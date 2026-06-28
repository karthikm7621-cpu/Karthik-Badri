# Contributing Guidelines

First off, thank you for considering contributing to this project. It's people like you that make the open-source community such a great place to learn, inspire, and create.

## Developer Certificate of Origin (DCO)

All contributions to this project must be accompanied by a Developer Certificate of Origin (DCO) sign-off. This ensures that you have the right to submit the code. 
Add the following line to the end of your commit message:

```
Signed-off-by: Random J Developer <random@developer.example.org>
```

You can automatically sign your commits using `git commit -s`.

## Branching Strategy

We follow a structured branching strategy based on Git Flow:
- `main`: Represents the production-ready state of the code. Only merge into `main` from approved pull requests.
- `feat/feature-name`: For new features.
- `fix/issue-description`: For bug fixes.
- `chore/task-name`: For maintenance tasks (e.g., dependency updates, CI/CD changes).

## Commit Conventions

We strictly adhere to [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). All commit messages must follow this structure:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```
**Allowed types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

## Pull Request (PR) Process

1. **Ensure your branch is up to date** with the latest `main` branch.
2. **Run all tests and linters** locally before submitting. Our CI pipeline enforces formatting and typing standards.
3. **Fill out the PR template** completely. Provide context on what the PR does and link to any relevant issues.
4. **Code Review:** All PRs require at least one approval from a core maintainer before merging. Address any feedback promptly.

## Code Review Standards

- **Readability over cleverness:** Code should be self-documenting. Use clear variables and add comments for complex logic.
- **Test coverage:** Any new feature must be accompanied by appropriate unit and integration tests.
- **Security:** Ensure no sensitive data (secrets, tokens, PII) is included in the PR.
