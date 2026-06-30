# Compliance Checklist: [Feature Name]

**Related Spec:** `[path/to/feature_spec.md]`  
**Reviewer:** [Name]  
**Date:** [YYYY-MM-DD]

## Specification

- [ ] Feature spec is complete.
- [ ] Implementation plan is complete.
- [ ] Tasks are traceable to requirements.
- [ ] Acceptance criteria are testable.

## Flask Backend

- [ ] New routes are organized through Blueprints when applicable.
- [ ] Route handlers remain thin.
- [ ] Business logic is outside request handlers.
- [ ] Inputs are validated.
- [ ] Errors return safe JSON responses.
- [ ] Tests cover success, validation, and failure paths.

## Vanilla JavaScript Frontend

- [ ] Code is modular and avoids unnecessary globals.
- [ ] User-controlled content uses safe DOM APIs.
- [ ] Event listeners have cleanup when applicable.
- [ ] UI states cover loading, empty, error, and offline behavior where relevant.
- [ ] Jest/jsdom tests cover core behavior.

## Tooling

- [ ] Biome format passes.
- [ ] Biome lint passes.
- [ ] Knip dead-code check passes.
- [ ] Ruff passes.
- [ ] MyPy passes where applicable.
- [ ] Bandit passes.
- [ ] Dependency audit passes.

## Coverage and CI

- [ ] Backend coverage meets the configured threshold.
- [ ] Frontend coverage report is generated when tests exist.
- [ ] GitLab artifacts include coverage reports.
- [ ] Coverage regex is visible in GitLab job configuration.

## Security and Release

- [ ] No secrets or local environment files are committed.
- [ ] New dependencies are justified.
- [ ] Rollback plan is documented.
- [ ] Merge request template is complete.
- [ ] AI assistance is disclosed when applicable.
