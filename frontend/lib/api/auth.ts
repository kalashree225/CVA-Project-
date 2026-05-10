import { apiClient } from "./client";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "user" | "viewer";
  is_active: boolean;
  organization_id: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export const authApi = {
  async register(data: RegisterRequest): Promise<User> {
    return apiClient.post("/api/v1/auth/register", data);
  },

  async login(data: LoginRequest): Promise<TokenResponse> {
    return apiClient.postForm("/api/v1/auth/login", new URLSearchParams({ ...data }));
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get("/api/v1/auth/me");
  },

  async logout(): Promise<void> {
    // Call backend to clear the httpOnly cookie
    await apiClient.post("/api/v1/auth/logout");
  },
};
