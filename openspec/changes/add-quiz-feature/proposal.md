# Change: Add AI-Powered Quiz Generation Feature

## Why

Students enrolled in courses need a structured way to self-assess their understanding of course material. Currently, teachers must manually create assessments, which is time-consuming and limits the frequency of feedback students receive. An AI-powered quiz generation system enables:

1. **Automated Assessment Creation**: Teachers can generate quizzes from uploaded course materials with minimal manual effort
2. **Immediate Feedback**: Students receive instant scoring and explanations to reinforce learning
3. **Scalable Personalization**: AI can generate varied questions at different difficulty levels to match student needs
4. **Learning Analytics**: Teachers gain insights into which topics students struggle with most

## What Changes

### New Capabilities

- **AI Quiz Generation**: Genkit flow that analyzes course content and generates quiz questions using Gemini LLM
- **Quiz Management (Teacher)**: Interface to generate, preview, edit, and publish quizzes
- **Quiz Taking (Student)**: Interface to browse available quizzes, answer questions, and submit
- **Results & Analytics**: Score calculation, explanations display, and performance tracking
- **Microservice-Ready API**: REST API layer with abstraction for future service extraction

### Technical Additions

- `src/ai/flows/quiz-generation.ts` - AI flow for question generation
- `src/lib/quiz-api-client.ts` - API client abstraction
- `src/lib/firebase-quiz-service.ts` - Firestore operations for quizzes
- `src/lib/firebase-attempt-service.ts` - Firestore operations for attempts
- `src/app/api/quizzes/` - REST API routes for quiz CRUD
- `src/app/api/attempts/` - REST API routes for attempt CRUD
- `src/app/teacher/quizzes/` - Teacher dashboard pages
- `src/app/student/quizzes/` - Student dashboard pages

## Impact

- **Affected specs**: quiz (new capability)
- **Affected code**: 
  - AI flows: `src/ai/flows/`
  - API layer: `src/app/api/quizzes/`, `src/app/api/attempts/`
  - Services: `src/lib/firebase-*-service.ts`, `src/lib/quiz-api-client.ts`
  - UI: `src/app/teacher/quizzes/`, `src/app/student/quizzes/`
  - Types: `src/lib/types.ts`
- **Database**: New Firestore collections `quizzes` and `quiz_attempts`

---

## LLM Analysis Process

This section documents the collaborative process between LLM-generated content and human refinements during the development of this feature.

### Phase 1: Requirements Elicitation

**LLM Input**: "Design requirements for an educational quiz system that integrates with our course platform"

**LLM Contribution**:
- Basic CRUD operations for quizzes
- Simple question/answer model
- Student submission tracking

**Human Refinements**:
- Added difficulty levels (easy/medium/hard) for adaptive learning
- Added topic extraction and tagging for granular analytics
- Added explanation field for each question to enhance learning feedback
- Added multiple question types (multiple-choice, true-false, short-answer) instead of just multiple-choice
- Specified Gherkin-style scenarios for testable requirements

**Why Better**: The LLM provided a functional baseline, but lacked educational pedagogy considerations. Human expertise added difficulty calibration for adaptive learning and mandatory explanations that transform quizzes from pure assessment into learning opportunities.

### Phase 2: Architecture Design

**LLM Input**: "Design a microservice architecture for quiz generation in Next.js with Firebase"

**LLM Contribution**:
- Suggested monolithic approach with direct Firestore calls from components
- Basic API route structure

**Human Refinements**:
- Introduced `QuizApiClient` abstraction layer that supports both local and external service URLs
- Added `NEXT_PUBLIC_QUIZ_SERVICE_URL` environment variable for future microservice extraction
- Separated Firebase services (`firebase-quiz-service.ts`, `firebase-attempt-service.ts`) from API client
- Designed clear data flow: UI → API Client → API Routes → Firebase Services → Firestore

**Why Better**: LLM's monolithic suggestion would have created tight coupling. The abstraction layer enables the quiz feature to be extracted as a standalone microservice without changing frontend code - a critical requirement for scalability.

### Phase 3: Data Model Design

**LLM Input**: "Design Firestore schema for quizzes and student attempts"

**LLM Contribution**:
```typescript
// LLM suggested basic structure
type Quiz = {
  id: string;
  title: string;
  questions: Question[];
  createdBy: string;
};
```

**Human Refinements**:
```typescript
// Human-refined structure
type Quiz = {
  id: string;
  courseId: string;           // Added: Link to course
  title: string;
  description: string;        // Added: Quiz description
  questions: QuizQuestion[];
  createdBy: string;
  createdAt: string;          // Added: Timestamp
  totalPoints: number;        // Added: Pre-calculated
  difficulty: 'easy' | 'medium' | 'hard';  // Added: Difficulty enum
  topics: string[];           // Added: Topic tagging
};

type QuizQuestion = {
  // ... plus explanation field, topic field, points per question
};
```

**Why Better**: LLM's minimal schema lacked crucial fields for:
- Course association (required for filtering and access control)
- Difficulty levels (required for adaptive learning)
- Topics array (required for analytics on student weak areas)
- Explanation field (required for learning feedback)

### Phase 4: Prompt Engineering

**LLM Input**: Initial prompt for generating quiz questions from course content

**LLM Contribution**:
- Generic instruction to "generate quiz questions from the text"
- Basic JSON output format

**Human Refinements**:
1. **Course material injection**: Added `{{courseContent}}` and `{{learningObjectives}}` template variables
2. **Difficulty calibration**: Added specific guidance for easy/medium/hard:
   - Easy: Focus on definitions, basic concepts, and recall
   - Medium: Require understanding and application
   - Hard: Require analysis, synthesis, and critical thinking
3. **Question type distribution**: Specified ~60% multiple-choice, ~20% true-false, ~20% short-answer
4. **Quality requirements**: 
   - "Questions MUST be directly based on the provided course content"
   - "Avoid ambiguous or trick questions"
   - "Make all answer options plausible but clearly distinguishable"
5. **Validation layer**: Added `validateQuestionQuality()` function to filter out low-quality generated questions

**Why Better**: Initial LLM prompts produced generic questions that could apply to any subject. Human refinements ensure questions are grounded in actual course material, follow pedagogical best practices, and maintain consistent quality through post-generation validation.

### Phase 5: Security & Authorization

**LLM Input**: "Add authentication to quiz API routes"

**LLM Contribution**:
- Basic auth check (is user logged in?)

**Human Refinements**:
- Role-based access control (teachers can only manage their own quizzes)
- Course enrollment verification for students
- Firestore security rules for data isolation
- Ownership checks before update/delete operations
- Test-only routes disabled in production (`ENABLE_TEST_AUTH`)

**Why Better**: LLM's authentication check was necessary but insufficient. Production systems require authorization (who can do what), not just authentication (who are you). Human expertise added the principle of least privilege.

---

## Comparison Summary

| Aspect | LLM Contribution | Human Addition | Improvement Rationale |
|--------|------------------|----------------|----------------------|
| Question types | Multiple-choice only | + true-false, + short-answer | More comprehensive assessment coverage |
| Explanations | Not included | Mandatory explanation field | Transforms quiz into learning tool |
| Difficulty | Single level | 3-level system with calibration | Enables adaptive learning paths |
| Topics | Not tracked | Topic extraction and tagging | Enables per-topic performance analytics |
| Architecture | Monolithic | API client abstraction layer | Future microservice extraction ready |
| Data model | Minimal fields | Rich metadata (course, difficulty, topics, timestamps) | Supports filtering, analytics, access control |
| Prompt | Generic question generation | Course-grounded with validation | Higher quality, relevant questions |
| Security | Auth check only | Role-based authorization + Firestore rules | Production-ready access control |

## Lessons Learned

1. **LLM excels at scaffolding**: Generated boilerplate code, API patterns, and basic structures quickly
2. **Domain expertise required**: Educational pedagogy (difficulty levels, explanations) needed human input
3. **Security requires human oversight**: LLM suggestions were functional but not production-secure
4. **Iterative refinement works best**: Starting with LLM output and refining produced better results than either alone
5. **Validation is essential**: Post-processing LLM-generated content (like question quality validation) ensures consistent output quality
