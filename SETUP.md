# Redmine MCP – Setup

## 1. Build

```bash
cd redmine-mcp
npm install
npm run build
```

## 2. Konfiguráció

Másold a `.env.example`-t `.env`-be, és töltsd ki:

```env
REDMINE_URL=https://your-redmine.example.com
REDMINE_API_KEY=your_api_key_here
```

Az API key-t a Redmine-ban a **My account → API access key** menüpontban találod.

## 3. Claude Desktop konfiguráció

A `claude_desktop_config.json`-ba (Windows: `%APPDATA%\Claude\claude_desktop_config.json`,
Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "redmine": {
      "command": "node",
      "args": ["/abszolut/eleresi/ut/redmine-mcp/dist/index.js"],
      "env": {
        "REDMINE_URL": "https://your-redmine.example.com",
        "REDMINE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## 4. Docker (opcionális, később)

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist/ ./dist/
CMD ["node", "dist/index.js"]
```

## Elérhető tools

| Tool | Leírás |
|------|--------|
| `list_issues` | Issue-k listázása szűrőkkel (projekt, státusz, assignee, verzió, stb.) |
| `get_issue` | Egy issue lekérése journal/komment históriával |
| `create_issue` | Új issue létrehozása |
| `update_issue` | Státusz, verzió, assignee, custom field módosítása + komment egyszerre |
| `add_comment` | Komment hozzáadása issue-hoz |
| `list_projects` | Projektek listázása |
| `list_issue_statuses` | Elérhető státuszok |
| `list_priorities` | Elérhető prioritások |
| `list_trackers` | Elérhető trackerek (Bug, Feature, stb.) |
| `list_versions` | Projekt verzióinak listázása |
| `list_members` | Projekt tagjainak listázása |
