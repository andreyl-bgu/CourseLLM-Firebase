# Architecture Specification

This document provides a concise specification of the most important components in the CourseLLM codebase.

---

## Backend API Functions

### Courses API (`/src/app/api/courses/route.ts`)

#### `GET /api/courses?teacherId={id}`
List courses (filtered by teacher if `teacherId` provided, all courses otherwise).

#### `POST /api/courses`
Create a new course.
- **Body**: `{ teacherId, title, description, materials, learningObjectives, ... }`

#### `PUT /api/courses`
Update an existing course.
- **Body**: `{ teacherId, courseId, updates }`

---

### Quizzes API (`/src/app/api/quizzes/route.ts`)

#### `GET /api/quizzes?courseId={id}&teacherId={id}`
List quizzes (filtered by course or teacher).

#### `POST /api/quizzes`
Create a new quiz.
- **Body**: `{ courseId, title, questions, createdBy, difficulty, ... }`

#### `POST /api/quizzes/generate`
Generate quiz questions using AI.
- **Body**: `{ courseContent, learningObjectives, numberOfQuestions, difficulty, topics? }`
- **Returns**: `{ questions: QuizQuestion[] }`

#### `GET /api/quizzes/[id]`
Get quiz by ID.

#### `PUT /api/quizzes/[id]` / `DELETE /api/quizzes/[id]`
Update or delete quiz.

---

### Quiz Attempts API (`/src/app/api/attempts/route.ts`)

#### `GET /api/attempts?quizId={id}&studentId={id}`
List quiz attempts (filtered by quiz and/or student).

#### `POST /api/attempts`
Create/submit a quiz attempt.
- **Body**: `{ quizId, studentId, courseId, answers, score, maxScore, status }`

#### `GET /api/attempts/[id]`
Get attempt by ID.

---

### Course Materials Import API

#### `POST /api/courses/[courseId]/import-github`
Import materials from GitHub repository.
- **Body**: `{ teacherId, githubUrl }`

#### `POST /api/courses/[courseId]/import-local`
Import materials from local directory.
- **Body**: `{ teacherId, directoryPath }`

---

## Service Layer Functions

### FirebaseQuizService (`/src/lib/firebase-quiz-service.ts`)

- `getAll()` - Get all quizzes
- `getById(id)` - Get quiz by ID
- `getByCourse(courseId)` - Get quizzes for a course
- `getByTeacher(teacherId)` - Get quizzes by teacher
- `add(quiz)` - Create quiz
- `update(id, updates)` - Update quiz
- `delete(id)` - Delete quiz

### FirebaseAttemptService (`/src/lib/firebase-attempt-service.ts`)

- `getByQuiz(quizId)` - Get all attempts for a quiz
- `getByStudent(studentId)` - Get all attempts by student
- `getStudentAttempt(quizId, studentId)` - Get specific student's attempt
- `create(attempt)` - Create attempt
- `update(id, updates)` - Update attempt

### FirebaseCourseService (`/src/lib/firebase-course-service.ts`)

- `getByTeacher(teacherId)` - Get courses for teacher
- `getAll()` - Get all courses (for students)
- `getById(teacherId, courseId)` - Get course by ID
- `add(teacherId, course)` - Create course
- `update(teacherId, courseId, updates)` - Update course

### QuizApiClient (`/src/lib/quiz-api-client.ts`)

Client wrapper for all quiz/attempt API calls. Supports external microservice via `NEXT_PUBLIC_QUIZ_SERVICE_URL`.
- All methods mirror `FirebaseQuizService` and `FirebaseAttemptService`
- Examples: `getAll()`, `getById(id)`, `getByCourse(courseId)`, `createAttempt(attempt)`, etc.

---

## AI Flow Functions

### `generateQuiz(input)` (`/src/ai/flows/quiz-generation.ts`)
Generate quiz questions using Google Genkit (Gemini 2.5 Flash).

**Input**:
```typescript
{
  courseContent: string;
  learningObjectives: string;
  numberOfQuestions: number; // 1-50
  difficulty: 'easy' | 'medium' | 'hard';
  topics?: string[];
}
```

**Output**: `{ questions: QuizQuestion[] }` with explanations and answers.

---

### `socraticCourseChat(input)` (`/src/ai/flows/socratic-course-chat.ts`)
Provide Socratic-style tutoring responses to student questions.

**Input**:
```typescript
{
  courseMaterial: string;
  studentQuestion: string;
}
```

**Output**: `{ response: string }`

---

### `generatePersonalizedAssessment(input)` (`/src/ai/flows/personalized-learning-assessment.ts`)
Generate personalized assessment based on student learning path.

**Input**:
```typescript
{
  studentLearningPath: string;
  courseContent: string;
  studentQuestionsAndAnswers: string;
  learningObjectives: string;
}
```

**Output**: `{ assessment: string, suggestedAreasForImprovement: string }`

---

## Frontend React Components

### Authentication & Layout

- **`AuthProviderClient`** (`/src/components/AuthProviderClient.tsx`)
  - Provides `useAuth()` hook with `firebaseUser`, `profile`, `loading`
  
- **`RoleGuardClient`** (`/src/components/RoleGuardClient.tsx`)
  - Restricts access by role (`allowedRoles` prop)

- **`InnerAppShellClient`** (`/src/components/InnerAppShellClient.tsx`)
  - App shell with sidebar navigation for authenticated users

---

### Teacher Components

- **`TeacherQuizzesPage`** (`/src/app/teacher/quizzes/page.tsx`)
  - Lists all quizzes with statistics (attempts, average score)

- **`TeacherQuizGeneratePage`** (`/src/app/teacher/quizzes/generate/page.tsx`)
  - Quiz generation interface with AI integration

- **`TeacherQuizResultsPage`** (`/src/app/teacher/quizzes/[quizId]/results/page.tsx`)
  - View all student attempts for a quiz

- **`TeacherCoursesPage`** (`/src/app/teacher/courses/page.tsx`)
  - Course management and creation

- **`CourseManagementClient`** (`/src/app/teacher/courses/[courseId]/_components/course-management-client.tsx`)
  - Manage course materials (upload files, import from GitHub/local)

---

### Student Components

- **`StudentQuizzesPage`** (`/src/app/student/quizzes/page.tsx`)
  - Browse available quizzes

- **`StudentQuizTakingPage`** (`/src/app/student/quizzes/[quizId]/page.tsx`)
  - Interactive quiz-taking interface with answer saving

- **`StudentQuizResultsPage`** (`/src/app/student/quizzes/[quizId]/results/[attemptId]/page.tsx`)
  - Review quiz results with explanations

- **`StudentCoursesPage`** (`/src/app/student/courses/page.tsx`)
  - Browse all available courses

- **`ChatPanel`** (`/src/app/student/courses/[courseId]/_components/chat-panel.tsx`)
  - Socratic chat interface for course questions

---

## Core Data Types

### `Course`
```typescript
{
  id: string;
  title: string;
  description: string;
  materials: Material[];
  learningObjectives: string;
  // ...
}
```

### `Quiz`
```typescript
{
  id: string;
  courseId: string;
  title: string;
  questions: QuizQuestion[];
  createdBy: string; // teacher ID
  difficulty: 'easy' | 'medium' | 'hard';
  // ...
}
```

### `QuizQuestion`
```typescript
{
  id: string;
  questionText: string;
  questionType: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
  topic: string;
}
```

### `QuizAttempt`
```typescript
{
  id: string;
  quizId: string;
  studentId: string;
  courseId: string;
  answers: QuizAnswer[];
  score: number;
  maxScore: number;
  status: 'in-progress' | 'completed';
  startedAt: string;
  completedAt: string | null;
}
```

---

## Key Architecture Notes

- **Server vs Client**: Services detect environment (`typeof window === 'undefined'`) and use Admin SDK on server, Client SDK on client
- **Data Flow**: `React Component → QuizApiClient → API Route → Firebase Service → Firestore`
- **Error Handling**: API routes return HTTP status codes, components display errors via toasts

---

**Document Version**: 1.1 (Simplified)  
**Last Updated**: January 2025
