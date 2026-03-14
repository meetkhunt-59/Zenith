import { supabase } from './supabase';

const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const base = String(rawBase).replace(/\/+$/, '');
const API_BASE = base.endsWith('/api/v1') ? base : `${base}/api/v1`;

async function authHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  const auth = await authHeaders();
  if (auth.Authorization) headers.set('Authorization', auth.Authorization);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.ok) return (await res.json()) as T;

  let message = `API error (${res.status})`;
  try {
    const data = await res.json();
    message = data?.detail || data?.message || message;
  } catch {
    try {
      message = await res.text();
    } catch {
      // ignore
    }
  }
  throw new Error(message);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
