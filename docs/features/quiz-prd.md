# Quiz Feature - Product Requirements Document (PRD)

## Team: RNA

## Feature Overview

The Quiz feature enables automated generation of personalized quizzes based on course content to assess student understanding and provide immediate feedback. Teachers can generate quizzes from uploaded course materials, and students can take these quizzes to test their knowledge.

---

## User Stories

### Teacher Stories
1. **As a teacher**, I want to generate quizzes automatically from course content so that I can assess student understanding without manually creating questions.
2. **As a teacher**, I want to view quiz results for all students so that I can identify who needs additional support.
3. **As a teacher**, I want to customize quiz parameters (difficulty, number of questions, topics) so that I can target specific learning objectives.

### Student Stories
1. **As a student**, I want to take quizzes on course topics so that I can assess my understanding of the material.
2. **As a student**, I want to receive immediate feedback on my quiz answers so that I can learn from my mistakes.
3. **As a student**, I want to see my quiz history so that I can track my progress over time.

---

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

---

## Acceptance Criteria

### Quiz Generation (Teacher)
- [ ] Teacher can generate a quiz from course material via AI
- [ ] Teacher can specify quiz parameters: difficulty level, number of questions, topics to cover
- [ ] Generated quiz includes multiple question types (multiple-choice, true-false, short-answer)
- [ ] Each question includes an explanation for the correct answer
- [ ] Quiz is automatically saved to the course

### Quiz Taking (Student)
- [ ] Student can view available quizzes for their enrolled courses
- [ ] Student can start a quiz and see questions one at a time or all at once (configurable)
- [ ] Student can submit answers and receive immediate feedback
- [ ] Student can see their score and correct answers after completion
- [ ] Student can review explanations for each question

### Quiz Results (Teacher)
- [ ] Teacher can view all quiz attempts for a specific quiz
- [ ] Teacher can see aggregated statistics (average score, completion rate)
- [ ] Teacher can identify questions that were commonly answered incorrectly
- [ ] Teacher can view individual student attempts and scores

### Quiz History (Student)
- [ ] Student can view their quiz attempt history
- [ ] Student can see scores and dates for all past attempts
- [ ] Student can retake quizzes (configurable by teacher)

---

## API Endpoints

### Backend AI Flow
```typescript
// Generate quiz from course content
generateQuiz(input: {
  courseContent: string;
  learningObjectives: string;
  numberOfQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topics?: string[];
}): Promise<{
  questions: QuizQuestion[];
}>;
```

### Frontend API (Server Actions)
```typescript
// Create a new quiz
POST /api/quizzes
Body: { courseId, title, description, questions, difficulty, topics }

// Get all quizzes for a course
GET /api/courses/:courseId/quizzes

// Get a specific quiz
GET /api/quizzes/:quizId

// Start a quiz attempt
POST /api/quizzes/:quizId/attempts
Body: { studentId }

// Submit quiz answers
PUT /api/quizzes/attempts/:attemptId
Body: { answers: QuizAnswer[] }

// Get quiz attempts for a student
GET /api/students/:studentId/quiz-attempts

// Get quiz attempts for a quiz (teacher view)
GET /api/quizzes/:quizId/attempts
```

---

## Dependencies

### Internal Dependencies
1. **Content Management**: Requires uploaded course materials to generate quizzes from
2. **Student Profile Manager**: Requires student data to track quiz attempts and scores
3. **Auth/Authorization**: Requires user authentication to ensure teachers can only manage their quizzes

### External Dependencies
1. **Firebase Firestore**: For storing quiz data, attempts, and results
2. **Genkit AI**: For generating quiz questions from course content
3. **Google Generative AI**: For the AI model to analyze content and create questions

---

## Assumptions

1. **Content Availability**: Course materials are already uploaded and available in text/markdown format
2. **AI Quality**: The AI can generate meaningful questions from course content without hallucinating
3. **Single Course Context**: Each quiz is associated with a single course
4. **Immediate Grading**: All questions are auto-graded (no manual grading required)
5. **Open Book**: Quizzes are not time-limited by default (can be added later)
6. **No Proctoring**: No anti-cheating mechanisms in initial version
7. **Firebase Schema**: Quiz data will be stored in Firestore collections with appropriate indexes

---

## Technical Architecture

### Microservice Approach
The Quiz feature is implemented as a modular microservice with:

1. **AI Flow Service** (`src/ai/flows/quiz-generation.ts`): Handles quiz generation using Genkit
2. **Frontend Components** (`src/app/student/quizzes/`, `src/app/teacher/quizzes/`): React components for UI
3. **Data Layer** (`src/lib/types.ts`): Type definitions for Quiz domain
4. **Mock Data** (`src/lib/mock-data.ts`): Test data for development and E2E testing

### Data Flow
```
Teacher → Generate Quiz UI → AI Quiz Generation Flow → Firebase Firestore
                                                              ↓
Student → Quiz List → Take Quiz UI → Submit Answers → Firebase Firestore
                                                              ↓
                                                        Score Calculation
                                                              ↓
                                                        Results Display
```

---

## Future Enhancements (Out of Scope for MVP)

1. **Adaptive Difficulty**: Adjust quiz difficulty based on student performance
2. **Question Bank**: Reuse questions across multiple quizzes
3. **Timed Quizzes**: Add time limits for quiz completion
4. **Question Randomization**: Randomize question order and options
5. **Peer Review**: Allow students to create quiz questions
6. **Analytics Dashboard**: Advanced analytics on quiz performance
7. **Export Results**: Export quiz results to CSV/PDF

---

## Success Metrics

1. **Usage**: 80% of teachers generate at least one quiz per course
2. **Engagement**: Students complete 70% of available quizzes
3. **Quality**: Generated questions have 90% relevance to course content (teacher feedback)
4. **Performance**: Quiz generation completes in < 30 seconds
5. **Reliability**: Quiz submission success rate > 99%

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| AI generates irrelevant questions | High | Implement review step for teachers before publishing |
| Poor question quality | Medium | Add feedback mechanism for teachers to report issues |
| Slow generation time | Low | Use streaming responses, show progress indicator |
| Data loss on submission | High | Implement auto-save for quiz attempts |
| Cheating/sharing answers | Medium | Add disclaimer, implement question pools in future |

---

## Development Timeline

- **Week 1**: PRD finalization, data model, AI flow implementation
- **Week 2**: Teacher UI (quiz generation and management)
- **Week 3**: Student UI (quiz taking and results)
- **Week 4**: Testing, bug fixes, documentation, PR submission

---

## Testing Strategy

1. **Unit Tests**: Test AI flow with various course content inputs
2. **Integration Tests**: Test quiz CRUD operations with Firebase
3. **E2E Tests**: Complete flow from quiz generation to student completion with mock data
4. **Manual Testing**: Teacher and student personas testing all user stories

---

## Documentation Deliverables

- [x] PRD (this document)
- [ ] Design documentation (architecture diagrams, component tree)
- [ ] API documentation (endpoints, request/response formats)
- [ ] User guide (how to generate and take quizzes)
- [ ] Developer guide (how to extend/modify the feature)

