# Quiz Feature - Route Documentation

This document provides comprehensive documentation of all routes (frontend pages and API endpoints) for the Quiz feature.

## Route Overview

The Quiz feature exposes two types of routes:
1. **Frontend Routes** - Next.js App Router pages for user interaction
2. **API Routes** - REST endpoints for data operations

---

## Frontend Routes

### Teacher Routes

| Route | Component | Description | Access |
|-------|-----------|-------------|--------|
| `/teacher/quizzes` | `page.tsx` | Quiz management list | Teacher |
| `/teacher/quizzes/generate` | `generate/page.tsx` | Generate new quiz with AI | Teacher |
| `/teacher/quizzes/[quizId]` | `[quizId]/page.tsx` | Quiz details and statistics | Teacher (owner) |
| `/teacher/quizzes/[quizId]/results` | `[quizId]/results/page.tsx` | Student results for quiz | Teacher (owner) |

### Student Routes

| Route | Component | Description | Access |
|-------|-----------|-------------|--------|
| `/student/quizzes` | `page.tsx` | Available quizzes list | Student |
| `/student/quizzes/[quizId]` | `[quizId]/page.tsx` | Take quiz | Student |
| `/student/quizzes/[quizId]/results/[attemptId]` | `[quizId]/results/[attemptId]/page.tsx` | View attempt results | Student (owner) |

---

## Frontend Route Details

### /teacher/quizzes

**File:** `src/app/teacher/quizzes/page.tsx`

**Purpose:** Main quiz management dashboard for teachers

**Authentication:** Required (Teacher role)

**Features:**
- View all quizzes created by the teacher
- Filter by course and difficulty
- See quiz statistics (attempts, average score)
- Delete quizzes
- Navigate to generate new quiz
- Navigate to quiz details

**Navigation:**
- From: Teacher Dashboard sidebar
- To: 
  - `/teacher/quizzes/generate` (Generate Quiz button)
  - `/teacher/quizzes/[quizId]` (View Details link)
  - `/teacher/quizzes/[quizId]/results` (View Results link)

---

### /teacher/quizzes/generate

**File:** `src/app/teacher/quizzes/generate/page.tsx`

**Purpose:** AI-powered quiz generation interface

**Authentication:** Required (Teacher role)

**URL Parameters:** None

**Features:**
- Select course to generate quiz from
- Configure quiz parameters
- Generate questions using AI
- Preview generated questions
- Save quiz to database

**Form Fields:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Course | Select | Yes | Must select a course |
| Title | Text | Yes | Min 1 character |
| Description | Textarea | No | - |
| Number of Questions | Number | Yes | 1-50 |
| Difficulty | Select | Yes | easy/medium/hard |
| Topics | Text | No | Comma-separated |

**Navigation:**
- From: `/teacher/quizzes` (Generate Quiz button)
- To: `/teacher/quizzes` (after save)

---

### /teacher/quizzes/[quizId]

**File:** `src/app/teacher/quizzes/[quizId]/page.tsx`

**Purpose:** Quiz details and summary statistics

**Authentication:** Required (Teacher role, quiz owner)

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `quizId` | string | Unique quiz identifier |

**Features:**
- View quiz metadata (title, description, difficulty)
- View all questions with answers
- See summary statistics
- Navigate to detailed results

**Navigation:**
- From: `/teacher/quizzes` (View Details)
- To: `/teacher/quizzes/[quizId]/results` (View All Results)

---

### /teacher/quizzes/[quizId]/results

**File:** `src/app/teacher/quizzes/[quizId]/results/page.tsx`

**Purpose:** Detailed student results and analytics

**Authentication:** Required (Teacher role, quiz owner)

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `quizId` | string | Unique quiz identifier |

**Features:**
- View all student attempts
- See per-question performance statistics
- Identify challenging questions
- Sort and filter attempts

**Data Displayed:**
- Student name, score, percentage, completion date
- Per-question correct/incorrect counts
- Average score and completion rate

**Navigation:**
- From: `/teacher/quizzes/[quizId]` (View All Results)
- To: Individual student attempt details (future)

---

### /student/quizzes

**File:** `src/app/student/quizzes/page.tsx`

**Purpose:** Browse available quizzes

**Authentication:** Required (Student role)

**Features:**
- View quizzes for enrolled courses
- Filter by course, difficulty, completion status
- See quiz metadata (questions, points, difficulty)
- View completion status and best score
- Start new quiz or view past results

**Filters:**
| Filter | Options |
|--------|---------|
| Course | All / Specific course |
| Difficulty | All / Easy / Medium / Hard |
| Status | All / Completed / Not Started |

**Navigation:**
- From: Student Dashboard sidebar
- To:
  - `/student/quizzes/[quizId]` (Start Quiz)
  - `/student/quizzes/[quizId]/results/[attemptId]` (View Results)

---

### /student/quizzes/[quizId]

**File:** `src/app/student/quizzes/[quizId]/page.tsx`

**Purpose:** Quiz taking interface

**Authentication:** Required (Student role)

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `quizId` | string | Unique quiz identifier |

**Features:**
- Display questions one at a time
- Support multiple question types
- Track progress
- Auto-restore in-progress attempts
- Submit quiz with confirmation

**Question Navigation:**
- Previous/Next buttons
- Progress indicator (Question X of Y)
- Direct submit option

**Navigation:**
- From: `/student/quizzes` (Start Quiz)
- To: `/student/quizzes/[quizId]/results/[attemptId]` (after submit)

---

### /student/quizzes/[quizId]/results/[attemptId]

**File:** `src/app/student/quizzes/[quizId]/results/[attemptId]/page.tsx`

**Purpose:** View quiz attempt results

**Authentication:** Required (Student role, attempt owner)

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `quizId` | string | Unique quiz identifier |
| `attemptId` | string | Unique attempt identifier |

**Features:**
- Display final score and percentage
- Show all questions with student answers
- Indicate correct/incorrect answers
- Display explanations
- Option to retake quiz

**Navigation:**
- From: 
  - `/student/quizzes/[quizId]` (after submit)
  - `/student/quizzes` (View Results)
- To: `/student/quizzes/[quizId]` (Retake Quiz)

---

## API Routes

### Quiz API Routes

| Method | Route | Handler | Description |
|--------|-------|---------|-------------|
| GET | `/api/quizzes` | `route.ts` | List quizzes with filters |
| POST | `/api/quizzes` | `route.ts` | Create new quiz |
| GET | `/api/quizzes/[id]` | `[id]/route.ts` | Get quiz by ID |
| PUT | `/api/quizzes/[id]` | `[id]/route.ts` | Update quiz |
| DELETE | `/api/quizzes/[id]` | `[id]/route.ts` | Delete quiz |
| POST | `/api/quizzes/generate` | `generate/route.ts` | Generate quiz with AI |

### Attempt API Routes

| Method | Route | Handler | Description |
|--------|-------|---------|-------------|
| GET | `/api/attempts` | `route.ts` | List attempts with filters |
| POST | `/api/attempts` | `route.ts` | Create new attempt |
| GET | `/api/attempts/[id]` | `[id]/route.ts` | Get attempt by ID |
| PUT | `/api/attempts/[id]` | `[id]/route.ts` | Update attempt |
| DELETE | `/api/attempts/[id]` | `[id]/route.ts` | Delete attempt |

---

## API Route Details

### GET /api/quizzes

**File:** `src/app/api/quizzes/route.ts`

**Query Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `courseId` | No | Filter by course |
| `teacherId` | No | Filter by teacher |

**Returns:** `Quiz[]`

---

### POST /api/quizzes

**File:** `src/app/api/quizzes/route.ts`

**Request Body:** `QuizCreate` object

**Returns:** `Quiz` (201 Created)

---

### GET /api/quizzes/[id]

**File:** `src/app/api/quizzes/[id]/route.ts`

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | Quiz ID |

**Returns:** `Quiz` or 404

---

### PUT /api/quizzes/[id]

**File:** `src/app/api/quizzes/[id]/route.ts`

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | Quiz ID |

**Request Body:** Partial `Quiz` object

**Returns:** Updated `Quiz`

---

### DELETE /api/quizzes/[id]

**File:** `src/app/api/quizzes/[id]/route.ts`

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | Quiz ID |

**Returns:** 204 No Content

---

### POST /api/quizzes/generate

**File:** `src/app/api/quizzes/generate/route.ts`

**Request Body:**
```json
{
  "courseContent": "string",
  "learningObjectives": "string",
  "numberOfQuestions": 5,
  "difficulty": "medium",
  "topics": ["optional"]
}
```

**Returns:** `{ questions: QuizQuestion[] }`

---

### GET /api/attempts

**File:** `src/app/api/attempts/route.ts`

**Query Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `quizId` | One required | Filter by quiz |
| `studentId` | One required | Filter by student |

**Returns:** `QuizAttempt[]`

---

### POST /api/attempts

**File:** `src/app/api/attempts/route.ts`

**Request Body:** `QuizAttemptCreate` object

**Returns:** `QuizAttempt` (201 Created)

---

### GET /api/attempts/[id]

**File:** `src/app/api/attempts/[id]/route.ts`

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | Attempt ID |

**Returns:** `QuizAttempt` or 404

---

### PUT /api/attempts/[id]

**File:** `src/app/api/attempts/[id]/route.ts`

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | Attempt ID |

**Request Body:** Partial `QuizAttempt` object

**Returns:** Updated `QuizAttempt`

---

### DELETE /api/attempts/[id]

**File:** `src/app/api/attempts/[id]/route.ts`

**Path Parameters:**
| Parameter | Description |
|-----------|-------------|
| `id` | Attempt ID |

**Returns:** 204 No Content

---

## Navigation Flow Diagrams

### Teacher Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Teacher Navigation Flow                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────┐                                               │
│   │ Teacher         │                                               │
│   │ Dashboard       │                                               │
│   └────────┬────────┘                                               │
│            │ Sidebar "Quizzes"                                       │
│            ▼                                                         │
│   ┌─────────────────┐                                               │
│   │ /teacher/quizzes│◄─────────────────────────────────────┐        │
│   │ (Quiz List)     │                                      │        │
│   └────────┬────────┘                                      │        │
│            │                                               │        │
│     ┌──────┴──────┐                                        │        │
│     │             │                                        │        │
│     ▼             ▼                                        │        │
│  ┌──────────┐  ┌──────────────────┐                        │        │
│  │ Generate │  │ /teacher/quizzes │                        │        │
│  │ Quiz     │  │ /[quizId]        │                        │        │
│  │ Button   │  │ (Quiz Details)   │                        │        │
│  └────┬─────┘  └────────┬─────────┘                        │        │
│       │                 │                                  │        │
│       ▼                 ▼                                  │        │
│  ┌──────────────────┐  ┌──────────────────┐               │        │
│  │ /teacher/quizzes │  │ /teacher/quizzes │               │        │
│  │ /generate        │  │ /[quizId]/results│───────────────┘        │
│  │ (Generate Quiz)  │  │ (Student Results)│                        │
│  └────────┬─────────┘  └──────────────────┘                        │
│           │                                                         │
│           │ Save Quiz                                               │
│           └─────────────────────────────────────────────────────────┘
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Student Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Student Navigation Flow                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────┐                                               │
│   │ Student         │                                               │
│   │ Dashboard       │                                               │
│   └────────┬────────┘                                               │
│            │ Sidebar "Quizzes"                                       │
│            ▼                                                         │
│   ┌─────────────────┐                                               │
│   │ /student/quizzes│◄──────────────────────────────────────┐       │
│   │ (Quiz List)     │                                       │       │
│   └────────┬────────┘                                       │       │
│            │                                                │       │
│     ┌──────┴──────────┐                                     │       │
│     │                 │                                     │       │
│     ▼                 ▼                                     │       │
│  ┌──────────┐  ┌─────────────────────────────────┐          │       │
│  │ Start    │  │ View Results                     │         │       │
│  │ Quiz     │  │ (completed quiz)                │          │       │
│  └────┬─────┘  └────────┬────────────────────────┘          │       │
│       │                 │                                   │       │
│       ▼                 │                                   │       │
│  ┌──────────────────┐   │                                   │       │
│  │ /student/quizzes │   │                                   │       │
│  │ /[quizId]        │   │                                   │       │
│  │ (Take Quiz)      │   │                                   │       │
│  └────────┬─────────┘   │                                   │       │
│           │             │                                   │       │
│           │ Submit      │                                   │       │
│           ▼             │                                   │       │
│  ┌──────────────────────┴───────────┐                       │       │
│  │ /student/quizzes/[quizId]/       │                       │       │
│  │ results/[attemptId]              │───────────────────────┘       │
│  │ (Quiz Results)                   │  Retake Quiz                  │
│  └──────────────────────────────────┘                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Access Control Summary

| Route Pattern | Required Role | Additional Check |
|---------------|---------------|------------------|
| `/teacher/quizzes/**` | Teacher | - |
| `/teacher/quizzes/[quizId]/**` | Teacher | Quiz owner check |
| `/student/quizzes` | Student | - |
| `/student/quizzes/[quizId]` | Student | Course enrollment |
| `/student/quizzes/[quizId]/results/[attemptId]` | Student | Attempt owner check |

**Note:** Access control is currently implemented at the component level using the `useAuth` hook. Components check the user's role and redirect if unauthorized.

---

## File Structure

```
src/app/
├── api/
│   ├── quizzes/
│   │   ├── route.ts              # GET (list), POST (create)
│   │   ├── [id]/
│   │   │   └── route.ts          # GET, PUT, DELETE by ID
│   │   └── generate/
│   │       └── route.ts          # POST (AI generation)
│   └── attempts/
│       ├── route.ts              # GET (list), POST (create)
│       └── [id]/
│           └── route.ts          # GET, PUT, DELETE by ID
│
├── teacher/
│   └── quizzes/
│       ├── page.tsx              # Quiz management list
│       ├── generate/
│       │   └── page.tsx          # Generate quiz
│       └── [quizId]/
│           ├── page.tsx          # Quiz details
│           └── results/
│               └── page.tsx      # Student results
│
└── student/
    └── quizzes/
        ├── page.tsx              # Available quizzes
        └── [quizId]/
            ├── page.tsx          # Take quiz
            └── results/
                └── [attemptId]/
                    └── page.tsx  # View results
```
