import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
const TOKEN_KEY = 'petid_access_token';

class ApiClient {
  private accessToken: string | null = null;

  async init() {
    this.accessToken = await SecureStore.getItemAsync(TOKEN_KEY);
  }

  setToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) ?? {}),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

    if (res.status === 401 && path !== '/auth/refresh') {
      const refreshed = await this.refreshTokens();
      if (refreshed) {
        return this.request(method, path, body, options);
      }
    }

    const json = await res.json();

    if (!res.ok) {
      throw new ApiError(json.error?.message ?? 'Request failed', res.status, json.error?.code);
    }

    return json.data as T;
  }

  private async refreshTokens(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return false;
      const json = await res.json();
      this.setToken(json.data.accessToken);
      return true;
    } catch {
      this.setToken(null);
      return false;
    }
  }

  get<T>(path: string) {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>('POST', path, body);
  }

  patch<T>(path: string, body: unknown) {
    return this.request<T>('PATCH', path, body);
  }

  delete<T>(path: string) {
    return this.request<T>('DELETE', path);
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = new ApiClient();
