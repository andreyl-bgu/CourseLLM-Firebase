# Quiz Feature - Component Specification

This document provides detailed specifications for all React components in the Quiz feature.

## Component Hierarchy

```
Quiz Feature Components
├── Teacher Components
│   ├── TeacherQuizzesPage (Quiz management list)
│   ├── GenerateQuizPage (Quiz generation with AI)
│   ├── QuizDetailsPage (Quiz details and analytics)
│   └── QuizResultsPage (Student results for a quiz)
│
└── Student Components
    ├── StudentQuizzesPage (Available quizzes list)
    ├── TakeQuizPage (Quiz taking interface)
    └── QuizResultsPage (Individual attempt results)
```

---

## Teacher Components

### TeacherQuizzesPage

**File:** `src/app/teacher/quizzes/page.tsx`

**Type:** Page Component (Next.js App Router)

**Route:** `/teacher/quizzes`

**Access:** Teacher role required

**Purpose:** Displays all quizzes created by the teacher with management options.

**Features:**
- List all teacher's quizzes
- Filter by course and difficulty
- View quiz statistics (attempts, average score)
- Delete quizzes
- Navigate to quiz details and generation

**State:**

| State | Type | Initial | Description |
|-------|------|---------|-------------|
| `selectedCourse` | `string` | `'all'` | Course filter |
| `selectedDifficulty` | `string` | `'all'` | Difficulty filter |
| `allQuizzes` | `Quiz[]` | `[]` | All teacher's quizzes |
| `allAttempts` | `QuizAttempt[]` | `[]` | All attempts for teacher's quizzes |
| `teacherCourses` | `Course[]` | `[]` | Teacher's courses |
| `isLoading` | `boolean` | `true` | Loading state |
| `deleteDialogOpen` | `boolean` | `false` | Delete confirmation dialog |
| `quizToDelete` | `Quiz \| null` | `null` | Quiz pending deletion |
| `isDeleting` | `boolean` | `false` | Deletion in progress |

**Key Functions:**

| Function | Description |
|----------|-------------|
| `fetchData()` | Fetches quizzes, courses, and attempts from API |
| `handleDeleteQuiz(quiz)` | Opens delete confirmation dialog |
| `confirmDelete()` | Confirms and executes quiz deletion |
| `getQuizStats(quizId)` | Calculates statistics for a quiz |

**Dependencies:**
- `QuizApiClient` - API client for quiz operations
- `useAuth` - Firebase authentication context

**UI Components Used:**
- `Card`, `CardHeader`, `CardContent` - Quiz cards
- `Table`, `TableRow`, `TableCell` - Quiz list table
- `Badge` - Difficulty and status badges
- `Select` - Filter dropdowns
- `AlertDialog` - Delete confirmation
- `Button` - Actions

---

### GenerateQuizPage

**File:** `src/app/teacher/quizzes/generate/page.tsx`

**Type:** Page Component (Next.js App Router)

**Route:** `/teacher/quizzes/generate`

**Access:** Teacher role required

**Purpose:** Allows teachers to generate AI-powered quizzes from course content.

**Features:**
- Select course to generate quiz from
- Configure quiz parameters (title, questions, difficulty)
- AI-powered question generation
- Preview generated questions
- Edit questions before saving
- Save quiz to database

**State:**

| State | Type | Initial | Description |
|-------|------|---------|-------------|
| `courses` | `Course[]` | `[]` | Available courses |
| `isLoadingCourses` | `boolean` | `true` | Courses loading state |
| `selectedCourse` | `string` | `''` | Selected course ID |
| `quizTitle` | `string` | `''` | Quiz title input |
| `quizDescription` | `string` | `''` | Quiz description input |
| `numberOfQuestions` | `number` | `5` | Questions to generate |
| `difficulty` | `'easy' \| 'medium' \| 'hard'` | `'medium'` | Difficulty level |
| `topics` | `string` | `''` | Optional topics (comma-separated) |
| `isGenerating` | `boolean` | `false` | Generation in progress |
| `generatedQuestions` | `QuizQuestion[]` | `[]` | Generated questions |
| `showPreview` | `boolean` | `false` | Show preview mode |

**Key Functions:**

| Function | Description |
|----------|-------------|
| `fetchCourses()` | Loads teacher's courses |
| `handleGenerate()` | Calls AI API to generate questions |
| `handleSave()` | Saves quiz to Firestore |
| `getCourseContent(courseId)` | Extracts content from course materials |

**API Calls:**
- `GET /api/courses?teacherId={uid}` - Fetch courses
- `POST /api/quizzes/generate` - Generate questions with AI
- `POST /api/quizzes` - Save quiz

**UI Components Used:**
- `Card` - Form container and preview
- `Input`, `Textarea` - Form inputs
- `Select` - Course and difficulty selection
- `Button` - Generate and Save actions
- `Accordion` - Question preview
- `Badge` - Question type and topic badges

---

### QuizDetailsPage

**File:** `src/app/teacher/quizzes/[quizId]/page.tsx`

**Type:** Page Component (Next.js App Router)

**Route:** `/teacher/quizzes/[quizId]`

**Access:** Teacher role required (quiz owner)

**Purpose:** Displays quiz details, questions, and summary statistics.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `quizId` | `string` | Quiz ID from URL |

**State:**

| State | Type | Initial | Description |
|-------|------|---------|-------------|
| `quiz` | `Quiz \| null` | `null` | Quiz data |
| `attempts` | `QuizAttempt[]` | `[]` | All attempts for this quiz |
| `isLoading` | `boolean` | `true` | Loading state |

**Key Functions:**

| Function | Description |
|----------|-------------|
| `fetchQuizData()` | Loads quiz and attempts |
| `calculateStats()` | Computes quiz statistics |

---

### QuizResultsPage (Teacher)

**File:** `src/app/teacher/quizzes/[quizId]/results/page.tsx`

**Type:** Page Component (Next.js App Router)

**Route:** `/teacher/quizzes/[quizId]/results`

**Access:** Teacher role required (quiz owner)

**Purpose:** Displays detailed student results and per-question analytics.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `quizId` | `string` | Quiz ID from URL |

**Features:**
- Student attempt list with scores
- Per-question success rates
- Identify challenging questions
- Export capabilities (future)

**State:**

| State | Type | Initial | Description |
|-------|------|---------|-------------|
| `quiz` | `Quiz \| null` | `null` | Quiz data |
| `attempts` | `QuizAttempt[]` | `[]` | All student attempts |
| `questionStats` | `QuestionStats[]` | `[]` | Per-question statistics |
| `isLoading` | `boolean` | `true` | Loading state |

---

## Student Components

### StudentQuizzesPage

**File:** `src/app/student/quizzes/page.tsx`

**Type:** Page Component (Next.js App Router)

**Route:** `/student/quizzes`

**Access:** Student role required

**Purpose:** Displays available quizzes for the student to take.

**Features:**
- List available quizzes
- Filter by course, difficulty, completion status
- Show quiz metadata (questions, points, difficulty)
- Navigate to take quiz or view results

**State:**

| State | Type | Initial | Description |
|-------|------|---------|-------------|
| `selectedCourse` | `string` | `'all'` | Course filter |
| `selectedDifficulty` | `string` | `'all'` | Difficulty filter |
| `selectedStatus` | `string` | `'all'` | Completion status filter |
| `quizzes` | `Quiz[]` | `[]` | All available quizzes |
| `studentAttempts` | `QuizAttempt[]` | `[]` | Student's attempt history |
| `isLoading` | `boolean` | `true` | Loading state |

**Key Functions:**

| Function | Description |
|----------|-------------|
| `fetchData()` | Loads quizzes and student attempts |
| `getQuizStatus(quizId)` | Returns completion status for a quiz |
| `getBestScore(quizId)` | Returns best score from attempts |

**Filter Logic:**
- Course filter: `quiz.courseId === selectedCourse`
- Difficulty filter: `quiz.difficulty === selectedDifficulty`
- Status filter: Check if completed attempt exists

**UI Components Used:**
- `Card` - Quiz cards
- `Badge` - Difficulty and completion badges
- `Select` - Filter dropdowns
- `Progress` - Score display
- `Button` - Take quiz / View results

---

### TakeQuizPage

**File:** `src/app/student/quizzes/[quizId]/page.tsx`

**Type:** Page Component (Next.js App Router)

**Route:** `/student/quizzes/[quizId]`

**Access:** Student role required

**Purpose:** Interactive quiz-taking interface.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `quizId` | `string` | Quiz ID from URL |

**Features:**
- Display questions one at a time
- Support multiple question types
- Progress indicator
- Answer persistence (auto-save)
- Submit confirmation dialog
- Score calculation on submit

**State:**

| State | Type | Initial | Description |
|-------|------|---------|-------------|
| `quiz` | `Quiz \| null` | `null` | Quiz data |
| `isLoading` | `boolean` | `true` | Loading state |
| `currentQuestionIndex` | `number` | `0` | Current question (0-indexed) |
| `answers` | `Record<string, string>` | `{}` | Student answers by question ID |
| `showSubmitDialog` | `boolean` | `false` | Submit confirmation dialog |
| `isSubmitting` | `boolean` | `false` | Submission in progress |

**Key Functions:**

| Function | Description |
|----------|-------------|
| `fetchQuiz()` | Loads quiz and restores in-progress attempt |
| `handleAnswerChange(questionId, answer)` | Updates answer for a question |
| `handlePrevious()` | Navigate to previous question |
| `handleNext()` | Navigate to next question |
| `handleSubmit()` | Opens submit confirmation dialog |
| `confirmSubmit()` | Calculates score and creates attempt |

**Question Type Rendering:**

| Type | UI Component | Description |
|------|--------------|-------------|
| `multiple-choice` | `RadioGroup` | Radio buttons for options |
| `true-false` | `RadioGroup` | Two radio buttons (True/False) |
| `short-answer` | `Textarea` | Text input field |

**Score Calculation:**
```typescript
// For each question
const isCorrect = studentAnswer.toLowerCase() === correctAnswer.toLowerCase();
const pointsEarned = isCorrect ? question.points : 0;
```

**UI Components Used:**
- `Card` - Question container
- `RadioGroup`, `RadioGroupItem` - Multiple choice / True-false
- `Textarea` - Short answer
- `Progress` - Quiz progress bar
- `Button` - Navigation and submit
- `AlertDialog` - Submit confirmation
- `Badge` - Question metadata

---

### QuizResultsPage (Student)

**File:** `src/app/student/quizzes/[quizId]/results/[attemptId]/page.tsx`

**Type:** Page Component (Next.js App Router)

**Route:** `/student/quizzes/[quizId]/results/[attemptId]`

**Access:** Student role required (attempt owner)

**Purpose:** Displays quiz results with correct answers and explanations.

**Route Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `quizId` | `string` | Quiz ID from URL |
| `attemptId` | `string` | Attempt ID from URL |

**Features:**
- Display final score and percentage
- Show each question with student's answer
- Indicate correct/incorrect answers
- Display explanations for all questions
- Option to retake quiz

**State:**

| State | Type | Initial | Description |
|-------|------|---------|-------------|
| `quiz` | `Quiz \| null` | `null` | Quiz data |
| `attempt` | `QuizAttempt \| null` | `null` | Student's attempt |
| `isLoading` | `boolean` | `true` | Loading state |

**Key Functions:**

| Function | Description |
|----------|-------------|
| `fetchData()` | Loads quiz and attempt data |
| `getAnswerForQuestion(questionId)` | Gets student's answer for a question |
| `isAnswerCorrect(questionId)` | Checks if answer is correct |

**UI Components Used:**
- `Card` - Score summary and question cards
- `Badge` - Correct/incorrect indicators
- `Progress` - Score visualization
- `Button` - Retake quiz action

---

## Shared UI Components

The Quiz feature uses the following shared UI components from `src/components/ui/`:

| Component | Usage |
|-----------|-------|
| `Card`, `CardHeader`, `CardContent`, `CardTitle`, `CardDescription` | Container components |
| `Button` | Actions and navigation |
| `Badge` | Labels and status indicators |
| `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` | Dropdown filters |
| `Input` | Text inputs |
| `Textarea` | Multi-line text inputs |
| `Label` | Form labels |
| `RadioGroup`, `RadioGroupItem` | Radio button groups |
| `Progress` | Progress bars |
| `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` | Data tables |
| `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle` | Confirmation dialogs |
| `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` | Collapsible sections |
| `Separator` | Visual dividers |

---

## Hooks Used

### useAuth

**Source:** `src/components/AuthProviderClient.tsx`

**Returns:**
```typescript
{
  firebaseUser: User | null;  // Firebase auth user
  role: 'student' | 'teacher' | null;
  isLoading: boolean;
}
```

**Usage:** All quiz components use this to get the current user ID for API calls.

### useParams

**Source:** `next/navigation`

**Usage:** Extract route parameters (quizId, attemptId).

### useRouter

**Source:** `next/navigation`

**Usage:** Programmatic navigation after actions (submit quiz, delete).

### useToast

**Source:** `src/hooks/use-toast.ts`

**Usage:** Display success/error notifications.

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Component Data Flow                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐                     ┌──────────────┐              │
│  │   useAuth    │───── firebaseUser ──│  Component   │              │
│  └──────────────┘                     │    State     │              │
│                                       └──────┬───────┘              │
│                                              │                       │
│                                     useEffect (fetch)                │
│                                              │                       │
│                                              ▼                       │
│                                    ┌──────────────────┐              │
│                                    │  QuizApiClient   │              │
│                                    └────────┬─────────┘              │
│                                             │                        │
│                                      fetch() calls                   │
│                                             │                        │
│                                             ▼                        │
│                                    ┌──────────────────┐              │
│                                    │   /api/quizzes   │              │
│                                    │   /api/attempts  │              │
│                                    └────────┬─────────┘              │
│                                             │                        │
│                                             ▼                        │
│                                    ┌──────────────────┐              │
│                                    │    Firestore     │              │
│                                    └──────────────────┘              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Styling Guidelines

All components follow the CourseWise design system:

**Colors:**
- Primary: Deep Indigo (#3F51B5) - Headers, CTAs
- Background: Light Grey (#ECEFF1) - Main content
- Accent: Soft Violet (#9575CD) - Interactive elements
- Success: Green - Correct answers
- Error: Red - Incorrect answers

**Typography:**
- Font: Inter (system fallback: sans-serif)
- Hierarchy: h1 (4xl), h2 (3xl), h3 (2xl), h4 (xl)

**Spacing:**
- Consistent padding/margin using Tailwind classes
- Card padding: `p-4` or `p-6`
- Section gaps: `space-y-4` or `gap-4`
