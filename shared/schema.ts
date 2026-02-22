import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  real,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // Acts as login identifier (phone/email)
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  role: text("role", {
    enum: ["MEMBER", "LEADER", "CONTRIBUTOR", "WORKER", "ADMIN"],
  })
    .notNull()
    .default("MEMBER"),
  rating: real("rating").default(5.0),
  totalEarnings: real("total_earnings").default(0.0),
  availability: text("availability"),
  skillTags: jsonb("skill_tags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  targetAmount: real("target_amount").notNull(), // Max 10000
  isPrivateResidentialProperty: boolean("is_private_residential_property")
    .notNull()
    .default(false),
  collectedAmount: real("collected_amount").default(0.0),
  executionMode: text("execution_mode", {
    enum: ["WORKER_EXECUTION", "LEADER_EXECUTION"],
  }).notNull(),
  status: text("status", {
    enum: [
      "FUNDING_OPEN",
      "FUNDING_COMPLETE",
      "WORKER_SELECTED",
      "IN_PROGRESS",
      "AWAITING_VERIFICATION",
      "UNDER_REVIEW",
      "COMPLETED",
      "DISPUTED",
      "CANCELLED",
    ],
  })
    .notNull()
    .default("FUNDING_OPEN"),
  platformFeePercent: real("platform_fee_percent").notNull().default(0),
  platformFeeAmount: real("platform_fee_amount").notNull().default(0),
  walletBalance: real("wallet_balance").notNull().default(0),
  fundsFrozen: boolean("funds_frozen").notNull().default(false),
  leaderId: integer("leader_id").notNull(),
  selectedWorkerId: integer("selected_worker_id"),
  reviewDeadline: timestamp("review_deadline"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contributions = pgTable("contributions", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  userId: integer("user_id").notNull(),
  amount: real("amount").notNull(),
  paymentStatus: text("payment_status", {
    enum: ["PENDING", "SUCCESS", "FAILED"],
  })
    .notNull()
    .default("PENDING"),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workerApplications = pgTable("worker_applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  workerId: integer("worker_id").notNull(),
  bidAmount: real("bid_amount").notNull(),
  status: text("status", { enum: ["PENDING", "ACCEPTED", "REJECTED"] })
    .notNull()
    .default("PENDING"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobProofs = pgTable("job_proofs", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  beforePhoto: text("before_photo").notNull(),
  afterPhoto: text("after_photo").notNull(),
  disposalPhoto: text("disposal_photo").notNull(),
  metadata: jsonb("metadata")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  capturedAt: timestamp("captured_at").notNull().defaultNow(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const disputes = pgTable("disputes", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  raisedById: integer("raised_by_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["OPEN", "RESOLVED", "REJECTED"] })
    .notNull()
    .default("OPEN"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobExpenseTransactions = pgTable("job_expense_transactions", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  leaderId: integer("leader_id").notNull(),
  amount: real("amount").notNull(),
  description: text("description").notNull(),
  proofUrl: text("proof_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === WALLET TABLES ===

export const userWallets = pgTable("user_wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  availableBalance: real("available_balance").notNull().default(0),
  frozenBalance: real("frozen_balance").notNull().default(0),
  totalDeposited: real("total_deposited").notNull().default(0),
  totalSpent: real("total_spent").notNull().default(0),
  totalRefunded: real("total_refunded").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type", {
    enum: ["DEPOSIT", "CONTRIBUTION", "REFUND", "WITHDRAWAL", "FEE", "BONUS"],
  }).notNull(),
  amount: real("amount").notNull(),
  status: text("status", {
    enum: ["PENDING", "SUCCESS", "FAILED", "CANCELLED"],
  })
    .notNull()
    .default("PENDING"),
  referenceId: text("reference_id"), // Razorpay order/payment ID or job ID
  description: text("description"),
  jobId: integer("job_id"), // For contribution/refund related to a job
  createdAt: timestamp("created_at").defaultNow(),
});

export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: real("amount").notNull(),
  status: text("status", {
    enum: ["PENDING", "APPROVED", "PROCESSING", "PAID", "FAILED", "REJECTED"],
  })
    .notNull()
    .default("PENDING"),
  bankAccount: text("bank_account").notNull(), // JSON string of bank details
  razorpayPayoutId: text("razorpay_payout_id"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
  ledJobs: many(jobs, { relationName: "leaderJobs" }),
  workerJobs: many(jobs, { relationName: "workerJobs" }),
  contributions: many(contributions),
  applications: many(workerApplications),
  disputes: many(disputes),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  leader: one(users, {
    fields: [jobs.leaderId],
    references: [users.id],
    relationName: "leaderJobs",
  }),
  selectedWorker: one(users, {
    fields: [jobs.selectedWorkerId],
    references: [users.id],
    relationName: "workerJobs",
  }),
  contributions: many(contributions),
  applications: many(workerApplications),
  proof: one(jobProofs, {
    fields: [jobs.id],
    references: [jobProofs.jobId],
  }),
  disputes: many(disputes),
  expenses: many(jobExpenseTransactions),
}));

export const contributionsRelations = relations(contributions, ({ one }) => ({
  job: one(jobs, {
    fields: [contributions.jobId],
    references: [jobs.id],
  }),
  user: one(users, {
    fields: [contributions.userId],
    references: [users.id],
  }),
}));

export const workerApplicationsRelations = relations(
  workerApplications,
  ({ one }) => ({
    job: one(jobs, {
      fields: [workerApplications.jobId],
      references: [jobs.id],
    }),
    worker: one(users, {
      fields: [workerApplications.workerId],
      references: [users.id],
    }),
  }),
);

export const jobProofsRelations = relations(jobProofs, ({ one }) => ({
  job: one(jobs, {
    fields: [jobProofs.jobId],
    references: [jobs.id],
  }),
}));

export const disputesRelations = relations(disputes, ({ one }) => ({
  job: one(jobs, {
    fields: [disputes.jobId],
    references: [jobs.id],
  }),
  raisedBy: one(users, {
    fields: [disputes.raisedById],
    references: [users.id],
  }),
}));

export const jobExpenseTransactionsRelations = relations(
  jobExpenseTransactions,
  ({ one }) => ({
    job: one(jobs, {
      fields: [jobExpenseTransactions.jobId],
      references: [jobs.id],
    }),
    leader: one(users, {
      fields: [jobExpenseTransactions.leaderId],
      references: [users.id],
    }),
  }),
);

// Wallet relations
export const userWalletsRelations = relations(userWallets, ({ one, many }) => ({
  user: one(users, {
    fields: [userWallets.userId],
    references: [users.id],
  }),
  transactions: many(walletTransactions),
}));

export const walletTransactionsRelations = relations(
  walletTransactions,
  ({ one }) => ({
    user: one(users, {
      fields: [walletTransactions.userId],
      references: [users.id],
    }),
    job: one(jobs, {
      fields: [walletTransactions.jobId],
      references: [jobs.id],
    }),
  }),
);

export const withdrawalRequestsRelations = relations(
  withdrawalRequests,
  ({ one }) => ({
    user: one(users, {
      fields: [withdrawalRequests.userId],
      references: [users.id],
    }),
  }),
);

// === BASE SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  rating: true,
  totalEarnings: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  collectedAmount: true,
  status: true,
  platformFeePercent: true,
  platformFeeAmount: true,
  walletBalance: true,
  fundsFrozen: true,
  selectedWorkerId: true,
  reviewDeadline: true,
});

export const insertContributionSchema = createInsertSchema(contributions).omit({
  id: true,
  createdAt: true,
  razorpayOrderId: true,
  razorpayPaymentId: true,
});

export const insertWorkerApplicationSchema = createInsertSchema(
  workerApplications,
).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertJobProofSchema = createInsertSchema(jobProofs).omit({
  id: true,
  uploadedAt: true,
});

export const insertDisputeSchema = createInsertSchema(disputes).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertJobExpenseTransactionSchema = createInsertSchema(
  jobExpenseTransactions,
).omit({
  id: true,
  createdAt: true,
});

export const insertUserWalletSchema = createInsertSchema(userWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWalletTransactionSchema = createInsertSchema(
  walletTransactions,
).omit({
  id: true,
  createdAt: true,
});

export const insertWithdrawalRequestSchema = createInsertSchema(
  withdrawalRequests,
).omit({
  id: true,
  createdAt: true,
  processedAt: true,
  status: true,
  razorpayPayoutId: true,
});

// === EXPLICIT API CONTRACT TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Contribution = typeof contributions.$inferSelect;
export type InsertContribution = z.infer<typeof insertContributionSchema>;

export type WorkerApplication = typeof workerApplications.$inferSelect;
export type InsertWorkerApplication = z.infer<
  typeof insertWorkerApplicationSchema
>;

export type JobProof = typeof jobProofs.$inferSelect;
export type InsertJobProof = z.infer<typeof insertJobProofSchema>;

export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;

export type JobExpenseTransaction = typeof jobExpenseTransactions.$inferSelect;
export type InsertJobExpenseTransaction = z.infer<
  typeof insertJobExpenseTransactionSchema
>;

export type UpdateUserProfileRequest = Partial<
  Pick<User, "name" | "phone" | "availability" | "skillTags">
>;

export type CreateJobRequest = Pick<
  Job,
  | "title"
  | "description"
  | "location"
  | "targetAmount"
  | "isPrivateResidentialProperty"
  | "executionMode"
>;
export type UpdateJobRequest = Partial<CreateJobRequest> & {
  status?: Job["status"];
  selectedWorkerId?: number;
};
export type CreateContributionRequest = Pick<Contribution, "jobId" | "amount">;
export type CreateApplicationRequest = Pick<
  WorkerApplication,
  "jobId" | "bidAmount"
>;
export type CreateProofRequest = Pick<
  JobProof,
  "jobId" | "beforePhoto" | "afterPhoto" | "disposalPhoto" | "metadata"
> & {
  capturedAt?: string;
};
export type CreateDisputeRequest = Pick<Dispute, "jobId" | "reason">;

// Response types
export type JobResponse = Job & {
  leader?: User;
  selectedWorker?: User | null;
  contributions?: Contribution[];
  applicationCount?: number;
};

export type ApplicationResponse = WorkerApplication & {
  worker?: User;
};

// Wallet types
export type UserWallet = typeof userWallets.$inferSelect;
export type InsertUserWallet = z.infer<typeof insertUserWalletSchema>;

export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = z.infer<
  typeof insertWalletTransactionSchema
>;

export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = z.infer<
  typeof insertWithdrawalRequestSchema
>;

// Wallet transaction types for API
export type WalletTransactionType = WalletTransaction["type"];
export type WalletTransactionStatus = WalletTransaction["status"];
export type WithdrawalRequestStatus = WithdrawalRequest["status"];

// API Request/Response types
export type AddMoneyRequest = {
  amount: number;
};

export type CreateWithdrawalRequest = {
  amount: number;
  bankAccount: {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
  };
};

export type WalletResponse = {
  wallet: UserWallet;
  transactions: WalletTransaction[];
};

export type ContributionFromWalletRequest = {
  jobId: number;
  amount: number;
};
