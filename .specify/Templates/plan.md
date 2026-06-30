# Implementation Plan: [Feature Name]

**Spec:** `[path/to/feature_spec.md]`  
**Branch:** `[branch-name]`  
**Owner:** `[Name or Team]`  
**Status:** [Draft | Ready | In Progress | Complete]

## 1. Objective

State the concrete implementation outcome.

## 2. Scope

### In Scope

- [Implementation item]
- [Implementation item]

### Out of Scope

- [Explicit non-goal]
- [Explicit non-goal]

## 3. Architecture Impact

| Area | Change Required | Notes |
| --- | --- | --- |
| Flask routes / Blueprints | [Yes/No] | [Details] |
| Service layer | [Yes/No] | [Details] |
| Database / persistence | [Yes/No] | [Details] |
| Static JavaScript modules | [Yes/No] | [Details] |
| HTML/CSS | [Yes/No] | [Details] |
| Service worker / offline data | [Yes/No] | [Details] |
| GitLab CI/CD | [Yes/No] | [Details] |

## 4. Files to Change

- `[path]`: [Reason]
- `[path]`: [Reason]

## 5. Implementation Steps

1. [Step]
2. [Step]
3. [Step]

## 6. Validation Plan

- [ ] `python -m py_compile app.py data-processor/app.py data-processor/wsgi.py`
- [ ] `python -m pytest --cov=. --cov-report=term-missing --cov-report=xml`
- [ ] `npm run check`
- [ ] `npm run deadcode`
- [ ] `npm run test:ci`

## 7. Security Review

- Input validation: [Details]
- Output encoding / DOM safety: [Details]
- Authentication / authorization: [Details]
- Secrets and local files: [Details]
- Dependency impact: [Details]

## 8. Rollout

- Deployment order: [Steps]
- Monitoring: [Signals]
- Rollback: [Steps]
