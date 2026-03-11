#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const REDMINE_URL = (process.env.REDMINE_URL ?? "").replace(/\/$/, "");
const REDMINE_API_KEY = process.env.REDMINE_API_KEY ?? "";

if (!REDMINE_URL || !REDMINE_API_KEY) {
  console.error(
    "Error: REDMINE_URL and REDMINE_API_KEY environment variables are required."
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

async function redmineRequest<T = unknown>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: object
): Promise<T> {
  const url = `${REDMINE_URL}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      "X-Redmine-API-Key": REDMINE_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Redmine API error ${response.status} ${response.statusText}: ${text}`);
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return null as T;
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const tools: Tool[] = [
  // ---- Issues ----
  {
    name: "list_issues",
    description:
      "List issues from Redmine. Supports filtering by project, status, assignee, version and more.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "Project ID or identifier (slug). Omit to list across all projects.",
        },
        status_id: {
          type: "string",
          description: "'open' (default) | 'closed' | '*' (all) | numeric status ID",
        },
        assigned_to_id: {
          type: "string",
          description: "User ID or 'me' for the API key owner.",
        },
        fixed_version_id: {
          type: "number",
          description: "Filter by target version (fix version) ID.",
        },
        tracker_id: {
          type: "number",
          description: "Filter by tracker ID.",
        },
        priority_id: {
          type: "number",
          description: "Filter by priority ID.",
        },
        subject: {
          type: "string",
          description: "Filter issues where subject contains this string (uses ~subject syntax).",
        },
        sort: {
          type: "string",
          description: "Sort column, e.g. 'updated_on:desc' or 'priority:desc,updated_on:desc'.",
        },
        limit: {
          type: "number",
          description: "Number of issues to return (1-100, default 25).",
        },
        offset: {
          type: "number",
          description: "Pagination offset.",
        },
      },
    },
  },
  {
    name: "get_issue",
    description:
      "Get a single issue by ID, including all fields, custom fields, and journal entries (comments/history).",
    inputSchema: {
      type: "object",
      properties: {
        issue_id: { type: "number", description: "Issue ID." },
      },
      required: ["issue_id"],
    },
  },
  {
    name: "create_issue",
    description: "Create a new issue in Redmine.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "Project ID or identifier (required).",
        },
        subject: { type: "string", description: "Issue title (required)." },
        description: { type: "string", description: "Issue body / description." },
        tracker_id: { type: "number", description: "Tracker ID (Bug, Feature, etc.)." },
        status_id: { type: "number", description: "Initial status ID." },
        priority_id: { type: "number", description: "Priority ID." },
        assigned_to_id: { type: "number", description: "User ID to assign to." },
        fixed_version_id: {
          type: "number",
          description: "Target version (fix version) ID.",
        },
        parent_issue_id: { type: "number", description: "Parent issue ID." },
        custom_fields: {
          type: "array",
          description: "Array of custom field objects: [{ id: number, value: string }].",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              value: { type: "string" },
            },
            required: ["id", "value"],
          },
        },
      },
      required: ["project_id", "subject"],
    },
  },
  {
    name: "update_issue",
    description:
      "Update an existing issue — change status, version, assignee, priority, subject, description, custom fields, or add a comment. All fields are optional; only provided fields are changed.",
    inputSchema: {
      type: "object",
      properties: {
        issue_id: { type: "number", description: "Issue ID (required)." },
        subject: { type: "string", description: "New issue title." },
        description: { type: "string", description: "New issue description." },
        status_id: { type: "number", description: "New status ID." },
        priority_id: { type: "number", description: "New priority ID." },
        assigned_to_id: {
          type: "number",
          description: "New assignee user ID. Pass 0 to unassign.",
        },
        fixed_version_id: {
          type: "number",
          description: "New target version ID. Pass 0 to clear.",
        },
        tracker_id: { type: "number", description: "New tracker ID." },
        notes: {
          type: "string",
          description: "Comment / journal note to add to the issue.",
        },
        private_notes: {
          type: "boolean",
          description: "Whether the notes are private (default false).",
        },
        custom_fields: {
          type: "array",
          description: "Custom fields to update: [{ id: number, value: string }].",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              value: { type: "string" },
            },
            required: ["id", "value"],
          },
        },
      },
      required: ["issue_id"],
    },
  },
  {
    name: "add_comment",
    description: "Add a comment / journal note to an existing issue.",
    inputSchema: {
      type: "object",
      properties: {
        issue_id: { type: "number", description: "Issue ID." },
        notes: { type: "string", description: "The comment text." },
        private_notes: {
          type: "boolean",
          description: "Make it a private note (default false).",
        },
      },
      required: ["issue_id", "notes"],
    },
  },

  // ---- Projects ----
  {
    name: "list_projects",
    description: "List all projects the API key has access to.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of projects to return (default 100)." },
        offset: { type: "number", description: "Pagination offset." },
      },
    },
  },

  // ---- Metadata ----
  {
    name: "list_issue_statuses",
    description: "List all available issue statuses.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_priorities",
    description: "List all available issue priorities.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_trackers",
    description: "List all available trackers (Bug, Feature, Support, etc.).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_versions",
    description: "List versions (fix versions / milestones) for a project.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "Project ID or identifier.",
        },
      },
      required: ["project_id"],
    },
  },
  {
    name: "list_members",
    description: "List project members (users) for a project.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "string",
          description: "Project ID or identifier.",
        },
      },
      required: ["project_id"],
    },
  },
  // ---- Time Tracking ----
  {
    name: "log_time",
    description: "Log time (spent hours) on an issue or project.",
    inputSchema: {
      type: "object",
      properties: {
        issue_id: { type: "number", description: "Issue ID (optional if project_id is provided)." },
        project_id: {
          type: "string",
          description: "Project ID or identifier (optional if issue_id is provided).",
        },
        spent_on: {
          type: "string",
          description: "Date the time was spent (YYYY-MM-DD). Defaults to today.",
        },
        hours: { type: "number", description: "Number of hours spent (e.g., 1.5)." },
        activity_id: { type: "number", description: "Activity ID (e.g., Development, Design)." },
        comments: { type: "string", description: "Optional description for the time entry." },
      },
      required: ["hours"],
    },
  },
  {
    name: "list_time_activities",
    description: "List available activities for time logging (e.g., Development, Design).",
    inputSchema: { type: "object", properties: {} },
  },
];

// ---------------------------------------------------------------------------
// Tool handlers
// ---------------------------------------------------------------------------

type Args = Record<string, unknown>;

async function handleLogTime(args: Args): Promise<string> {
  const time_entry: Record<string, unknown> = {
    hours: args.hours,
  };

  if (args.issue_id !== undefined) time_entry.issue_id = args.issue_id;
  if (args.project_id !== undefined) time_entry.project_id = args.project_id;
  if (args.spent_on !== undefined) time_entry.spent_on = args.spent_on;
  if (args.activity_id !== undefined) time_entry.activity_id = args.activity_id;
  if (args.comments !== undefined) time_entry.comments = args.comments;

  if (!time_entry.issue_id && !time_entry.project_id) {
    throw new Error("Either issue_id or project_id must be provided.");
  }

  const data = await redmineRequest<{ time_entry: Record<string, unknown> }>(
    "/time_entries.json",
    "POST",
    { time_entry }
  );
  return JSON.stringify(data.time_entry, null, 2);
}

async function handleListTimeActivities(): Promise<string> {
  const data = await redmineRequest<{
    time_entry_activities: Record<string, unknown>[];
  }>("/enumerations/time_entry_activities.json");
  return JSON.stringify(data.time_entry_activities, null, 2);
}

async function handleListIssues(args: Args): Promise<string> {
  const params = new URLSearchParams();
  if (args.project_id) params.set("project_id", String(args.project_id));
  params.set("status_id", String(args.status_id ?? "open"));
  if (args.assigned_to_id) params.set("assigned_to_id", String(args.assigned_to_id));
  if (args.fixed_version_id) params.set("fixed_version_id", String(args.fixed_version_id));
  if (args.tracker_id) params.set("tracker_id", String(args.tracker_id));
  if (args.priority_id) params.set("priority_id", String(args.priority_id));
  if (args.subject) params.set("subject", `~${String(args.subject)}`);
  if (args.sort) params.set("sort", String(args.sort));
  params.set("limit", String(args.limit ?? 25));
  if (args.offset) params.set("offset", String(args.offset));

  const data = await redmineRequest<{
    issues: Record<string, unknown>[];
    total_count: number;
  }>(`/issues.json?${params}`);

  return JSON.stringify({ total_count: data.total_count, issues: data.issues }, null, 2);
}

async function handleGetIssue(args: Args): Promise<string> {
  const data = await redmineRequest<{ issue: Record<string, unknown> }>(
    `/issues/${args.issue_id}.json?include=journals,attachments,changesets,watchers,relations`
  );
  return JSON.stringify(data.issue, null, 2);
}

async function handleCreateIssue(args: Args): Promise<string> {
  const issue: Record<string, unknown> = {
    project_id: args.project_id,
    subject: args.subject,
  };
  if (args.description !== undefined) issue.description = args.description;
  if (args.tracker_id !== undefined) issue.tracker_id = args.tracker_id;
  if (args.status_id !== undefined) issue.status_id = args.status_id;
  if (args.priority_id !== undefined) issue.priority_id = args.priority_id;
  if (args.assigned_to_id !== undefined) issue.assigned_to_id = args.assigned_to_id;
  if (args.fixed_version_id !== undefined) issue.fixed_version_id = args.fixed_version_id;
  if (args.parent_issue_id !== undefined) issue.parent_issue_id = args.parent_issue_id;
  if (args.custom_fields !== undefined) issue.custom_fields = args.custom_fields;

  const data = await redmineRequest<{ issue: Record<string, unknown> }>("/issues.json", "POST", {
    issue,
  });
  return JSON.stringify(data.issue, null, 2);
}

async function handleUpdateIssue(args: Args): Promise<string> {
  const issue: Record<string, unknown> = {};
  if (args.subject !== undefined) issue.subject = args.subject;
  if (args.description !== undefined) issue.description = args.description;
  if (args.status_id !== undefined) issue.status_id = args.status_id;
  if (args.priority_id !== undefined) issue.priority_id = args.priority_id;
  if (args.assigned_to_id !== undefined) issue.assigned_to_id = args.assigned_to_id;
  if (args.fixed_version_id !== undefined) issue.fixed_version_id = args.fixed_version_id;
  if (args.tracker_id !== undefined) issue.tracker_id = args.tracker_id;
  if (args.notes !== undefined) issue.notes = args.notes;
  if (args.private_notes !== undefined) issue.private_notes = args.private_notes;
  if (args.custom_fields !== undefined) issue.custom_fields = args.custom_fields;

  await redmineRequest(`/issues/${args.issue_id}.json`, "PUT", { issue });
  return `Issue #${args.issue_id} updated successfully.`;
}

async function handleAddComment(args: Args): Promise<string> {
  await redmineRequest(`/issues/${args.issue_id}.json`, "PUT", {
    issue: {
      notes: args.notes,
      ...(args.private_notes !== undefined ? { private_notes: args.private_notes } : {}),
    },
  });
  return `Comment added to issue #${args.issue_id}.`;
}

async function handleListProjects(args: Args): Promise<string> {
  const params = new URLSearchParams();
  params.set("limit", String(args.limit ?? 100));
  if (args.offset) params.set("offset", String(args.offset));

  const data = await redmineRequest<{
    projects: Record<string, unknown>[];
    total_count: number;
  }>(`/projects.json?${params}`);

  return JSON.stringify({ total_count: data.total_count, projects: data.projects }, null, 2);
}

async function handleListIssueStatuses(): Promise<string> {
  const data = await redmineRequest<{ issue_statuses: Record<string, unknown>[] }>(
    "/issue_statuses.json"
  );
  return JSON.stringify(data.issue_statuses, null, 2);
}

async function handleListPriorities(): Promise<string> {
  const data = await redmineRequest<{
    issue_priorities: Record<string, unknown>[];
  }>("/enumerations/issue_priorities.json");
  return JSON.stringify(data.issue_priorities, null, 2);
}

async function handleListTrackers(): Promise<string> {
  const data = await redmineRequest<{ trackers: Record<string, unknown>[] }>("/trackers.json");
  return JSON.stringify(data.trackers, null, 2);
}

async function handleListVersions(args: Args): Promise<string> {
  const data = await redmineRequest<{ versions: Record<string, unknown>[]; total_count: number }>(
    `/projects/${args.project_id}/versions.json`
  );
  return JSON.stringify({ total_count: data.total_count, versions: data.versions }, null, 2);
}

async function handleListMembers(args: Args): Promise<string> {
  const data = await redmineRequest<{
    memberships: Record<string, unknown>[];
    total_count: number;
  }>(`/projects/${args.project_id}/memberships.json?limit=100`);
  return JSON.stringify(
    { total_count: data.total_count, memberships: data.memberships },
    null,
    2
  );
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = new Server(
  { name: "redmine-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    let result: string;

    switch (name) {
      case "list_issues":
        result = await handleListIssues(args as Args);
        break;
      case "get_issue":
        result = await handleGetIssue(args as Args);
        break;
      case "create_issue":
        result = await handleCreateIssue(args as Args);
        break;
      case "update_issue":
        result = await handleUpdateIssue(args as Args);
        break;
      case "add_comment":
        result = await handleAddComment(args as Args);
        break;
      case "list_projects":
        result = await handleListProjects(args as Args);
        break;
      case "list_issue_statuses":
        result = await handleListIssueStatuses();
        break;
      case "list_priorities":
        result = await handleListPriorities();
        break;
      case "list_trackers":
        result = await handleListTrackers();
        break;
      case "list_versions":
        result = await handleListVersions(args as Args);
        break;
      case "list_members":
        result = await handleListMembers(args as Args);
        break;
      case "log_time":
        result = await handleLogTime(args as Args);
        break;
      case "list_time_activities":
        result = await handleListTimeActivities();
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return { content: [{ type: "text", text: result }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Redmine MCP server running — connected to ${REDMINE_URL}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
