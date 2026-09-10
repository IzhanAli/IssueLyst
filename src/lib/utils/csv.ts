import type { IssueView, User } from "@/lib/types";
import { PRIORITY_META } from "@/lib/constants";

function esc(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const COLUMNS = [
  "Key",
  "Title",
  "Status",
  "Priority",
  "Assignee",
  "Labels",
  "Due date",
  "Reporter",
  "Created",
  "Updated",
  "Comments",
  "Attachments",
] as const;

export function issuesToCsv(views: IssueView[], users: User[]): string {
  const rows = views.map((v) => {
    const reporter = users.find((u) => u.id === v.createdById);
    return [
      v.issueKey,
      v.title,
      v.status.name,
      PRIORITY_META[v.priority].label,
      v.assignee?.name ?? "",
      v.labels.map((l) => l.name).join("; "),
      v.dueDate ?? "",
      reporter?.name ?? "",
      v.createdAt,
      v.updatedAt,
      v.commentCount,
      v.attachmentCount,
    ].map(esc).join(",");
  });
  return [COLUMNS.join(","), ...rows].join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
