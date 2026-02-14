import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertContribution } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useCreateContribution() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertContribution) => {
      const res = await fetch(api.contributions.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to contribute");
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.get.path, variables.jobId] });
      toast({ title: "Contribution Successful", description: "Thank you for supporting this cause!" });
    },
    onError: (err) => {
      toast({ title: "Payment Failed", description: err.message, variant: "destructive" });
    },
  });
}
