// User types
export interface User {
  id: number;
  username: string;
  name: string;
  phone: string;
  role: "MEMBER" | "LEADER" | "WORKER" | "CONTRIBUTOR" | "ADMIN";
  rating: number;
  totalEarnings: number;
  availability?: string;
  skillTags: string[];
  createdAt: string;
}

// Job types
export interface Job {
  id: number;
  title: string;
  description: string;
  location: string;
  targetAmount: number;
  isPrivateResidentialProperty: boolean;
  collectedAmount: number;
  executionMode: "WORKER_EXECUTION" | "LEADER_EXECUTION";
  status: JobStatus;
  platformFeePercent: number;
  platformFeeAmount: number;
  walletBalance: number;
  fundsFrozen: boolean;
  leaderId: number;
  selectedWorkerId?: number;
  reviewDeadline?: string;
  metadata: Record<string, any>;
  createdAt: string;
  imageUrl?: string;
  leader?: User;
  selectedWorker?: User;
  contributions?: Contribution[];
  proof?: JobProof;
  proofDraft?: JobProof;
  disputes?: Dispute[];
  contributorCount?: number;
  contributorProfiles?: ContributorProfile[];
}

export type JobStatus =
  | "CREATED"
  | "FUNDING_OPEN"
  | "FUNDING_COMPLETE"
  | "WORKER_SELECTED"
  | "IN_PROGRESS"
  | "AWAITING_VERIFICATION"
  | "UNDER_REVIEW"
  | "COMPLETED"
  | "DISPUTED"
  | "CANCELLED";

export interface JobProof {
  beforePhoto?: string;
  afterPhoto?: string;
  disposalPhoto?: string;
  capturedAt?: string;
  metadata?: Record<string, any>;
}

export interface ContributorProfile {
  id: number;
  name: string;
  phone?: string;
  contributionAmount: number;
  contributionDate?: string;
}

// Wallet types
export interface Wallet {
  id: number;
  userId: number;
  availableBalance: number;
  frozenBalance: number;
  totalDeposited: number;
  totalSpent: number;
  totalRefunded: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: number;
  userId: number;
  type: "DEPOSIT" | "CONTRIBUTION" | "REFUND" | "FEE" | "WITHDRAWAL";
  amount: number;
  status: string;
  referenceId?: string;
  description?: string;
  jobId?: number;
  createdAt: string;
}

export interface Withdrawal {
  id: number;
  userId: number;
  amount: number;
  status:
    | "PENDING"
    | "PROCESSING"
    | "APPROVED"
    | "REJECTED"
    | "PAID"
    | "FAILED";
  bankAccount: string;
  razorpayPayoutId?: string;
  adminNote?: string;
  createdAt: string;
  processedAt?: string;
}

// Contribution types
export interface Contribution {
  id: number;
  jobId: number;
  userId: number;
  amount: number;
  paymentStatus: "PENDING" | "SUCCESS" | "FAILED";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
}

// Application types
export interface Application {
  id: number;
  jobId: number;
  workerId: number;
  bidAmount: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  worker?: User;
  createdAt: string;
}

// Ledger types
export interface Ledger {
  totalRaised: number;
  totalSpent: number;
  remainingBalance: number;
  platformFeePercent: number;
  platformFeeAmount: number;
  transactions: LedgerTransaction[];
}

export interface LedgerTransaction {
  id: number;
  jobId: number;
  leaderId: number;
  amount: number;
  description: string;
  proofUrl?: string;
  createdAt: string;
}

// Dispute types
export interface Dispute {
  id: number;
  jobId: number;
  raisedById: number;
  reason: string;
  status: "OPEN" | "RESOLVED";
  details?: DisputeDetails;
  createdAt: string;
}

export interface DisputeDetails {
  raisedEvidencePhotoUrl?: string;
  workerResponse?: {
    message: string;
    photoUrl?: string;
  };
  leaderClarification?: {
    message: string;
  };
  adminDecision?: {
    action: "APPROVE_WORK" | "REJECT_WORK";
  };
}
