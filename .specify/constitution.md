# Engineering Constitution

This document defines the core principles, decision-making frameworks, and non-negotiable architectural constraints for all software development in this repository. 

## 1. Core Principles
- **Zero-Defect Culture:** Code must be rigorously tested before merging. We do not tolerate "broken windows."
- **Security by Default:** All inputs are untrusted. Secrets must never be hardcoded. Dependencies must be pinned and scanned.
- **Observability:** If it runs in production, it must emit logs, metrics, and traces.
- **Simplicity:** Choose boring technology. Avoid clever code. Readability is prioritized over conciseness.

## 2. Decision-Making Framework (RFC Process)
Major architectural changes must follow the Request for Comments (RFC) process:
1. **Draft:** The author creates a `spec.md` detailing the problem and proposed solution.
2. **Review:** The core team reviews the proposal asynchronously.
3. **Consensus:** We strive for consensus. If consensus cannot be reached, the Principal Architect makes the final call.
4. **Implementation:** Only approved specs move to the planning and execution phase.

## 3. Architectural Constraints & Tech Stack
- **Backend:** Python 3.11+, Flask for lightweight services. No async frameworks (e.g., FastAPI) unless specifically approved for high-concurrency websocket features.
- **Frontend:** Vanilla JS/HTML/CSS for core tools. React/Next.js is only permitted for complex state-heavy client portals.
- **Database:** PostgreSQL for relational data. SQLite is strictly for local dev or offline-first embedded scenarios.
- **Containerization:** All services must be fully containerized. Dockerfiles must use multi-stage builds and run as non-root.

## 4. Non-Negotiables
- **CI/CD:** No code is merged to `main` without passing the CI pipeline (Linting, Types, Security, Tests).
- **Code Reviews:** Every PR requires at least one approval from a designated code owner.
- **Test Coverage:** Global test coverage must not drop below 85%. New features require 100% test coverage on the critical path.
