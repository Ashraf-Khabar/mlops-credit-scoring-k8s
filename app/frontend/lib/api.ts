import axios from "axios";
import type {
  HistoryPage,
  PlatformStats,
  PredictResult,
  Statistics,
  TokenResponse,
  User,
} from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token && token !== "null" && token !== "fake-jwt") {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export async function login(
  username: string,
  password: string
): Promise<TokenResponse> {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);
  const { data } = await api.post<TokenResponse>("/token", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

export async function register(payload: {
  username: string;
  password: string;
  email?: string;
  full_name?: string;
}): Promise<User> {
  const { data } = await api.post<User>("/register", payload);
  return data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>("/me");
  return data;
}

export async function updateProfile(payload: {
  email?: string;
  full_name?: string;
}): Promise<User> {
  const { data } = await api.patch<User>("/me", payload);
  return data;
}

export async function changePassword(
  current_password: string,
  new_password: string
): Promise<void> {
  await api.post("/me/password", { current_password, new_password });
}

export async function fetchStatistics(): Promise<Statistics> {
  const { data } = await api.get<Statistics>("/statistics");
  return data;
}

export async function predict(payload: {
  age: number;
  income: number;
  loan_amount: number;
  credit_history_length: number;
}): Promise<PredictResult> {
  const { data } = await api.post<PredictResult>("/predict", payload);
  return data;
}

export async function fetchHistory(
  page = 1,
  pageSize = 10,
  status?: string
): Promise<HistoryPage> {
  const { data } = await api.get<HistoryPage>("/history", {
    params: { page, page_size: pageSize, status },
  });
  return data;
}

export async function fetchUsers(params?: {
  q?: string;
  role?: string;
  active?: boolean;
}): Promise<User[]> {
  const { data } = await api.get<User[]>("/users", { params });
  return data;
}

export async function createUser(payload: {
  username: string;
  password: string;
  email?: string;
  full_name?: string;
}): Promise<User> {
  const { data } = await api.post<User>("/users", payload);
  return data;
}

export async function updateUser(
  id: number,
  payload: Partial<Pick<User, "email" | "full_name" | "role" | "is_active">>
): Promise<User> {
  const { data } = await api.patch<User>(`/users/${id}`, payload);
  return data;
}

export async function resetUserPassword(
  id: number,
  new_password: string
): Promise<void> {
  await api.post(`/users/${id}/reset-password`, { new_password });
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`);
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const { data } = await api.get<PlatformStats>("/users/platform-stats");
  return data;
}

export function getErrorMessage(err: unknown, fallback = "Une erreur est survenue") {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
    }
  }
  return fallback;
}
