/** REST: empty string = same-origin (Vite proxies /api in dev). */
export function getApiBaseUrl() {
  if (typeof window !== "undefined" && import.meta.env?.DEV) {
    return "";
  }
  const env = typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL;
  return env ? String(env).replace(/\/$/, "") : "";
}

/** Socket.io: same-origin in dev (Vite proxies /socket.io); API host in production when set. */
export function getSocketUrl() {
  if (typeof window === "undefined") return "";
  const env = import.meta.env?.VITE_API_URL;
  if (import.meta.env?.DEV || !env) {
    return window.location.origin;
  }
  return String(env).replace(/\/$/, "");
}
