# Quiz Feature Specification

## Overview

The Quiz feature enables automated generation of personalized quizzes based on course content to assess student understanding and provide immediate feedback. Teachers can generate quizzes from uploaded course materials, and students can take these quizzes to test their knowledge.

## Requirements

### Requirement: Quiz Generation by Teachers

Teachers must be able to generate quizzes automatically from course content using AI.

#### Scenario: Teacher generates quiz with default parameters
- Given a teacher is authenticated and has access to course materials
- When the teacher navigates to the quiz generation page
- And selects a course with available materials
- And enters a quiz title
- And clicks "Generate Quiz with AI"
- Then the system generates quiz questions from the course content
- And displays a preview of the generated quiz
- And the teacher can save the quiz to make it available to students

#### Scenario: Teacher generates quiz with custom parameters
- Given a teacher is on the quiz generation page
- When the teacher selects difficulty level (easy/medium/hard)
- And specifies the number of questions
- And optionally provides specific topics to cover
- And clicks "Generate Quiz with AI"
- Then the system generates questions matching the specified parameters
- And the generated quiz reflects the selected difficulty level
- And the number of questions matches the request (within validation limits)

#### Scenario: Quiz generation includes multiple question types
- Given a teacher generates a quiz
- When the AI generates questions
- Then the quiz includes multiple-choice questions
- And the quiz includes true-false questions
- And the quiz includes short-answer questions
- And each question type is appropriate for the content

#### Scenario: Generated questions include explanations
- Given a quiz has been generated
- When viewing the quiz preview
- Then each question has a correct answer specified
- And each question includes an explanation for why the answer is correct
- And explanations relate to the course material

### Requirement: Quiz Taking by Students

Students must be able to take quizzes and receive immediate feedback.

#### Scenario: Student views available quizzes
- Given a student is authenticated and enrolled in courses
- When the student navigates to the quizzes page
- Then the system displays all available quizzes for enrolled courses
- And quizzes show metadata (difficulty, number of questions, completion status)
- And the student can filter quizzes by course, difficulty, and status

#### Scenario: Student starts a quiz
- Given a student is viewing available quizzes
- When the student clicks "Start Quiz" on an unstarted quiz
- Then the system creates a quiz attempt record
- And displays the first question
- And shows progress (Question X of Y)
- And allows the student to navigate between questions

#### Scenario: Student answers questions
- Given a student is taking a quiz
- When the student selects an answer for a multiple-choice question
- Then the answer is saved
- And the student can change the answer before submission
- When the student answers a true-false question
- Then the answer is saved
- When the student enters text for a short-answer question
- Then the answer is saved

#### Scenario: Student submits quiz
- Given a student has answered some or all questions
- When the student clicks "Submit Quiz"
- Then the system shows a confirmation dialog
- And if confirmed, calculates the score
- And displays results with correct/incorrect answers
- And shows explanations for each question
- And saves the completed attempt

#### Scenario: Student views quiz results
- Given a student has completed a quiz
- When the student views the results page
- Then the system displays the score (X/Y points, percentage)
- And shows which answers were correct and incorrect
- And displays explanations for all questions
- And allows the student to retake the quiz

### Requirement: Quiz Results and Analytics for Teachers

Teachers must be able to view quiz results and analytics for all students.

#### Scenario: Teacher views quiz statistics
- Given a teacher has created quizzes
- When the teacher navigates to quiz management
- Then the system displays statistics for each quiz:
  - Total number of attempts
  - Average score
  - Completion rate
- And statistics are calculated from completed attempts

#### Scenario: Teacher views individual student attempts
- Given a teacher is viewing a specific quiz
- When the teacher navigates to quiz results
- Then the system displays a table of all student attempts
- And shows student name, score, percentage, and completion date
- And allows the teacher to view detailed attempt information

#### Scenario: Teacher identifies challenging questions
- Given a quiz has multiple student attempts
- When the teacher views question performance analytics
- Then the system shows the percentage of students who answered each question correctly
- And highlights questions with low correct answer rates
- And displays the number of correct vs incorrect answers per question

### Requirement: Quiz Data Management

The system must manage quiz data with proper persistence and retrieval.

#### Scenario: Quiz is saved to database
- Given a teacher has generated and reviewed a quiz
- When the teacher clicks "Save Quiz"
- Then the quiz is stored in Firestore with all metadata
- And the quiz is associated with the course
- And the quiz is linked to the teacher who created it
- And the quiz becomes available to students enrolled in the course

#### Scenario: Quiz attempt is tracked
- Given a student starts a quiz
- When the student answers questions
- Then answers are saved to the attempt record
- And the attempt status is set to "in-progress"
- When the student submits the quiz
- Then the attempt status is set to "completed"
- And the score is calculated and saved
- And the completion timestamp is recorded

#### Scenario: Quiz retrieval by filters
- Given quizzes exist in the system
- When querying quizzes by course ID
- Then only quizzes for that course are returned
- When querying quizzes by teacher ID
- Then only quizzes created by that teacher are returned
- When querying attempts by quiz ID
- Then all attempts for that quiz are returned
- When querying attempts by student ID
- Then all attempts by that student are returned

### Requirement: API Layer for Quiz Service

The quiz service must expose REST API endpoints for all operations.

#### Scenario: Quiz CRUD operations via API
- Given the quiz API is available
- When creating a quiz via POST /api/quizzes
- Then the quiz is created and returned with generated ID
- When retrieving a quiz via GET /api/quizzes/[id]
- Then the quiz data is returned
- When updating a quiz via PUT /api/quizzes/[id]
- Then the quiz is updated and returned
- When deleting a quiz via DELETE /api/quizzes/[id]
- Then the quiz is removed from the database

#### Scenario: Attempt operations via API
- Given the attempt API is available
- When creating an attempt via POST /api/attempts
- Then the attempt is created with initial state
- When retrieving attempts via GET /api/attempts?quizId=X
- Then all attempts for that quiz are returned
- When retrieving attempts via GET /api/attempts?studentId=Y
- Then all attempts for that student are returned
- When updating an attempt via PUT /api/attempts/[id]
- Then the attempt is updated (e.g., answers, score, status)

#### Scenario: API supports external service URL
- Given NEXT_PUBLIC_QUIZ_SERVICE_URL environment variable is set
- When the QuizApiClient makes requests
- Then requests are sent to the external service URL
- When NEXT_PUBLIC_QUIZ_SERVICE_URL is empty
- Then requests are sent to local API routes (same server)

## Data Model

### Quiz Type
```typescript
export type Quiz = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  createdBy: string; // teacher user ID
  createdAt: string;
  totalPoints: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[]; // topics covered in this quiz
};
```

### QuizQuestion Type
```typescript
export type QuizQuestion = {
  id: string;
  questionText: string;
  questionType: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[]; // for multiple-choice questions
  correctAnswer: string | string[]; // can be multiple for multi-select
  explanation: string; // explanation of the correct answer
  points: number;
  topic: string;
};
```

### QuizAttempt Type
```typescript
export type QuizAttempt = {
  id: string;
  quizId: string;
  studentId: string;
  courseId: string;
  answers: QuizAnswer[];
  score: number;
  maxScore: number;
  startedAt: string;
  completedAt: string | null;
  status: 'in-progress' | 'completed';
};
```

### QuizAnswer Type
```typescript
export type QuizAnswer = {
  questionId: string;
  studentAnswer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
};
```

## Dependencies

### Internal Dependencies
1. **Content Management**: Requires uploaded course materials to generate quizzes from
2. **Student Profile Manager**: Requires student data to track quiz attempts and scores
3. **Auth/Authorization**: Requires user authentication to ensure teachers can only manage their quizzes

### External Dependencies
1. **Firebase Firestore**: For storing quiz data, attempts, and results
2. **Genkit AI**: For generating quiz questions from course content
3. **Google Generative AI**: For the AI model to analyze content and create questions

## Constraints

1. **Content Availability**: Course materials must be uploaded and available in text/markdown format
2. **AI Quality**: The AI generates questions from course content; quality validation is performed
3. **Single Course Context**: Each quiz is associated with a single course
4. **Immediate Grading**: All questions are auto-graded (no manual grading required)
5. **Open Book**: Quizzes are not time-limited by default (can be added later)
6. **No Proctoring**: No anti-cheating mechanisms in initial version
7. **Firebase Schema**: Quiz data is stored in Firestore collections with appropriate indexes

## Integration

### Application Flow Context

The Quiz feature integrates into the CourseWise platform as a key assessment tool within the learning workflow.

#### Entry Points
- **Teacher Entry**: Teacher Dashboard → Quizzes section → Generate Quiz or Manage Quizzes
- **Student Entry**: Student Dashboard → Quizzes section → Browse available quizzes

#### Prerequisites
- User must be authenticated via Firebase Auth
- User must have completed onboarding (role selection, department, courses)
- For students: Must be enrolled in at least one course to see available quizzes
- For teachers: Must have access to courses with uploaded materials to generate quizzes

#### Exit Points
- Quiz results stored in Firestore (`quiz_attempts` collection)
- Results available for teacher analytics dashboard
- Student attempt history preserved for learning trajectory tracking

### User Journey Positioning

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Student Journey                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  Login → Onboarding → Dashboard → Select Course →                       │
│                                        ↓                                │
│            ┌───────────────────────────┼───────────────────────────┐    │
│            ↓                           ↓                           ↓    │
│     Course Materials           [QUIZ FEATURE]              Socratic Chat│
│            │                    Take Quiz                          │    │
│            │                    View Results                       │    │
│            │                    Review Explanations                │    │
│            └───────────────────────────┼───────────────────────────┘    │
│                                        ↓                                │
│                              Learning Progress                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        Teacher Journey                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  Login → Onboarding → Dashboard → Select Course →                       │
│                                        ↓                                │
│            ┌───────────────────────────┼───────────────────────────┐    │
│            ↓                           ↓                           ↓    │
│     Manage Materials           [QUIZ FEATURE]              View Progress│
│            │                    Generate Quiz                      │    │
│            │                    Preview & Save                     │    │
│            │                    View Analytics                     │    │
│            └───────────────────────────┼───────────────────────────┘    │
│                                        ↓                                │
│                              Student Performance Insights               │
└─────────────────────────────────────────────────────────────────────────┘
```

### Cross-Feature Integration

#### 1. With Authentication & Authorization
- **Dependency**: Quiz requires authenticated users with assigned roles
- **Integration**: Uses `RoleGuardClient` component for route protection
- **Data Flow**: User ID and role from Auth Context → Quiz operations

#### 2. With Course Management
- **Dependency**: Quiz generation requires course materials
- **Integration**: Quiz is associated with a specific course via `courseId`
- **Data Flow**: 
  - Course content → AI Quiz Generation
  - Course ID → Quiz filtering for students/teachers

#### 3. With Student Profiles
- **Dependency**: Tracks quiz attempts per student
- **Integration**: Student ID links attempts to user profile
- **Data Flow**:
  - Student ID → Quiz attempt creation
  - Quiz results → Student learning history
  - Attempt data → Performance analytics

#### 4. With Analytics Dashboard
- **Contribution**: Quiz provides data for teacher insights
- **Data Flow**:
  - Quiz attempts → Aggregated statistics (average scores, completion rates)
  - Per-question performance → Identify challenging topics
  - Student progress → Learning trajectory visualization

#### 5. With Socratic Chat (Future Integration)
- **Potential**: Failed quiz topics could trigger recommended chat sessions
- **Data Flow** (planned):
  - Quiz results (low scores on specific topics) → Recommended topics for Socratic dialogue
  - Chat completion → Suggest quiz retake

### Data Flow Between Features

```
┌─────────────────────┐
│  Course Management  │
│  (Course Materials) │
└─────────┬───────────┘
          │ Course content + learning objectives
          ↓
┌─────────────────────┐
│   Quiz Generation   │
│    (AI Flow)        │
└─────────┬───────────┘
          │ Generated quiz
          ↓
┌─────────────────────┐     ┌─────────────────────┐
│   Quiz Taking       │────→│   Student Profile   │
│   (Student UI)      │     │  (Attempt History)  │
└─────────┬───────────┘     └─────────────────────┘
          │ Completed attempt
          ↓
┌─────────────────────┐     ┌─────────────────────┐
│   Quiz Results      │────→│  Teacher Analytics  │
│   (Scoring)         │     │   (Dashboard)       │
└─────────────────────┘     └─────────────────────┘
```

### Shared Data Stores

| Collection | Used By | Purpose |
|------------|---------|---------|
| `users` | Auth, Quiz | User profiles with role information |
| `courses` | Course Mgmt, Quiz | Course metadata and enrollment |
| `quizzes` | Quiz Feature | Quiz definitions with questions |
| `quiz_attempts` | Quiz Feature, Analytics | Student attempt records |

### API Integration Points

| Endpoint | Consumers | Purpose |
|----------|-----------|---------|
| `GET /api/quizzes?courseId=X` | Student UI, Teacher UI | List quizzes for a course |
| `POST /api/quizzes` | Teacher UI | Create new quiz |
| `GET /api/attempts?studentId=Y` | Student UI | Get student's attempt history |
| `GET /api/attempts?quizId=Z` | Teacher Analytics | Get all attempts for a quiz |
| `POST /api/attempts` | Student UI | Create/update quiz attempt |

### Testing Integration

Quiz feature E2E tests verify integration with:
- **Auth Flow**: Tests require authenticated users (`tests/helpers/auth-helpers.ts`)
- **Role-Based Access**: Teacher vs Student route access
- **Data Persistence**: Quiz and attempt data saved to Firestore
- **Cross-Feature Navigation**: Dashboard → Quiz → Results flow
