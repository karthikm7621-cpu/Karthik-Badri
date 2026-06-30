# API Contract: [Feature Name]

**Related Spec:** `[path/to/feature_spec.md]`  
**Base Path:** `/api`  
**Status:** [Draft | Approved]

## Endpoint: `[METHOD] /api/[resource]`

### Purpose

Describe the endpoint behavior.

### Authentication

- Required: [Yes/No]
- Roles: [Roles or N/A]

### Request Headers

| Header | Required | Description |
| --- | --- | --- |
| `Content-Type` | Yes | `application/json` |

### Request Body

```json
{
  "field": "value"
}
```

### Validation

| Field | Rule | Error Code |
| --- | --- | --- |
| `field` | [Rule] | `VALIDATION_ERROR` |

### Success Response

Status: `200 OK`

```json
{
  "status": "success",
  "data": {}
}
```

### Error Responses

| Status | Error Code | Response Shape |
| --- | --- | --- |
| `400` | `VALIDATION_ERROR` | `{"status":"error","error_code":"VALIDATION_ERROR","message":"..."}` |
| `401` | `UNAUTHORIZED` | `{"status":"error","error_code":"UNAUTHORIZED","message":"..."}` |
| `403` | `FORBIDDEN` | `{"status":"error","error_code":"FORBIDDEN","message":"..."}` |
| `500` | `INTERNAL_ERROR` | `{"status":"error","error_code":"INTERNAL_ERROR","message":"..."}` |

### Test Cases

- [ ] Valid request returns expected payload.
- [ ] Missing required field returns `400`.
- [ ] Unauthorized request returns `401` or `403`.
- [ ] Unexpected server error does not leak internals.
