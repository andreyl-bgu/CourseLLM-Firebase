# Project Report & AI Process Analysis (Reflective)

**Project:** CourseLLM / Coursewise (Firebase + Next.js)  
**Scope:** Quiz feature + documentation + testing stabilization + monitoring  
**Audience:** Reviewers of the PR (engineering + product)  
**Date:** 2026-01-21  

---

## Executive summary

This PR is the result of an iterative, AI-assisted implementation process focused on delivering a production-minded **Quiz feature** (teacher generation + student taking + analytics), making it **spec-driven** (OpenSpec documentation, routes/components/API references), stabilizing the **testing workflow** (Jest + Playwright), and adding a **teacher-only monitoring dashboard** to verify health and instance-level resource usage.

The biggest value the AI agent provided was speed in:
- generating first drafts of specs/docs and turning them into navigable artifacts
- implementing repetitive route/service plumbing safely
- doing broad “inventory” style audits (what exists, what’s missing)
- accelerating debugging by proposing hypotheses and quickly validating them with logs/tests

The biggest risks were:
- **“SLOP”**: plausible-but-unused code and redundant docs, requiring deliberate cleanup
- test flakiness: E2E tests need realistic preconditions (seed data) and correct environment setup
- production safety: test bypass mechanisms must remain strictly dev/test-only

---

## Starting point (what we had initially)

At the start, the repository already contained a working application skeleton:
- Next.js app with student/teacher role separation
- Firebase Auth + Firestore integration
- Genkit-based AI flows (including quiz generation)

However, the repo needed stronger “PR-quality” deliverables:
- **formal specification artifacts** for the feature (OpenSpec)
- a clear map of **routes/components/APIs** (including non-breaking OpenAPI docs)
- clarity on **how to run tests reliably** and what environment secrets are required
- stabilization of the E2E workflow (headless/headed, CI env behavior, auth bypass)

---

## How the work evolved (major iterations)

### 1) Spec-first documentation (OpenSpec)
- Added/updated feature specs to make the quiz flow explainable: requirements, architecture, integration points.
- Produced “reviewer-friendly” artifacts: API reference docs, route maps, and component breakdowns.

### 2) Non-breaking API documentation (OpenAPI without touching runtime)
- Generated a standalone `openapi.yaml` for the Quiz API.
- Ensured documentation is “read-only” (no swagger runtime integration changes).

### 3) Code quality pass (“less SLOP”)
- Removed dead/redundant code paths and mock data that no longer matched the Firebase-backed reality.
- Reverted temporary debugging logs after diagnosis.

### 4) Testing reliability pass (Jest + Playwright)
- Verified unit tests (Jest) and improved confidence in service layers.
- Ran E2E tests, diagnosed failures (mostly environment + missing seed data + assumptions in tests).
- Documented the required local setup and the most reliable local test flow.
- Removed/trimmed flaky E2E tests that were failing due to environmental variability and missing deterministic fixtures.

### 5) Monitoring (operational visibility)
- Restored prior monitoring implementation (from historical commit) in a safe, teacher-only way.
- Added lightweight health endpoint and documented how to use cloud monitoring and budgets/alerts for real production visibility.

---

## What AI agents helped with (and what humans added)

### Where the AI agent helped most
- **High-throughput drafting**: initial versions of specs, route/component inventories, and API docs.
- **Plumbing work**: repeating patterns like API route scaffolds, simple services, UI wiring.
- **Debug hypothesis generation**: quickly suggesting plausible failure modes (e.g., env var truthiness, missing auth/credentials, server “listening but unhealthy”).
- **Search + synthesis**: reading multiple files and consolidating a coherent picture for reviewers.

### Where human judgment mattered most
- **Scope control**: deciding what not to build (e.g., not adding swagger runtime that might break working code).
- **Quality control**: removing redundant code, avoiding “too clever” abstractions, keeping the monitoring surface minimal.
- **Security posture**: keeping secrets out of git, guarding test-only auth, and ensuring teacher-only pages remain protected.
- **Test realism**: deciding when to seed data vs. remove tests that were too brittle for current fixtures.

---

## Prompt patterns that worked well (examples)

These were the most effective categories of prompts used with the AI agent (paraphrased; not all were literal):

### Spec + documentation prompts
- “Create OpenSpec docs for feature X with concrete requirements and integration flows.”
- “Add API reference and OpenAPI spec without modifying runtime behavior.”
- “Update docs to explain where this feature fits in the full app flow and how it’s tested.”

### Implementation prompts (bounded changes)
- “Implement the plan as specified. Do not edit the plan file.”
- “Restore monitoring from commit X and adapt it safely to the current codebase.”
- “Add a teacher-only route and ensure the API returns no secrets (no-store).”

### Debugging prompts
- “Show logs and explain why E2E is stuck; validate the hypothesis (auth/emulators/env vars).”
- “Run a single Playwright test in headed mode to see what happens.”
- “Don’t change code—only change execution steps and document them.”

### Quality prompts (anti-SLOP)
- “Audit for redundant/unused code and remove it.”
- “Reduce verbosity and remove debug logs after the issue is understood.”

---

## What was hard (and how we handled it)

### 1) E2E tests depend on correct environment + realistic data
Some tests failed because the UI legitimately displayed empty states (“No quizzes found”) or because the test assumed a specific question type/DOM structure.

Mitigations:
- documented required secrets (`.env.local`, `service-account.json`) and reliable local flows
- ensured dev server starts with the right env (`ENABLE_TEST_AUTH=true`, `FIREBASE_SERVICE_ACCOUNT_PATH=...`)
- seeded minimal test data when appropriate
- removed tests that were too flaky given current fixtures and deterministic requirements

### 2) Environment variables can behave unexpectedly
Example: `CI=false` still being treated as truthy in some contexts, affecting Playwright config decisions.

Mitigations:
- ran Playwright with `CI=` to truly unset the variable when needed
- updated run instructions accordingly

### 3) Balancing “documentation completeness” vs. maintenance
It’s easy for AI-generated docs to become repetitive.

Mitigations:
- kept docs intentionally “map-like” (routes/components/API tables) with explicit purpose
- avoided duplicating the same content across multiple documents unless needed for reviewers

---

## Testing approach used in this project

### Unit tests (Jest)
- Focus: service-layer logic and API client behavior with mocks.
- Strength: fast feedback loop; stable in CI/local.

### E2E tests (Playwright)
- Focus: role-based access, navigation, and key UX flows.
- Strength: validates integration (routing + UI rendering + API interaction).
- Weakness: requires stable preconditions and careful test data management.

### Practical lesson
If the application depends on external services (Firebase, Genkit, etc.), E2E tests must be engineered as **deterministic**:
- explicit fixtures and seed steps
- stable selectors and clear UI assertions
- predictable environments (ports, env vars, credentials)

---

## What cost the most (time, risk, and compute)

### 1) AI generation (runtime)
The quiz generation flow uses LLM calls (Gemini via Genkit). This can cost more due to:
- long input contexts (course material)
- retries/validation loops
- generating many questions at higher difficulty

### 2) E2E iteration time (developer time)
Playwright runs are “cheap” in compute but expensive in **iteration time** when:
- the server is misconfigured (auth credentials missing)
- tests wait on UI states that never occur due to missing data
- headed debugging is required to understand failures

### 3) Production costs
The largest production cost drivers are typically:
- Firestore reads/writes at scale
- Cloud Run/App Hosting compute under traffic
- LLM inference usage (quiz generation)

This is why we added a split between **in-app monitoring (instance)** and **cloud-console monitoring (real infra & billing)**.

---

## What we would do differently (next iteration)

1. **Deterministic test data strategy**
   - Add a first-class “seed” mechanism for Playwright (API or fixture scripts) and keep E2E tests strictly data-driven.

2. **Tighter boundary for test-only auth**
   - Ensure test-only endpoints are impossible to enable in production (multiple safeguards).

3. **Less doc duplication**
   - Consolidate overlapping material into a single “source of truth” doc per topic and keep others as references/links.

4. **LLM cost measurement**
   - Add simple instrumentation around quiz generation to log request counts, latency, and approximate token usage (without logging prompts/PII).

5. **CI environment standardization**
   - Pin Node version consistently (avoid engine mismatch warnings) and standardize test commands.

---

## Where to look next (for reviewers)

- **Quiz feature report**: `docs/features/quiz-report.md`
- **OpenSpec**: `openspec/` (feature specs, route maps, component docs, OpenAPI)
- **Monitoring**: `src/app/teacher/monitoring/`, `src/app/api/monitoring/`, `src/app/api/health/`
- **Tests**: `src/lib/__tests__/` (Jest), `tests/` (Playwright)

