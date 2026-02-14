import { z } from 'zod';
import {
  insertUserSchema,
  insertJobSchema,
  insertContributionSchema,
  insertWorkerApplicationSchema,
  insertJobProofSchema,
  insertDisputeSchema,
  users,
  jobs,
  contributions,
  workerApplications,
  jobProofs,
  disputes
} from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register' as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login' as const,
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.validation,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.forbidden,
      },
    },
  },
  jobs: {
    list: {
      method: 'GET' as const,
      path: '/api/jobs' as const,
      input: z.object({
        status: z.string().optional(),
        leaderId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof jobs.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/jobs' as const,
      input: insertJobSchema,
      responses: {
        201: z.custom<typeof jobs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/jobs/:id' as const,
      responses: {
        200: z.custom<typeof jobs.$inferSelect & {
          leader?: typeof users.$inferSelect,
          contributions?: typeof contributions.$inferSelect[],
          selectedWorker?: typeof users.$inferSelect | null,
          proof?: typeof jobProofs.$inferSelect | null
        }>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/jobs/:id' as const,
      input: insertJobSchema.partial().extend({
        status: z.enum([
          "FUNDING_OPEN", "FUNDING_COMPLETE", "WORKER_SELECTED",
          "IN_PROGRESS", "AWAITING_VERIFICATION", "UNDER_REVIEW",
          "COMPLETED", "DISPUTED", "CANCELLED"
        ]).optional(),
        selectedWorkerId: z.number().optional(),
      }),
      responses: {
        200: z.custom<typeof jobs.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  contributions: {
    create: {
      method: 'POST' as const,
      path: '/api/contributions' as const,
      input: insertContributionSchema,
      responses: {
        201: z.custom<typeof contributions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
        method: 'GET' as const,
        path: '/api/contributions' as const, // Can filter by job in query params
        responses: {
            200: z.array(z.custom<typeof contributions.$inferSelect>()),
        }
    }
  },
  applications: {
    create: {
      method: 'POST' as const,
      path: '/api/applications' as const,
      input: insertWorkerApplicationSchema,
      responses: {
        201: z.custom<typeof workerApplications.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/jobs/:jobId/applications' as const,
      responses: {
        200: z.array(z.custom<typeof workerApplications.$inferSelect & { worker: typeof users.$inferSelect }>()),
      },
    },
    update: { // Accept/Reject
        method: 'PATCH' as const,
        path: '/api/applications/:id' as const,
        input: z.object({ status: z.enum(["ACCEPTED", "REJECTED"]) }),
        responses: {
            200: z.custom<typeof workerApplications.$inferSelect>(),
        }
    }
  },
  proofs: {
    create: {
      method: 'POST' as const,
      path: '/api/proofs' as const,
      input: insertJobProofSchema,
      responses: {
        201: z.custom<typeof jobProofs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  disputes: {
    create: {
      method: 'POST' as const,
      path: '/api/disputes' as const,
      input: insertDisputeSchema,
      responses: {
        201: z.custom<typeof disputes.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
        method: 'GET' as const,
        path: '/api/disputes' as const,
        responses: {
            200: z.array(z.custom<typeof disputes.$inferSelect>()),
        }
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type LoginInput = z.infer<typeof api.auth.login.input>;
export type RegisterInput = z.infer<typeof api.auth.register.input>;
