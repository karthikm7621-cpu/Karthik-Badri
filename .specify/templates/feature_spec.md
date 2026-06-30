# Feature Specification: [Feature Name]

**Status:** [Draft | In Review | Approved | Implemented]  
**Owner:** [Name or Team]  
**Reviewers:** [Maintainer Names]  
**Target Release:** [Version or Date]  
**Related Issue/MR:** [Link]

## 1. Summary

Describe the feature in one or two paragraphs.

## 2. Problem Statement

Explain the user or operational problem this feature solves.

## 3. Goals

- [Goal 1]
- [Goal 2]
- [Goal 3]

## 4. Non-Goals

- [Out of scope item 1]
- [Out of scope item 2]

## 5. Users and Use Cases

| User Type | Use Case | Success Outcome |
| --- | --- | --- |
| [Persona] | [What they need to do] | [How success is measured] |

## 6. Functional Requirements

- **FR-001:** [Requirement]
- **FR-002:** [Requirement]
- **FR-003:** [Requirement]

## 7. Acceptance Criteria

- [ ] [Observable acceptance criterion]
- [ ] [Observable acceptance criterion]
- [ ] [Observable acceptance criterion]

## 8. Backend Specification

### Flask Architecture

- Blueprint: `[blueprint_name]`
- Service module: `[module path]`
- Repository/data access module: `[module path or N/A]`

### API Endpoints

| Method | Path | Auth Required | Description |
| --- | --- | --- | --- |
| `GET` | `/api/[resource]` | [Yes/No] | [Description] |

### Request Validation

```json
{
  "field": "type and constraints"
}
```

### Success Response

```json
{
  "status": "success",
  "data": {}
}
```

### Error Responses

| Status | Error Code | Condition |
| --- | --- | --- |
| `400` | `VALIDATION_ERROR` | [Condition] |
| `404` | `NOT_FOUND` | [Condition] |

## 9. Frontend Specification

### Files and Modules

- `static/[file].js`: [Responsibility]
- `static/[file].css`: [Responsibility]
- `static/index.html`: [DOM changes]

### State Model

```json
{
  "stateKey": "meaning"
}
```

### DOM and Accessibility

- Mounted elements: [Selectors]
- Events: [Event names and handlers]
- Keyboard support: [Required behavior]
- ARIA requirements: [Labels, roles, live regions]

### Browser Storage and Offline Behavior

- IndexedDB changes: [Yes/No and details]
- Service worker changes: [Yes/No and details]
- Offline fallback: [Expected behavior]

## 10. Security and Privacy

- User-controlled input: [Fields]
- Sanitization strategy: [textContent, validation, escaping, etc.]
- Sensitive data handled: [None or details]
- Authorization impact: [None or details]
- Abuse cases: [Rate limits, upload restrictions, injection risks]

## 11. Testing Plan

### Backend Tests

- [ ] Unit tests for service logic
- [ ] API tests for success and error responses
- [ ] Validation tests
- [ ] Security regression tests where applicable

### Frontend Tests

- [ ] DOM behavior tests with Jest/jsdom
- [ ] State transition tests
- [ ] Error and offline-state tests
- [ ] Accessibility checks where practical

### Coverage Expectations

- Backend coverage impact: [No decrease / target percentage]
- Frontend coverage impact: [No decrease / target percentage]

## 12. Observability

- Logs: [New log events]
- Metrics: [New metrics]
- Error reporting: [Expected errors and handling]

## 13. Rollout and Rollback

- Rollout plan: [Steps]
- Rollback plan: [Steps]
- Data migration or cleanup: [None or details]

## 14. AI Assistance Disclosure

- AI-assisted implementation expected: [Yes/No]
- AI-assisted files or logic: [List]
- Human review focus areas: [Security, data model, UX, performance]
