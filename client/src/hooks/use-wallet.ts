import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface UserWallet {
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

export interface WalletTransaction {
  id: number;
  userId: number;
  type: "DEPOSIT" | "CONTRIBUTION" | "REFUND" | "WITHDRAWAL" | "FEE" | "BONUS";
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  referenceId: string | null;
  description: string | null;
  jobId: number | null;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: number;
  userId: number;
  amount: number;
  status:
    | "PENDING"
    | "APPROVED"
    | "PROCESSING"
    | "PAID"
    | "FAILED"
    | "REJECTED";
  bankAccount: string;
  razorpayPayoutId: string | null;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
}

const API_BASE = "/api";

async function fetchWallet(): Promise<UserWallet> {
  // Add cache-busting query param to avoid 304 caching
  const res = await fetch(`${API_BASE}/wallet?t=${Date.now()}`);
  if (!res.ok) throw new Error("Failed to fetch wallet");
  return res.json();
}

async function fetchTransactions(): Promise<WalletTransaction[]> {
  const res = await fetch(`${API_BASE}/wallet/transactions`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

async function fetchWithdrawals(): Promise<WithdrawalRequest[]> {
  const res = await fetch(`${API_BASE}/wallet/withdrawals`);
  if (!res.ok) throw new Error("Failed to fetch withdrawals");
  return res.json();
}

async function addMoney(
  amount: number,
): Promise<{ orderId: string; amount: number; currency: string }> {
  const res = await fetch(`${API_BASE}/wallet/add-money`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to add money");
  }
  return res.json();
}

async function contributeFromWallet(
  jobId: number,
  amount: number,
): Promise<UserWallet> {
  const res = await fetch(`${API_BASE}/wallet/contribute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId, amount }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to contribute");
  }
  return res.json();
}

async function requestWithdrawal(data: {
  amount: number;
  bankAccount: {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
  };
}): Promise<WithdrawalRequest> {
  const res = await fetch(`${API_BASE}/wallet/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to request withdrawal");
  }
  return res.json();
}

export function useWallet() {
  const queryClient = useQueryClient();

  const walletQuery = useQuery({
    queryKey: ["wallet"],
    queryFn: fetchWallet,
  });

  const transactionsQuery = useQuery({
    queryKey: ["wallet", "transactions"],
    queryFn: fetchTransactions,
  });

  const withdrawalsQuery = useQuery({
    queryKey: ["wallet", "withdrawals"],
    queryFn: fetchWithdrawals,
  });

  const addMoneyMutation = useMutation({
    mutationFn: addMoney,
    onSuccess: async () => {
      // Force refetch wallet data to get updated balance
      await queryClient.invalidateQueries({ queryKey: ["wallet"] });
      await queryClient.invalidateQueries({
        queryKey: ["wallet", "transactions"],
      });
      // Also explicitly fetch to ensure fresh data
      await queryClient.fetchQuery({
        queryKey: ["wallet"],
        queryFn: fetchWallet,
      });
    },
  });

  const contributeMutation = useMutation({
    mutationFn: ({ jobId, amount }: { jobId: number; amount: number }) =>
      contributeFromWallet(jobId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      // Invalidate job queries so contributor list updates
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: requestWithdrawal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["wallet", "withdrawals"] });
    },
  });

  return {
    wallet: walletQuery.data,
    transactions: transactionsQuery.data || [],
    withdrawals: withdrawalsQuery.data || [],
    isLoadingWallet: walletQuery.isLoading,
    isLoadingTransactions: transactionsQuery.isLoading,
    isLoadingWithdrawals: withdrawalsQuery.isLoading,
    addMoney: addMoneyMutation.mutate,
    contribute: contributeMutation.mutate,
    requestWithdrawal: withdrawMutation.mutate,
    addMoneyError: addMoneyMutation.error,
    contributeError: contributeMutation.error,
    withdrawError: withdrawMutation.error,
    isAddingMoney: addMoneyMutation.isPending,
    isContributing: contributeMutation.isPending,
    isWithdrawing: withdrawMutation.isPending,
    refetchWallet: () =>
      queryClient.invalidateQueries({ queryKey: ["wallet"] }),
  };
}

export function useWalletBalance() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: fetchWallet,
    select: (data) => data?.availableBalance ?? 0,
  });
}
