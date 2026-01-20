# Integration Documentation

This document describes where the Quiz feature works, how it connects to other features, and integration with the full system model.

---

## 1. Where the Feature Works

### Application Structure

**Frontend**:
- **Teacher Portal**: `/src/app/teacher/quizzes/` - Quiz management, generation, results
- **Student Portal**: `/src/app/student/quizzes/` - Quiz browsing, taking, results review

**Backend**:
- **API Routes**: `/src/app/api/quizzes/`, `/src/app/api/attempts/`
- **AI Flow**: `/src/ai/flows/quiz-generation.ts` - Google Genkit with Gemini
- **Data Services**: `/src/lib/firebase-quiz-service.ts`, `/src/lib/firebase-attempt-service.ts`

**Database**:
- Firestore collections: `/quizzes/{quizId}`, `/quiz_attempts/{attemptId}`

---

## 2. Integration with Other Features

### Course Management
- **Connection**: Quizzes are linked to courses via `courseId`
- **Flow**: Course Creation → Materials Upload → Quiz Generation
- **Data Source**: Quiz generation uses course `materials` and `learningObjectives`

### Authentication & Authorization
- **Connection**: Role-based access via Firebase Auth
- **Teachers**: Can create/manage quizzes (enforced by `createdBy` field)
- **Students**: Can view and take quizzes for enrolled courses
- **Implementation**: `AuthProviderClient` provides auth state, `RoleGuardClient` enforces access

### Course Materials
- **Sources**: File upload, GitHub import, local directory import
- **Usage**: Materials converted to `courseContent` string for AI quiz generation
- **API**: `/api/courses/[courseId]/import-github`, `/api/courses/[courseId]/import-local`

### AI Flows

**Currently Integrated**:
- **Quiz Generation** (`generateQuiz`) - Active, uses course materials

**Future Integration Opportunities**:
- **Personalized Assessment** (`generatePersonalizedAssessment`) - Could use quiz attempt data
- **Socratic Chat** (`socraticCourseChat`) - Could be enriched with quiz performance context

---

## 3. Integration with Full Model

### Current Integration Status

✅ **Fully Integrated**:
- Course Management (quizzes linked to courses)
- Authentication & Authorization
- Course Materials (used for quiz generation)
- Basic Analytics (quiz statistics)

🔄 **Partially Integrated**:
- Student Progress (basic attempt tracking)
- AI Flows (quiz generation active, assessment/chat not connected)

❌ **Not Yet Integrated**:
- Personalized Learning Assessment (AI flow exists but not using quiz data)
- Socratic Course Chat (active but not enriched with quiz performance)
- Learning Trajectories (no time-series analysis)
- Course Recommendations (no quiz-based recommendations)

### Future Integration Vision

**Quiz → Assessment Integration**:
- Use quiz attempts as input for personalized assessments
- Analyze performance data to identify strengths/weaknesses

**Quiz → Socratic Chat Integration**:
- Enrich chat context with quiz performance data
- Proactively address weak areas identified in quizzes

**Quiz → Learning Trajectories**:
- Track performance over time
- Generate adaptive learning paths based on quiz results

**Quiz → Teacher Analytics**:
- Comprehensive analytics dashboard
- Question-level effectiveness analysis
- Student engagement metrics

---

## 4. Data Flow

```
Student Takes Quiz
       ↓
Quiz Attempt Saved
       ↓
Update Statistics → Teacher Dashboard
       ↓
(Future) Feed to Assessment Generator
       ↓
(Future) Enhance Chat Context
       ↓
(Future) Update Learning Trajectories
```

---

## 5. Key Integration Points

- **Shared Data Models**: `QuizAttempt` contains data useful for analytics and future integrations
- **API Endpoints**: `GET /api/attempts?quizId={id}` enables data access for other features
- **Firestore Structure**: Collections organized for efficient querying and future expansion

---

**Document Version**: 1.1 (Simplified)  
**Last Updated**: January 2025
