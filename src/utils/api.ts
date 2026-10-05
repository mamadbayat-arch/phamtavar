// Single entry point for talking to the Hamtavar server.

declare global {
  interface Window {
    PersonalNative?: {
      readState: () => string;
      writeState: (json: string) => boolean;
      exportBackup: (json: string) => void;
      importBackup: () => void;
      apiBase?: () => string;
      openExternal?: (url: string) => void;
    };
  }
}

const TOKEN_KEY = 'hp_token';
const TELEMETRY_KEY = 'hp_telemetry';

export const isNativeApp = (): boolean => typeof window !== 'undefined' && !!window.PersonalNative;

const resolveApiBase = (): string => {
  try {
    const native = window.PersonalNative?.apiBase?.();
    if (native) return native.replace(/\/+$/, '');
  } catch {}
  return String(import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '');
};

export const API_BASE = resolveApiBase();

/**
 * The Android shell serves the UI from bundled assets, so a relative `/api`
 * call can never reach a server there; it needs an explicit API base.
 */
export const hasServer = (): boolean => !isNativeApp() || API_BASE !== '';

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string | null): void => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
};

export const isTelemetryEnabled = (): boolean => {
  try {
    return localStorage.getItem(TELEMETRY_KEY) !== 'off';
  } catch {
    return true;
  }
};

export const setTelemetryEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(TELEMETRY_KEY, enabled ? 'on' : 'off');
  } catch {}
};

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
  /** True when the server could not be reached at all (offline, DNS, CORS). */
  get isNetwork(): boolean {
    return this.status === 0;
  }
}

export const apiUrl = (path: string): string => `${API_BASE}${path}`;

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!hasServer()) throw new ApiError('سرور برای این نسخه تنظیم نشده است.', 0);

  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  let res: Response;
  try {
    res = await fetch(apiUrl(path), { ...init, headers });
  } catch {
    throw new ApiError('اتصال به سرور برقرار نشد. اینترنت خود را بررسی کنید.', 0);
  }
  if (res.status === 401) setToken(null);
  return res;
}

/** Calls a JSON endpoint and throws an ApiError carrying the server's Persian message on failure. */
export async function apiJson<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  let data: any = null;
  try {
    data = await res.json();
  } catch {}
  if (!res.ok || data === null || data.success === false) {
    // A non-JSON 200 means something other than our server answered.
    const status = res.ok && data === null ? 0 : res.status;
    throw new ApiError(data?.message || (status === 0 ? 'پاسخ سرور قابل خواندن نبود.' : `خطای سرور (${res.status})`), status, data);
  }
  return data as T;
}

export const postJson = <T = any>(path: string, body: unknown): Promise<T> =>
  apiJson<T>(path, { method: 'POST', body: JSON.stringify(body) });

/** Downloads an authenticated file; a plain <a href> cannot send the session token. */
export async function downloadFromApi(path: string, filename: string): Promise<void> {
  const res = await apiFetch(path);
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(data?.message || `خطای سرور (${res.status})`, res.status, data);
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Opens a link outside the app; the Android WebView blocks ordinary navigation. */
export function openExternal(url: string): void {
  if (window.PersonalNative?.openExternal) {
    window.PersonalNative.openExternal(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}
