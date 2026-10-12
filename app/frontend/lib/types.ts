export type UserRole = "user" | "admin";

export interface User {
  id: number;
  username: string;
  email?: string | null;
  full_name?: string | null;
  role: UserRole;
  is_active: boolean;
  created_at?: string | null;
}

export interface Statistics {
  total: number;
  approved: number;
  rejected: number;
  approval_rate: number;
  avg_probability: number;
  avg_loan_amount: number;
  avg_income: number;
  recent_7d: number;
}

export interface PlatformStats {
  users_total: number;
  users_active: number;
  predictions_total: number;
  approval_rate: number;
}

export interface HistoryItem {
  id: number;
  age: number;
  income: number;
  loan_amount: number;
  credit_history_length?: number;
  status: string;
  probability?: number | null;
  message?: string | null;
  created_at?: string | null;
  username?: string | null;
}

export interface HistoryPage {
  items: HistoryItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface PredictResult {
  id: number;
  status: string;
  probability: number;
  message: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}
