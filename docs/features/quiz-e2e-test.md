# Quiz Feature - End-to-End Test Documentation

## Team: RNA

---

## Overview

This document describes the end-to-end testing approach for the Quiz feature. The tests verify the complete flow from quiz generation by teachers to quiz completion by students using mock data.

---

## Test Environment Setup

### Prerequisites

1. **Development Server Running**: Ensure the Next.js dev server is running
   ```bash
   npm run dev
   ```

2. **Mock Data**: Tests use mock data from `src/lib/mock-data.ts`
   - Pre-configured courses with materials
   - Sample quizzes with questions
   - Student quiz attempts

3. **AI Flow**: Tests use the actual `generateQuiz` AI flow but with mock course content

---

## Test Scenarios

### Scenario 1: Teacher Generates Quiz (Happy Path)

**Goal**: Verify that a teacher can successfully generate a quiz using AI from course content.

**Test Steps**:

1. **Navigate to Quiz Generation**
   - Open browser to `http://localhost:9002/teacher/quizzes/generate`
   - Verify page loads with "Generate Quiz with AI" heading

2. **Configure Quiz Parameters**
   - Select course: "Introduction to Python" (cs101)
   - Enter quiz title: "E2E Test Quiz - Python Basics"
   - Enter description: "Test quiz generated for E2E testing"
   - Set number of questions: 5
   - Set difficulty: "medium"
   - Enter topics: "Variables, Data Types, Syntax"

3. **Generate Quiz**
   - Click "Generate Quiz with AI" button
   - Verify loading state appears (spinner and "Generating Questions..." text)
   - Wait for quiz generation to complete (up to 30 seconds)
   - Verify success toast message appears

4. **Review Generated Questions**
   - Verify preview panel shows 5 questions
   - Verify each question has:
     - Question text
     - Question type (multiple-choice, true-false, or short-answer)
     - Correct answer
     - Explanation
     - Points value
     - Topic label
   - Expand accordion items to review question details

5. **Save Quiz**
   - Click "Save Quiz" button
   - Verify success toast message appears
   - Verify redirect to `/teacher/quizzes` page
   - Verify new quiz appears in the quiz list

**Expected Results**:
- ✅ Quiz generated successfully with 5 questions
- ✅ Questions are relevant to selected topics
- ✅ All questions have required fields populated
- ✅ Quiz saved and appears in teacher's quiz list

**Mock Data Used**:
- Course: cs101 (Introduction to Python)
- Materials: Week 1 & Week 2 content from mock-data.ts

---

### Scenario 2: Student Takes Quiz (Happy Path)

**Goal**: Verify that a student can take a quiz, submit answers, and view results.

**Test Steps**:

1. **Navigate to Quiz List**
   - Open browser to `http://localhost:9002/student/quizzes`
   - Verify page shows available quizzes

2. **Select Quiz**
   - Filter by course: "Introduction to Python"
   - Find quiz: "Python Basics Quiz" (quiz-1 from mock data)
   - Verify quiz card shows:
     - Title, description, difficulty badge
     - Number of questions (4)
     - Total points (10)
     - Estimated time (~8 minutes)
   - Click "Start Quiz" button

3. **Answer Questions**
   - **Question 1** (Multiple Choice):
     - Read question: "What is the correct way to print..."
     - Select answer: "print("Hello, World!")"
     - Click "Next"
   
   - **Question 2** (True/False):
     - Read question about variable declaration
     - Select answer: "False"
     - Click "Next"
   
   - **Question 3** (Multiple Choice):
     - Read question about data types
     - Select answer: "char"
     - Click "Next"
   
   - **Question 4** (Short Answer):
     - Read question about function definition
     - Type answer: "def"
     - Verify "Submit Quiz" button appears

4. **Submit Quiz**
   - Click "Submit Quiz" button
   - Verify confirmation dialog appears
   - Confirm showing 4/4 questions answered
   - Click "Submit" in dialog
   - Verify loading state
   - Verify success toast message

5. **View Results**
   - Verify redirect to results page
   - Verify score display: Shows percentage and points (e.g., 80% - 8/10 pts)
   - Verify performance message (e.g., "Great job!")
   - Verify statistics:
     - Total questions: 4
     - Correct answers count
     - Incorrect answers count
   - Verify question review section

6. **Review Incorrect Answers**
   - Expand accordion for question 3 (if answered incorrectly)
   - Verify displays:
     - Full question text
     - Student's answer (highlighted as incorrect)
     - Correct answer (highlighted)
     - Explanation
   - Verify can review all questions

7. **Retake Quiz Option**
   - Click "Retake Quiz" button
   - Verify redirect to quiz taking page
   - Verify quiz loads fresh (no previous answers)

**Expected Results**:
- ✅ Student can navigate quiz interface smoothly
- ✅ All question types render correctly
- ✅ Answers are saved and submitted successfully
- ✅ Score is calculated correctly
- ✅ Results page shows detailed feedback
- ✅ Student can retake quiz

**Mock Data Used**:
- Quiz: quiz-1 (Python Basics Quiz)
- Student: student-1 (Alex Johnson)
- Expected score: 8/10 (if answering as in mock data)

---

### Scenario 3: Teacher Views Quiz Results (Happy Path)

**Goal**: Verify that a teacher can view detailed quiz statistics and student performance.

**Test Steps**:

1. **Navigate to Quiz Management**
   - Open browser to `http://localhost:9002/teacher/quizzes`
   - Verify quiz list displays

2. **View Quiz Details**
   - Find "Python Basics Quiz"
   - Verify statistics card shows:
     - Total attempts: 1
     - Average score: 80%
     - Completion rate: 100%
   - Click "View Details" button

3. **Review Quiz Detail Page**
   - Verify quiz metadata:
     - Title, difficulty, course name
     - Description and topics
     - Created date
   - Verify statistics overview:
     - Total attempts: 1
     - Average score: 80%
     - Number of questions: 4
     - Total points: 10

4. **Review Question Performance**
   - Verify question performance section shows all 4 questions
   - For each question, verify:
     - Question text preview
     - Points value
     - Correct percentage badge
   - Expand a question to see:
     - Full question text
     - Question type and topic
     - Number of students who answered correctly/incorrectly

5. **Review Student Attempts**
   - Scroll to "Student Attempts" table
   - Verify shows attempt by Alex Johnson
   - Verify columns:
     - Student name
     - Score: 8/10
     - Percentage: 80%
     - Completed date
     - Status: completed

**Expected Results**:
- ✅ Quiz statistics are calculated correctly
- ✅ Question performance data is accurate
- ✅ Student attempts table displays complete information
- ✅ All data matches mock attempt data

**Mock Data Used**:
- Quiz: quiz-1
- Attempt: attempt-1 (student-1, score: 8/10)

---

### Scenario 4: Quiz Filters and Navigation

**Goal**: Verify filtering and navigation features work correctly.

**Test Steps**:

1. **Filter Quizzes (Student View)**
   - Navigate to `/student/quizzes`
   - Use course filter: Select "Introduction to Python"
   - Verify only cs101 quizzes show (quiz-1, quiz-2)
   - Use difficulty filter: Select "easy"
   - Verify only easy quizzes show (quiz-1)
   - Use status filter: Select "completed"
   - Verify only completed quizzes show

2. **Filter Quizzes (Teacher View)**
   - Navigate to `/teacher/quizzes`
   - Use course filter: Select "Data Structures & Algorithms"
   - Verify only cs202 quizzes show (quiz-3)
   - Use difficulty filter: Select "hard"
   - Verify only hard quizzes show (quiz-3)
   - Reset filters to "All"

3. **Quiz Navigation**
   - From student quiz list, click a quiz card
   - Verify navigates to `/student/quizzes/[quizId]`
   - Click "Back to Quizzes" (browser back)
   - Verify returns to quiz list
   - From teacher quiz list, click "View Details"
   - Verify navigates to `/teacher/quizzes/[quizId]`

**Expected Results**:
- ✅ Filters work independently and in combination
- ✅ Navigation buttons work correctly
- ✅ URL routing is correct

---

## Edge Cases & Error Scenarios

### Test: Quiz Generation with Insufficient Content

**Steps**:
1. Try to generate quiz without selecting a course
2. Verify validation error toast appears
3. Try to generate quiz without entering a title
4. Verify validation error toast appears

**Expected**: Form validation prevents submission, shows helpful error messages

---

### Test: Quiz Submission with Unanswered Questions

**Steps**:
1. Start a quiz
2. Answer only 2 out of 4 questions
3. Click "Submit Quiz"
4. Verify warning dialog shows: "You have 2 unanswered question(s)"
5. Confirm submission anyway
6. Verify score calculation accounts for unanswered questions (0 points)

**Expected**: Warning shown, but submission allowed. Score reflects unanswered questions.

---

### Test: Quiz Not Found

**Steps**:
1. Navigate to `/student/quizzes/invalid-quiz-id`
2. Verify "Quiz not found" message
3. Verify "Back to Quizzes" button is displayed
4. Click button, verify navigates to `/student/quizzes`

**Expected**: Graceful error handling with clear messaging

---

## Automated Test Script (Manual Execution)

For developers to run E2E tests manually, follow this checklist:

```markdown
## E2E Test Execution Checklist

### Setup
- [ ] Start dev server: `npm run dev`
- [ ] Verify server running on http://localhost:9002
- [ ] Clear browser cache/cookies (optional for clean state)

### Teacher Flow
- [ ] Navigate to `/teacher/quizzes/generate`
- [ ] Select course, enter title/description
- [ ] Set parameters: 5 questions, medium difficulty
- [ ] Click "Generate Quiz with AI"
- [ ] Wait for generation (verify loading state)
- [ ] Verify 5 questions appear in preview
- [ ] Review question quality (relevant to course)
- [ ] Click "Save Quiz"
- [ ] Verify redirect to `/teacher/quizzes`
- [ ] Verify quiz appears in list

### Student Flow
- [ ] Navigate to `/student/quizzes`
- [ ] Apply filters (course, difficulty)
- [ ] Select "Python Basics Quiz"
- [ ] Click "Start Quiz"
- [ ] Answer all 4 questions
- [ ] Click "Submit Quiz"
- [ ] Confirm submission in dialog
- [ ] Verify results page shows correct score
- [ ] Review explanations for each question
- [ ] Click "Retake Quiz"
- [ ] Verify quiz resets

### Teacher Analytics
- [ ] Navigate to `/teacher/quizzes`
- [ ] Click "View Details" on any quiz
- [ ] Verify statistics (attempts, avg score)
- [ ] Verify question performance section
- [ ] Verify student attempts table
- [ ] Check data accuracy against mock data

### Edge Cases
- [ ] Try generating quiz without course (expect error)
- [ ] Try submitting quiz with unanswered questions (expect warning)
- [ ] Navigate to invalid quiz ID (expect 404 message)
- [ ] Test all filter combinations (student & teacher views)

### ✅ All Tests Passed
- Date: ______________
- Tester: ______________
- Notes: ______________
```

---

## Test Data Reference

### Mock Courses
- **cs101**: Introduction to Python (2 materials)
- **cs202**: Data Structures & Algorithms (2 materials)
- **cs303**: Machine Learning Foundations (2 materials)

### Mock Quizzes
- **quiz-1**: Python Basics Quiz (4 questions, easy, cs101)
- **quiz-2**: Control Flow Mastery (5 questions, medium, cs101)
- **quiz-3**: Arrays and Complexity Analysis (5 questions, hard, cs202)

### Mock Students
- **student-1**: Alex Johnson
- **student-2**: Maria Garcia
- **student-3**: James Smith

### Mock Attempts
- **attempt-1**: student-1 completed quiz-1 (8/10 points)
- **attempt-2**: student-2 in-progress quiz-1
- **attempt-3**: student-3 completed quiz-2 (13/15 points)

---

## Success Criteria

All E2E tests pass when:

1. ✅ Teacher can generate quiz from course content using AI
2. ✅ Generated questions are relevant and well-formatted
3. ✅ Quiz is saved and appears in teacher's quiz list
4. ✅ Student can view, take, and submit quiz
5. ✅ All question types (multiple-choice, true-false, short-answer) work correctly
6. ✅ Score is calculated accurately
7. ✅ Results page shows detailed feedback with explanations
8. ✅ Student can retake quiz
9. ✅ Teacher can view quiz statistics and student performance
10. ✅ Filters work correctly in both student and teacher views
11. ✅ Navigation flows work smoothly
12. ✅ Edge cases handled gracefully with clear error messages
13. ✅ UI follows CourseWise style guidelines (colors, fonts, layout)
14. ✅ All pages are responsive and work on mobile/tablet/desktop

---

## Notes for Reviewers

When reviewing this PR in GitHub Codespaces:

1. **Start the dev server**:
   ```bash
   npm install
   npm run dev
   ```

2. **Open the app** in the preview browser (port 9002)

3. **Follow the test scenarios** listed above

4. **Check the implementation**:
   - AI flow: `src/ai/flows/quiz-generation.ts`
   - Student pages: `src/app/student/quizzes/`
   - Teacher pages: `src/app/teacher/quizzes/`
   - Data types: `src/lib/types.ts`
   - Mock data: `src/lib/mock-data.ts`

5. **Verify style compliance**:
   - Primary color: #3F51B5 (deep indigo)
   - Background: #ECEFF1 (light grey)
   - Accent: #9575CD (soft violet)
   - Font: Inter

6. **Test key interactions**:
   - Quiz generation (may take 15-30 seconds)
   - Quiz taking flow
   - Results viewing
   - Teacher analytics

---

## Known Limitations (MVP)

1. **No Real Firebase Integration**: Currently uses mock data. Production will use Firestore.
2. **No Authentication**: User ID is hard-coded. Production will use Firebase Auth.
3. **No Real-time Updates**: Quiz attempts don't update live. Production can use Firestore listeners.
4. **AI Generation Time**: Takes 15-30 seconds. Consider adding streaming in future.
5. **No Question Editing**: Teachers can't edit generated questions. Future enhancement.

---

## Future Test Enhancements

1. **Automated E2E Tests**: Use Playwright or Cypress for automated browser testing
2. **Unit Tests**: Add Jest tests for AI flow, score calculation, and utilities
3. **Integration Tests**: Test Firebase operations with emulator
4. **Performance Tests**: Measure quiz generation time and page load times
5. **Accessibility Tests**: Ensure WCAG compliance
6. **Mobile Testing**: Test on actual mobile devices

