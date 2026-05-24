import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

async function fetchWithAuth<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = await getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) ?? {}),
  };

  if (session?.user?.accessToken) {
    headers['Authorization'] = `Bearer ${session.user.accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error?.message ?? 'API request failed');
  }

  return json.data as T;
}

export const adminApi = {
  get: <T>(path: string) => fetchWithAuth<T>(path),
  post: <T>(path: string, body: unknown) =>
    fetchWithAuth<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    fetchWithAuth<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => fetchWithAuth<T>(path, { method: 'DELETE' }),
};
