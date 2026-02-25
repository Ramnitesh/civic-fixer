import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  User,
  Job,
  Wallet,
  Transaction,
  Withdrawal,
  Contribution,
  Application,
  Ledger,
} from "../types";

const API_BASE_URL = "https://civic-fixer.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post("/login", { username, password });
    if (response.data.token) {
      await AsyncStorage.setItem("auth_token", response.data.token);
    }
    // Return user data if available, otherwise return full response
    return response.data;
  },

  register: async (data: {
    username: string;
    password: string;
    name: string;
    phone: string;
    role: string;
  }) => {
    const response = await api.post("/register", data);
    if (response.data.token) {
      await AsyncStorage.setItem("auth_token", response.data.token);
    }
    return response.data;
  },

  logout: async () => {
    await api.post("/logout");
    await AsyncStorage.removeItem("auth_token");
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get("/user");
    return response.data;
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await api.patch("/user", data);
    return response.data;
  },
};

// Jobs API
export const jobsAPI = {
  getAll: async (params?: {
    status?: string;
    leaderId?: string;
    contributorId?: string;
    limit?: number;
  }): Promise<Job[]> => {
    const response = await api.get("/jobs", { params });
    return response.data;
  },

  getById: async (id: number): Promise<Job> => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },

  create: async (data: Partial<Job>): Promise<Job> => {
    const response = await api.post("/jobs", data);
    return response.data;
  },

  update: async (id: number, data: Partial<Job>): Promise<Job> => {
    const response = await api.patch(`/jobs/${id}`, data);
    return response.data;
  },

  getApplications: async (jobId: number): Promise<Application[]> => {
    const response = await api.get(`/jobs/${jobId}/applications`);
    return response.data;
  },

  acceptApplication: async (applicationId: number): Promise<Application> => {
    const response = await api.patch(`/applications/${applicationId}`, {
      status: "ACCEPTED",
    });
    return response.data;
  },

  getLedger: async (jobId: number): Promise<Ledger> => {
    const response = await api.get(`/jobs/${jobId}/ledger`);
    return response.data;
  },

  createExpense: async (
    jobId: number,
    data: { amount: number; description: string; proofUrl: string },
  ) => {
    const response = await api.post(`/jobs/${jobId}/expense`, data);
    return response.data;
  },
};

// Contributions API
export const contributionsAPI = {
  getMy: async (): Promise<Contribution[]> => {
    const response = await api.get("/contributions");
    return response.data;
  },

  create: async (jobId: number, amount: number) => {
    const response = await api.post("/contributions", { jobId, amount });
    return response.data;
  },
};

// Wallet API
export const walletAPI = {
  get: async (): Promise<Wallet> => {
    const response = await api.get("/wallet");
    return response.data;
  },

  getTransactions: async (): Promise<Transaction[]> => {
    const response = await api.get("/wallet/transactions");
    return response.data;
  },

  getWithdrawals: async (): Promise<Withdrawal[]> => {
    const response = await api.get("/wallet/withdrawals");
    return response.data;
  },

  addMoney: async (amount: number) => {
    const response = await api.post("/wallet/add-money", { amount });
    return response.data;
  },

  requestWithdrawal: async (data: {
    amount: number;
    bankAccount: {
      accountNumber: string;
      ifsc: string;
      accountHolderName: string;
    };
  }) => {
    const response = await api.post("/wallet/withdraw", data);
    return response.data;
  },
};

// Applications API
export const applicationsAPI = {
  apply: async (jobId: number, bidAmount: number) => {
    const response = await api.post("/applications", { jobId, bidAmount });
    return response.data;
  },
};

export default api;
