# Quiz Feature - Design & Implementation Documentation

## Team: RNA

---

## Architecture Overview

The Quiz feature follows a modular microservice architecture pattern, with clear separation between:

1. **AI Generation Service**: Backend AI flow for quiz generation
2. **Frontend Components**: React-based UI for teachers and students
3. **Data Layer**: Type-safe data models and mock data
4. **Firebase Integration**: Cloud Firestore for data persistence

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

---

## Component Structure

### 1. AI Flow Service (`src/ai/flows/quiz-generation.ts`)

**Purpose**: Generate quiz questions from course content using AI

**Key Functions**:
- `generateQuiz()`: Main entry point for quiz generation
- Input: Course content, learning objectives, parameters
- Output: Array of quiz questions with answers and explanations

**AI Prompt Design**:
```
System: You are an expert educational assessment creator specializing in 
generating high-quality quiz questions from course materials.

Task: Generate [N] quiz questions at [DIFFICULTY] level covering [TOPICS].

Requirements:
- Questions must be directly based on provided course content
- Include diverse question types (multiple-choice, true-false, short-answer)
- Provide clear explanations for correct answers
- Align with learning objectives
- Ensure questions test understanding, not just memorization
```

**Tools**:
- `validateQuestionQuality`: Ensures generated questions meet quality standards
- `extractKeyTopics`: Identifies main topics from course content

---

### 2. Data Types (`src/lib/types.ts`)

Extended type definitions to include:
- `Quiz`: Quiz metadata and questions
- `QuizQuestion`: Individual question with options and answers
- `QuizAttempt`: Student's attempt record
- `QuizAnswer`: Individual answer submission
- `QuizStatistics`: Aggregated quiz performance data

---

### 3. Frontend Components

#### Teacher Components (`src/app/teacher/quizzes/`)

**Quiz Generation Page** (`generate/page.tsx`):
- Form to configure quiz parameters
- Course content selector
- Difficulty level picker
- Topic/learning objective selector
- Generate button with loading state
- Preview generated quiz before saving

**Quiz Management Page** (`page.tsx`):
- List all quizzes for teacher's courses
- Edit/delete quiz actions
- View quiz statistics
- See student attempts

**Quiz Results Page** (`[quizId]/results/page.tsx`):
- Detailed analytics for a specific quiz
- Student performance table
- Question difficulty analysis
- Common misconceptions

#### Student Components (`src/app/student/quizzes/`)

**Quiz List Page** (`page.tsx`):
- Display available quizzes by course
- Show quiz metadata (difficulty, # questions, completion status)
- Filter by course, difficulty, completion status

**Quiz Taking Page** (`[quizId]/take/page.tsx`):
- Render questions with appropriate UI for each type
- Track progress (question X of Y)
- Auto-save answers
- Submit button
- Confirmation dialog before submission

**Quiz Results Page** (`[quizId]/results/[attemptId]/page.tsx`):
- Show score and performance
- Display correct/incorrect answers
- Show explanations for each question
- Option to retake quiz

**Quiz History Page** (`history/page.tsx`):
- List all past quiz attempts
- Sort by date, score, course
- Quick view of scores

---

## Data Flow

### Quiz Generation Flow

```
1. Teacher selects course → 2. Configures quiz parameters → 3. Clicks "Generate"
                                                                      ↓
4. Frontend sends request to AI flow ← 5. AI analyzes course content
                                                                      ↓
6. AI generates questions with answers ← 7. Validates question quality
                                                                      ↓
8. Returns quiz data to frontend ← 9. Teacher reviews quiz
                                                                      ↓
10. Teacher saves quiz ← 11. Quiz stored in Firebase Firestore
```

### Quiz Taking Flow

```
1. Student browses available quizzes → 2. Selects a quiz → 3. Starts attempt
                                                                      ↓
4. Quiz attempt record created in Firebase ← 5. Questions loaded
                                                                      ↓
6. Student answers questions ← 7. Answers auto-saved
                                                                      ↓
8. Student submits quiz ← 9. Backend calculates score
                                                                      ↓
10. Results displayed ← 11. Attempt updated in Firebase
```

---

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
  difficulty: string
  topics: string[]
  questions: [
    {
      id: string
      questionText: string
      questionType: string
      options: string[]
      correctAnswer: string | string[]
      explanation: string
      points: number
      topic: string
    }
  ]
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
  status: string
  score: number
  maxScore: number
  answers: [
    {
      questionId: string
      studentAnswer: string | string[]
      isCorrect: boolean
      pointsEarned: number
    }
  ]
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

---

## UI Design

### Design System Compliance

Following CourseWise style guidelines:
- **Primary Color**: Deep indigo (#3F51B5) for headers and CTAs
- **Background**: Light grey (#ECEFF1) for main content areas
- **Accent**: Soft violet (#9575CD) for interactive elements
- **Typography**: 'Inter' font family

### Component Library

Using shadcn/ui components:
- `Card`: Quiz containers
- `Button`: Actions (generate, submit, review)
- `Form`: Quiz configuration
- `RadioGroup`: Multiple choice questions
- `Checkbox`: Multi-select questions
- `Textarea`: Short answer questions
- `Progress`: Quiz completion progress
- `Badge`: Difficulty indicators
- `Table`: Results and statistics
- `Dialog`: Confirmation modals
- `Tabs`: Switching between quiz sections

---

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

---

## API Implementation

### AI Flow API (Server-Side)

```typescript
// src/ai/flows/quiz-generation.ts
export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return quizGenerationFlow(input);
}

const quizGenerationFlow = ai.defineFlow(
  {
    name: 'quizGenerationFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    // 1. Extract key topics from course content
    const topics = await extractKeyTopics({
      courseContent: input.courseContent,
      learningObjectives: input.learningObjectives,
    });

    // 2. Generate questions using AI
    const {output} = await quizPrompt({
      ...input,
      topics: topics.join(', '),
    });

    // 3. Validate question quality
    const validatedQuestions = await Promise.all(
      output!.questions.map(async (q) => {
        const isValid = await validateQuestionQuality({
          question: q,
          courseContent: input.courseContent,
        });
        return isValid ? q : null;
      })
    );

    // 4. Filter out invalid questions
    const validQuestions = validatedQuestions.filter(Boolean);

    return { questions: validQuestions };
  }
);
```

---

## Error Handling

### Client-Side Errors

```typescript
try {
  const result = await generateQuiz(params);
  setGeneratedQuiz(result);
} catch (error) {
  toast({
    title: "Quiz Generation Failed",
    description: error.message || "Please try again later.",
    variant: "destructive",
  });
}
```

### Server-Side Errors

```typescript
// AI flow error handling
try {
  const {output} = await quizPrompt(input);
  return output!;
} catch (error) {
  console.error('Quiz generation error:', error);
  throw new Error('Unable to generate quiz. Please check course content and try again.');
}
```

---

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Load quiz questions on-demand
2. **Caching**: Cache generated quizzes for 24 hours
3. **Debouncing**: Debounce auto-save during quiz taking
4. **Pagination**: Paginate quiz lists and results
5. **Code Splitting**: Split quiz components into separate chunks
6. **Image Optimization**: Use Next.js Image for any visual content

### Expected Performance

- Quiz generation: < 30 seconds for 10 questions
- Quiz loading: < 2 seconds
- Answer submission: < 1 second
- Results calculation: Instant (client-side)

---

## Security Considerations

### Authentication & Authorization

```typescript
// Only teachers can generate quizzes
if (user.role !== 'teacher') {
  throw new Error('Unauthorized: Only teachers can generate quizzes');
}

// Only course teacher can manage their quizzes
if (quiz.createdBy !== user.id) {
  throw new Error('Unauthorized: You can only manage your own quizzes');
}

// Students can only access their own attempts
if (attempt.studentId !== user.id && user.role !== 'teacher') {
  throw new Error('Unauthorized: You can only view your own quiz attempts');
}
```

### Data Validation

```typescript
// Validate quiz parameters
const quizParamsSchema = z.object({
  numberOfQuestions: z.number().min(1).max(50),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  courseId: z.string().min(1),
});

// Validate quiz answers
const quizAnswerSchema = z.object({
  questionId: z.string(),
  studentAnswer: z.union([z.string(), z.array(z.string())]),
});
```

---

## Testing Strategy

### Unit Tests

```typescript
// Test AI flow with mock data
describe('Quiz Generation Flow', () => {
  it('should generate questions from course content', async () => {
    const result = await generateQuiz({
      courseContent: mockCourseContent,
      learningObjectives: mockObjectives,
      numberOfQuestions: 5,
      difficulty: 'medium',
    });
    
    expect(result.questions).toHaveLength(5);
    expect(result.questions[0]).toHaveProperty('questionText');
    expect(result.questions[0]).toHaveProperty('correctAnswer');
  });
});
```

### Integration Tests

```typescript
// Test quiz creation and retrieval
describe('Quiz CRUD Operations', () => {
  it('should create and retrieve a quiz', async () => {
    const quiz = await createQuiz(mockQuizData);
    const retrieved = await getQuiz(quiz.id);
    expect(retrieved).toEqual(quiz);
  });
});
```

### E2E Tests

```typescript
// Test complete flow with mock data
describe('Complete Quiz Flow', () => {
  it('should allow teacher to generate quiz and student to take it', async () => {
    // 1. Teacher generates quiz
    const quiz = await teacherGeneratesQuiz();
    
    // 2. Student starts quiz
    const attempt = await studentStartsQuiz(quiz.id);
    
    // 3. Student answers questions
    await studentAnswersQuestions(attempt.id, mockAnswers);
    
    // 4. Student submits quiz
    const result = await studentSubmitsQuiz(attempt.id);
    
    // 5. Verify score calculation
    expect(result.score).toBeGreaterThan(0);
    expect(result.status).toBe('completed');
  });
});
```

---

## Deployment Checklist

- [ ] All TypeScript types defined
- [ ] AI flow implemented and tested
- [ ] Frontend components implemented
- [ ] Firebase schema created
- [ ] Firestore indexes added
- [ ] Mock data for testing
- [ ] E2E test passing
- [ ] Documentation complete
- [ ] Code reviewed
- [ ] PR created with "Review in Codespace" enabled

---

## Maintenance & Support

### Monitoring

- Track quiz generation success rate
- Monitor AI response times
- Log errors to Firebase Analytics
- Track student completion rates

### Future Improvements

1. **Question Bank**: Store reusable questions
2. **Adaptive Difficulty**: Adjust based on performance
3. **Multimedia Questions**: Support images and videos
4. **Collaborative Quizzes**: Group quiz sessions
5. **Gamification**: Badges and leaderboards

---

## Contact & Support

**Team RNA**
- Feature Owner: RNA Team Lead
- AI Engineer: RNA Backend Developer
- Frontend Engineer: RNA Frontend Developer

For questions or support, please reach out via:
- GitHub Issues: Tag with `feature:quiz` and `team:rna`
- Team Slack: #team-rna channel

