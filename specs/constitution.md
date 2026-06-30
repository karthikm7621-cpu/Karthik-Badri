# Team ATK Engineering Constitution

This Constitution defines the core principles, coding standards, and workflows for Team ATK. It serves as the definitive guide for all engineering decisions.

## 1. Core Engineering Principles
- **Spec-Driven Development (SDD):** No code is written without an approved specification.
- **Offline-First:** All client-facing systems must support offline capabilities (via Service Workers/IndexedDB).
- **Simplicity & Readability:** Code is read more often than it is written. Optimize for maintainability over cleverness.
- **Security by Default:** Validate all inputs, escape all outputs, and enforce least privilege.

## 2. Coding Standards

### Python (Flask & Backend)
- **Typing:** Use Python type hints (`typing` module) for all function signatures.
- **Style:** Follow PEP 8 guidelines. Use `black` for formatting and `ruff` or `flake8` for linting.
- **Documentation:** Use Google-style docstrings for all modules, classes, and public functions.
- **Error Handling:** Use custom exceptions. Never use bare `except:` blocks.
- **API Design:** Follow RESTful principles. Use HTTP status codes correctly. Always return standardized JSON responses.

### JavaScript (Vanilla Frontend)
- **Modern Syntax:** Use ES6+ features (`const`, `let`, arrow functions, destructuring).
- **DOM Manipulation:** Cache DOM elements. Batch DOM updates to avoid layout thrashing.
- **State Management:** Use a unidirectional data flow. Centralize state in a dedicated store module (e.g., `state.js`) and dispatch events for UI updates.
- **Error Handling:** Use `try/catch` for `async/await`. Always provide user-friendly feedback for failed operations.

## 3. Workflows & Version Control
- **Branching Strategy:** Use feature branches (`feature/feature-name`, `bugfix/issue-name`). Never commit directly to `main`.
- **Commits:** Write descriptive commit messages using conventional commits (e.g., `feat: ...`, `fix: ...`).
- **Pull Requests:** PRs require at least one approving review and passing CI pipelines before merging.
- **Deployment:** Deployments are triggered automatically via CI/CD from the `main` branch.
