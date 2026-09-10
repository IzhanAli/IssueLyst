export type Priority = "urgent" | "high" | "medium" | "low" | "none";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
}

export interface Status {
  id: string;
  name: string;
  category: "backlog" | "unstarted" | "started" | "completed" | "canceled";
  position: number;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Issue {
  id: string;
  number: number;
  title: string;
  description: string;
  statusId: string;
  priority: Priority;
  assigneeId: string | null;
  createdById: string;
  labelIds: string[];
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface Comment {
  id: string;
  issueId: string;
  userId: string;
  body: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  issueId: string;
  userId: string;
  event: string;
  meta: Record<string, unknown>;
  createdAt: string;
}

export interface Dataset {
  project: { id: string; key: string; name: string };
  users: User[];
  statuses: Status[];
  labels: Label[];
  issues: Issue[];
  comments: Comment[];
  activities: Activity[];
  nextIssueNumber: number;
}
