# Redmine MCP – Setup

## 1. Build

```bash
cd redmine-mcp
npm install
npm run build
```

## 2. Configuration

Copy `.env.example` to `.env` and fill in the details:

```env
REDMINE_URL=https://your-redmine.example.com
REDMINE_API_KEY=your_api_key_here
```

You can find the API key in Redmine under **My account → API access key**.

## 3. Claude Desktop Configuration

In your `claude_desktop_config.json` (Windows: `%APPDATA%\Claude\claude_desktop_config.json`,
Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "redmine": {
      "command": "node",
      "args": ["/absolute/path/to/redmine-mcp/dist/index.js"],
      "env": {
        "REDMINE_URL": "https://your-redmine.example.com",
        "REDMINE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## 4. Docker (optional, later)

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist/ ./dist/
CMD ["node", "dist/index.js"]
```

## Available Tools

| Tool | Description |
|------|-------------|
| `list_issues` | List issues with filters (project, status, assignee, version, etc.) |
| `get_issue` | Retrieve an issue with journal/comment history |
| `create_issue` | Create a new issue |
| `update_issue` | Modify status, version, assignee, custom fields + add a comment at the same time |
| `add_comment` | Add a comment to an issue |
| `list_projects` | List projects |
| `list_issue_statuses` | List available statuses |
| `list_priorities` | List available priorities |
| `list_trackers` | List available trackers (Bug, Feature, etc.) |
| `list_versions` | List project versions |
| `list_members` | List project members |
