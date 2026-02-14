import { db } from "./db";
import {
  users, jobs, contributions, workerApplications, jobProofs, disputes,
  type User, type InsertUser,
  type Job, type InsertJob,
  type Contribution, type InsertContribution,
  type WorkerApplication, type InsertWorkerApplication,
  type JobProof, type InsertJobProof,
  type Dispute, type InsertDispute
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  sessionStore: session.Store;

  // Jobs
  getJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, updates: Partial<InsertJob> & { status?: string, selectedWorkerId?: number }): Promise<Job>;

  // Contributions
  createContribution(contribution: InsertContribution): Promise<Contribution>;
  getContributionsByJob(jobId: number): Promise<Contribution[]>;
  getContributorCount(jobId: number): Promise<number>;

  // Applications
  createApplication(app: InsertWorkerApplication): Promise<WorkerApplication>;
  getApplicationsByJob(jobId: number): Promise<(WorkerApplication & { worker: User })[]>;
  updateApplicationStatus(id: number, status: string): Promise<WorkerApplication>;

  // Proofs
  createJobProof(proof: InsertJobProof): Promise<JobProof>;
  getJobProof(jobId: number): Promise<JobProof | undefined>;

  // Disputes
  createDispute(dispute: InsertDispute): Promise<Dispute>;
  getDisputes(): Promise<Dispute[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Jobs
  async getJobs(): Promise<Job[]> {
    return await db.select().from(jobs).orderBy(desc(jobs.createdAt));
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const [job] = await db.insert(jobs).values(insertJob).returning();
    return job;
  }

  async updateJob(id: number, updates: Partial<InsertJob> & { status?: string, selectedWorkerId?: number }): Promise<Job> {
    const [job] = await db.update(jobs)
      .set(updates)
      .where(eq(jobs.id, id))
      .returning();
    return job;
  }

  // Contributions
  async createContribution(insertContribution: InsertContribution): Promise<Contribution> {
    const [contribution] = await db.insert(contributions).values(insertContribution).returning();
    
    // Auto-update job collected amount
    const job = await this.getJob(insertContribution.jobId);
    if (job) {
        await this.updateJob(job.id, {
            collectedAmount: (job.collectedAmount || 0) + insertContribution.amount
        });
    }

    return contribution;
  }

  async getContributionsByJob(jobId: number): Promise<Contribution[]> {
    return await db.select().from(contributions).where(eq(contributions.jobId, jobId));
  }

  async getContributorCount(jobId: number): Promise<number> {
    // Count unique user IDs contributing to this job
    const result = await db.execute(sql`
        SELECT COUNT(DISTINCT user_id) as count 
        FROM contributions 
        WHERE job_id = ${jobId}
    `);
    return Number(result.rows[0].count);
  }

  // Applications
  async createApplication(insertApp: InsertWorkerApplication): Promise<WorkerApplication> {
    const [app] = await db.insert(workerApplications).values(insertApp).returning();
    return app;
  }

  async getApplicationsByJob(jobId: number): Promise<(WorkerApplication & { worker: User })[]> {
    const result = await db.select({
        application: workerApplications,
        worker: users
    })
    .from(workerApplications)
    .innerJoin(users, eq(workerApplications.workerId, users.id))
    .where(eq(workerApplications.jobId, jobId));

    return result.map(r => ({ ...r.application, worker: r.worker }));
  }

  async updateApplicationStatus(id: number, status: string): Promise<WorkerApplication> {
    const [app] = await db.update(workerApplications)
        .set({ status })
        .where(eq(workerApplications.id, id))
        .returning();
    return app;
  }

  // Proofs
  async createJobProof(insertProof: InsertJobProof): Promise<JobProof> {
    const [proof] = await db.insert(jobProofs).values(insertProof).returning();
    return proof;
  }

  async getJobProof(jobId: number): Promise<JobProof | undefined> {
    const [proof] = await db.select().from(jobProofs).where(eq(jobProofs.jobId, jobId));
    return proof;
  }

  // Disputes
  async createDispute(insertDispute: InsertDispute): Promise<Dispute> {
    const [dispute] = await db.insert(disputes).values(insertDispute).returning();
    return dispute;
  }

  async getDisputes(): Promise<Dispute[]> {
    return await db.select().from(disputes).orderBy(desc(disputes.createdAt));
  }
}

export const storage = new DatabaseStorage();
