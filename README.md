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
REDMINE_REQUEST_TIMEOUT_MS=15000
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

## 4. Gemini CLI Configuration

In your `settings.json` (Windows: `%USERPROFILE%\.gemini\settings.json`,
Mac: `~/.gemini/settings.json`):

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

## 5. Codex Configuration

In your `config.toml` (Windows: `%USERPROFILE%\.codex\config.toml`,
Mac: `~/.codex/config.toml`):

```toml
[mcp_servers.redmine]
command = "node"
args = ["/absolute/path/to/redmine-mcp/dist/index.js"]
env = { REDMINE_URL = "https://your-redmine.example.com", REDMINE_API_KEY = "your_api_key_here" }
```

## Available Tools

| Tool                   | Description                                                                      |
| ---------------------- | -------------------------------------------------------------------------------- |
| `list_issues`          | List issues with filters (project, status, assignee, version, etc.)              |
| `get_issue`            | Retrieve an issue with journal/comment history                                   |
| `create_issue`         | Create a new issue                                                               |
| `update_issue`         | Modify status, version, assignee, custom fields + add a comment at the same time |
| `add_comment`          | Add a comment to an issue                                                        |
| `list_projects`        | List projects                                                                    |
| `list_issue_statuses`  | List available statuses                                                          |
| `list_priorities`      | List available priorities                                                        |
| `list_trackers`        | List available trackers (Bug, Feature, etc.)                                     |
| `list_versions`        | List project versions                                                            |
| `list_members`         | List project members                                                             |
| `log_time`             | Log time (spent hours) on an issue or project                                    |
| `list_time_activities` | List available activities for time logging                                       |
| `list_my_time_entries` | List your own time entries for a specific day                                    |
