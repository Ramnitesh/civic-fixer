import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { createHash } from "crypto";

const scryptAsync = promisify(scrypt);
const REVIEW_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours for worker execution
const LEADER_EXECUTION_REVIEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days for leader execution
const WORKER_EXECUTION_FEE_PERCENT = 5;
// Leader execution: no platform fee
const LEADER_EXECUTION_FEE_PERCENT = 0;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function computeFeeAndWallet(collectedAmount: number, feePercent: number) {
  // For LEADER_EXECUTION: feePercent is 0, so no platform fee deducted
  // For WORKER_EXECUTION: fee is charged when paying worker, not upfront
  const platformFeeAmount = roundMoney((collectedAmount * feePercent) / 100);
  const walletBalance = roundMoney(collectedAmount - platformFeeAmount);
  return { platformFeeAmount, walletBalance };
}

function getCloudinaryConfig() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (!cloudinaryUrl) {
    throw new Error("CLOUDINARY_URL is not configured");
  }

  const parsed = new URL(cloudinaryUrl);
  const cloudName = parsed.hostname;
  const apiKey = parsed.username;
  const apiSecret = parsed.password;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Invalid CLOUDINARY_URL format");
  }

  return { cloudName, apiKey, apiSecret };
}

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

function mapLegacyStatus(
  status: string,
):
  | "FUNDING_OPEN"
  | "FUNDING_COMPLETE"
  | "IN_PROGRESS"
  | "UNDER_REVIEW"
  | "COMPLETED"
  | "DISPUTED"
  | "CANCELLED"
  | "WORKER_SELECTED"
  | "AWAITING_VERIFICATION" {
  switch (status) {
    case "CREATED":
    case "FUNDING":
      return "FUNDING_OPEN";
    case "FUNDED":
      return "FUNDING_COMPLETE";
    case "LEADER_EXECUTING":
      return "IN_PROGRESS";
    case "REVIEW_WINDOW":
      return "UNDER_REVIEW";
    case "CLOSED":
      return "COMPLETED";
    default:
      return status as
        | "FUNDING_OPEN"
        | "FUNDING_COMPLETE"
        | "IN_PROGRESS"
        | "UNDER_REVIEW"
        | "COMPLETED"
        | "DISPUTED"
        | "CANCELLED"
        | "WORKER_SELECTED"
        | "AWAITING_VERIFICATION";
  }
}

function normalizeMetadata(metadata: unknown): Record<string, unknown> {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return {};
}

async function getPersistedDisputeDetails(jobId: number, disputeId: number) {
  const proof = await storage.getJobProof(jobId);
  if (!proof) return undefined;

  const metadata = normalizeMetadata(proof.metadata);
  const disputeDetailsMap =
    metadata.disputeDetails &&
    typeof metadata.disputeDetails === "object" &&
    !Array.isArray(metadata.disputeDetails)
      ? (metadata.disputeDetails as Record<string, unknown>)
      : {};

  const details = disputeDetailsMap[String(disputeId)];
  if (details && typeof details === "object" && !Array.isArray(details)) {
    return details as Record<string, unknown>;
  }

  return undefined;
}

async function persistDisputeDetails(
  jobId: number,
  disputeId: number,
  details: Record<string, unknown>,
) {
  const proof = await storage.getJobProof(jobId);
  if (!proof) return;

  const metadata = normalizeMetadata(proof.metadata);
  const existingDisputeDetails =
    metadata.disputeDetails &&
    typeof metadata.disputeDetails === "object" &&
    !Array.isArray(metadata.disputeDetails)
      ? (metadata.disputeDetails as Record<string, unknown>)
      : {};

  await storage.updateJobProofMetadata(jobId, {
    ...metadata,
    disputeDetails: {
      ...existingDisputeDetails,
      [String(disputeId)]: details,
    },
  });
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

  // For WORKER_EXECUTION: pay worker
  if (job.executionMode === "WORKER_EXECUTION") {
    const acceptedApp = await storage.getAcceptedApplicationByJob(job.id);
    if (acceptedApp) {
      const worker = await storage.getUser(acceptedApp.workerId);
      if (worker) {
        const platformFee = roundMoney(
          (acceptedApp.bidAmount * WORKER_EXECUTION_FEE_PERCENT) / 100,
        );
        const payout = Math.max(acceptedApp.bidAmount - platformFee, 0);
        await storage.updateUser(worker.id, {
          totalEarnings: (worker.totalEarnings || 0) + payout,
        });
      }
    }
    await storage.updateJob(job.id, { status: "COMPLETED" });
    return;
  }

  // For LEADER_EXECUTION: calculate and refund remaining balance to contributors
  if (job.executionMode === "LEADER_EXECUTION") {
    const totalRaised = job.collectedAmount || 0;
    const transactions = await storage.getJobExpenseTransactions(job.id);
    const totalSpent = transactions.reduce(
      (sum, tx) => sum + (tx.amount || 0),
      0,
    );
    const remainingBalance = roundMoney(totalRaised - totalSpent);

    const contributions = await storage.getContributionsByJob(job.id);

    // Build refund details for each contributor
    const refundDetails: Array<{
      userId: number;
      name: string;
      phone: string;
      contributionAmount: number;
      refundAmount: number;
    }> = [];

    if (remainingBalance > 0 && totalRaised > 0) {
      const refundRatio = remainingBalance / totalRaised;
      for (const contribution of contributions) {
        if (!contribution.userId) continue;
        const contributor = await storage.getUser(contribution.userId);
        if (contributor) {
          const refundAmount = roundMoney(contribution.amount * refundRatio);
          if (refundAmount > 0) {
            // Refund was already added to frozen when job was marked UNDER_REVIEW
            // Now release it to available balance
            try {
              await storage.unfreezeWalletFunds(contributor.id, refundAmount);
            } catch (err) {
              console.error(
                `Error releasing refund for user ${contributor.id}:`,
                err,
              );
            }
            refundDetails.push({
              userId: contributor.id,
              name: contributor.name || "Unknown",
              phone: contributor.phone || "",
              contributionAmount: contribution.amount,
              refundAmount,
            });
          }
        }
      }
    }

    const leader = await storage.getUser(job.leaderId);
    if (leader) {
      await storage.updateUser(job.leaderId, {
        totalEarnings: (leader.totalEarnings || 0) + totalSpent,
      });
    }

    // Store refund details in job metadata
    const existingMetadata =
      job.metadata && typeof job.metadata === "object"
        ? (job.metadata as Record<string, unknown>)
        : {};
    await storage.updateJob(job.id, {
      status: "COMPLETED",
      walletBalance: 0,
      metadata: {
        ...existingMetadata,
        refundDetails,
        totalRaised,
        totalSpent,
        remainingBalance,
        refundProcessedAt: new Date().toISOString(),
      },
    });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  setupAuth(app);

  const hashedPassword = await hashPassword("password123");

  let leader = await storage.getUserByUsername("leader");
  if (!leader) {
    leader = await storage.createUser({
      username: "leader",
      password: hashedPassword,
      name: "Civic Leader",
      phone: "9876543210",
      role: "MEMBER",
    });
  }

  const worker = await storage.getUserByUsername("worker");
  if (!worker) {
    await storage.createUser({
      username: "worker",
      password: hashedPassword,
      name: "Hard Worker",
      phone: "1122334455",
      role: "WORKER",
      availability: "Weekdays",
      skillTags: ["waste-management"],
    });
  }

  const contributor = await storage.getUserByUsername("contributor");
  if (!contributor) {
    await storage.createUser({
      username: "contributor",
      password: hashedPassword,
      name: "Good Citizen",
      phone: "5544332211",
      role: "MEMBER",
    });
  }

  if ((await storage.getJobs()).length === 0) {
    await storage.createJob({
      title: "Clean Park Bench",
      description: "Remove graffiti and repaint the bench in Central Park.",
      location: "Central Park, Sector 4",
      targetAmount: 2000,
      isPrivateResidentialProperty: false,
      executionMode: "WORKER_EXECUTION",
      leaderId: leader.id,
    });
  }

  // One-time normalization for legacy statuses from older builds
  const existingJobs = await storage.getJobs();
  for (const existingJob of existingJobs) {
    const normalizedStatus = mapLegacyStatus(existingJob.status);
    let nextStatus = normalizedStatus;
    if (
      nextStatus === "FUNDING_OPEN" &&
      (existingJob.collectedAmount || 0) >= existingJob.targetAmount
    ) {
      nextStatus =
        existingJob.executionMode === "LEADER_EXECUTION"
          ? "IN_PROGRESS"
          : "FUNDING_COMPLETE";
    }
    if (nextStatus !== existingJob.status) {
      await storage.updateJob(existingJob.id, { status: nextStatus });
    }
  }

  // Start background job to auto-complete jobs after review period ends
  // Runs every hour to check for jobs that have passed their review deadline
  const AUTO_COMPLETE_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  async function checkAndAutoCompleteJobs() {
    try {
      const allJobs = await storage.getJobs();
      const jobsToCheck = allJobs.filter(
        (job) => job.status === "UNDER_REVIEW" && job.reviewDeadline,
      );

      for (const job of jobsToCheck) {
        if (
          job.reviewDeadline &&
          new Date(job.reviewDeadline).getTime() < Date.now()
        ) {
          console.info(
            `[auto-complete] Job #${job.id} review period ended, completing job...`,
          );
          await finalizeReviewIfEligible(job.id);
        }
      }
    } catch (error) {
      console.error("[auto-complete] Error checking jobs:", error);
    }
  }

  // Run immediately on startup, then every hour
  checkAndAutoCompleteJobs();
  setInterval(checkAndAutoCompleteJobs, AUTO_COMPLETE_INTERVAL_MS);
  console.info(
    `[auto-complete] Background job started - checking every ${AUTO_COMPLETE_INTERVAL_MS / 1000 / 60} minutes`,
  );

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
    if (req.isAuthenticated() && req.user?.role === "WORKER") {
      filtered = filtered.filter(
        (job) => job.executionMode === "WORKER_EXECUTION",
      );
    }
    if (req.query.status)
      filtered = filtered.filter((j) => j.status === req.query.status);
    if (req.query.leaderId)
      filtered = filtered.filter(
        (j) => j.leaderId === Number(req.query.leaderId),
      );
    if (req.query.contributorId) {
      const contributorId = Number(req.query.contributorId);
      const allJobs = await storage.getJobs();
      const contributionJobIds = (
        await Promise.all(
          allJobs.map(async (job) => {
            const contributions = await storage.getContributionsByJob(job.id);
            return contributions.some((c) => c.userId === contributorId)
              ? job.id
              : null;
          }),
        )
      ).filter(Boolean);
      filtered = filtered.filter((j) => contributionJobIds.includes(j.id));
    }

    const enriched = await Promise.all(
      filtered.map(async (job) => ({
        ...job,
        imageUrl: (await storage.getJobImage(job.id)) ?? null,
      })),
    );
    res.json(enriched);
  });

  app.post(api.jobs.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (
      !["MEMBER", "LEADER", "CONTRIBUTOR", "ADMIN"].includes(req.user!.role)
    ) {
      return res.status(403).json({ message: "Only members can create jobs" });
    }

    const input = api.jobs.create.input.parse(req.body);
    const { imageUrl, executionMode, ...jobInput } = input;
    const platformFeePercent =
      executionMode === "LEADER_EXECUTION"
        ? LEADER_EXECUTION_FEE_PERCENT
        : WORKER_EXECUTION_FEE_PERCENT;
    const job = await storage.createJob({
      ...jobInput,
      executionMode,
      leaderId: req.user!.id,
    });
    const initializedJob = await storage.updateJob(job.id, {
      status: "FUNDING_OPEN",
      platformFeePercent,
      platformFeeAmount: 0,
      walletBalance: 0,
      fundsFrozen: false,
    });
    if (imageUrl) {
      await storage.setJobImage(initializedJob.id, imageUrl);
    }
    res.status(201).json({ ...initializedJob, imageUrl: imageUrl ?? null });
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
    const proofDraft = await storage.getJobProofDraft(job.id);
    const disputes = await storage.getDisputesByJob(job.id);
    const disputesWithDetails = await Promise.all(
      disputes.map(async (dispute) => ({
        ...dispute,
        details:
          (await storage.getDisputeDetails(dispute.id)) ??
          (await getPersistedDisputeDetails(job.id, dispute.id)) ??
          null,
      })),
    );
    const contributorCount = await storage.getContributorCount(job.id);
    const contributorIds = Array.from(
      new Set(contributions.map((contribution) => contribution.userId)),
    );
    const contributorProfiles = await Promise.all(
      contributorIds.map(async (contributorId) => {
        const profile = await storage.getUser(contributorId);
        if (!profile) return null;
        const userContributions = contributions.filter(
          (c) => c.userId === contributorId,
        );
        const totalAmount = userContributions.reduce(
          (sum, c) => sum + c.amount,
          0,
        );
        const latestContribution = userContributions
          .filter((c) => c.createdAt)
          .sort(
            (a, b) =>
              new Date(b.createdAt!).getTime() -
              new Date(a.createdAt!).getTime(),
          )[0];
        return {
          ...profile,
          contributionAmount: totalAmount,
          contributionDate: latestContribution?.createdAt || undefined,
        };
      }),
    );

    res.json({
      ...job,
      imageUrl: (await storage.getJobImage(job.id)) ?? null,
      leader,
      contributions,
      selectedWorker,
      proof,
      proofDraft: proofDraft ?? null,
      disputes: disputesWithDetails,
      contributorCount,
      contributorProfiles,
    });
  });

  app.patch(api.jobs.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const id = Number(req.params.id);
    const updates = api.jobs.update.input.parse(req.body);
    const { workerSubmissionMessage, executionMode, ...jobUpdates } = updates;
    const job = await storage.getJob(id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const requesterId = Number(req.user!.id);
    const isAdmin = req.user!.role === "ADMIN";
    const isLeader = job.leaderId === requesterId;

    if (executionMode && executionMode !== job.executionMode) {
      if (!isAdmin && !isLeader) {
        return res.status(403).json({
          message: "Forbidden: only leader/admin can change execution mode",
        });
      }
      if (job.status !== "FUNDING_OPEN") {
        return res.status(400).json({
          message:
            "Execution mode can only be changed while status is FUNDING_OPEN",
        });
      }

      const platformFeePercent =
        executionMode === "LEADER_EXECUTION"
          ? LEADER_EXECUTION_FEE_PERCENT
          : WORKER_EXECUTION_FEE_PERCENT;
      const feeCalc = computeFeeAndWallet(
        job.collectedAmount || 0,
        platformFeePercent,
      );
      const updated = await storage.updateJob(id, {
        executionMode,
        platformFeePercent,
        platformFeeAmount: feeCalc.platformFeeAmount,
        walletBalance: feeCalc.walletBalance,
      });
      return res.json(updated);
    }

    const isWorkflowStatusUpdate =
      typeof updates.status === "string" &&
      ["IN_PROGRESS", "AWAITING_VERIFICATION"].includes(updates.status);

    if (isWorkflowStatusUpdate) {
      if (job.selectedWorkerId !== req.user!.id) {
        return res.status(403).json({
          message: "Only selected worker can update workflow status",
        });
      }

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

      if (updates.status === "AWAITING_VERIFICATION") {
        const proof = await storage.getJobProof(job.id);
        if (!proof) {
          return res
            .status(400)
            .json({ message: "Upload all proof before submitting for review" });
        }

        const note = workerSubmissionMessage?.trim();
        if (note) {
          const existingMetadata =
            proof.metadata && typeof proof.metadata === "object"
              ? proof.metadata
              : {};

          await storage.updateJobProofMetadata(job.id, {
            ...(existingMetadata as Record<string, unknown>),
            workerSubmissionMessage: note,
            workerSubmissionBy: req.user!.id,
            workerSubmissionAt: new Date().toISOString(),
          });
        }
      }

      const updated = await storage.updateJob(id, {
        status: updates.status as "IN_PROGRESS" | "AWAITING_VERIFICATION",
      });

      // If marking as IN_PROGRESS (leader completed work), deduct frozen funds from contributors
      if (
        updates.status === "IN_PROGRESS" &&
        job.executionMode === "LEADER_EXECUTION"
      ) {
        const contributions = await storage.getContributionsByJob(job.id);
        for (const contribution of contributions) {
          if (contribution.userId && contribution.amount > 0) {
            try {
              // Calculate refund amount (remaining balance after expenses)
              const transactions = await storage.getJobExpenseTransactions(
                job.id,
              );
              const totalSpent = transactions.reduce(
                (sum, tx) => sum + (tx.amount || 0),
                0,
              );
              const totalRaised = job.collectedAmount || 0;
              const remainingBalance = roundMoney(totalRaised - totalSpent);
              const refundRatio =
                totalRaised > 0 ? remainingBalance / totalRaised : 0;
              const refundAmount = roundMoney(
                contribution.amount * refundRatio,
              );

              // Add refund amount to frozen (if any remaining)
              // No need to deduct from frozen since frozen was never increased in freezeWalletFunds
              if (refundAmount > 0) {
                await storage.addToFrozen(
                  contribution.userId,
                  refundAmount,
                  `Refund - Job #${job.id} completed, ${refundAmount} eligible for refund`,
                  "REFUND",
                );
              }
            } catch (err) {
              console.error(
                `Error processing frozen funds for user ${contribution.userId}:`,
                err,
              );
            }
          }
        }
      }

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

    if (updates.status === "FUNDING_COMPLETE") {
      if ((job.collectedAmount || 0) < job.targetAmount) {
        return res
          .status(400)
          .json({ message: "Cannot close funding before target is reached" });
      }
    }

    if (updates.status === "UNDER_REVIEW") {
      if (job.executionMode === "WORKER_EXECUTION") {
        const proof = await storage.getJobProof(job.id);
        if (!proof)
          return res
            .status(400)
            .json({ message: "Cannot verify before proof upload" });
      }

      // Use different review windows based on execution mode
      const reviewWindowMs =
        job.executionMode === "LEADER_EXECUTION"
          ? LEADER_EXECUTION_REVIEW_WINDOW_MS
          : REVIEW_WINDOW_MS;

      // For LEADER_EXECUTION: calculate and store estimated refund details
      // so contributors can see potential refund during review window
      let jobUpdates: Record<string, unknown> = {
        status: "UNDER_REVIEW",
        reviewDeadline: new Date(Date.now() + reviewWindowMs),
      };

      if (job.executionMode === "LEADER_EXECUTION") {
        const totalRaised = job.collectedAmount || 0;
        const transactions = await storage.getJobExpenseTransactions(job.id);
        const totalSpent = transactions.reduce(
          (sum, tx) => sum + (tx.amount || 0),
          0,
        );
        const remainingBalance = roundMoney(totalRaised - totalSpent);

        const contributions = await storage.getContributionsByJob(job.id);

        // Build refund details for each contributor and process wallet transactions
        const refundDetails: Array<{
          userId: number;
          name: string;
          phone: string;
          contributionAmount: number;
          refundAmount: number;
        }> = [];

        if (remainingBalance > 0 && totalRaised > 0) {
          const refundRatio = remainingBalance / totalRaised;
          for (const contribution of contributions) {
            if (!contribution.userId) continue;
            const contributor = await storage.getUser(contribution.userId);
            if (contributor) {
              const refundAmount = roundMoney(
                contribution.amount * refundRatio,
              );
              if (refundAmount > 0) {
                // Add refund amount to contributor's frozen balance
                try {
                  await storage.addToFrozen(
                    contributor.id,
                    refundAmount,
                    `Refund - Job #${job.id} completed, ${refundAmount} eligible for refund`,
                    "REFUND",
                  );
                } catch (err) {
                  console.error(
                    `Error adding refund to frozen for user ${contributor.id}:`,
                    err,
                  );
                }
                refundDetails.push({
                  userId: contributor.id,
                  name: contributor.name || "Unknown",
                  phone: contributor.phone || "",
                  contributionAmount: contribution.amount,
                  refundAmount,
                });
              }
            }
          }
        }

        // Store refund details in job metadata
        const existingMetadata =
          job.metadata && typeof job.metadata === "object"
            ? (job.metadata as Record<string, unknown>)
            : {};
        jobUpdates.metadata = {
          ...existingMetadata,
          refundDetails,
          totalRaised,
          totalSpent,
          remainingBalance,
        };
      }

      const updated = await storage.updateJob(job.id, jobUpdates);
      return res.json(updated);
    }

    const updated = await storage.updateJob(id, jobUpdates);

    // If targetAmount was updated, check if we need to auto-update status
    // based on collectedAmount vs new targetAmount
    if (updates.targetAmount && job) {
      const newTargetAmount = updates.targetAmount;
      const collectedAmount = job.collectedAmount || 0;

      // Only update status if:
      // 1. Job is currently in FUNDING_OPEN or FUNDING_COMPLETE status
      // 2. Collected amount now meets or exceeds the new target
      // 3. The current status doesn't reflect this
      const currentStatus = job.status;
      if (
        (currentStatus === "FUNDING_OPEN" ||
          currentStatus === "FUNDING_COMPLETE") &&
        collectedAmount >= newTargetAmount
      ) {
        const newStatus =
          job.executionMode === "LEADER_EXECUTION"
            ? "IN_PROGRESS"
            : "FUNDING_COMPLETE";

        if (currentStatus !== newStatus) {
          await storage.updateJob(id, { status: newStatus });
        }
      }
    }

    res.json(updated);
  });

  app.post(api.contributions.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (
      !["MEMBER", "LEADER", "CONTRIBUTOR", "ADMIN"].includes(req.user!.role)
    ) {
      return res.status(403).json({ message: "Only members can contribute" });
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
        "AWAITING_VERIFICATION",
        "UNDER_REVIEW",
        "COMPLETED",
        "DISPUTED",
        "CANCELLED",
      ].includes(job.status)
    ) {
      return res.status(400).json({
        message:
          "Contributions are closed once a worker submitted work for review or job is completed/cancelled",
      });
    }

    const alreadyContributed = await storage.getContributionByJobAndUser(
      input.jobId,
      req.user!.id,
    );

    const contribution = await storage.createContribution({
      jobId: input.jobId,
      userId: req.user!.id,
      amount: input.amount,
    });

    const refreshedJob = await storage.getJob(input.jobId);
    if (refreshedJob) {
      // For WORKER_EXECUTION: no fee deducted from contributions
      // Fee (5%) is only charged when paying the worker
      // For LEADER_EXECUTION: no fee at all (already set to 0)
      const feePercent =
        refreshedJob.executionMode === "WORKER_EXECUTION"
          ? 0 // No fee on contributions for worker mode
          : 0; // No fee for leader execution mode
      const feeCalc = computeFeeAndWallet(
        refreshedJob.collectedAmount || 0,
        feePercent,
      );

      const nextStatus =
        (refreshedJob.collectedAmount || 0) >= refreshedJob.targetAmount
          ? refreshedJob.executionMode === "LEADER_EXECUTION"
            ? "IN_PROGRESS"
            : "FUNDING_COMPLETE"
          : "FUNDING_OPEN";

      await storage.updateJob(refreshedJob.id, {
        status: nextStatus,
        platformFeeAmount: feeCalc.platformFeeAmount,
        walletBalance: feeCalc.walletBalance,
      });
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
    if (job.executionMode !== "WORKER_EXECUTION") {
      return res.status(400).json({
        message:
          "Worker applications are not allowed for LEADER_EXECUTION jobs",
      });
    }
    if (job.leaderId === req.user!.id)
      return res
        .status(400)
        .json({ message: "You cannot apply to your own job" });
    if (job.status !== "FUNDING_COMPLETE") {
      return res.status(400).json({
        message: "Applications are only allowed once funding is completed",
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
    if (job.executionMode !== "WORKER_EXECUTION") {
      return res.status(400).json({
        message: "Proof uploads are only for WORKER_EXECUTION jobs",
      });
    }
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
    await storage.clearJobProofDraft(input.jobId);

    res.status(201).json(proof);
  });

  app.post(api.proofs.draftUpsert.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const input = api.proofs.draftUpsert.input.parse(req.body);

    const job = await storage.getJob(input.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.executionMode !== "WORKER_EXECUTION") {
      return res.status(400).json({
        message: "Proof drafts are only for WORKER_EXECUTION jobs",
      });
    }
    if (job.selectedWorkerId !== req.user!.id) {
      return res
        .status(403)
        .json({ message: "Only the selected worker can upload proof" });
    }

    const existingProof = await storage.getJobProof(input.jobId);
    if (existingProof) {
      return res
        .status(409)
        .json({ message: "Proof is already uploaded for this job" });
    }

    const draft = await storage.upsertJobProofDraft({
      jobId: input.jobId,
      beforePhoto: input.beforePhoto,
      afterPhoto: input.afterPhoto,
      disposalPhoto: input.disposalPhoto,
    });

    return res.json(draft);
  });

  app.post("/api/uploads/cloudinary/signature", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    let config: { cloudName: string; apiKey: string; apiSecret: string };
    try {
      config = getCloudinaryConfig();
    } catch (error) {
      return res.status(500).json({
        message:
          error instanceof Error ? error.message : "Cloudinary misconfigured",
      });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const uploadPurpose =
      typeof req.body?.purpose === "string" ? req.body.purpose : "worker_proof";
    const envName = process.env.NODE_ENV || "development";
    const folder =
      uploadPurpose === "job_image"
        ? `${envName}/civicfix/job/images`
        : `${envName}/civicfix/worker/proof`;
    const signature = createHash("sha1")
      .update(`folder=${folder}&timestamp=${timestamp}${config.apiSecret}`)
      .digest("hex");

    return res.json({
      cloudName: config.cloudName,
      apiKey: config.apiKey,
      timestamp,
      folder,
      signature,
    });
  });

  app.post(api.disputes.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const input = api.disputes.create.input.parse(req.body);

    const job = await storage.getJob(input.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    const isWorkerModeWindow =
      job.executionMode === "WORKER_EXECUTION" && job.status === "UNDER_REVIEW";
    const isLeaderModeWindow =
      job.executionMode === "LEADER_EXECUTION" && job.status === "UNDER_REVIEW";
    if ((!isWorkerModeWindow && !isLeaderModeWindow) || !job.reviewDeadline) {
      return res.status(400).json({
        message:
          "Disputes can only be raised during the active review window for the current execution mode",
      });
    }
    if (new Date(job.reviewDeadline).getTime() < Date.now()) {
      return res.status(400).json({ message: "Review window has ended" });
    }

    if (
      !["MEMBER", "LEADER", "CONTRIBUTOR", "ADMIN"].includes(req.user!.role)
    ) {
      return res
        .status(403)
        .json({ message: "Only members can raise disputes" });
    }

    const contribution = await storage.getContributionByJobAndUser(
      job.id,
      req.user!.id,
    );
    if (!contribution) {
      return res
        .status(403)
        .json({ message: "Only funded contributors can raise disputes" });
    }

    const existingDisputes = await storage.getDisputesByJob(job.id);
    if (
      existingDisputes.some((dispute) => dispute.raisedById === req.user!.id)
    ) {
      return res.status(409).json({
        message: "You can raise dispute only once for this job",
      });
    }

    const dispute = await storage.createDispute({
      jobId: input.jobId,
      reason: input.reason,
      raisedById: req.user!.id,
    });

    await storage.setDisputeDetails(dispute.id, {
      raisedEvidencePhotoUrl: input.evidencePhotoUrl,
    });
    await persistDisputeDetails(job.id, dispute.id, {
      raisedEvidencePhotoUrl: input.evidencePhotoUrl,
    });

    await storage.updateJob(input.jobId, {
      status: "DISPUTED",
      fundsFrozen: job.executionMode === "LEADER_EXECUTION",
    });
    console.info(
      `[notification] Dispute raised for job #${job.id}: notify worker #${job.selectedWorkerId} and leader #${job.leaderId}`,
    );
    res.status(201).json(dispute);
  });

  app.post(api.disputes.workerResponse.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const disputeId = Number(req.params.id);
    const input = api.disputes.workerResponse.input.parse(req.body);
    const dispute = await storage.getDisputeById(disputeId);
    if (!dispute) return res.status(404).json({ message: "Dispute not found" });

    const job = await storage.getJob(dispute.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.selectedWorkerId !== req.user!.id) {
      return res
        .status(403)
        .json({ message: "Only selected worker can submit response" });
    }
    if (dispute.status !== "OPEN") {
      return res.status(400).json({ message: "Dispute is not open" });
    }

    const existing = (await storage.getDisputeDetails(dispute.id)) ?? {};
    const nextDetails = {
      ...existing,
      workerResponse: {
        message: input.message,
        photoUrl: input.photoUrl,
        submittedAt: new Date().toISOString(),
      },
    };
    await storage.setDisputeDetails(dispute.id, nextDetails);
    await persistDisputeDetails(job.id, dispute.id, nextDetails);

    return res.json(dispute);
  });

  app.post(api.disputes.leaderClarification.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const disputeId = Number(req.params.id);
    const input = api.disputes.leaderClarification.input.parse(req.body);
    const dispute = await storage.getDisputeById(disputeId);
    if (!dispute) return res.status(404).json({ message: "Dispute not found" });

    const job = await storage.getJob(dispute.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.leaderId !== req.user!.id) {
      return res
        .status(403)
        .json({ message: "Only leader can submit clarification" });
    }
    if (dispute.status !== "OPEN") {
      return res.status(400).json({ message: "Dispute is not open" });
    }

    const existing = (await storage.getDisputeDetails(dispute.id)) ?? {};
    const nextDetails = {
      ...existing,
      leaderClarification: {
        message: input.message,
        submittedAt: new Date().toISOString(),
      },
    };
    await storage.setDisputeDetails(dispute.id, nextDetails);
    await persistDisputeDetails(job.id, dispute.id, nextDetails);

    return res.json(dispute);
  });

  app.post(api.disputes.adminDecision.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "Only admin can take dispute decision" });
    }

    const disputeId = Number(req.params.id);
    const input = api.disputes.adminDecision.input.parse(req.body);
    const dispute = await storage.getDisputeById(disputeId);
    if (!dispute) return res.status(404).json({ message: "Dispute not found" });
    if (dispute.status !== "OPEN") {
      return res.status(400).json({ message: "Dispute is already decided" });
    }

    const job = await storage.getJob(dispute.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (input.action === "APPROVE_WORK") {
      if (job.executionMode === "LEADER_EXECUTION") {
        const updatedDispute = await storage.updateDisputeStatus(
          dispute.id,
          "RESOLVED",
        );
        await storage.updateJob(job.id, {
          status: "UNDER_REVIEW",
          fundsFrozen: false,
        });

        const existingDetails =
          (await storage.getDisputeDetails(dispute.id)) ?? {};
        const nextDetails = {
          ...existingDetails,
          adminDecision: {
            action: input.action,
            decidedById: req.user!.id,
            decidedAt: new Date().toISOString(),
          },
        };
        await storage.setDisputeDetails(dispute.id, nextDetails);
        await persistDisputeDetails(job.id, dispute.id, nextDetails);

        return res.json(updatedDispute);
      }

      const acceptedApp = await storage.getAcceptedApplicationByJob(job.id);
      if (acceptedApp) {
        const worker = await storage.getUser(acceptedApp.workerId);
        if (worker) {
          // Deduct 5% platform fee when paying worker
          const platformFee = roundMoney(
            (acceptedApp.bidAmount * WORKER_EXECUTION_FEE_PERCENT) / 100,
          );
          const payout = Math.max(acceptedApp.bidAmount - platformFee, 0);
          await storage.updateUser(worker.id, {
            totalEarnings: (worker.totalEarnings || 0) + payout,
          });
        }
      }

      await storage.updateJob(job.id, { status: "COMPLETED" });
      const updatedDispute = await storage.updateDisputeStatus(
        dispute.id,
        "RESOLVED",
      );
      const existingDetails =
        (await storage.getDisputeDetails(dispute.id)) ?? {};
      const nextDetails = {
        ...existingDetails,
        adminDecision: {
          action: input.action,
          decidedById: req.user!.id,
          decidedAt: new Date().toISOString(),
        },
      };
      await storage.setDisputeDetails(dispute.id, nextDetails);
      await persistDisputeDetails(job.id, dispute.id, nextDetails);

      return res.json(updatedDispute);
    }

    await storage.markContributionsRefunded(job.id);
    await storage.updateJob(job.id, {
      status: "CANCELLED",
      fundsFrozen: job.executionMode === "LEADER_EXECUTION",
    });
    const updatedDispute = await storage.updateDisputeStatus(
      dispute.id,
      "REJECTED",
    );
    const existingDetails = (await storage.getDisputeDetails(dispute.id)) ?? {};
    const nextDetails = {
      ...existingDetails,
      adminDecision: {
        action: input.action,
        decidedById: req.user!.id,
        decidedAt: new Date().toISOString(),
      },
    };
    await storage.setDisputeDetails(dispute.id, nextDetails);
    await persistDisputeDetails(job.id, dispute.id, nextDetails);

    return res.json(updatedDispute);
  });

  app.get(api.disputes.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role === "ADMIN") {
      const allDisputes = await storage.getDisputes();
      return res.json(
        await Promise.all(
          allDisputes.map(async (dispute) => ({
            ...dispute,
            details:
              (await storage.getDisputeDetails(dispute.id)) ??
              (await getPersistedDisputeDetails(dispute.jobId, dispute.id)) ??
              null,
          })),
        ),
      );
    }

    const jobs = await storage.getJobs();
    const mine = jobs
      .filter((j) => j.leaderId === req.user!.id)
      .map((j) => j.id);
    const all = await storage.getDisputes();
    const mineDisputes = all.filter((d) => mine.includes(d.jobId));
    return res.json(
      await Promise.all(
        mineDisputes.map(async (dispute) => ({
          ...dispute,
          details:
            (await storage.getDisputeDetails(dispute.id)) ??
            (await getPersistedDisputeDetails(dispute.jobId, dispute.id)) ??
            null,
        })),
      ),
    );
  });

  app.post(api.jobs.createExpense.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const jobId = Number(req.params.id);
    const input = api.jobs.createExpense.input.parse(req.body);
    const job = await storage.getJob(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const isAdmin = req.user!.role === "ADMIN";
    const isLeader = job.leaderId === req.user!.id;
    if (!isAdmin && !isLeader) {
      return res
        .status(403)
        .json({ message: "Only job leader/admin can create expenses" });
    }
    if (job.executionMode !== "LEADER_EXECUTION") {
      return res.status(400).json({
        message: "Expenses are allowed only for LEADER_EXECUTION jobs",
      });
    }
    if (job.status !== "IN_PROGRESS") {
      return res.status(400).json({
        message: "Expenses can be created only while job is IN_PROGRESS",
      });
    }
    if (job.fundsFrozen) {
      return res
        .status(400)
        .json({ message: "Funds are frozen due to an active dispute" });
    }

    const transactions = await storage.getJobExpenseTransactions(job.id);
    const totalSpent = transactions.reduce(
      (sum, tx) => sum + (tx.amount || 0),
      0,
    );
    const remaining = roundMoney((job.walletBalance || 0) - totalSpent);
    if (input.amount > remaining) {
      return res.status(400).json({
        message: "Expense exceeds remaining wallet balance",
      });
    }

    const created = await storage.createJobExpenseTransaction({
      jobId: job.id,
      leaderId: req.user!.id,
      amount: input.amount,
      description: input.description,
      proofUrl: input.proofUrl,
    });

    return res.status(201).json(created);
  });

  app.get(api.jobs.ledger.path, async (req, res) => {
    const jobId = Number(req.params.id);
    const job = await storage.getJob(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const transactions = await storage.getJobExpenseTransactions(job.id);
    const totalSpent = roundMoney(
      transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0),
    );
    const totalRaised = roundMoney(job.collectedAmount || 0);
    const remainingBalance = roundMoney((job.walletBalance || 0) - totalSpent);

    return res.json({
      totalRaised,
      totalSpent,
      remainingBalance,
      platformFeePercent: job.platformFeePercent || 0,
      platformFeeAmount: job.platformFeeAmount || 0,
      transactions,
    });
  });

  // =====================
  // WALLET ROUTES
  // =====================

  // Get wallet balance
  app.get(api.wallet.getBalance.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const wallet = await storage.getOrCreateWallet(req.user!.id);
    res.json(wallet);
  });

  // Add money to wallet - create Razorpay order
  app.post(api.wallet.addMoney.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const input = api.wallet.addMoney.input.parse(req.body);
    const amountInPaise = Math.round(input.amount * 100);

    // For demo/testing: immediately credit the wallet
    // In production, this would be done via webhook after payment verification
    const mockOrderId = `wallet_order_${Date.now()}_${req.user!.id}`;
    const mockPaymentId = `pay_${Date.now()}`;

    try {
      await storage.addMoneyToWallet(req.user!.id, input.amount, mockPaymentId);

      res.json({
        orderId: mockOrderId,
        amount: amountInPaise,
        currency: "INR",
        status: "credited",
      });
    } catch (error) {
      console.error("Error adding money to wallet:", error);
      res.status(500).json({ message: "Failed to add money to wallet" });
    }
  });

  // Webhook endpoint for Razorpay payment success
  app.post("/api/webhooks/razorpay", async (req, res) => {
    const { payment_id, order_id, amount } = req.body;

    // In production, verify webhook signature first
    // const signature = req.headers['x-razorpay-signature'];
    // razorpay.webhooks.verify(payload, signature);

    // Extract userId from order_id (format: wallet_order_{timestamp}_{userId})
    const parts = order_id?.split("_");
    const userId = parts ? parseInt(parts[parts.length - 1], 10) : null;

    if (!userId) {
      return res.status(400).json({ message: "Invalid order" });
    }

    const amountInRupees = amount / 100;

    try {
      await storage.addMoneyToWallet(userId, amountInRupees, payment_id);
      res.json({ status: "credited" });
    } catch (error) {
      console.error("Error crediting wallet:", error);
      res.status(500).json({ message: "Failed to credit wallet" });
    }
  });

  // Contribute to job from wallet
  app.post(api.wallet.contribute.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const input = api.wallet.contribute.input.parse(req.body);

    const job = await storage.getJob(input.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (
      job.selectedWorkerId ||
      [
        "AWAITING_VERIFICATION",
        "UNDER_REVIEW",
        "COMPLETED",
        "DISPUTED",
        "CANCELLED",
      ].includes(job.status)
    ) {
      return res.status(400).json({
        message: "Contributions are closed for this job",
      });
    }

    // Check wallet balance
    const wallet = await storage.getOrCreateWallet(req.user!.id);
    if (wallet.availableBalance < input.amount) {
      return res.status(400).json({
        message: "Insufficient wallet balance",
        required: input.amount,
        available: wallet.availableBalance,
      });
    }

    try {
      // Freeze funds in wallet (will be deducted when job completes)
      await storage.freezeWalletFunds(req.user!.id, input.amount, input.jobId);

      // Create contribution record so it shows in contributor list
      // Note: createContribution already updates job's collectedAmount
      await storage.createContribution({
        jobId: input.jobId,
        userId: req.user!.id,
        amount: input.amount,
        paymentStatus: "SUCCESS",
      });

      // Update job status based on new collected amount
      const refreshedJob = await storage.getJob(input.jobId);
      if (refreshedJob) {
        const feePercent = 0;
        const feeCalc = computeFeeAndWallet(
          refreshedJob.collectedAmount || 0,
          feePercent,
        );

        const nextStatus =
          (refreshedJob.collectedAmount || 0) >= refreshedJob.targetAmount
            ? refreshedJob.executionMode === "LEADER_EXECUTION"
              ? "IN_PROGRESS"
              : "FUNDING_COMPLETE"
            : "FUNDING_OPEN";

        await storage.updateJob(refreshedJob.id, {
          status: nextStatus,
          walletBalance: feeCalc.walletBalance,
        });
      }

      // Get updated wallet
      const updatedWallet = await storage.getOrCreateWallet(req.user!.id);
      res.json(updatedWallet);
    } catch (error) {
      console.error("Error contributing from wallet:", error);
      res.status(500).json({ message: "Failed to contribute" });
    }
  });

  // Get wallet transactions
  app.get(api.wallet.getTransactions.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const transactions = await storage.getWalletTransactions(req.user!.id);
    res.json(transactions);
  });

  // Request withdrawal
  app.post(api.wallet.withdraw.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const input = api.wallet.withdraw.input.parse(req.body);

    // Check wallet balance
    const wallet = await storage.getOrCreateWallet(req.user!.id);
    if (wallet.availableBalance < input.amount) {
      return res.status(400).json({
        message: "Insufficient wallet balance",
        required: input.amount,
        available: wallet.availableBalance,
      });
    }

    try {
      // Deduct from wallet
      await storage.deductFromWallet(
        req.user!.id,
        input.amount,
        "WITHDRAWAL",
        `withdrawal_${Date.now()}`,
        "Withdrawal requested to bank account",
      );

      // Create withdrawal request
      const withdrawal = await storage.createWithdrawalRequest({
        userId: req.user!.id,
        amount: input.amount,
        bankAccount: JSON.stringify(input.bankAccount),
      });

      res.status(201).json(withdrawal);
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      res.status(500).json({ message: "Failed to process withdrawal" });
    }
  });

  // Get withdrawal history
  app.get(api.wallet.getWithdrawals.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const withdrawals = await storage.getWithdrawalRequests(req.user!.id);
    res.json(withdrawals);
  });

  return httpServer;
}
