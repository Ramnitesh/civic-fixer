import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

type CreateContributionInput = {
  jobId: number;
  amount: number;
};

export function useCreateContribution() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateContributionInput) => {
      const res = await fetch(api.contributions.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const message =
          (await res.json().catch(() => null))?.message ??
          "Failed to contribute";
        throw new Error(message);
      }
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [api.jobs.get.path, variables.jobId],
      });
      toast({
        title: "Contribution Successful",
        description: "Thank you for supporting this cause!",
      });
    },
    onError: (err) => {
      toast({
        title: "Payment Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });
}
