/** Human-readable, low-noise formatters. Timestamps render in mono in the UI. */

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.round((now - then) / 1000); // seconds
  const abs = Math.abs(diff);
  if (abs < 45) return "just now";
  if (abs < 90) return diff > 0 ? "1m ago" : "in 1m";
  const mins = Math.round(diff / 60);
  if (abs < 3600) return diff > 0 ? `${mins}m ago` : `in ${-mins}m`;
  const hrs = Math.round(diff / 3600);
  if (abs < 86400) return diff > 0 ? `${hrs}h ago` : `in ${-hrs}h`;
  const days = Math.round(diff / 86400);
  if (abs < 86400 * 7) return diff > 0 ? `${days}d ago` : `in ${-days}d`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function shortDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function fullDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Initials for avatar fallback (max 2). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function isOverdue(due: string | null, closed: string | null): boolean {
  if (!due || closed) return false;
  const d = new Date(due);
  d.setHours(23, 59, 59, 999);
  return d.getTime() < Date.now();
}
