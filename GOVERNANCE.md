# Governance

This project is maintained by the project maintainers listed in the repository ownership records.

## Roles

### Maintainers

Maintainers are responsible for:

- Reviewing and merging merge requests
- Managing releases
- Triaging issues
- Enforcing the Code of Conduct
- Coordinating security fixes
- Maintaining project documentation

### Contributors

Contributors may:

- Open issues
- Submit merge requests
- Improve documentation
- Propose features
- Report bugs and security concerns

## Decision Making

Project decisions are made by maintainer consensus whenever possible.

For routine changes, approval from at least one maintainer is required before merge.

For significant changes, including architecture changes, dependency changes, public API changes, or security-sensitive changes, maintainers may request additional review.

## Merge Requirements

All merge requests must:

- Target a non-protected feature or fix branch
- Pass CI/CD checks
- Avoid committing secrets, credentials, or local environment files
- Include tests or a clear explanation when tests are not applicable
- Follow the contribution guidelines in `CONTRIBUTING.md`

## Security-Sensitive Changes

Security-sensitive changes require maintainer review and must not weaken or bypass existing security controls, scanning tools, or CI/CD protections.

Agents and automation must not modify `.gitlab-ci.yml` unless explicitly instructed by a verified human maintainer.

## Code of Conduct Enforcement

Maintainers are responsible for enforcing `CODE_OF_CONDUCT.md`.

Reports may be sent to:

[Code of Conduct Contact Email]
