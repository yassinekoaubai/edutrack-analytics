/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from 'axios';

const BASE_URL_KEY = 'edutrack_base_url_v1';
const AUTH_TOKEN_KEY = 'edutrack_auth_token_v1';

function getMetaApiUrl(): string | null {
  const meta = document.querySelector('meta[name="edutrack-api"]');
  return meta?.getAttribute('content')?.trim() || null;
}

export function getBaseUrl(): string {
  return (
    localStorage.getItem(BASE_URL_KEY) ||
    import.meta.env.VITE_API_URL ||
    getMetaApiUrl() ||
    'http://localhost:8002'
  );
}

export function setBaseUrl(url: string): void {
  localStorage.setItem(BASE_URL_KEY, url);
}

export function getToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function logout(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  window.location.reload();
}

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: { Accept: 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  config.baseURL = getBaseUrl();
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const detail =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message;
    return Promise.reject(
      new Error(status ? `Erreur API (${status}): ${detail}` : String(detail))
    );
  }
);
