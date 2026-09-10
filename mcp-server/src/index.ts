#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Store } from "./store.js";

const store = new Store();
const server = new McpServer({ name: "projex", version: "0.1.0" });

const json = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });
const err = (m: string) => ({ content: [{ type: "text" as const, text: m }], isError: true });

/* ── Reads ─────────────────────────────────────────────────────────── */
server.tool(
  "list_issues",
  "List issues in the Engineering project, optionally filtered by status, priority, assignee (name/email/id or 'unassigned'), label, or a text query. Returns a summary array.",
  {
    status: z.string().optional().describe("e.g. 'Open', 'In Progress'"),
    priority: z.string().optional().describe("urgent | high | medium | low | none"),
    assignee: z.string().optional().describe("name, email, id, or 'unassigned'"),
    label: z.string().optional(),
    query: z.string().optional().describe("free-text match on title/description/key"),
    limit: z.number().int().positive().max(200).optional(),
  },
  async (args) => json(store.listIssues(args)),
);

server.tool(
  "get_issue",
  "Get the full detail of one issue by key (e.g. ENG-142), including description, comments and activity.",
  { key: z.string().describe("issue key, e.g. ENG-142") },
  async ({ key }) => {
    const detail = store.getIssueDetail(key);
    return detail ? json(detail) : err(`No issue found for ${key}`);
  },
);

server.tool("search_issues", "Full-text search across issue titles, descriptions and keys.",
  { query: z.string() },
  async ({ query }) => json(store.listIssues({ query, limit: 25 })),
);

server.tool("list_users", "List the team members in the workspace.", {}, async () => json(store.users));
server.tool("list_labels", "List the labels available in the project.", {}, async () => json(store.labels));
server.tool("list_statuses", "List the workflow statuses in order.", {}, async () => json(store.statuses));

/* ── Writes ────────────────────────────────────────────────────────── */
server.tool(
  "create_issue",
  "Create a new issue. Title is required; status/priority/assignee/labels accept human-readable names.",
  {
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    assignee: z.string().optional(),
    labels: z.array(z.string()).optional(),
    actor: z.string().optional().describe("who is creating it (defaults to workspace admin)"),
  },
  async (args) => json(store.createIssue(args)),
);

server.tool(
  "update_issue",
  "Update fields on an existing issue by key. Only provided fields change. Pass assignee:'' to unassign.",
  {
    key: z.string(),
    status: z.string().optional(),
    priority: z.string().optional(),
    assignee: z.string().nullable().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    dueDate: z.string().nullable().optional().describe("ISO date (YYYY-MM-DD) or null"),
    actor: z.string().optional(),
  },
  async ({ key, ...patch }) => {
    const updated = store.updateIssue(key, { ...patch, assignee: patch.assignee === "" ? null : patch.assignee });
    return updated ? json(updated) : err(`No issue found for ${key}`);
  },
);

server.tool(
  "add_comment",
  "Add a comment to an issue by key.",
  { key: z.string(), body: z.string().min(1), author: z.string().optional() },
  async ({ key, body, author }) => {
    const c = store.addComment(key, body, author);
    return c ? json(c) : err(`No issue found for ${key}`);
  },
);

/* ── Export ────────────────────────────────────────────────────────── */
server.tool(
  "export_issues_csv",
  "Export issues to CSV text (same columns as the app export). Accepts the same filters as list_issues.",
  {
    status: z.string().optional(),
    priority: z.string().optional(),
    assignee: z.string().optional(),
    label: z.string().optional(),
    query: z.string().optional(),
  },
  async (args) => text(store.toCsv(store.listIssues(args))),
);

server.tool("reset_data", "Reset the dataset back to the seeded demo data.", {}, async () => {
  store.reset();
  return text("Dataset reset to seed.");
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("projex-mcp server running on stdio");
