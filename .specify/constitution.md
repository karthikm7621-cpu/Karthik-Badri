# Team ATK Engineering & Automation Constitution 🛡️

**Authored by:** Core Architecture, AI Automation, and DevOps Guilds

This constitution enforces non-negotiable standards across our AI-assisted development, core software engineering, and continuous delivery pipelines. All human and autonomous agent contributors MUST adhere to this document.

---

## 1. 🧠 AI Prompt Engineering & Automation Standards
*As mandated by the Principal Prompt Engineer*

- **System Prompt Integrity:** All AI agents contributing to this repository must operate strictly under the context of this constitution.
- **Spec-to-Code Traceability:** Agents must generate code that explicitly references the corresponding `feature_spec.md` or `technical_spec.md` in commit messages and PR descriptions.
- **Zero-Hallucination Policy:** AI-generated code must exclusively use the approved tech stack (Vanilla JS, Flask, HTML/CSS). No unauthorized third-party libraries may be imported without explicit architectural approval.
- **Self-Correction Loop:** Agents must run local linters and unit tests (where configured) before proposing a commit.

## 2. 💻 Software Engineering Standards
*As mandated by the Principal Software Developer*

### Backend (Python/Flask)
- **Hexagonal Architecture (Ports and Adapters):** Business logic must be decoupled from Flask routing. Flask routes (Adapters) must only parse requests, pass them to Service layers (Core), and format responses.
- **Strict Typing:** All Python code must use `typing` and pass static analysis tools (e.g., `mypy --strict`).
- **Stateless APIs:** All Flask endpoints must be perfectly stateless. Session data belongs in Redis or client-side tokens (JWT), never in local memory.
- **Error Boundaries:** Use global exception handlers to capture, log (with correlation IDs), and sanitize errors before returning a standardized `{"status": "error", "error_code": "..."}` JSON payload to the client.

### Frontend (Vanilla JS & UI)
- **Component Lifecycle Management:** Vanilla JS modules must expose `mount(element)` and `unmount()` methods to prevent memory leaks and dangling event listeners.
- **Offline-First State Machine:** Client-side state must be managed via a centralized store that syncs with IndexedDB. Network calls must be queued during offline states and automatically retried via Service Workers.
- **Security Primitives:** DOM updates must use `textContent` or `DOMPurify` to mitigate XSS. Never use raw `innerHTML`.

## 3. 🚀 CI/CD & Pipeline Standards
*As mandated by the Principal Pipeline Specialist*

- **Immutable Build Artifacts:** Docker images must be built once, tagged with the Git SHA, and promoted across environments (Staging -> Prod) without rebuilding.
- **Shift-Left Security:** All PRs must pass automated SAST (Static Application Security Testing) and dependency vulnerability scans before the merge button is unlocked.
- **Zero-Downtime Deployments:** The pipeline mandates Blue/Green or Canary deployment strategies. Health-check endpoints (`/api/health`) are strictly required.
- **Merge Criteria:** 
  1. 100% pass rate on unit/integration tests.
  2. Test coverage must not decrease (enforced by SonarQube/Codecov).
  3. Minimum one human approval.
  4. Squashed commits following Conventional Commits (`type(scope): subject`).
