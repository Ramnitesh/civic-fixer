import { db } from "./db";
import {
  users,
  jobs,
  contributions,
  workerApplications,
  jobProofs,
  disputes,
  jobExpenseTransactions,
  userWallets,
  walletTransactions,
  withdrawalRequests,
  type User,
  type InsertUser,
  type Job,
  type InsertJob,
  type Contribution,
  type InsertContribution,
  type WorkerApplication,
  type InsertWorkerApplication,
  type JobProof,
  type InsertJobProof,
  type Dispute,
  type InsertDispute,
  type JobExpenseTransaction,
  type InsertJobExpenseTransaction,
  type UserWallet,
  type InsertUserWallet,
  type WalletTransaction,
  type InsertWalletTransaction,
  type WithdrawalRequest,
  type InsertWithdrawalRequest,
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export type JobProofDraft = {
  jobId: number;
  beforePhoto?: string;
  afterPhoto?: string;
  disposalPhoto?: string;
  updatedAt: string;
};

export type DisputeDetails = {
  raisedEvidencePhotoUrl?: string;
  workerResponse?: {
    message: string;
    photoUrl?: string;
    submittedAt: string;
  };
  leaderClarification?: {
    message: string;
    submittedAt: string;
  };
  adminDecision?: {
    action: "APPROVE_WORK" | "REJECT_WORK";
    decidedById: number;
    decidedAt: string;
  };
};

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  sessionStore: session.Store;

  // Jobs
  getJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(
    id: number,
    updates: Partial<Job> & {
      status?: Job["status"];
      selectedWorkerId?: number;
    },
  ): Promise<Job>;
  setJobImage(jobId: number, imageUrl: string): Promise<void>;
  getJobImage(jobId: number): Promise<string | undefined>;

  // Contributions
  createContribution(contribution: InsertContribution): Promise<Contribution>;
  getContributionsByJob(jobId: number): Promise<Contribution[]>;
  getContributionsByUser(userId: number): Promise<Contribution[]>;
  getContributionByJobAndUser(
    jobId: number,
    userId: number,
  ): Promise<Contribution | undefined>;
  getContributorCount(jobId: number): Promise<number>;

  // Applications
  createApplication(app: InsertWorkerApplication): Promise<WorkerApplication>;
  getApplicationsByJob(
    jobId: number,
  ): Promise<(WorkerApplication & { worker: User })[]>;
  getApplicationById(id: number): Promise<WorkerApplication | undefined>;
  getApplicationByJobAndWorker(
    jobId: number,
    workerId: number,
  ): Promise<WorkerApplication | undefined>;
  getAcceptedApplicationByJob(
    jobId: number,
  ): Promise<WorkerApplication | undefined>;
  updateApplicationStatus(
    id: number,
    status: WorkerApplication["status"],
  ): Promise<WorkerApplication>;
  rejectOtherApplications(
    jobId: number,
    acceptedApplicationId: number,
  ): Promise<void>;

  // Proofs
  createJobProof(proof: InsertJobProof): Promise<JobProof>;
  getJobProof(jobId: number): Promise<JobProof | undefined>;
  updateJobProofMetadata(
    jobId: number,
    metadata: Record<string, unknown>,
  ): Promise<JobProof>;
  upsertJobProofDraft(
    input: Omit<JobProofDraft, "updatedAt">,
  ): Promise<JobProofDraft>;
  getJobProofDraft(jobId: number): Promise<JobProofDraft | undefined>;
  clearJobProofDraft(jobId: number): Promise<void>;

  // Disputes
  createDispute(dispute: InsertDispute): Promise<Dispute>;
  getDisputeById(id: number): Promise<Dispute | undefined>;
  getDisputes(): Promise<Dispute[]>;
  getDisputesByJob(jobId: number): Promise<Dispute[]>;
  updateDisputeStatus(id: number, status: Dispute["status"]): Promise<Dispute>;
  setDisputeDetails(disputeId: number, details: DisputeDetails): Promise<void>;
  getDisputeDetails(disputeId: number): Promise<DisputeDetails | undefined>;
  markContributionsRefunded(jobId: number): Promise<void>;

  // Leader execution expenses / ledger
  createJobExpenseTransaction(
    expense: InsertJobExpenseTransaction,
  ): Promise<JobExpenseTransaction>;
  getJobExpenseTransactions(jobId: number): Promise<JobExpenseTransaction[]>;

  // User Wallet
  getOrCreateWallet(userId: number): Promise<UserWallet>;
  getWalletByUserId(userId: number): Promise<UserWallet | undefined>;
  addMoneyToWallet(
    userId: number,
    amount: number,
    referenceId: string,
  ): Promise<UserWallet>;
  deductFromWallet(
    userId: number,
    amount: number,
    type: string,
    referenceId: string,
    description?: string,
    jobId?: number,
  ): Promise<UserWallet>;
  freezeWalletFunds(
    userId: number,
    amount: number,
    jobId?: number,
  ): Promise<UserWallet>;
  addToFrozen(
    userId: number,
    amount: number,
    description: string,
    type?: string,
  ): Promise<UserWallet>;
  unfreezeWalletFunds(userId: number, amount: number): Promise<UserWallet>;
  deductFromFrozen(
    userId: number,
    amount: number,
    type: string,
    referenceId: string,
    description?: string,
    jobId?: number,
  ): Promise<UserWallet>;
  deductFromFrozenNoTransaction(
    userId: number,
    amount: number,
  ): Promise<UserWallet>;
  refundToWallet(
    userId: number,
    amount: number,
    jobId: number,
    description?: string,
  ): Promise<UserWallet>;

  // Wallet Transactions
  createWalletTransaction(
    tx: InsertWalletTransaction,
  ): Promise<WalletTransaction>;
  getWalletTransactions(
    userId: number,
    limit?: number,
  ): Promise<WalletTransaction[]>;

  // Withdrawal Requests
  createWithdrawalRequest(
    request: InsertWithdrawalRequest,
  ): Promise<WithdrawalRequest>;
  getWithdrawalRequests(userId: number): Promise<WithdrawalRequest[]>;
  getWithdrawalRequestById(id: number): Promise<WithdrawalRequest | undefined>;
  updateWithdrawalStatus(
    id: number,
    status: WithdrawalRequest["status"],
    razorpayPayoutId?: string,
    adminNote?: string,
  ): Promise<WithdrawalRequest>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  private jobImageUrls = new Map<number, string>();
  private proofDrafts = new Map<number, JobProofDraft>();
  private disputeDetails = new Map<number, DisputeDetails>();

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
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        skillTags: Array.isArray(insertUser.skillTags)
          ? insertUser.skillTags.map((tag) => String(tag))
          : undefined,
      })
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
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

  async updateJob(
    id: number,
    updates: Partial<Job> & {
      status?: Job["status"];
      selectedWorkerId?: number;
    },
  ): Promise<Job> {
    const [job] = await db
      .update(jobs)
      .set(updates)
      .where(eq(jobs.id, id))
      .returning();
    return job;
  }

  async setJobImage(jobId: number, imageUrl: string): Promise<void> {
    this.jobImageUrls.set(jobId, imageUrl);
  }

  async getJobImage(jobId: number): Promise<string | undefined> {
    return this.jobImageUrls.get(jobId);
  }

  // Contributions
  async createContribution(
    insertContribution: InsertContribution,
  ): Promise<Contribution> {
    const [contribution] = await db
      .insert(contributions)
      .values(insertContribution)
      .returning();

    // Auto-update job collected amount
    const job = await this.getJob(insertContribution.jobId);
    if (job) {
      await this.updateJob(job.id, {
        collectedAmount: (job.collectedAmount || 0) + insertContribution.amount,
      });
    }

    return contribution;
  }

  async getContributionsByJob(jobId: number): Promise<Contribution[]> {
    return await db
      .select()
      .from(contributions)
      .where(eq(contributions.jobId, jobId));
  }

  async getContributionsByUser(userId: number): Promise<Contribution[]> {
    return await db
      .select()
      .from(contributions)
      .where(eq(contributions.userId, userId))
      .orderBy(desc(contributions.createdAt));
  }

  async getContributionByJobAndUser(
    jobId: number,
    userId: number,
  ): Promise<Contribution | undefined> {
    const [contribution] = await db
      .select()
      .from(contributions)
      .where(
        and(eq(contributions.jobId, jobId), eq(contributions.userId, userId)),
      );
    return contribution;
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
  async createApplication(
    insertApp: InsertWorkerApplication,
  ): Promise<WorkerApplication> {
    const [app] = await db
      .insert(workerApplications)
      .values(insertApp)
      .returning();
    return app;
  }

  async getApplicationsByJob(
    jobId: number,
  ): Promise<(WorkerApplication & { worker: User })[]> {
    const result = await db
      .select({
        application: workerApplications,
        worker: users,
      })
      .from(workerApplications)
      .innerJoin(users, eq(workerApplications.workerId, users.id))
      .where(eq(workerApplications.jobId, jobId));

    return result.map((r) => ({ ...r.application, worker: r.worker }));
  }

  async getApplicationById(id: number): Promise<WorkerApplication | undefined> {
    const [app] = await db
      .select()
      .from(workerApplications)
      .where(eq(workerApplications.id, id));
    return app;
  }

  async getApplicationByJobAndWorker(
    jobId: number,
    workerId: number,
  ): Promise<WorkerApplication | undefined> {
    const [app] = await db
      .select()
      .from(workerApplications)
      .where(
        and(
          eq(workerApplications.jobId, jobId),
          eq(workerApplications.workerId, workerId),
        ),
      );
    return app;
  }

  async getAcceptedApplicationByJob(
    jobId: number,
  ): Promise<WorkerApplication | undefined> {
    const [app] = await db
      .select()
      .from(workerApplications)
      .where(
        and(
          eq(workerApplications.jobId, jobId),
          eq(workerApplications.status, "ACCEPTED"),
        ),
      );
    return app;
  }

  async updateApplicationStatus(
    id: number,
    status: WorkerApplication["status"],
  ): Promise<WorkerApplication> {
    const [app] = await db
      .update(workerApplications)
      .set({ status })
      .where(eq(workerApplications.id, id))
      .returning();
    return app;
  }

  async rejectOtherApplications(
    jobId: number,
    acceptedApplicationId: number,
  ): Promise<void> {
    await db
      .update(workerApplications)
      .set({ status: "REJECTED" })
      .where(
        and(
          eq(workerApplications.jobId, jobId),
          sql`${workerApplications.id} <> ${acceptedApplicationId}`,
        ),
      );
  }

  // Proofs
  async createJobProof(insertProof: InsertJobProof): Promise<JobProof> {
    const [proof] = await db.insert(jobProofs).values(insertProof).returning();
    return proof;
  }

  async getJobProof(jobId: number): Promise<JobProof | undefined> {
    const [proof] = await db
      .select()
      .from(jobProofs)
      .where(eq(jobProofs.jobId, jobId));
    return proof;
  }

  async updateJobProofMetadata(
    jobId: number,
    metadata: Record<string, unknown>,
  ): Promise<JobProof> {
    const [updated] = await db
      .update(jobProofs)
      .set({ metadata })
      .where(eq(jobProofs.jobId, jobId))
      .returning();

    return updated;
  }

  async upsertJobProofDraft(
    input: Omit<JobProofDraft, "updatedAt">,
  ): Promise<JobProofDraft> {
    const existing = this.proofDrafts.get(input.jobId);
    const merged: JobProofDraft = {
      jobId: input.jobId,
      beforePhoto: input.beforePhoto ?? existing?.beforePhoto,
      afterPhoto: input.afterPhoto ?? existing?.afterPhoto,
      disposalPhoto: input.disposalPhoto ?? existing?.disposalPhoto,
      updatedAt: new Date().toISOString(),
    };
    this.proofDrafts.set(input.jobId, merged);
    return merged;
  }

  async getJobProofDraft(jobId: number): Promise<JobProofDraft | undefined> {
    return this.proofDrafts.get(jobId);
  }

  async clearJobProofDraft(jobId: number): Promise<void> {
    this.proofDrafts.delete(jobId);
  }

  // Disputes
  async createDispute(insertDispute: InsertDispute): Promise<Dispute> {
    const [dispute] = await db
      .insert(disputes)
      .values(insertDispute)
      .returning();
    return dispute;
  }

  async getDisputeById(id: number): Promise<Dispute | undefined> {
    const [dispute] = await db
      .select()
      .from(disputes)
      .where(eq(disputes.id, id));
    return dispute;
  }

  async getDisputes(): Promise<Dispute[]> {
    return await db.select().from(disputes).orderBy(desc(disputes.createdAt));
  }

  async getDisputesByJob(jobId: number): Promise<Dispute[]> {
    return await db
      .select()
      .from(disputes)
      .where(eq(disputes.jobId, jobId))
      .orderBy(desc(disputes.createdAt));
  }

  async updateDisputeStatus(
    id: number,
    status: Dispute["status"],
  ): Promise<Dispute> {
    const [updated] = await db
      .update(disputes)
      .set({ status })
      .where(eq(disputes.id, id))
      .returning();

    return updated;
  }

  async setDisputeDetails(
    disputeId: number,
    details: DisputeDetails,
  ): Promise<void> {
    this.disputeDetails.set(disputeId, details);
  }

  async getDisputeDetails(
    disputeId: number,
  ): Promise<DisputeDetails | undefined> {
    return this.disputeDetails.get(disputeId);
  }

  async markContributionsRefunded(jobId: number): Promise<void> {
    await db
      .update(contributions)
      .set({ paymentStatus: "FAILED" })
      .where(eq(contributions.jobId, jobId));
  }

  async createJobExpenseTransaction(
    expense: InsertJobExpenseTransaction,
  ): Promise<JobExpenseTransaction> {
    const [result] = await db
      .insert(jobExpenseTransactions)
      .values(expense)
      .returning();
    return result;
  }

  async getJobExpenseTransactions(
    jobId: number,
  ): Promise<JobExpenseTransaction[]> {
    return await db
      .select()
      .from(jobExpenseTransactions)
      .where(eq(jobExpenseTransactions.jobId, jobId))
      .orderBy(desc(jobExpenseTransactions.createdAt));
  }

  // === WALLET METHODS ===

  async getOrCreateWallet(userId: number): Promise<UserWallet> {
    let [wallet] = await db
      .select()
      .from(userWallets)
      .where(eq(userWallets.userId, userId));

    if (!wallet) {
      [wallet] = await db.insert(userWallets).values({ userId }).returning();
    }

    return wallet;
  }

  async getWalletByUserId(userId: number): Promise<UserWallet | undefined> {
    const [wallet] = await db
      .select()
      .from(userWallets)
      .where(eq(userWallets.userId, userId));
    return wallet;
  }

  async addMoneyToWallet(
    userId: number,
    amount: number,
    referenceId: string,
  ): Promise<UserWallet> {
    const wallet = await this.getOrCreateWallet(userId);
    const roundedAmount = Math.round(amount * 100) / 100;

    const [updated] = await db
      .update(userWallets)
      .set({
        availableBalance: wallet.availableBalance + roundedAmount,
        totalDeposited: wallet.totalDeposited + roundedAmount,
        updatedAt: new Date(),
      })
      .where(eq(userWallets.userId, userId))
      .returning();

    // Create transaction record
    await this.createWalletTransaction({
      userId,
      type: "DEPOSIT",
      amount: roundedAmount,
      status: "SUCCESS",
      referenceId,
      description: "Money added to wallet via Razorpay",
    });

    return updated;
  }

  async deductFromWallet(
    userId: number,
    amount: number,
    type: string,
    referenceId: string,
    description?: string,
    jobId?: number,
  ): Promise<UserWallet> {
    const wallet = await this.getOrCreateWallet(userId);
    const roundedAmount = Math.round(amount * 100) / 100;

    if (wallet.availableBalance < roundedAmount) {
      throw new Error("Insufficient wallet balance");
    }

    const [updated] = await db
      .update(userWallets)
      .set({
        availableBalance: wallet.availableBalance - roundedAmount,
        totalSpent: wallet.totalSpent + roundedAmount,
        updatedAt: new Date(),
      })
      .where(eq(userWallets.userId, userId))
      .returning();

    // Create transaction record
    await this.createWalletTransaction({
      userId,
      type: type as any,
      amount: roundedAmount,
      status: "SUCCESS",
      referenceId,
      description,
      jobId,
    });

    return updated;
  }

  async freezeWalletFunds(
    userId: number,
    amount: number,
    jobId?: number,
  ): Promise<UserWallet> {
    const wallet = await this.getOrCreateWallet(userId);
    const roundedAmount = Math.round(amount * 100) / 100;

    if (wallet.availableBalance < roundedAmount) {
      throw new Error("Insufficient available balance to freeze");
    }

    // Available: -Amount (deducted), Frozen: no change, Spent: +Amount
    const [updated] = await db
      .update(userWallets)
      .set({
        availableBalance: wallet.availableBalance - roundedAmount,
        totalSpent: wallet.totalSpent + roundedAmount,
        updatedAt: new Date(),
      })
      .where(eq(userWallets.userId, userId))
      .returning();

    // Create transaction record for contributed amount
    const jobRef = jobId ? `#${jobId}` : "";
    await this.createWalletTransaction({
      userId,
      type: "FEE",
      amount: roundedAmount,
      status: "SUCCESS",
      referenceId: `contribute-${jobId || Date.now()}`,
      description: `Contributed to job ${jobRef} pending completion`,
      jobId: jobId,
    });

    return updated;
  }

  async addToFrozen(
    userId: number,
    amount: number,
    description: string,
    type: string = "FEE",
  ): Promise<UserWallet> {
    // Ensure wallet exists first
    const wallet = await this.getOrCreateWallet(userId);
    const roundedAmount = Math.round(amount * 100) / 100;

    // For REFUND type: decrease totalSpent (refund reduces spent)
    const updateData: Record<string, unknown> = {
      frozenBalance: wallet.frozenBalance + roundedAmount,
      updatedAt: new Date(),
    };

    if (type === "REFUND") {
      // Decrease spent when refunding
      updateData.totalSpent = Math.max(0, wallet.totalSpent - roundedAmount);
    }

    const [updated] = await db
      .update(userWallets)
      .set(updateData)
      .where(eq(userWallets.userId, userId))
      .returning();

    // Create transaction record for added frozen amount
    await this.createWalletTransaction({
      userId,
      type: type as any,
      amount: roundedAmount,
      status: "SUCCESS",
      referenceId: `frozen-${Date.now()}`,
      description: description,
    });

    // Return fresh wallet data
    return await this.getOrCreateWallet(userId);
  }

  async unfreezeWalletFunds(
    userId: number,
    amount: number,
  ): Promise<UserWallet> {
    const wallet = await this.getOrCreateWallet(userId);
    const roundedAmount = Math.round(amount * 100) / 100;

    if (wallet.frozenBalance < roundedAmount) {
      throw new Error("Insufficient frozen balance to unfreeze");
    }

    // Don't change totalSpent - just move from frozen to available
    const [updated] = await db
      .update(userWallets)
      .set({
        availableBalance: wallet.availableBalance + roundedAmount,
        frozenBalance: wallet.frozenBalance - roundedAmount,
        updatedAt: new Date(),
      })
      .where(eq(userWallets.userId, userId))
      .returning();

    // Create transaction record for unfreeze (when job completes)
    await this.createWalletTransaction({
      userId,
      type: "REFUND",
      amount: roundedAmount,
      status: "SUCCESS",
      referenceId: `unfreeze-${Date.now()}`,
      description: `Refund - Job completed, unused funds returned`,
    });

    return updated;
  }

  async deductFromFrozen(
    userId: number,
    amount: number,
    type: string,
    referenceId: string,
    description?: string,
    jobId?: number,
  ): Promise<UserWallet> {
    const wallet = await this.getOrCreateWallet(userId);
    const roundedAmount = Math.round(amount * 100) / 100;

    if (wallet.frozenBalance < roundedAmount) {
      throw new Error("Insufficient frozen balance to deduct");
    }

    const [updated] = await db
      .update(userWallets)
      .set({
        frozenBalance: wallet.frozenBalance - roundedAmount,
        totalSpent: wallet.totalSpent + roundedAmount,
        updatedAt: new Date(),
      })
      .where(eq(userWallets.userId, userId))
      .returning();

    // Create transaction record for deducted frozen funds
    await this.createWalletTransaction({
      userId,
      type: type as any,
      amount: roundedAmount,
      status: "SUCCESS",
      referenceId,
      description,
      jobId,
    });

    return updated;
  }

  async deductFromFrozenNoTransaction(
    userId: number,
    amount: number,
  ): Promise<UserWallet> {
    const wallet = await this.getOrCreateWallet(userId);
    const roundedAmount = Math.round(amount * 100) / 100;

    if (wallet.frozenBalance < roundedAmount) {
      throw new Error("Insufficient frozen balance to deduct");
    }

    const [updated] = await db
      .update(userWallets)
      .set({
        frozenBalance: wallet.frozenBalance - roundedAmount,
        updatedAt: new Date(),
      })
      .where(eq(userWallets.userId, userId))
      .returning();

    return updated;
  }

  async refundToWallet(
    userId: number,
    amount: number,
    jobId: number,
    description?: string,
  ): Promise<UserWallet> {
    const wallet = await this.getOrCreateWallet(userId);
    const roundedAmount = Math.round(amount * 100) / 100;

    const [updated] = await db
      .update(userWallets)
      .set({
        availableBalance: wallet.availableBalance + roundedAmount,
        totalRefunded: wallet.totalRefunded + roundedAmount,
        updatedAt: new Date(),
      })
      .where(eq(userWallets.userId, userId))
      .returning();

    // Create transaction record
    await this.createWalletTransaction({
      userId,
      type: "REFUND",
      amount: roundedAmount,
      status: "SUCCESS",
      referenceId: `job-${jobId}-refund`,
      description: description || `Refund for job #${jobId}`,
      jobId,
    });

    return updated;
  }

  // Wallet Transactions
  async createWalletTransaction(
    tx: InsertWalletTransaction,
  ): Promise<WalletTransaction> {
    const [transaction] = await db
      .insert(walletTransactions)
      .values(tx)
      .returning();
    return transaction;
  }

  async getWalletTransactions(
    userId: number,
    limit: number = 50,
  ): Promise<WalletTransaction[]> {
    return await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(limit);
  }

  // Withdrawal Requests
  async createWithdrawalRequest(
    request: InsertWithdrawalRequest,
  ): Promise<WithdrawalRequest> {
    const [withdrawal] = await db
      .insert(withdrawalRequests)
      .values(request)
      .returning();
    return withdrawal;
  }

  async getWithdrawalRequests(userId: number): Promise<WithdrawalRequest[]> {
    return await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.userId, userId))
      .orderBy(desc(withdrawalRequests.createdAt));
  }

  async getWithdrawalRequestById(
    id: number,
  ): Promise<WithdrawalRequest | undefined> {
    const [withdrawal] = await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.id, id));
    return withdrawal;
  }

  async updateWithdrawalStatus(
    id: number,
    status: WithdrawalRequest["status"],
    razorpayPayoutId?: string,
    adminNote?: string,
  ): Promise<WithdrawalRequest> {
    const [updated] = await db
      .update(withdrawalRequests)
      .set({
        status,
        razorpayPayoutId,
        adminNote,
        processedAt:
          status === "PAID" || status === "FAILED" ? new Date() : undefined,
      })
      .where(eq(withdrawalRequests.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
