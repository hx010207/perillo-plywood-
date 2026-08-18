export function resolveApiBaseUrl(): string {
  // If explicitly provided via VITE_API_URL, use that
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }

  // Default for web apps: use relative path '/api' which Vite proxies to backend localhost:5000
  // Or if running outside proxy, fallback to http://localhost:5000/api
  if (typeof window !== 'undefined') {
    const isDev = import.meta.env.DEV;
    if (isDev) {
      return '/api';
    }
    const hostname = window.location.hostname || 'localhost';
    return `http://${hostname}:5000/api`;
  }

  return 'http://localhost:5000/api';
}

export const API_URL = resolveApiBaseUrl();
