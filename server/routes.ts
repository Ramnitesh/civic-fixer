import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const REVIEW_WINDOW_MS = 24 * 60 * 60 * 1000;

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

function canEditJob(job: Awaited<ReturnType<typeof storage.getJob>>): boolean {
  if (!job) return false;
  if (job.selectedWorkerId) return false;
  if (
    [
      "WORKER_SELECTED",
      "IN_PROGRESS",
      "AWAITING_VERIFICATION",
      "UNDER_REVIEW",
      "COMPLETED",
    ].includes(job.status)
  ) {
    return false;
  }
  return true;
}

async function finalizeReviewIfEligible(jobId: number) {
  const job = await storage.getJob(jobId);
  if (!job || job.status !== "UNDER_REVIEW" || !job.reviewDeadline) return;

  if (new Date(job.reviewDeadline).getTime() > Date.now()) return;

  const jobDisputes = await storage.getDisputesByJob(job.id);
  const hasOpenDispute = jobDisputes.some((d) => d.status === "OPEN");
  if (hasOpenDispute) {
    await storage.updateJob(job.id, { status: "DISPUTED" });
    return;
  }

  const acceptedApp = await storage.getAcceptedApplicationByJob(job.id);
  if (acceptedApp) {
    const worker = await storage.getUser(acceptedApp.workerId);
    if (worker) {
      const payout = Math.max(acceptedApp.bidAmount - 500, 0);
      await storage.updateUser(worker.id, {
        totalEarnings: (worker.totalEarnings || 0) + payout,
      });
    }
  }

  await storage.updateJob(job.id, { status: "COMPLETED" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  setupAuth(app);

  if ((await storage.getJobs()).length === 0) {
    const hashedPassword = await hashPassword("password123");

    const leader = await storage.createUser({
      username: "leader",
      password: hashedPassword,
      name: "Civic Leader",
      phone: "9876543210",
      role: "LEADER",
    });
    await storage.createUser({
      username: "worker",
      password: hashedPassword,
      name: "Hard Worker",
      phone: "1122334455",
      role: "WORKER",
      availability: "Weekdays",
      skillTags: ["waste-management"],
    });
    await storage.createUser({
      username: "contributor",
      password: hashedPassword,
      name: "Good Citizen",
      phone: "5544332211",
      role: "CONTRIBUTOR",
    });

    await storage.createJob({
      title: "Clean Park Bench",
      description: "Remove graffiti and repaint the bench in Central Park.",
      location: "Central Park, Sector 4",
      targetAmount: 2000,
      isPrivateResidentialProperty: false,
      leaderId: leader.id,
    });
  }

  app.patch(api.auth.updateProfile.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const input = api.auth.updateProfile.input.parse(req.body);
    const updated = await storage.updateUser(req.user!.id, input);
    res.json(updated);
  });

  app.get(api.jobs.list.path, async (req, res) => {
    const jobs = await storage.getJobs();
    for (const job of jobs) {
      await finalizeReviewIfEligible(job.id);
    }

    let filtered = await storage.getJobs();
    if (req.query.status)
      filtered = filtered.filter((j) => j.status === req.query.status);
    if (req.query.leaderId)
      filtered = filtered.filter(
        (j) => j.leaderId === Number(req.query.leaderId),
      );
    res.json(filtered);
  });

  app.post(api.jobs.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!["LEADER", "CONTRIBUTOR", "ADMIN"].includes(req.user!.role)) {
      return res
        .status(403)
        .json({ message: "Only leaders/contributors can create jobs" });
    }

    const input = api.jobs.create.input.parse(req.body);
    if (input.targetAmount > 10000) {
      return res
        .status(400)
        .json({ message: "Target amount must be ≤ ₹10,000" });
    }

    const job = await storage.createJob({ ...input, leaderId: req.user!.id });
    res.status(201).json(job);
  });

  app.get(api.jobs.get.path, async (req, res) => {
    const id = Number(req.params.id);
    await finalizeReviewIfEligible(id);

    const job = await storage.getJob(id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const leader = await storage.getUser(job.leaderId);
    const contributions = await storage.getContributionsByJob(job.id);
    const selectedWorker = job.selectedWorkerId
      ? await storage.getUser(job.selectedWorkerId)
      : null;
    const proof = await storage.getJobProof(job.id);
    const disputes = await storage.getDisputesByJob(job.id);
    const contributorCount = await storage.getContributorCount(job.id);
    const contributorIds = Array.from(
      new Set(contributions.map((contribution) => contribution.userId)),
    );
    const contributorProfiles = (
      await Promise.all(
        contributorIds.map((contributorId) => storage.getUser(contributorId)),
      )
    ).filter(Boolean);

    res.json({
      ...job,
      leader,
      contributions,
      selectedWorker,
      proof,
      disputes,
      contributorCount,
      contributorProfiles,
    });
  });

  app.patch(api.jobs.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const id = Number(req.params.id);
    const updates = api.jobs.update.input.parse(req.body);
    const job = await storage.getJob(id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const requesterId = Number(req.user!.id);
    const isAdmin = req.user!.role === "ADMIN";
    const isLeader = job.leaderId === requesterId;
    const isWorkflowStatusUpdate =
      typeof updates.status === "string" &&
      ["IN_PROGRESS", "AWAITING_VERIFICATION"].includes(updates.status);

    if (isWorkflowStatusUpdate) {
      if (
        updates.status === "IN_PROGRESS" &&
        job.status !== "WORKER_SELECTED"
      ) {
        return res
          .status(400)
          .json({ message: "Can start work only after worker selection" });
      }
      if (
        updates.status === "AWAITING_VERIFICATION" &&
        job.status !== "IN_PROGRESS"
      ) {
        return res
          .status(400)
          .json({ message: "Can complete work only after it is in progress" });
      }

      const updated = await storage.updateJob(id, {
        status: updates.status as "IN_PROGRESS" | "AWAITING_VERIFICATION",
      });
      return res.json(updated);
    }

    if (!isAdmin && !isLeader)
      return res.status(403).json({
        message: "Forbidden: only leader/admin can update this job",
      });

    if (
      (updates.title ||
        updates.description ||
        updates.location ||
        updates.targetAmount ||
        updates.isPrivateResidentialProperty !== undefined) &&
      !canEditJob(job)
    ) {
      return res.status(400).json({
        message: "Job details can be edited only before worker selection",
      });
    }

    if (updates.targetAmount && updates.targetAmount > 10000) {
      return res
        .status(400)
        .json({ message: "Target amount must be ≤ ₹10,000" });
    }

    if (updates.status === "FUNDING_COMPLETE") {
      const contributorCount = await storage.getContributorCount(job.id);
      if (contributorCount < 3) {
        return res.status(400).json({
          message: "Cannot close funding before minimum 3 contributors",
        });
      }
      if ((job.collectedAmount || 0) < job.targetAmount) {
        return res
          .status(400)
          .json({ message: "Cannot close funding before target is reached" });
      }
    }

    if (updates.status === "UNDER_REVIEW") {
      const proof = await storage.getJobProof(job.id);
      if (!proof)
        return res
          .status(400)
          .json({ message: "Cannot verify before proof upload" });

      const updated = await storage.updateJob(job.id, {
        status: "UNDER_REVIEW",
        reviewDeadline: new Date(Date.now() + REVIEW_WINDOW_MS),
      });
      return res.json(updated);
    }

    const updated = await storage.updateJob(id, updates);
    res.json(updated);
  });

  app.post(api.contributions.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!["LEADER", "CONTRIBUTOR", "ADMIN"].includes(req.user!.role)) {
      return res
        .status(403)
        .json({ message: "Only leaders and contributors can contribute" });
    }

    const input = api.contributions.create.input.parse(req.body);
    if (input.amount <= 0)
      return res
        .status(400)
        .json({ message: "Contribution amount must be greater than 0" });

    const job = await storage.getJob(input.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (
      job.selectedWorkerId ||
      [
        "WORKER_SELECTED",
        "IN_PROGRESS",
        "AWAITING_VERIFICATION",
        "UNDER_REVIEW",
        "COMPLETED",
        "DISPUTED",
      ].includes(job.status)
    ) {
      return res.status(400).json({
        message: "Contributions are closed once a worker is selected",
      });
    }

    const alreadyContributed = await storage.getContributionByJobAndUser(
      input.jobId,
      req.user!.id,
    );
    if (alreadyContributed)
      return res
        .status(409)
        .json({ message: "You can contribute only once per job" });

    const contribution = await storage.createContribution({
      jobId: input.jobId,
      userId: req.user!.id,
      amount: input.amount,
    });

    const refreshedJob = await storage.getJob(input.jobId);
    const contributorCount = await storage.getContributorCount(input.jobId);
    if (
      refreshedJob &&
      (refreshedJob.collectedAmount || 0) >= refreshedJob.targetAmount &&
      contributorCount >= 3
    ) {
      await storage.updateJob(refreshedJob.id, { status: "FUNDING_COMPLETE" });
    }

    res.status(201).json(contribution);
  });

  app.get(api.contributions.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const list = await storage.getContributionsByUser(req.user!.id);
    res.json(list);
  });

  app.post(api.applications.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== "WORKER")
      return res.status(403).json({ message: "Only workers can apply" });

    const input = api.applications.create.input.parse(req.body);
    const job = await storage.getJob(input.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.leaderId === req.user!.id)
      return res
        .status(400)
        .json({ message: "You cannot apply to your own job" });
    if (!["FUNDING_OPEN", "FUNDING_COMPLETE"].includes(job.status)) {
      return res.status(400).json({
        message: "Applications are only allowed while funding is open",
      });
    }

    const existing = await storage.getApplicationByJobAndWorker(
      input.jobId,
      req.user!.id,
    );
    if (existing)
      return res
        .status(409)
        .json({ message: "You have already applied for this job" });

    const application = await storage.createApplication({
      jobId: input.jobId,
      workerId: req.user!.id,
      bidAmount: input.bidAmount,
    });

    res.status(201).json(application);
  });

  app.get(api.applications.list.path, async (req, res) => {
    const apps = await storage.getApplicationsByJob(Number(req.params.jobId));
    res.json(apps);
  });

  app.patch(api.applications.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = Number(req.params.id);
    const { status } = api.applications.update.input.parse(req.body);

    const existingApp = await storage.getApplicationById(id);
    if (!existingApp)
      return res.status(404).json({ message: "Application not found" });

    const job = await storage.getJob(existingApp.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const isAdmin = req.user!.role === "ADMIN";
    const isJobLeader = job.leaderId === req.user!.id;
    if (!isAdmin && !isJobLeader) {
      return res
        .status(403)
        .json({ message: "Only the job leader can review applications" });
    }

    if (status === "ACCEPTED") {
      if (job.leaderId === existingApp.workerId) {
        return res
          .status(400)
          .json({ message: "Leader cannot select self as worker" });
      }
      const alreadyAccepted = await storage.getAcceptedApplicationByJob(job.id);
      if (
        alreadyAccepted &&
        alreadyAccepted.id !== existingApp.id &&
        !isAdmin
      ) {
        return res
          .status(400)
          .json({ message: "Only one worker can be selected" });
      }
    }

    const appResult = await storage.updateApplicationStatus(id, status);
    if (status === "ACCEPTED") {
      await storage.rejectOtherApplications(job.id, appResult.id);
      await storage.updateJob(job.id, {
        selectedWorkerId: appResult.workerId,
        status: "WORKER_SELECTED",
      });
    }

    res.json(appResult);
  });

  app.post(api.proofs.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const input = api.proofs.create.input.parse(req.body);

    const job = await storage.getJob(input.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.selectedWorkerId !== req.user!.id) {
      return res
        .status(403)
        .json({ message: "Only the selected worker can upload proof" });
    }
    if (!["WORKER_SELECTED", "IN_PROGRESS"].includes(job.status)) {
      return res.status(400).json({
        message: "Proof can only be uploaded after worker is selected",
      });
    }

    const existingProof = await storage.getJobProof(input.jobId);
    if (existingProof)
      return res
        .status(409)
        .json({ message: "Proof is already uploaded for this job" });

    const proof = await storage.createJobProof({
      ...input,
      capturedAt: input.capturedAt ? new Date(input.capturedAt) : new Date(),
    });
    await storage.updateJob(input.jobId, { status: "AWAITING_VERIFICATION" });

    res.status(201).json(proof);
  });

  app.post(api.disputes.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const input = api.disputes.create.input.parse(req.body);

    const job = await storage.getJob(input.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.status !== "UNDER_REVIEW" || !job.reviewDeadline) {
      return res
        .status(400)
        .json({ message: "Disputes can only be raised during review window" });
    }
    if (new Date(job.reviewDeadline).getTime() < Date.now()) {
      return res.status(400).json({ message: "Review window has ended" });
    }

    if (req.user!.id !== job.leaderId && req.user!.role !== "ADMIN") {
      const contribution = await storage.getContributionByJobAndUser(
        job.id,
        req.user!.id,
      );
      if (!contribution) {
        return res
          .status(403)
          .json({ message: "Only contributors or leader can raise dispute" });
      }
    }

    const dispute = await storage.createDispute({
      jobId: input.jobId,
      reason: input.reason,
      raisedById: req.user!.id,
    });

    await storage.updateJob(input.jobId, { status: "DISPUTED" });
    res.status(201).json(dispute);
  });

  app.get(api.disputes.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role === "ADMIN") {
      return res.json(await storage.getDisputes());
    }

    const jobs = await storage.getJobs();
    const mine = jobs
      .filter((j) => j.leaderId === req.user!.id)
      .map((j) => j.id);
    const all = await storage.getDisputes();
    return res.json(all.filter((d) => mine.includes(d.jobId)));
  });

  return httpServer;
}
