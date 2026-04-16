# Skill: GAB V2 API Reference

Condensed reference for the GAB Core V2 API. Use this when building adapters or understanding what the backend provides.

**Interactive docs:** https://gab-core-api.gab.ogintegration.us/docs
**OpenAPI spec:** `GET /docs/openapi.json`

## Three-Tier Architecture

| Tier | Prefix | Auth | Purpose |
|------|--------|------|---------|
| **Config** | `/v2/auth/app-config.json` | None | Public auth mode configuration |
| **Platform** | `/v2/auth/*`, `/v2/apps`, `/v2/users`, `/v2/templates` | Varies | Auth, app catalog, user management, templates |
| **Workspace** | `/v2/apps/:appId/*` | Required | Per-app: schema, records, relationships, pages |

## Authentication

```http
Authorization: Bearer <access_token>
```

### Login

```http
POST /v2/auth/token
Content-Type: application/json

{ "email": "admin@gab.dev", "password": "admin123" }
```

Response:

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": "...", "email": "admin@gab.dev", "name": "Admin User", "role": "super_admin" }
}
```

### Other auth endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/v2/auth/register` | None | Self-register |
| `POST` | `/v2/auth/refresh` | None | Rotate refresh token |
| `POST` | `/v2/auth/sync` | Auth0 Bearer | JIT-provision Auth0 user |
| `POST` | `/v2/auth/logout` | Required | End session |
| `GET` | `/v2/auth/profile` | Required | Current user |

## Identifier Formats

All `:appId`, `:tableId`, `:fieldId` path parameters accept either format:

| Format | Example |
|--------|---------|
| base36 key | `mwgcdub47` |
| UUID | `019d2c73-4315-763f-a0f2-eaf2fb142eda` |

Record IDs (`:recordId`) are integers (e.g., `42`).

Keys and slugs are **always generated server-side**. Never send `key` or `slug` in create requests (except optionally for fields).

## Apps

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v2/apps` | Create app (only `name` required) |
| `GET` | `/v2/apps` | List apps |
| `GET` | `/v2/apps/:appId` | Get app |
| `DELETE` | `/v2/apps/:appId` | Soft-delete app |
| `POST` | `/v2/apps/:appId/copy` | Copy app (`schema_only` or `schema_and_data`) |
| `GET` | `/v2/apps/:appId/export` | Export schema as JSON |

### Sandbox (schema staging)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v2/apps/:appId/sandbox` | Create sandbox (locks parent schema) |
| `GET` | `/v2/apps/:appId/sandbox/diff` | Diff sandbox vs parent |
| `POST` | `/v2/apps/:appId/sandbox/promote` | Apply sandbox changes to production |
| `DELETE` | `/v2/apps/:appId/sandbox` | Discard sandbox (unlock parent) |

### Backups

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v2/apps/:appId/backups` | List schema backups |
| `POST` | `/v2/apps/:appId/rollback` | Rollback to backup |

## Schema (Workspace Tier)

### Tables

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v2/apps/:appId/tables` | Create table (only `name` required) |
| `GET` | `/v2/apps/:appId/tables` | List tables |
| `GET` | `/v2/apps/:appId/tables/:tableId` | Get table |
| `PATCH` | `/v2/apps/:appId/tables/:tableId` | Update table |
| `DELETE` | `/v2/apps/:appId/tables/:tableId` | Delete table |

### Fields

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v2/apps/:appId/tables/:tableId/fields` | Create field |
| `GET` | `/v2/apps/:appId/tables/:tableId/fields` | List fields |
| `GET` | `/v2/apps/:appId/tables/:tableId/fields/:fieldId` | Get field |
| `PATCH` | `/v2/apps/:appId/tables/:tableId/fields/:fieldId` | Update field |
| `DELETE` | `/v2/apps/:appId/tables/:tableId/fields/:fieldId` | Delete field (cascades to dependents) |
| `GET` | `/v2/apps/:appId/tables/:tableId/fields/:fieldId/dependents` | Dependency analysis |

### Supported field types (20)

| Category | Types |
|----------|-------|
| Text | `text`, `multiline`, `rich_text`, `email`, `phone`, `url` |
| Number | `number`, `currency`, `percent` |
| Date | `date`, `datetime` |
| Boolean | `boolean` |
| Selection | `select`, `multi_select` |
| Computed | `formula`, `lookup`, `summary` |
| Special | `uuid`, `user`, `attachment` |

`reference` fields are auto-created when relationships are established — they cannot be created directly.

Select/multi-select fields use `config.options`:

```json
{ "name": "Status", "type": "select", "config": { "options": ["Draft", "Active", "Closed"] } }
```

### Relationships

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v2/apps/:appId/relationships` | Create relationship |
| `GET` | `/v2/apps/:appId/relationships` | List relationships |
| `PATCH` | `/v2/apps/:appId/relationships/:relId` | Update relationship |
| `DELETE` | `/v2/apps/:appId/relationships/:relId` | Delete relationship |

Create request:

```json
{ "parentTableId": "tableKeyOrUUID", "childTableId": "tableKeyOrUUID", "type": "one_to_many" }
```

When `childFkField` is omitted, the backend auto-creates a `reference` field on the child table.

## Records (Workspace Tier)

### CRUD

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v2/apps/:appId/tables/:tableId/records` | Create record |
| `GET` | `/v2/apps/:appId/tables/:tableId/records` | List records (paginated) |
| `GET` | `/v2/apps/:appId/tables/:tableId/records/:recordId` | Get record |
| `PATCH` | `/v2/apps/:appId/tables/:tableId/records/:recordId` | Update record |
| `DELETE` | `/v2/apps/:appId/tables/:tableId/records/:recordId` | Delete record |
| `PUT` | `/v2/apps/:appId/tables/:tableId/records/bulk` | Bulk update |
| `POST` | `/v2/apps/:appId/tables/:tableId/records/bulk-delete` | Bulk delete |
| `POST` | `/v2/apps/:appId/tables/:tableId/import` | Bulk import |

### Query with filters

Use `POST /v2/apps/:appId/tables/:tableId/records/query` for complex queries:

```json
{
  "limit": 25,
  "offset": 0,
  "search": "smith",
  "sort": { "field": "LastName", "direction": "asc" },
  "filter": [
    { "field": "Status", "operator": "eq", "value": "Active" },
    { "field": "Amount", "operator": "gte", "value": "100" },
    { "field": "Category", "operator": "in", "value": "A,B,C" }
  ]
}
```

Response:

```json
{ "records": [{ "record_id": 1, "Status": "Active", ... }], "total": 42 }
```

### Filter operators (14)

| Operator | Description | Value format |
|----------|-------------|-------------|
| `eq` | Equals | single value |
| `neq` | Not equals | single value |
| `in` | Matches any in list | comma-separated |
| `is_null` | Is null/empty | ignored |
| `not_null` | Is not null/empty | ignored |
| `gt` | Greater than | single value |
| `gte` | Greater than or equal | single value |
| `lt` | Less than | single value |
| `lte` | Less than or equal | single value |
| `between` | Between (inclusive) | two comma-separated |
| `contains` | Contains substring | substring |
| `not_contains` | Does not contain | substring |
| `starts_with` | Starts with prefix | prefix |
| `ends_with` | Ends with suffix | suffix |

Multiple filters combine with AND logic. String operators are case-insensitive.

For simple queries (1-3 filters), use `GET /records` with `filter` as a JSON-encoded query param.

## Users

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v2/users` | Create user (admin) |
| `GET` | `/v2/users` | List users |
| `GET` | `/v2/users/:userId` | Get user |
| `PUT` | `/v2/users/:userId` | Update user |
| `DELETE` | `/v2/users/:userId` | Delete user |
| `POST` | `/v2/users/:userId/roles` | Assign role |
| `DELETE` | `/v2/users/:userId/roles/:role` | Remove role |
| `POST` | `/v2/users/invite` | Create invite |
| `POST` | `/v2/users/invite/:token/accept` | Accept invite |
| `POST` | `/v2/users/password/recover` | Request recovery |
| `POST` | `/v2/users/password/reset` | Reset password |
| `PUT` | `/v2/users/:userId/password` | Change password |

## Templates

Templates are reusable app schemas that can be published, versioned, and pushed to subscriber apps.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v2/templates` | Create template (accepts optional `config` JSON for import) |
| `GET` | `/v2/templates` | List templates |
| `GET` | `/v2/templates/:templateId` | Get template |
| `PUT` | `/v2/templates/:templateId` | Update template |
| `DELETE` | `/v2/templates/:templateId` | Delete template |
| `POST` | `/v2/templates/:templateId/publish` | Publish version |
| `GET` | `/v2/templates/:templateId/versions` | List versions |
| `POST` | `/v2/templates/:templateId/materialize` | Create app from template |
| `GET` | `/v2/templates/:templateId/subscribers` | List subscribers |
| `POST` | `/v2/templates/:templateId/push-update` | Push update to subscribers |

### Per-app template operations

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v2/apps/:appId/subscription` | Get subscription |
| `POST` | `/v2/apps/:appId/apply-update` | Apply template update |
| `POST` | `/v2/apps/:appId/extract-template` | Extract as template |
| `GET` | `/v2/apps/:appId/template-diff` | Three-way diff |
| `POST` | `/v2/apps/:appId/template-rollback` | Rollback to version |

## Permissions

```http
GET /v2/apps/:appId/my-permissions
```

Returns the authenticated user's CRUD permissions per table:

```json
{
  "tables": [{
    "key": "kt8xbp9kp",
    "canView": true, "canAdd": true, "canEdit": true, "canDelete": true,
    "viewAccess": "all", "editAccess": "all", "deleteAccess": "all",
    "noAccessFieldKeys": [],
    "readOnlyFieldKeys": ["created_at"],
    "capabilities": ["import_data", "manage_forms", "view_table"]
  }]
}
```

## Pages

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v2/apps/:appId/pages` | List pages |
| `GET` | `/v2/apps/:appId/pages/:pageKey` | Get page |
| `POST` | `/v2/apps/:appId/pages` | Create page |
| `PATCH` | `/v2/apps/:appId/pages/:pageKey` | Update page |
| `DELETE` | `/v2/apps/:appId/pages/:pageKey` | Delete page |
| `POST` | `/v2/apps/:appId/pages/:pageKey/duplicate` | Duplicate page |

## Error Responses

| Status | Meaning |
|--------|---------|
| 400 | Validation error (bad payload or field type) |
| 401 | Missing or invalid Bearer token |
| 403 | Insufficient permissions (e.g., non-admin on admin endpoint) |
| 404 | Resource not found |
| 409 | Conflict (e.g., sandbox already exists) |
| 423 | Schema locked (sandbox exists for this app) |
