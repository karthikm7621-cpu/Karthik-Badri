# Team ATK Engineering Constitution

**Version:** 1.0.0  
**Scope:** Flask backend, vanilla JavaScript frontend, GitLab CI/CD, AI-assisted contributions  
**Status:** Mandatory for all human and autonomous contributors

## 1. Operating Principles

- Every feature must start from a written specification in `.specify/Templates/feature_spec.md` or a derivative in `specs/`.
- Production code must be small, testable, observable, and secure by default.
- CI is the source of truth for merge readiness.
- Agents must not commit directly to `main`.
- Security scanning, type checking, coverage, and dependency audits must not be disabled to force a merge.

## 2. Backend Architecture: Flask

- Flask applications must be created through an application factory when new backend modules are introduced.
- New route groups must be implemented as Flask Blueprints and registered from the application assembly layer.
- Route handlers must stay thin: parse input, call service/domain code, and return serialized responses.
- Business logic must live outside route handlers.
- Database access must be isolated behind repository or service functions rather than mixed into request parsing.
- Request input must be validated before use.
- File uploads must validate size, extension, content type, and storage path.
- API responses must avoid leaking stack traces, local paths, secrets, tokens, or raw exception messages.
- Error handling must return stable JSON responses for API endpoints.
- Python code must pass Ruff, MyPy where practical, Bandit, dependency audit, and pytest coverage checks.

## 3. Frontend Architecture: Vanilla JavaScript

- JavaScript must be organized into modules with explicit imports and exports when the browser target allows it.
- New code must avoid global namespace pollution. Globals are allowed only for browser platform APIs or clearly documented compatibility shims.
- DOM writes must prefer `textContent`, safe attribute setters, or controlled template construction.
- `innerHTML` is prohibited for user-controlled content.
- Event listeners created by a module must have a clear cleanup path when the module can be unmounted.
- Network access must go through shared request helpers when present.
- IndexedDB and service-worker behavior must be treated as application infrastructure and covered by regression tests when modified.
- Frontend code must pass Biome formatting, Biome linting, Knip dead-code checks, and Jest coverage checks.

## 4. Security Requirements

- Secrets, credentials, private keys, tokens, and local `.env` files must never be committed.
- Authentication and authorization changes require explicit maintainer review.
- Dependency additions require a clear reason, a license-compatible package, and a passing dependency audit.
- Public issue reports must not contain vulnerability details. Use `SECURITY.md` for private disclosure.
- Generated files, model files, local databases, virtual environments, and caches must remain ignored unless explicitly approved.

## 5. Testing and Coverage

- Backend changes must include pytest coverage for service logic, request validation, and security-sensitive branches.
- Frontend changes must include Jest tests for state changes, DOM behavior, and browser-storage behavior where applicable.
- GitLab CI must publish backend and frontend coverage artifacts.
- Coverage should not decrease. The default backend minimum is 85% unless maintainers approve a staged exception.
- Bug fixes must include a regression test that fails before the fix.

## 6. GitLab Merge Rules

- Merge requests must use the GitLab merge request template.
- Merge requests must disclose AI-assisted or AI-authored work when substantial logic, architecture, or documentation was generated.
- Required checks include formatting, linting, type checking, security scanning, dependency audit, backend coverage, and frontend coverage.
- `.gitlab-ci.yml` changes require human maintainer intent and review.
- Squashed commits should follow Conventional Commits.

## 7. Specification Compliance

Every feature specification must define:

- User problem and acceptance criteria
- Backend endpoints or explicit statement that none are needed
- Frontend state, DOM, and accessibility behavior
- Data model or storage changes
- Security and privacy considerations
- Test plan and coverage expectations
- Rollout and rollback notes

Work that does not satisfy the relevant specification must not be merged.
