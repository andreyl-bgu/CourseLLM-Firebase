# Quiz Feature - Technical Design

## Architecture Overview

The Quiz feature follows a modular microservice architecture pattern with clear separation between AI generation, frontend components, data layer, and Firebase integration.

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CourseWise App                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Teacher Portal  │         │  Student Portal  │         │
│  │                  │         │                  │         │
│  │ - Generate Quiz  │         │ - Take Quiz      │         │
│  │ - View Results   │         │ - View History   │         │
│  │ - Manage Quizzes │         │ - See Feedback   │         │
│  └────────┬─────────┘         └─────────┬────────┘         │
│           │                             │                   │
│           └─────────────┬───────────────┘                   │
│                         │                                   │
│              ┌──────────▼──────────┐                        │
│              │   Quiz Components   │                        │
│              │  (React + Next.js)  │                        │
│              └──────────┬──────────┘                        │
│                         │                                   │
│              ┌──────────▼──────────┐                        │
│              │  Quiz API Client    │                        │
│              │  (REST API Layer)  │                        │
│              └──────────┬──────────┘                        │
│                         │                                   │
│              ┌──────────▼──────────┐                        │
│              │  Quiz Generation    │                        │
│              │    AI Flow          │                        │
│              │  (Genkit + LLM)     │                        │
│              └──────────┬──────────┘                        │
│                         │                                   │
│              ┌──────────▼──────────┐                        │
│              │  Firebase Firestore │                        │
│              │  (Data Persistence) │                        │
│              └─────────────────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### System Integration Architecture

The Quiz feature operates within the broader CourseWise platform, integrating with authentication, course management, and analytics services.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CourseWise Platform                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        Shared Services Layer                           │  │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                  │  │
│  │  │  Firebase   │   │  Firebase   │   │   User      │                  │  │
│  │  │    Auth     │   │  Firestore  │   │  Profiles   │                  │  │
│  │  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘                  │  │
│  └─────────┼─────────────────┼─────────────────┼─────────────────────────┘  │
│            │                 │                 │                             │
│            └─────────────────┼─────────────────┘                             │
│                              │                                               │
│  ┌───────────────────────────┼───────────────────────────────────────────┐  │
│  │                    Feature Layer                                       │  │
│  │                           │                                            │  │
│  │  ┌─────────────┐   ┌──────▼──────┐   ┌─────────────┐   ┌───────────┐  │  │
│  │  │   Course    │   │             │   │  Socratic   │   │ Learning  │  │  │
│  │  │ Management  │──→│    QUIZ     │   │    Chat     │   │Assessment │  │  │
│  │  │             │   │   FEATURE   │   │             │   │           │  │  │
│  │  │ - Materials │   │             │   │ - Tutoring  │   │ - Eval    │  │  │
│  │  │ - Courses   │   │ - Generate  │   │ - Q&A       │   │ - Recom.  │  │  │
│  │  │ - Enroll    │   │ - Take      │   │ - Guidance  │   │           │  │  │
│  │  └─────────────┘   │ - Results   │   └─────────────┘   └───────────┘  │  │
│  │                    │ - Analytics │                                     │  │
│  │                    └──────┬──────┘                                     │  │
│  │                           │                                            │  │
│  └───────────────────────────┼────────────────────────────────────────────┘  │
│                              │                                               │
│  ┌───────────────────────────▼───────────────────────────────────────────┐  │
│  │                    Analytics Layer                                     │  │
│  │  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐      │  │
│  │  │ Teacher         │   │ Student         │   │ Learning        │      │  │
│  │  │ Dashboard       │   │ Progress        │   │ Trajectory      │      │  │
│  │  └─────────────────┘   └─────────────────┘   └─────────────────┘      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Integration Data Flows

#### Input Dependencies (What Quiz Reads)

| Source | Data | Purpose |
|--------|------|---------|
| Firebase Auth | User ID, Role | Identify user, authorize operations |
| User Profiles | Student/Teacher data | Display names, track ownership |
| Course Management | Course content, Materials | Generate quiz questions |
| Course Management | Course enrollment | Filter available quizzes |

#### Output Contributions (What Quiz Provides)

| Destination | Data | Purpose |
|-------------|------|---------|
| Student Profiles | Quiz attempts, Scores | Track learning history |
| Teacher Dashboard | Aggregated statistics | Performance analytics |
| Analytics | Per-question metrics | Identify challenging topics |
| Learning Trajectory | Score progression | Track improvement over time |

### Shared Services

#### 1. Firebase Authentication
- **Used By**: All features including Quiz
- **Quiz Integration**: 
  - Validates user identity before API calls
  - Provides user ID for attempt tracking
  - Role determines teacher/student access

#### 2. Firebase Firestore
- **Collections Used by Quiz**:
  - `quizzes`: Quiz definitions
  - `quiz_attempts`: Student attempts
- **Shared Collections**:
  - `users`: User profiles (read)
  - `courses`: Course data (read)

#### 3. User Profiles Service
- **Quiz Reads**: User display name, role
- **Quiz Writes**: (Indirect) Quiz attempts linked to student ID
- **Integration Pattern**: Quiz stores `studentId` and `createdBy` fields referencing user profiles

### Cross-Feature Communication

```
Course Management                    Quiz Feature                    Analytics
      │                                   │                              │
      │  GET /api/courses/:id/materials   │                              │
      │──────────────────────────────────→│                              │
      │                                   │                              │
      │         Course content            │                              │
      │←──────────────────────────────────│                              │
      │                                   │                              │
      │                                   │  Quiz attempt completed      │
      │                                   │─────────────────────────────→│
      │                                   │                              │
      │                                   │  Aggregated statistics       │
      │                                   │←─────────────────────────────│
      │                                   │                              │
```

### Environment Configuration for Integration

| Variable | Purpose | Integration Impact |
|----------|---------|-------------------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase project config | Shared across all features |
| `NEXT_PUBLIC_QUIZ_SERVICE_URL` | External Quiz API URL | Enables microservice extraction |
| `ENABLE_TEST_AUTH` | Test authentication | Required for E2E integration tests |

## Key Components

### 1. AI Flow Service (`src/ai/flows/quiz-generation.ts`)

**Purpose**: Generate quiz questions from course content using AI

**Key Functions**:
- `generateQuiz()`: Main entry point for quiz generation
- Input: Course content, learning objectives, parameters
- Output: Array of quiz questions with answers and explanations

**AI Tools**:
- `validateQuestionQuality`: Ensures generated questions meet quality standards
- `extractKeyTopics`: Identifies main topics from course content

### 2. API Layer (`src/app/api/quizzes/`, `src/app/api/attempts/`)

**Purpose**: REST API endpoints wrapping Firebase services

**Endpoints**:
- `GET /api/quizzes` - List quizzes (with optional filters)
- `POST /api/quizzes` - Create quiz
- `GET /api/quizzes/[id]` - Get quiz by ID
- `PUT /api/quizzes/[id]` - Update quiz
- `DELETE /api/quizzes/[id]` - Delete quiz
- `GET /api/attempts` - List attempts (with optional filters)
- `POST /api/attempts` - Create attempt
- `GET /api/attempts/[id]` - Get attempt by ID
- `PUT /api/attempts/[id]` - Update attempt
- `DELETE /api/attempts/[id]` - Delete attempt

### 3. API Client (`src/lib/quiz-api-client.ts`)

**Purpose**: Client wrapper for API calls with support for external service URL

**Features**:
- Uses `NEXT_PUBLIC_QUIZ_SERVICE_URL` environment variable
- Defaults to local API routes when URL is empty
- Mirrors all Firebase service methods
- Enables future microservice extraction

### 4. Firebase Services (`src/lib/firebase-quiz-service.ts`, `src/lib/firebase-attempt-service.ts`)

**Purpose**: Direct Firestore operations for quiz and attempt data

**Operations**:
- CRUD operations for quizzes
- CRUD operations for attempts
- Query operations with filters (courseId, teacherId, studentId, quizId)

### 5. Frontend Components

#### Teacher Components (`src/app/teacher/quizzes/`)
- `generate/page.tsx`: Quiz generation form and preview
- `page.tsx`: Quiz management and list
- `[quizId]/page.tsx`: Quiz details and analytics
- `[quizId]/results/page.tsx`: Student attempts and results

#### Student Components (`src/app/student/quizzes/`)
- `page.tsx`: Quiz list with filters
- `[quizId]/page.tsx`: Quiz taking interface
- `[quizId]/results/[attemptId]/page.tsx`: Quiz results and review

## Data Flow

### Quiz Generation Flow

```
1. Teacher selects course → 2. Configures quiz parameters → 3. Clicks "Generate"
                                                                      ↓
4. Frontend calls QuizApiClient.add() → 5. API route calls AI flow
                                                                      ↓
6. AI analyzes course content → 7. Generates questions → 8. Validates quality
                                                                      ↓
9. Returns quiz data → 10. Teacher reviews quiz → 11. Teacher saves
                                                                      ↓
12. QuizApiClient.add() → 13. API route → 14. FirebaseQuizService.add()
                                                                      ↓
15. Quiz stored in Firestore
```

### Quiz Taking Flow

```
1. Student browses quizzes → 2. Selects quiz → 3. Clicks "Start Quiz"
                                                                      ↓
4. QuizApiClient.getById() → 5. API route → 6. FirebaseQuizService.getById()
                                                                      ↓
7. Quiz loaded → 8. Student answers questions → 9. Answers saved locally
                                                                      ↓
10. Student submits → 11. QuizApiClient.createAttempt() → 12. Score calculated
                                                                      ↓
13. Attempt saved to Firestore → 14. Results displayed
```

## Firebase Schema

### Collections

**`quizzes` Collection**:
```
/quizzes/{quizId}
{
  id: string
  courseId: string
  title: string
  description: string
  createdBy: string
  createdAt: timestamp
  totalPoints: number
  difficulty: 'easy' | 'medium' | 'hard'
  topics: string[]
  questions: QuizQuestion[]
}
```

**`quiz_attempts` Collection**:
```
/quiz_attempts/{attemptId}
{
  id: string
  quizId: string
  studentId: string
  courseId: string
  startedAt: timestamp
  completedAt: timestamp | null
  status: 'in-progress' | 'completed'
  score: number
  maxScore: number
  answers: QuizAnswer[]
}
```

### Indexes Required

```javascript
// Firestore indexes
quizzes: {
  courseId: "asc",
  createdAt: "desc"
}

quiz_attempts: {
  studentId: "asc",
  completedAt: "desc"
}

quiz_attempts: {
  quizId: "asc",
  completedAt: "desc"
}

quiz_attempts: {
  courseId: "asc",
  studentId: "asc",
  completedAt: "desc"
}
```

## State Management

### Client-Side State (React hooks)

```typescript
// Quiz generation state
const [isGenerating, setIsGenerating] = useState(false);
const [generatedQuiz, setGeneratedQuiz] = useState<Quiz | null>(null);
const [quizParams, setQuizParams] = useState<QuizParams>({...});

// Quiz taking state
const [currentQuestion, setCurrentQuestion] = useState(0);
const [answers, setAnswers] = useState<Record<string, string>>({});
const [isSubmitting, setIsSubmitting] = useState(false);

// Quiz results state
const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
const [showExplanations, setShowExplanations] = useState(false);
```

### Server State (Firebase)

All persistent data is stored in Firestore:
- Real-time listeners for quiz updates
- Optimistic UI updates for better UX
- Error handling and retry logic

## Security Considerations

### Authentication & Authorization

- Only teachers can generate quizzes (role-based access)
- Only course teacher can manage their quizzes (ownership check)
- Students can only access their own attempts (unless teacher viewing)
- API routes validate user authentication and authorization

### Data Validation

- Quiz parameters validated (number of questions, difficulty, etc.)
- Quiz answers validated (question ID, answer format)
- Input sanitization for user-provided content

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Load quiz questions on-demand
2. **Caching**: Cache generated quizzes for 24 hours
3. **Debouncing**: Debounce auto-save during quiz taking
4. **Pagination**: Paginate quiz lists and results
5. **Code Splitting**: Split quiz components into separate chunks

### Expected Performance

- Quiz generation: < 30 seconds for 10 questions
- Quiz loading: < 2 seconds
- Answer submission: < 1 second
- Results calculation: Instant (client-side)

## Microservice Architecture

The Quiz feature is designed for future extraction as a standalone microservice:

1. **API Layer**: REST endpoints in `src/app/api/quizzes/` and `src/app/api/attempts/`
2. **API Client**: `QuizApiClient` with configurable base URL
3. **Service Layer**: Firebase services can be extracted to microservice
4. **Environment Variable**: `NEXT_PUBLIC_QUIZ_SERVICE_URL` enables external service

When extracting to microservice:
- Copy API routes + Firebase services to new service
- Deploy to Cloud Run or similar
- Set `NEXT_PUBLIC_QUIZ_SERVICE_URL` to service URL
- Frontend automatically uses external service

## Error Handling

### Client-Side Errors

```typescript
try {
  const result = await QuizApiClient.add(quizData);
  // Handle success
} catch (error) {
  toast({
    title: "Quiz Creation Failed",
    description: error.message || "Please try again later.",
    variant: "destructive",
  });
}
```

### Server-Side Errors

- API routes catch errors and return appropriate HTTP status codes
- AI flow errors are caught and return user-friendly messages
- Firebase errors are logged and handled gracefully

## Testing Strategy

### Unit Tests
- Test API client methods with mocked fetch
- Test Firebase service methods with mocked Firestore
- Test score calculation logic
- Test error handling

### E2E Tests
- Complete flow from quiz generation to student completion
- Test authentication and authorization
- Test filters and navigation
- Test edge cases

## Deployment

### Local Development
- Run with Firebase emulators
- Use mock data for testing
- Enable test auth for E2E tests

### Production
- Deploy to Firebase Hosting + App Hosting
- Use production Firebase project
- Disable test auth routes
- Configure environment variables
