// api-host.ts — Portable host resolution
export function getApiHost(port: number = 8096): string {
  if (window.location.protocol === "https:") {
    return window.location.origin;
  }
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  return `http://${window.location.hostname}:${port}`;
}

export function getWsUrl(path: string = "/ws"): string {
  const isHTTPS = window.location.protocol === "https:";
  const proto = isHTTPS ? "wss:" : "ws:";
  const host = window.location.host;
  const route = path;
  return `${proto}//${host}${route}`;
}
