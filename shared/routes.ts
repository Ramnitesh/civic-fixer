import { z } from "zod";
import {
  insertUserSchema,
  users,
  jobs,
  contributions,
  workerApplications,
  jobProofs,
  disputes,
} from "./schema";

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  forbidden: z.object({ message: z.string() }),
  conflict: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

const createJobInput = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1),
  targetAmount: z.number().positive().max(10000),
  isPrivateResidentialProperty: z.boolean(),
});

const createContributionInput = z.object({
  jobId: z.number(),
  amount: z.number().positive(),
});

const createApplicationInput = z.object({
  jobId: z.number(),
  bidAmount: z.number().positive(),
});

const createProofInput = z.object({
  jobId: z.number(),
  beforePhoto: z.string().min(1),
  afterPhoto: z.string().min(1),
  disposalPhoto: z.string().min(1),
  metadata: z.record(z.unknown()),
  capturedAt: z.string().datetime().optional(),
});

const createDisputeInput = z.object({
  jobId: z.number(),
  reason: z.string().min(1),
});

export const api = {
  auth: {
    register: {
      method: "POST" as const,
      path: "/api/register" as const,
      input: insertUserSchema,
      responses: { 201: z.custom<typeof users.$inferSelect>() },
    },
    login: {
      method: "POST" as const,
      path: "/api/login" as const,
      input: z.object({ username: z.string(), password: z.string() }),
      responses: { 200: z.custom<typeof users.$inferSelect>() },
    },
    logout: {
      method: "POST" as const,
      path: "/api/logout" as const,
      responses: { 200: z.object({ message: z.string() }) },
    },
    me: {
      method: "GET" as const,
      path: "/api/user" as const,
      responses: { 200: z.custom<typeof users.$inferSelect>() },
    },
    updateProfile: {
      method: "PATCH" as const,
      path: "/api/user/profile" as const,
      input: z
        .object({
          name: z.string().min(1).optional(),
          phone: z.string().min(1).optional(),
          availability: z.string().optional(),
          skillTags: z.array(z.string()).optional(),
        })
        .strict(),
      responses: { 200: z.custom<typeof users.$inferSelect>() },
    },
  },
  jobs: {
    list: {
      method: "GET" as const,
      path: "/api/jobs" as const,
      input: z
        .object({
          status: z.string().optional(),
          leaderId: z.string().optional(),
        })
        .optional(),
      responses: { 200: z.array(z.custom<typeof jobs.$inferSelect>()) },
    },
    create: {
      method: "POST" as const,
      path: "/api/jobs" as const,
      input: createJobInput,
      responses: { 201: z.custom<typeof jobs.$inferSelect>() },
    },
    get: {
      method: "GET" as const,
      path: "/api/jobs/:id" as const,
      responses: {
        200: z.custom<
          typeof jobs.$inferSelect & {
            leader?: typeof users.$inferSelect;
            contributions?: (typeof contributions.$inferSelect)[];
            contributorProfiles?: (typeof users.$inferSelect)[];
            selectedWorker?: typeof users.$inferSelect | null;
            proof?: typeof jobProofs.$inferSelect | null;
            disputes?: (typeof disputes.$inferSelect)[];
            contributorCount?: number;
          }
        >(),
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/jobs/:id" as const,
      input: z
        .object({
          title: z.string().min(1).optional(),
          description: z.string().min(1).optional(),
          location: z.string().min(1).optional(),
          targetAmount: z.number().positive().max(10000).optional(),
          isPrivateResidentialProperty: z.boolean().optional(),
          status: z
            .enum([
              "FUNDING_OPEN",
              "FUNDING_COMPLETE",
              "WORKER_SELECTED",
              "IN_PROGRESS",
              "AWAITING_VERIFICATION",
              "UNDER_REVIEW",
              "COMPLETED",
              "DISPUTED",
              "CANCELLED",
            ])
            .optional(),
          selectedWorkerId: z.number().optional(),
        })
        .strict(),
      responses: { 200: z.custom<typeof jobs.$inferSelect>() },
    },
  },
  contributions: {
    create: {
      method: "POST" as const,
      path: "/api/contributions" as const,
      input: createContributionInput,
      responses: { 201: z.custom<typeof contributions.$inferSelect>() },
    },
    list: {
      method: "GET" as const,
      path: "/api/contributions" as const,
      responses: {
        200: z.array(z.custom<typeof contributions.$inferSelect>()),
      },
    },
  },
  applications: {
    create: {
      method: "POST" as const,
      path: "/api/applications" as const,
      input: createApplicationInput,
      responses: { 201: z.custom<typeof workerApplications.$inferSelect>() },
    },
    list: {
      method: "GET" as const,
      path: "/api/jobs/:jobId/applications" as const,
      responses: {
        200: z.array(
          z.custom<
            typeof workerApplications.$inferSelect & {
              worker: typeof users.$inferSelect;
            }
          >(),
        ),
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/applications/:id" as const,
      input: z.object({ status: z.enum(["ACCEPTED", "REJECTED"]) }),
      responses: { 200: z.custom<typeof workerApplications.$inferSelect>() },
    },
  },
  proofs: {
    create: {
      method: "POST" as const,
      path: "/api/proofs" as const,
      input: createProofInput,
      responses: { 201: z.custom<typeof jobProofs.$inferSelect>() },
    },
  },
  disputes: {
    create: {
      method: "POST" as const,
      path: "/api/disputes" as const,
      input: createDisputeInput,
      responses: { 201: z.custom<typeof disputes.$inferSelect>() },
    },
    list: {
      method: "GET" as const,
      path: "/api/disputes" as const,
      responses: { 200: z.array(z.custom<typeof disputes.$inferSelect>()) },
    },
  },
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
): string {
  let url = path;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`:${key}`, String(value));
    }
  }
  return url;
}

export type LoginInput = z.infer<typeof api.auth.login.input>;
export type RegisterInput = z.infer<typeof api.auth.register.input>;
