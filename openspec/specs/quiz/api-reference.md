# Quiz Feature - API Reference

This document provides comprehensive API documentation for all Quiz feature endpoints.

## Base URL

- **Local Development**: `http://localhost:9002`
- **Production**: Configured via environment
- **External Service**: Set `NEXT_PUBLIC_QUIZ_SERVICE_URL` for microservice deployment

## Authentication

All endpoints require Firebase Authentication. Include the Firebase ID token in requests:

```
Authorization: Bearer <firebase-id-token>
```

**Note**: In the current implementation, authentication is handled at the application level. API routes expect the user context to be established by the Next.js middleware.

---

## Quiz Endpoints

### GET /api/quizzes

List all quizzes with optional filters.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `courseId` | string | No | Filter by course ID |
| `teacherId` | string | No | Filter by teacher (creator) ID |

**Response (200 OK):**

```json
[
  {
    "id": "quiz-abc123",
    "courseId": "course-xyz",
    "title": "Python Basics Quiz",
    "description": "Test your knowledge of Python fundamentals",
    "questions": [...],
    "createdBy": "teacher-uid-123",
    "createdAt": "2026-01-21T10:30:00Z",
    "totalPoints": 50,
    "difficulty": "medium",
    "topics": ["variables", "loops", "functions"]
  }
]
```

**Error Responses:**

| Code | Description |
|------|-------------|
| 500 | Failed to fetch quizzes |

---

### POST /api/quizzes

Create a new quiz.

**Request Headers:**

| Header | Value | Required |
|--------|-------|----------|
| Content-Type | application/json | Yes |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `courseId` | string | Yes | Associated course ID |
| `title` | string | Yes | Quiz title |
| `description` | string | No | Quiz description |
| `questions` | QuizQuestion[] | Yes | Array of quiz questions |
| `createdBy` | string | Yes | Teacher user ID |
| `totalPoints` | number | Yes | Total points possible |
| `difficulty` | string | Yes | `easy`, `medium`, or `hard` |
| `topics` | string[] | No | Topics covered |

**QuizQuestion Object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique question ID |
| `questionText` | string | Yes | The question text |
| `questionType` | string | Yes | `multiple-choice`, `true-false`, or `short-answer` |
| `options` | string[] | For MC | Answer options (multiple-choice only) |
| `correctAnswer` | string or string[] | Yes | Correct answer(s) |
| `explanation` | string | Yes | Explanation for the answer |
| `points` | number | Yes | Points for this question |
| `topic` | string | Yes | Topic this question covers |

**Example Request:**

```json
{
  "courseId": "course-xyz",
  "title": "Python Basics Quiz",
  "description": "Test your Python fundamentals",
  "createdBy": "teacher-uid-123",
  "totalPoints": 20,
  "difficulty": "medium",
  "topics": ["variables", "loops"],
  "questions": [
    {
      "id": "q1",
      "questionText": "What is the output of print(2 + 2)?",
      "questionType": "multiple-choice",
      "options": ["2", "4", "22", "Error"],
      "correctAnswer": "4",
      "explanation": "The + operator performs addition on integers, so 2 + 2 = 4",
      "points": 5,
      "topic": "variables"
    },
    {
      "id": "q2",
      "questionText": "Python is a compiled language.",
      "questionType": "true-false",
      "correctAnswer": "false",
      "explanation": "Python is an interpreted language, not compiled.",
      "points": 5,
      "topic": "basics"
    }
  ]
}
```

**Response (201 Created):**

```json
{
  "id": "quiz-abc123",
  "courseId": "course-xyz",
  "title": "Python Basics Quiz",
  "description": "Test your Python fundamentals",
  "createdBy": "teacher-uid-123",
  "createdAt": "2026-01-21T10:30:00Z",
  "totalPoints": 20,
  "difficulty": "medium",
  "topics": ["variables", "loops"],
  "questions": [...]
}
```

**Error Responses:**

| Code | Description | Response Body |
|------|-------------|---------------|
| 500 | Failed to create quiz | `{ "error": "Failed to create quiz", "message": "...", "code": "..." }` |

---

### GET /api/quizzes/[id]

Get a specific quiz by ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Quiz ID |

**Response (200 OK):**

```json
{
  "id": "quiz-abc123",
  "courseId": "course-xyz",
  "title": "Python Basics Quiz",
  "description": "Test your Python fundamentals",
  "questions": [...],
  "createdBy": "teacher-uid-123",
  "createdAt": "2026-01-21T10:30:00Z",
  "totalPoints": 50,
  "difficulty": "medium",
  "topics": ["variables", "loops"]
}
```

**Error Responses:**

| Code | Description |
|------|-------------|
| 404 | Quiz not found |
| 500 | Failed to fetch quiz |

---

### PUT /api/quizzes/[id]

Update an existing quiz.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Quiz ID |

**Request Body:**

Partial Quiz object with fields to update.

```json
{
  "title": "Updated Quiz Title",
  "difficulty": "hard"
}
```

**Response (200 OK):**

Returns the updated Quiz object.

**Error Responses:**

| Code | Description |
|------|-------------|
| 500 | Failed to update quiz |

---

### DELETE /api/quizzes/[id]

Delete a quiz.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Quiz ID |

**Response (204 No Content):**

Empty response on success.

**Error Responses:**

| Code | Description |
|------|-------------|
| 500 | Failed to delete quiz |

---

### POST /api/quizzes/generate

Generate quiz questions using AI.

**Request Headers:**

| Header | Value | Required |
|--------|-------|----------|
| Content-Type | application/json | Yes |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `courseContent` | string | Yes | Course material text to generate questions from |
| `learningObjectives` | string | Yes | Learning objectives for the quiz |
| `numberOfQuestions` | number | Yes | Number of questions to generate (1-50) |
| `difficulty` | string | Yes | `easy`, `medium`, or `hard` |
| `topics` | string[] | No | Specific topics to focus on |

**Example Request:**

```json
{
  "courseContent": "Python is a high-level programming language...",
  "learningObjectives": "Students will understand Python basics including variables, data types, and control flow.",
  "numberOfQuestions": 5,
  "difficulty": "medium",
  "topics": ["variables", "data types"]
}
```

**Response (200 OK):**

```json
{
  "questions": [
    {
      "id": "q1",
      "questionText": "Which of the following is NOT a valid Python data type?",
      "questionType": "multiple-choice",
      "options": ["int", "str", "char", "float"],
      "correctAnswer": "char",
      "explanation": "Python does not have a 'char' data type. Single characters are represented as strings of length 1.",
      "points": 3,
      "topic": "data types"
    }
  ]
}
```

**Error Responses:**

| Code | Description | Response Body |
|------|-------------|---------------|
| 400 | Missing required fields | `{ "error": "Missing required fields: courseContent, learningObjectives, numberOfQuestions, difficulty" }` |
| 500 | Failed to generate quiz | `{ "error": "Failed to generate quiz", "message": "..." }` |

**Performance Notes:**

- Generation typically takes 15-30 seconds for 5-10 questions
- Larger content may take longer
- Questions are validated for quality before being returned

---

## Attempt Endpoints

### GET /api/attempts

List quiz attempts with filters.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `quizId` | string | One required | Filter by quiz ID |
| `studentId` | string | One required | Filter by student ID |

**Note**: At least one of `quizId` or `studentId` must be provided.

**Response (200 OK):**

```json
[
  {
    "id": "attempt-xyz789",
    "quizId": "quiz-abc123",
    "studentId": "student-uid-456",
    "courseId": "course-xyz",
    "answers": [...],
    "score": 45,
    "maxScore": 50,
    "startedAt": "2026-01-21T11:00:00Z",
    "completedAt": "2026-01-21T11:15:00Z",
    "status": "completed"
  }
]
```

**Error Responses:**

| Code | Description |
|------|-------------|
| 400 | quizId or studentId query parameter required |
| 500 | Failed to fetch attempts |

---

### POST /api/attempts

Create a new quiz attempt.

**Request Headers:**

| Header | Value | Required |
|--------|-------|----------|
| Content-Type | application/json | Yes |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `quizId` | string | Yes | Quiz being attempted |
| `studentId` | string | Yes | Student user ID |
| `courseId` | string | Yes | Course ID |
| `answers` | QuizAnswer[] | No | Initial answers (usually empty) |
| `score` | number | No | Current score (usually 0) |
| `maxScore` | number | Yes | Maximum possible score |
| `status` | string | Yes | `in-progress` or `completed` |

**QuizAnswer Object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `questionId` | string | Yes | Question ID |
| `studentAnswer` | string or string[] | Yes | Student's answer |
| `isCorrect` | boolean | Yes | Whether answer is correct |
| `pointsEarned` | number | Yes | Points earned for this answer |

**Example Request:**

```json
{
  "quizId": "quiz-abc123",
  "studentId": "student-uid-456",
  "courseId": "course-xyz",
  "answers": [],
  "score": 0,
  "maxScore": 50,
  "status": "in-progress"
}
```

**Response (201 Created):**

```json
{
  "id": "attempt-xyz789",
  "quizId": "quiz-abc123",
  "studentId": "student-uid-456",
  "courseId": "course-xyz",
  "answers": [],
  "score": 0,
  "maxScore": 50,
  "startedAt": "2026-01-21T11:00:00Z",
  "completedAt": null,
  "status": "in-progress"
}
```

**Error Responses:**

| Code | Description |
|------|-------------|
| 500 | Failed to create attempt |

---

### GET /api/attempts/[id]

Get a specific attempt by ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Attempt ID |

**Response (200 OK):**

```json
{
  "id": "attempt-xyz789",
  "quizId": "quiz-abc123",
  "studentId": "student-uid-456",
  "courseId": "course-xyz",
  "answers": [
    {
      "questionId": "q1",
      "studentAnswer": "4",
      "isCorrect": true,
      "pointsEarned": 5
    }
  ],
  "score": 45,
  "maxScore": 50,
  "startedAt": "2026-01-21T11:00:00Z",
  "completedAt": "2026-01-21T11:15:00Z",
  "status": "completed"
}
```

**Error Responses:**

| Code | Description |
|------|-------------|
| 404 | Attempt not found |
| 500 | Failed to fetch attempt |

---

### PUT /api/attempts/[id]

Update an attempt (e.g., submit answers, complete quiz).

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Attempt ID |

**Request Body:**

Partial QuizAttempt object with fields to update.

```json
{
  "answers": [
    {
      "questionId": "q1",
      "studentAnswer": "4",
      "isCorrect": true,
      "pointsEarned": 5
    }
  ],
  "score": 45,
  "completedAt": "2026-01-21T11:15:00Z",
  "status": "completed"
}
```

**Response (200 OK):**

Returns the updated QuizAttempt object.

**Error Responses:**

| Code | Description |
|------|-------------|
| 500 | Failed to update attempt |

---

### DELETE /api/attempts/[id]

Delete an attempt.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Attempt ID |

**Response (204 No Content):**

Empty response on success.

**Error Responses:**

| Code | Description |
|------|-------------|
| 500 | Failed to delete attempt |

---

## Data Types Reference

### Quiz

```typescript
type Quiz = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  createdBy: string;
  createdAt: string;  // ISO 8601 timestamp
  totalPoints: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
};
```

### QuizQuestion

```typescript
type QuizQuestion = {
  id: string;
  questionText: string;
  questionType: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];  // Required for multiple-choice
  correctAnswer: string | string[];
  explanation: string;
  points: number;
  topic: string;
};
```

### QuizAttempt

```typescript
type QuizAttempt = {
  id: string;
  quizId: string;
  studentId: string;
  courseId: string;
  answers: QuizAnswer[];
  score: number;
  maxScore: number;
  startedAt: string;   // ISO 8601 timestamp
  completedAt: string | null;
  status: 'in-progress' | 'completed';
};
```

### QuizAnswer

```typescript
type QuizAnswer = {
  questionId: string;
  studentAnswer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
};
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Brief error description",
  "message": "Detailed error message (optional)",
  "code": "ERROR_CODE (optional)"
}
```

## Rate Limiting

Currently, no rate limiting is implemented. For production deployment, consider adding rate limits especially for the AI generation endpoint.

## Versioning

This API does not currently use versioning. All endpoints are served from the root `/api/` path.
