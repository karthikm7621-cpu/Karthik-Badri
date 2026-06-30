# Team ATK Engineering Constitution

This constitution defines the strict engineering standards for our Spec-Driven Development (SDD) workflow. All code merged into this repository must adhere to these rules.

## 1. Frontend: Vanilla JavaScript & DOM Management
- **No Global Scope Pollution:** All JavaScript must be encapsulated within ES6 modules or IIFEs. Do not attach variables to the `window` object unless absolutely necessary for external integrations.
- **Strict Modularity:** Separate concerns strictly. Create distinct modules for State Management, API Services, and DOM UI components.
- **DOM Manipulation:** Cache DOM queries. Avoid direct inline styles; toggle CSS classes instead. Ensure all interactive elements have semantic HTML and ARIA labels.
- **Event Listeners:** Attach event listeners dynamically on module initialization and ensure they are removed when elements are destroyed to prevent memory leaks.

## 2. Backend: Python/Flask Structure
- **Blueprint Architecture:** Do not declare all routes in a single `app.py`. Use Flask Blueprints to logically group related routes and business logic (e.g., `auth`, `employees`, `attendance`).
- **API Response Formatting:** All API endpoints must return a standardized JSON response envelope:
  ```json
  {
    "status": "success | error",
    "data": { ... },
    "message": "Optional human-readable message"
  }
  ```
- **Error Handling:** Centralize error handling using `@app.errorhandler`. Never leak stack traces to the client in production.
- **Validation:** Validate all incoming requests and payloads before processing business logic. Use appropriate HTTP status codes (e.g., 400 for Bad Request, 401 for Unauthorized).

## 3. Version Control & SDD Workflow
- **Spec-Driven Requirement:** No feature branch can be created without a fully approved specification (`.specify/Templates/feature_spec.md` or `technical_spec.md`).
- **Commit Standards:** Use Conventional Commits strictly (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
- **Pull Requests:** PRs must link to their corresponding specification document. PRs require a peer review and passing CI pipelines to be eligible for merging. Main branch merges occur only via Pull Request.
