# IssueLyst MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) server that exposes
the IssueLyst issue tracker to AI clients (Claude Code, Claude Desktop, etc.).

It speaks the same domain model as the web app and persists to a local JSON
file (`data/store.json`, seeded on first run) — the natural seam toward the
future Neon-backed API. Point it elsewhere with `PROJEX_DATA_FILE`.

## Tools

| Tool | Description |
|------|-------------|
| `list_issues` | List issues, filtered by status / priority / assignee / label / query |
| `get_issue` | Full detail for one issue key (comments + activity) |
| `search_issues` | Full-text search |
| `create_issue` | Create an issue (names accepted for status/priority/assignee/labels) |
| `update_issue` | Update fields on an issue by key |
| `add_comment` | Comment on an issue |
| `export_issues_csv` | Export issues to CSV text (same columns as the app) |
| `list_users` / `list_labels` / `list_statuses` | Reference data |
| `reset_data` | Restore the seeded demo dataset |

Status, priority, assignee and label arguments accept human-readable values
(e.g. `"In Progress"`, `"high"`, `"Sara"`, `"Bug"`) and are resolved to ids.

## Run

```bash
npm install
npm run build
npm start          # stdio server
# or, without building:
npm run dev
```

## Register with Claude Code

```bash
claude mcp add issuelyst -- node /absolute/path/to/projex-app/mcp-server/dist/index.js
```

## Register with Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "issuelyst": {
      "command": "node",
      "args": ["/absolute/path/to/projex-app/mcp-server/dist/index.js"]
    }
  }
}
```

> The server and the web app currently keep **separate** datastores (the app
> persists in the browser; the server in a JSON file). When the Neon backend
> lands, both point at the same database and this note goes away.
