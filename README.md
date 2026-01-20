# CourseLLM

## 🌐 Production Deployment

**Live Application:** [https://coursellm-afe61.web.app/](https://coursellm-afe61.web.app/)

The application is deployed and available for testing. You can access it using Google OAuth authentication.

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
   cp .env.example .env.local  # if .env.example exists
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
│   │   │   └── monitoring/    # Monitoring API endpoint
│   │   ├── student/            # Student pages
│   │   ├── teacher/            # Teacher pages
│   │   │   └── monitoring/    # Monitoring dashboard
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
│   │   ├── monitoring-service.ts # System monitoring utilities
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
├── architecture.md             # Architecture documentation
├── integration.md              # Integration documentation
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

### System Monitoring

- **Real-Time CPU & RAM Monitoring**: Track system resource usage in real-time
- **Monitoring Dashboard**: Visual dashboard with charts and progress bars showing:
  - CPU usage percentage, load averages, and core count
  - Memory usage (total, free, used) with detailed breakdown
  - Node.js process memory metrics (heap, RSS, external)
  - System and process uptime
  - Historical usage trends (last 20 measurements)
- **API Endpoint**: `GET /api/monitoring` - Exposes system metrics in raw or formatted format
- **Auto-Refresh**: Dashboard automatically refreshes every 5 seconds (can be paused/resumed)
- **Teacher Access**: Available in the teacher portal at `/teacher/monitoring`

The monitoring system helps track application performance and resource utilization, enabling proactive identification of performance issues.

---

## Development Process

### Manual Development

The following components and features were developed manually by the team:

- **Project Architecture & Setup**: Initial project structure, Next.js configuration, Firebase setup, and build configuration
- **Authentication System**: Firebase Authentication integration, Google OAuth implementation, role-based access control
- **Database Schema Design**: Firestore data models, Firebase DataConnect schema design
- **UI/UX Design**: Component design, layout structure, styling with Tailwind CSS and Radix UI
- **API Design**: REST API endpoint definitions, request/response structures, microservice architecture planning
- **Testing Strategy**: Test framework setup (Jest, Playwright), test structure and organization
- **Deployment Configuration**: Firebase Hosting setup, App Hosting configuration, CI/CD pipeline
- **Project Documentation**: README, feature documentation, OpenSpec specifications

### AI-Assisted Development

The following components and features were developed with AI assistance:

- **Code Implementation**: Component implementations, service layer code, API route handlers
- **Type Definitions**: TypeScript type definitions and interfaces
- **Test Implementation**: Unit test and E2E test implementations
- **Code Refactoring**: Code optimization, bug fixes, and improvements
- **Documentation**: Code comments, inline documentation, and technical documentation

### Hybrid Approach

Many features were developed using a hybrid approach where:
- **Architecture and design decisions** were made manually by the team
- **Implementation details** were developed with AI assistance based on specifications
- **Code review and refinement** was done manually to ensure quality and alignment with project standards

---

## Deployment

### Production URL

**Live Application:** [https://coursellm-afe61.web.app/](https://coursellm-afe61.web.app/)

The application is deployed to Firebase Hosting and App Hosting. Reviewers can test the production deployment using Google OAuth authentication.

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

- [Architecture Documentation](architecture.md)
- [Integration Documentation](integration.md)
- [OpenSpec Documentation](openspec/AGENTS.md)
- [Quiz Feature Documentation](docs/features/QUIZ_README.md)
- [E2E Test Documentation](tests/README.md)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
