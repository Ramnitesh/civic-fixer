import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../services/api";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    password: string;
    name: string;
    phone: string;
    role: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUserFromLogin: (user: User) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  setUserFromLogin: () => {},
});

export const useAuth = () => useContext(AuthContext);

const USER_STORAGE_KEY = "civicfix_user_data";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on mount
  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Validate that we have the minimum required fields
          if (parsedUser && parsedUser.id && parsedUser.username) {
            setUser(parsedUser);
          }
        }
      } catch (error) {
        console.log("Error loading stored user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStoredUser();
  }, []);

  // Save user to storage whenever it changes
  const saveUserToStorage = async (userData: User | null) => {
    try {
      if (userData) {
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      } else {
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch (error) {
      console.log("Error saving user to storage:", error);
    }
  };

  const refreshUser = async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        setUser(null);
        await saveUserToStorage(null);
        return;
      }

      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      await saveUserToStorage(userData);
    } catch (error) {
      console.log("refreshUser error:", error);
    }
  };

  // Method to set user directly from login response
  const setUserFromLogin = (userData: User) => {
    setUser(userData);
    saveUserToStorage(userData);
  };

  const login = async (username: string, password: string) => {
    await authAPI.login(username, password);
    await refreshUser();
  };

  const register = async (data: {
    username: string;
    password: string;
    name: string;
    phone: string;
    role: string;
  }) => {
    await authAPI.register(data);
    await refreshUser();
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Ignore logout errors
    }
    setUser(null);
    await saveUserToStorage(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        setUserFromLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
