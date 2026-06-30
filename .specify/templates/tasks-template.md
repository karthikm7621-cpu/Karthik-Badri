# Tasks: [Feature Name]

**Spec:** `[path/to/feature_spec.md]`  
**Plan:** `[path/to/plan.md]`  
**Status:** [Draft | Ready | In Progress | Complete]

## Backend

- [ ] Define or update Flask Blueprint routes.
- [ ] Move business logic into service functions.
- [ ] Add request validation.
- [ ] Add stable JSON error responses.
- [ ] Add or update persistence/repository logic.
- [ ] Add pytest coverage for success, validation, and error paths.

## Frontend

- [ ] Update HTML structure with accessible labels and roles.
- [ ] Update CSS without layout shifts on mobile or desktop.
- [ ] Add or update JavaScript modules without global namespace pollution.
- [ ] Use safe DOM APIs for user-controlled content.
- [ ] Add cleanup for event listeners when applicable.
- [ ] Add Jest/jsdom coverage for state and DOM behavior.

## Security

- [ ] Validate all user-controlled inputs.
- [ ] Avoid raw `innerHTML` for user-controlled content.
- [ ] Confirm no secrets or local environment files are committed.
- [ ] Confirm new dependencies are necessary and license-compatible.
- [ ] Confirm Bandit and dependency audit pass.

## Quality Gates

- [ ] Biome formatting passes.
- [ ] Biome linting passes.
- [ ] Knip dead-code check passes.
- [ ] Ruff formatting and linting pass.
- [ ] MyPy check passes where applicable.
- [ ] Backend coverage meets the configured threshold.
- [ ] Frontend coverage artifacts are generated.

## Documentation

- [ ] Update `README.md` if behavior or setup changes.
- [ ] Update `USER_MANUAL.md` if user workflow changes.
- [ ] Update `CHANGELOG.md` or release notes when appropriate.
- [ ] Complete AI assistance disclosure in the merge request.
