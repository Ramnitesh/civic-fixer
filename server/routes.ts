import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";

import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Authentication
  setupAuth(app);

  // Seed Data
  if ((await storage.getJobs()).length === 0) {
      console.log("Seeding database...");
      const hashedPassword = await hashPassword("password123");
      
      const admin = await storage.createUser({
          username: "admin", password: hashedPassword, name: "Admin User", phone: "0000000000", role: "ADMIN"
      });
      const leader = await storage.createUser({
          username: "leader", password: hashedPassword, name: "Civic Leader", phone: "9876543210", role: "LEADER"
      });
      const worker = await storage.createUser({
          username: "worker", password: hashedPassword, name: "Hard Worker", phone: "1122334455", role: "WORKER"
      });
      const contributor = await storage.createUser({
          username: "contributor", password: hashedPassword, name: "Good Citizen", phone: "5544332211", role: "CONTRIBUTOR"
      });

      const job1 = await storage.createJob({
          title: "Clean Park Bench",
          description: "Remove graffiti and repaint the bench in Central Park.",
          location: "Central Park, Sector 4",
          targetAmount: 2000,
          leaderId: leader.id
      });

      await storage.createContribution({
          jobId: job1.id, userId: contributor.id, amount: 2000, paymentStatus: "SUCCESS"
      });
      // Auto-updates status to FUNDING_COMPLETE logic inside createContribution handles status update if enough contributors, 
      // but my logic requires 3 contributors. So let's add 2 more mock contributors or manually update status for seed.
      // For seed simplicity, I'll just leave it as is or update manually.
      await storage.updateJob(job1.id, { status: "FUNDING_OPEN", collectedAmount: 2000 });

      console.log("Database seeded!");
  }

  // Jobs
  app.get(api.jobs.list.path, async (req, res) => {
    const jobs = await storage.getJobs();
    // Simple in-memory filtering for MVP, normally DB query
    let filtered = jobs;
    if (req.query.status) {
        filtered = filtered.filter(j => j.status === req.query.status);
    }
    if (req.query.leaderId) {
        filtered = filtered.filter(j => j.leaderId === Number(req.query.leaderId));
    }
    res.json(filtered);
  });

  app.post(api.jobs.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const input = api.jobs.create.input.parse(req.body);
    const job = await storage.createJob({ ...input, leaderId: req.user!.id });
    res.status(201).json(job);
  });

  app.get(api.jobs.get.path, async (req, res) => {
    const job = await storage.getJob(Number(req.params.id));
    if (!job) return res.status(404).json({ message: "Job not found" });

    const leader = await storage.getUser(job.leaderId);
    const contributions = await storage.getContributionsByJob(job.id);
    const selectedWorker = job.selectedWorkerId ? await storage.getUser(job.selectedWorkerId) : null;
    const proof = await storage.getJobProof(job.id);

    res.json({ ...job, leader, contributions, selectedWorker, proof });
  });

  app.patch(api.jobs.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = Number(req.params.id);
    const updates = api.jobs.update.input.parse(req.body);
    
    const job = await storage.getJob(id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Only leader or admin should update (simplified)
    if (req.user!.role !== 'ADMIN' && job.leaderId !== req.user!.id) {
       // Allow worker to update status only if IN_PROGRESS -> AWAITING_VERIFICATION (via proof upload really)
       // For MVP, simplistic check:
       if (!(req.user!.role === 'WORKER' && job.selectedWorkerId === req.user!.id)) {
          return res.status(403).json({ message: "Forbidden" });
       }
    }

    const updated = await storage.updateJob(id, updates);
    res.json(updated);
  });

  // Contributions
  app.post(api.contributions.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const input = api.contributions.create.input.parse(req.body);
    
    // Prevent double contribution for MVP logic here if needed
    const contribution = await storage.createContribution({ ...input, userId: req.user!.id });
    
    // Check if funding complete
    const job = await storage.getJob(input.jobId);
    if (job) {
        const uniqueContributors = await storage.getContributorCount(job.id);
        if (job.collectedAmount! >= job.targetAmount && uniqueContributors >= 3) {
            await storage.updateJob(job.id, { status: "FUNDING_COMPLETE" });
        }
    }

    res.status(201).json(contribution);
  });

  app.get(api.contributions.list.path, async (req, res) => {
      // For MVP just return all or filter by job/user
      // This endpoint wasn't strictly defined with params in schema but useful for debugging
      res.json([]); 
  });

  // Applications
  app.post(api.applications.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== 'WORKER') return res.status(403).json({ message: "Only workers can apply" });
    
    const input = api.applications.create.input.parse(req.body);
    const application = await storage.createApplication({ ...input, workerId: req.user!.id });
    res.status(201).json(application);
  });

  app.get(api.applications.list.path, async (req, res) => {
    const apps = await storage.getApplicationsByJob(Number(req.params.jobId));
    res.json(apps);
  });

  app.patch(api.applications.update.path, async (req, res) => {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      const id = Number(req.params.id);
      const { status } = req.body; // Simplified parsing
      
      const app = await storage.updateApplicationStatus(id, status);
      
      // If accepted, update job status and selected worker
      if (status === 'ACCEPTED') {
          await storage.updateJob(app.jobId, { 
              selectedWorkerId: app.workerId,
              status: 'WORKER_SELECTED'
          });
      }

      res.json(app);
  });

  // Proofs
  app.post(api.proofs.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const input = api.proofs.create.input.parse(req.body);
    
    const proof = await storage.createJobProof(input);
    await storage.updateJob(input.jobId, { status: "AWAITING_VERIFICATION" });
    
    res.status(201).json(proof);
  });

  // Disputes
  app.post(api.disputes.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const input = api.disputes.create.input.parse(req.body);
    const dispute = await storage.createDispute({ ...input, raisedById: req.user!.id });
    
    await storage.updateJob(input.jobId, { status: "DISPUTED" });
    
    res.status(201).json(dispute);
  });

  app.get(api.disputes.list.path, async (req, res) => {
      if (!req.isAuthenticated() || req.user!.role !== 'ADMIN') return res.sendStatus(403);
      const disputes = await storage.getDisputes();
      res.json(disputes);
  });

  return httpServer;
}
