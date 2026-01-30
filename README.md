# CourseLLM

## PR Checklist (How to run this repo)

This section is a reviewer-oriented checklist that answers: **what to run**, **where to run it**, and **which environment variables/files are required**.

### Codespace / GitHub Workspace

- **Login works only if the workspace domain is allowed** in Firebase Auth.
  - **Action**: Firebase Console → **Authentication** → **Settings** → **Authorized domains** → add your Codespace/workspace domain.
  - If you don’t have access, send us the workspace URL and we’ll add it (owners have been invited via email).

### Required security files (manual setup)

Two files are required and are **not** in the repo (sent separately via email). Place both in the project root:
- **`.env.local`** (client Firebase config + local dev flags)
- **`service-account.json`** (Firebase Admin SDK credentials for server-side + E2E)

Both files are in `.gitignore` and must **never** be committed.

### Environment variables (what to set where)

#### Local development (`.env.local`)

Client Firebase config (required):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional)

Test auth + Admin SDK (local only; required for Playwright):
- `ENABLE_TEST_AUTH=true` (**never enable in production**)
- `FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json`
  - Alternative: `FIREBASE_SERVICE_ACCOUNT_JSON={...}`

Genkit / AI (local):
- `GOOGLE_API_KEY=...` (Gemini/Genkit API key)

Optional:
- `NEXT_PUBLIC_QUIZ_SERVICE_URL=` (if routing Quiz API to an external microservice)

#### Production (Firebase App Hosting)

- Production environment variables are configured via **Firebase App Hosting** (see `apphosting.yaml`).
- **Do not use** a committed `.env` file (this repo ignores `.env*`).
- **Never enable** `ENABLE_TEST_AUTH` in production.

### Install dependencies (where + which tool?)

From the repo root (`/quiz`):

```bash
pnpm install
```

Notes:
- Node **20+** is required (see `package.json` → `engines.node`).
- `pnpm` is the recommended package manager (repo pins it via `packageManager` in `package.json`).
- Playwright is already a dependency; browser binaries may need installation:

```bash
npx playwright install --with-deps chromium
```

### How to run locally (dev)

```bash
pnpm dev
```

App runs at `http://localhost:9002`.

### Genkit (AI) — how to run

In a separate terminal:

```bash
pnpm genkit:watch
```

Requires `GOOGLE_API_KEY` in your environment.

### How to run tests

#### Unit tests (Jest)

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

#### End-to-end tests (Playwright)

Playwright will start the dev server automatically with:
`ENABLE_TEST_AUTH=true FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json npm run dev`
(see `playwright.config.ts`).

Recommended deterministic flow (headed + explicit env):

```bash
# 1) Start server (required for E2E)
ENABLE_TEST_AUTH=true FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json pnpm dev

# 2) Run a single headed test (note: CI= unsets CI completely)
CI= pnpm exec playwright test tests/auth.spec.ts -g "teacher only access" --headed --workers=1 --reporter=line
```

### API documentation (where is it?)

- **OpenAPI**: `openspec/specs/quiz/openapi.yaml` (view in [Swagger Editor](https://editor.swagger.io/))
- **API reference**: `openspec/specs/quiz/api-reference.md`

### Login and roles (how does signup work?)

- Login page: `/login` (Google Sign-In).
- First login creates no profile automatically; users complete `/onboarding`.
- Onboarding writes `users/{uid}` in Firestore and assigns role:
  - `teacher` → `/teacher`
  - `student` → `/student`

Test-only bypass (used by Playwright):
- `/test/signin?uid=test-teacher&role=teacher&redirect=/teacher`
- `/test/signin?uid=test-student&role=student&redirect=/student`

### Emulators (important note)

The repo contains emulator configuration in `firebase.json`, but the **browser Firebase SDK is not currently wired to connect to emulators by default** (no `connectFirestoreEmulator/connectAuthEmulator` in `src/`).

Practical guidance:
- Most reliable local flow today is **real Firebase project + `.env.local` + service account**.

### DataConnect (do we use it?)

DataConnect is configured, but the Next.js app does **not** currently import `src/dataconnect-generated` (no references found in `src/`), so it is **configured but not actively used by the web app** right now.

Where it lives:
- Config: `dataconnect/dataconnect.yaml`
- Schema: `dataconnect/schema/schema.gql`
- Connector/generation: `dataconnect/example/connector.yaml` (generates `src/dataconnect-generated/` and `src/dataconnect-admin-generated/`, both ignored)

### Repo hygiene checks

- **Specs present**: `openspec/` contains quiz specs, routes/components docs, and OpenAPI.
- **`.gitignore` verified**: secrets (`.env*`, `service-account.json`) and generated artifacts are ignored.
- **AI tooling files**:
  - `CLINE.md` and `.clinerules/` are tooling/workflow docs; not required for runtime.
  - `database.rules.json` is referenced by `firebase.json` (Realtime Database rules). Remove only if you confirm RTDB is not used.

## Purpose
CourseLLM (Coursewise) is an educational platform that leverages AI to provide personalized learning experiences. 
It is intended for Undergraduate University Courses and is being tested on Computer Science courses.

The project provides role-based dashboards for students and teachers, integrated authentication via Firebase, and AI-powered course assessment and tutoring. 

The core goals are to:
- Enable personalized learning assessment and recommendations for students
- Provide Socratic-style course tutoring through AI chat
- Keep track of the history of students interactions with the system to enable teachers to monitor quality, intervene when needed, and obtain fine-grained analytics on learning trajectories.
- Support both student and teacher workflows
- Ensure secure, role-based access control

## Tech Stack
- **Frontend Framework**: Next.js 15 with React 18 (TypeScript)
- **Styling**: Tailwind CSS with Radix UI components
- **Backend/Functions**: Firebase Cloud Functions, Firebase Admin SDK
- **Backend**: FastAPI Python micro-services hosted on Google Cloud Run.
- **Database**: Firestore (NoSQL document database)
- **Authentication**: Firebase Authentication (Google OAuth)
- **AI/ML**: Google Genkit 1.20.0 with Google GenAI models (default: gemini-2.5-flash) and DSPy.ai for complex 
- **Data**: Firebase DataConnect (GraphQL layer over Firestore)
- **Testing**: Playwright for E2E tests, Jest for unit tests
- **Dev Tools**: TypeScript 5, pnpm workspace, Node.js
- **Deployment**: Firebase Hosting, App Hosting

More technical details are available in openspec/project.md

---

## Getting Started

### ⚠️ Required Security Files (Manual Setup)

**For security purposes, two configuration files are NOT included in the repository and must be added manually before running the application:**

| File | Purpose | Location |
|------|---------|----------|
| `.env.local` | Firebase API keys and configuration | Project root (`/quiz/.env.local`) |
| `service-account.json` | Firebase Admin SDK credentials | Project root (`/quiz/service-account.json`) |

**These files have been sent separately via email.** Place them in the project root directory before proceeding.

> **Security Note:** Both files are listed in `.gitignore` and should **NEVER** be committed to the repository. They contain sensitive credentials that could compromise the Firebase project if exposed.

If you haven't received these files, please contact the project maintainers.

---

### Prerequisites

- **Node.js**: Version 20+ (check with `node --version`)
- **npm** or **pnpm**: Package manager
- **Firebase Project**: Access to a Firebase project with Firestore enabled
- **Google Cloud Account**: For AI features (Genkit/Gemini)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd quiz
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Required environment variables:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   
   # For test authentication (development only)
   ENABLE_TEST_AUTH=true
   FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json
   # OR
   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
   
   # Optional: External Quiz Service URL (for microservice architecture)
   NEXT_PUBLIC_QUIZ_SERVICE_URL=
   ```

4. **Configure Firebase Service Account** (for testing)
   
   Place your Firebase service account JSON file at `./service-account.json` (or set `FIREBASE_SERVICE_ACCOUNT_JSON` env var).
   
   **Note:** `service-account.json` is in `.gitignore` - never commit this file.

### Running Locally

#### Development Server

```bash
npm run dev
```

The app will run on **http://localhost:9002**

#### Genkit AI Development Server

In a separate terminal, start the Genkit development server:

```bash
npm run genkit:watch
```

This enables AI features like quiz generation.

#### Running with Firebase Emulators

For local development with Firebase emulators:

1. **Start Firebase emulators**
   ```bash
   firebase emulators:start
   ```
   
   This starts:
   - Firestore emulator (port 8080)
   - Auth emulator (port 9099)
   - Functions emulator
   - DataConnect emulator (port 9399)
   - Storage emulator (port 9199)
   - Emulator UI (port 4000)

2. **Start Next.js dev server** (in another terminal)
   ```bash
   npm run dev
   ```

3. **Configure for emulators** (if needed)
   
   Update your Firebase config to point to emulators when running locally.

> **Important:** The browser Firebase SDK is not currently wired to automatically connect to emulators (no `connectFirestoreEmulator/connectAuthEmulator` in `src/`). Running emulators alone does not force the web app to use them.

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Testing

#### Unit Tests (Jest)

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

#### End-to-End Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Run tests with visible browser
npm run test:e2e:headed

# View test report
npm run test:e2e:report
```

**Note:** E2E tests require the dev server to be running. Playwright config will start it automatically if not already running.

**Recommended (most reliable) local flow (headed + explicit env):**

1. **Start the dev server with test auth + service account** (required for E2E)

```bash
ENABLE_TEST_AUTH=true FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json pnpm dev
```

2. **Run a single headed Playwright test** (so you can watch the browser)

```bash
CI= pnpm exec playwright test tests/auth.spec.ts -g "teacher only access" --headed --workers=1 --reporter=line
```

3. **Open the HTML report**

```bash
pnpm exec playwright show-report
```

If you prefer opening the file directly, it is generated at `playwright-report/index.html`.

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

---

## Project Structure

```
quiz/
├── src/
│   ├── app/                    # Next.js pages and API routes
│   │   ├── api/                # REST API endpoints
│   │   ├── student/            # Student pages
│   │   ├── teacher/            # Teacher pages
│   │   └── login/              # Authentication pages
│   ├── components/             # React components
│   │   ├── ui/                 # UI component library
│   │   └── layout/             # Layout components
│   ├── lib/                    # Utilities and services
│   │   ├── __tests__/          # Unit tests
│   │   ├── firebase.ts         # Firebase initialization
│   │   ├── firebase-quiz-service.ts
│   │   ├── firebase-attempt-service.ts
│   │   ├── quiz-api-client.ts  # API client
│   │   └── types.ts            # TypeScript types
│   └── ai/                     # AI flows (Genkit)
│       └── flows/
│           └── quiz-generation.ts
├── tests/                       # E2E tests (Playwright)
│   ├── helpers/                # Test helpers
│   ├── fixtures/               # Test data
│   ├── student/                # Student flow tests
│   ├── teacher/                # Teacher flow tests
│   └── shared/                 # Shared tests
├── openspec/                    # OpenSpec specifications
│   ├── specs/                  # Feature specifications
│   └── project.md              # Project context
├── docs/                        # Documentation
│   ├── features/               # Feature documentation
│   └── Auth/                   # Authentication docs
├── firebase.json                # Firebase configuration
├── jest.config.js              # Jest configuration
├── playwright.config.ts        # Playwright configuration
└── package.json                # Dependencies and scripts
```

---

## Key Features

### Quiz Feature (Team RNA)

- **AI-Powered Quiz Generation**: Teachers can generate quizzes from course materials using AI
- **Student Quiz Taking**: Interactive quiz interface with multiple question types
- **Results & Analytics**: Teachers can view student performance and analytics
- **Microservice Architecture**: REST API layer ready for service extraction

See [`docs/features/QUIZ_README.md`](docs/features/QUIZ_README.md) for detailed feature documentation.

---

## Monitoring & Operations

This project uses **two layers of monitoring**:

### 1) In-app Monitoring (Teacher)

Route: **`/teacher/monitoring`** (teacher-only)

This page shows **instance-level** runtime health/usage for the currently running Node.js process:
- CPU usage (process-based estimate)
- Memory usage (host + Node process heap/RSS)
- Uptime (system + process)
- Health endpoint status (`/api/health`)

API endpoints:
- **`GET /api/monitoring?format=raw`**: numeric values
- **`GET /api/monitoring?format=formatted`**: human-readable strings
- **`GET /api/health`**: lightweight liveness check

**Important limitations:** In production, App Hosting/Cloud Run may run multiple instances. The in-app dashboard reflects only **one instance** at a time and cannot report total platform usage, Firestore costs, Storage usage, or AI spend.

### 2) Production Monitoring (Firebase / Google Cloud)

Use cloud dashboards for the platform-wide view:
- **Firebase Console**: App Hosting status, Functions logs, Firestore usage
- **Google Cloud Monitoring**: request rate/latency, error rate (5xx), instance CPU/memory, uptime checks
- **Logs Explorer / Error Reporting**: exceptions, regressions, and correlation with deployments

### Cost Controls (Budgets & Alerts)

To avoid cost surprises:
- Create **Cloud Billing Budgets** with email alerts (e.g., 50%, 90%, 100%)
- Add alerts (via Monitoring) for spikes in:
  - 5xx errors
  - request latency
  - Firestore reads/writes
  - AI generation traffic/failures

---

## Deployment

### Firebase Hosting + App Hosting

The project is configured for Firebase deployment:

```bash
# Build and deploy
firebase deploy
```

Configuration files:
- `firebase.json` - Firebase project configuration
- `apphosting.yaml` - App Hosting configuration

### Environment Variables in Production

Ensure all `NEXT_PUBLIC_*` environment variables are set in your Firebase project settings.

**Important:** Never enable `ENABLE_TEST_AUTH` in production.

---

## Troubleshooting

### Port Already in Use

If port 9002 is in use:
```bash
# Kill process on port 9002
lsof -ti:9002 | xargs kill -9
# Or change port in package.json dev script
```

### Firebase Connection Issues

- Verify `.env.local` has correct Firebase credentials
- Check Firebase project settings
- Ensure Firestore is enabled in Firebase console

### Test Failures

- Ensure dev server is running (`npm run dev`)
- Check that `ENABLE_TEST_AUTH=true` is set
- Verify service account JSON is accessible
- Check Playwright browser installation: `npx playwright install`

### AI Generation Not Working

- Ensure Genkit dev server is running (`npm run genkit:watch`)
- Check Google Cloud credentials
- Verify API quotas and limits

---

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Write/update tests
4. Ensure all tests pass
5. Update documentation if needed
6. Create a pull request

---

## Additional Resources

- [OpenSpec Documentation](openspec/AGENTS.md)
- [Quiz Feature Documentation](docs/features/QUIZ_README.md)
- [Project Report & AI Process Analysis](docs/project-report-ai-process.md)
- [E2E Test Documentation](tests/README.md)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
