import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

type CreateApplicationInput = {
  jobId: number;
  bidAmount: number;
};

export function useApplications(jobId: number) {
  return useQuery({
    queryKey: [api.applications.list.path, jobId],
    queryFn: async () => {
      const url = buildUrl(api.applications.list.path, { jobId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch applications");
      return await res.json();
    },
    enabled: !!jobId,
  });
}

export function useApplyForJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateApplicationInput) => {
      const res = await fetch(api.applications.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const message =
          (await res.json().catch(() => null))?.message ?? "Failed to apply";
        throw new Error(message);
      }
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.applications.list.path, variables.jobId],
      });
      toast({
        title: "Application Sent",
        description: `Bid applied successfully: ₹${variables.bidAmount}. The leader will review your application.`,
      });
    },
    onError: (err) => {
      toast({
        title: "Application Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });
}
