import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { Job } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useJobs(filters?: { status?: string; leaderId?: string }) {
  const queryKey = [
    api.jobs.list.path,
    filters?.status,
    filters?.leaderId,
  ].filter(Boolean);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = filters
        ? `${api.jobs.list.path}?${new URLSearchParams(filters as any)}`
        : api.jobs.list.path;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return await res.json();
    },
  });
}

export function useJob(id: number) {
  return useQuery({
    queryKey: [api.jobs.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.jobs.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch job details");
      return await res.json();
    },
    enabled: !!id,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (job: {
      title: string;
      description: string;
      location: string;
      targetAmount: number;
      isPrivateResidentialProperty: boolean;
    }) => {
      const res = await fetch(api.jobs.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job),
      });
      if (!res.ok) {
        const message =
          (await res.json().catch(() => null))?.message ??
          "Failed to create job";
        throw new Error(message);
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.list.path] });
      toast({
        title: "Job Created",
        description: "Your cleanup job is now live!",
      });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: number } & {
      title?: string;
      description?: string;
      location?: string;
      targetAmount?: number;
      isPrivateResidentialProperty?: boolean;
      status?: Job["status"];
      selectedWorkerId?: number;
    }) => {
      const url = buildUrl(api.jobs.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const message =
          (await res.json().catch(() => null))?.message ??
          "Failed to update job";
        throw new Error(message);
      }
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.jobs.get.path, data.id] });
      toast({
        title: "Job Updated",
        description: "Changes saved successfully",
      });
    },
  });
}
