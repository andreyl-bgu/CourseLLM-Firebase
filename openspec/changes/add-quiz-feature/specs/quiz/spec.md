# Quiz Feature - Delta Specification

This delta spec documents the new Quiz capability added to the CourseWise platform.

## ADDED Requirements

### Requirement: Quiz Generation by Teachers

Teachers MUST be able to generate quizzes automatically from course content using AI.

#### Scenario: Teacher generates quiz with default parameters
- **GIVEN** a teacher is authenticated and has access to course materials
- **WHEN** the teacher navigates to the quiz generation page
- **AND** selects a course with available materials
- **AND** enters a quiz title
- **AND** clicks "Generate Quiz with AI"
- **THEN** the system generates quiz questions from the course content
- **AND** displays a preview of the generated quiz
- **AND** the teacher can save the quiz to make it available to students

#### Scenario: Teacher generates quiz with custom parameters
- **GIVEN** a teacher is on the quiz generation page
- **WHEN** the teacher selects difficulty level (easy/medium/hard)
- **AND** specifies the number of questions
- **AND** optionally provides specific topics to cover
- **AND** clicks "Generate Quiz with AI"
- **THEN** the system generates questions matching the specified parameters
- **AND** the generated quiz reflects the selected difficulty level
- **AND** the number of questions matches the request (within validation limits)

#### Scenario: Quiz generation includes multiple question types
- **GIVEN** a teacher generates a quiz
- **WHEN** the AI generates questions
- **THEN** the quiz includes multiple-choice questions
- **AND** the quiz includes true-false questions
- **AND** the quiz includes short-answer questions
- **AND** each question type is appropriate for the content

#### Scenario: Generated questions include explanations
- **GIVEN** a quiz has been generated
- **WHEN** viewing the quiz preview
- **THEN** each question has a correct answer specified
- **AND** each question includes an explanation for why the answer is correct
- **AND** explanations relate to the course material

### Requirement: Quiz Taking by Students

Students MUST be able to take quizzes and receive immediate feedback.

#### Scenario: Student views available quizzes
- **GIVEN** a student is authenticated and enrolled in courses
- **WHEN** the student navigates to the quizzes page
- **THEN** the system displays all available quizzes for enrolled courses
- **AND** quizzes show metadata (difficulty, number of questions, completion status)
- **AND** the student can filter quizzes by course, difficulty, and status

#### Scenario: Student starts a quiz
- **GIVEN** a student is viewing available quizzes
- **WHEN** the student clicks "Start Quiz" on an unstarted quiz
- **THEN** the system creates a quiz attempt record
- **AND** displays the first question
- **AND** shows progress (Question X of Y)
- **AND** allows the student to navigate between questions

#### Scenario: Student answers questions
- **GIVEN** a student is taking a quiz
- **WHEN** the student selects an answer for a multiple-choice question
- **THEN** the answer is saved
- **AND** the student can change the answer before submission
- **WHEN** the student answers a true-false question
- **THEN** the answer is saved
- **WHEN** the student enters text for a short-answer question
- **THEN** the answer is saved

#### Scenario: Student submits quiz
- **GIVEN** a student has answered some or all questions
- **WHEN** the student clicks "Submit Quiz"
- **THEN** the system shows a confirmation dialog
- **AND** if confirmed, calculates the score
- **AND** displays results with correct/incorrect answers
- **AND** shows explanations for each question
- **AND** saves the completed attempt

#### Scenario: Student views quiz results
- **GIVEN** a student has completed a quiz
- **WHEN** the student views the results page
- **THEN** the system displays the score (X/Y points, percentage)
- **AND** shows which answers were correct and incorrect
- **AND** displays explanations for all questions
- **AND** allows the student to retake the quiz

### Requirement: Quiz Results and Analytics for Teachers

Teachers MUST be able to view quiz results and analytics for all students.

#### Scenario: Teacher views quiz statistics
- **GIVEN** a teacher has created quizzes
- **WHEN** the teacher navigates to quiz management
- **THEN** the system displays statistics for each quiz (total attempts, average score, completion rate)
- **AND** statistics are calculated from completed attempts

#### Scenario: Teacher views individual student attempts
- **GIVEN** a teacher is viewing a specific quiz
- **WHEN** the teacher navigates to quiz results
- **THEN** the system displays a table of all student attempts
- **AND** shows student name, score, percentage, and completion date
- **AND** allows the teacher to view detailed attempt information

#### Scenario: Teacher identifies challenging questions
- **GIVEN** a quiz has multiple student attempts
- **WHEN** the teacher views question performance analytics
- **THEN** the system shows the percentage of students who answered each question correctly
- **AND** highlights questions with low correct answer rates
- **AND** displays the number of correct vs incorrect answers per question

### Requirement: Quiz Data Management

The system MUST manage quiz data with proper persistence and retrieval.

#### Scenario: Quiz is saved to database
- **GIVEN** a teacher has generated and reviewed a quiz
- **WHEN** the teacher clicks "Save Quiz"
- **THEN** the quiz is stored in Firestore with all metadata
- **AND** the quiz is associated with the course
- **AND** the quiz is linked to the teacher who created it
- **AND** the quiz becomes available to students enrolled in the course

#### Scenario: Quiz attempt is tracked
- **GIVEN** a student starts a quiz
- **WHEN** the student answers questions
- **THEN** answers are saved to the attempt record
- **AND** the attempt status is set to "in-progress"
- **WHEN** the student submits the quiz
- **THEN** the attempt status is set to "completed"
- **AND** the score is calculated and saved
- **AND** the completion timestamp is recorded

#### Scenario: Quiz retrieval by filters
- **GIVEN** quizzes exist in the system
- **WHEN** querying quizzes by course ID
- **THEN** only quizzes for that course are returned
- **WHEN** querying quizzes by teacher ID
- **THEN** only quizzes created by that teacher are returned
- **WHEN** querying attempts by quiz ID
- **THEN** all attempts for that quiz are returned
- **WHEN** querying attempts by student ID
- **THEN** all attempts by that student are returned

### Requirement: API Layer for Quiz Service

The quiz service MUST expose REST API endpoints for all operations.

#### Scenario: Quiz CRUD operations via API
- **GIVEN** the quiz API is available
- **WHEN** creating a quiz via POST /api/quizzes
- **THEN** the quiz is created and returned with generated ID
- **WHEN** retrieving a quiz via GET /api/quizzes/[id]
- **THEN** the quiz data is returned
- **WHEN** updating a quiz via PUT /api/quizzes/[id]
- **THEN** the quiz is updated and returned
- **WHEN** deleting a quiz via DELETE /api/quizzes/[id]
- **THEN** the quiz is removed from the database

#### Scenario: Attempt operations via API
- **GIVEN** the attempt API is available
- **WHEN** creating an attempt via POST /api/attempts
- **THEN** the attempt is created with initial state
- **WHEN** retrieving attempts via GET /api/attempts?quizId=X
- **THEN** all attempts for that quiz are returned
- **WHEN** retrieving attempts via GET /api/attempts?studentId=Y
- **THEN** all attempts for that student are returned
- **WHEN** updating an attempt via PUT /api/attempts/[id]
- **THEN** the attempt is updated (e.g., answers, score, status)

#### Scenario: API supports external service URL
- **GIVEN** NEXT_PUBLIC_QUIZ_SERVICE_URL environment variable is set
- **WHEN** the QuizApiClient makes requests
- **THEN** requests are sent to the external service URL
- **WHEN** NEXT_PUBLIC_QUIZ_SERVICE_URL is empty
- **THEN** requests are sent to local API routes (same server)
