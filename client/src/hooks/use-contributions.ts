import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

type CreateContributionInput = {
  jobId: number;
  amount: number;
};

export function useMyContributions() {
  return useQuery({
    queryKey: [api.contributions.list.path],
    queryFn: async () => {
      const res = await fetch(api.contributions.list.path);
      if (!res.ok) throw new Error("Failed to fetch contributions");
      return await res.json();
    },
  });
}

export function useCreateContribution() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateContributionInput) => {
      // Use wallet-based contribution
      const res = await fetch(api.wallet.contribute.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const message = errorData?.message ?? "Failed to contribute";

        // Check if it's a wallet balance issue
        if (errorData?.available !== undefined) {
          throw new Error(
            `Insufficient wallet balance. Required: ₹${errorData?.required}, Available: ₹${errorData?.available}`,
          );
        }
        throw new Error(message);
      }
      return await res.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate wallet queries to refresh balance
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({
        queryKey: [api.wallet.getBalance.path],
      });
      queryClient.invalidateQueries({
        queryKey: [api.wallet.getTransactions.path],
      });
      // Invalidate job queries to refresh collected amount
      queryClient.invalidateQueries({
        queryKey: [api.jobs.get.path, variables.jobId],
      });
      queryClient.invalidateQueries({
        queryKey: [api.jobs.list.path],
      });
      queryClient.invalidateQueries({
        queryKey: [api.contributions.list.path],
      });
      toast({
        title: "Contribution Successful",
        description: "Thank you for supporting this cause!",
      });
    },
    onError: (err) => {
      toast({
        title: "Contribution Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });
}
