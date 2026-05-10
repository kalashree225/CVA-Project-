import { create } from "zustand";
import { authApi, User } from "@/lib/api/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
<<<<<<< HEAD
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
=======
  user: {
    id: "mock-user-id",
    email: "demo@example.com",
    full_name: "Demo User",
    organization_id: "demo-org-id", // Matches the project_id expected by SSE
  },
  token: "mock-token",
  isLoading: false,
  isAuthenticated: true,
>>>>>>> 1f9e1f428c60a05a90a56f90b558cb17b6e52531

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login({ username: email, password });
      // Store token in-memory only — do NOT write to localStorage
      set({ token: response.access_token, isAuthenticated: true });

      // Fetch user details
      const user = await authApi.getCurrentUser();
      set({ user, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (email: string, password: string, fullName?: string) => {
    set({ isLoading: true });
    try {
      await authApi.register({ email, password, full_name: fullName });
      // Auto-login after registration
      await get().login(email, password);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      // Call backend logout to clear the httpOnly cookie
      await authApi.logout();
    } catch {
      // Ignore errors — still clear local state
    }
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchUser: async () => {
<<<<<<< HEAD
    const token = get().token;
    if (!token) {
      set({ user: null, isAuthenticated: false });
      return;
    }

    set({ isLoading: true });
    try {
      const user = await authApi.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      throw error;
    }
=======
    // BYPASS: Do nothing for demonstration to keep the mock user state
    return;
>>>>>>> 1f9e1f428c60a05a90a56f90b558cb17b6e52531
  },
}));
