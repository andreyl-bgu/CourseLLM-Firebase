/**
 * Unit tests for QuizApiClient
 */

import { QuizApiClient } from '../quiz-api-client';
import { Quiz, QuizAttempt } from '../types';

// Mock fetch globally
global.fetch = jest.fn();

describe('QuizApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variable
    process.env.NEXT_PUBLIC_QUIZ_SERVICE_URL = '';
  });

  describe('Quiz Operations', () => {
    const mockQuiz: Quiz = {
      id: 'quiz-1',
      courseId: 'course-1',
      title: 'Test Quiz',
      description: 'Test Description',
      questions: [],
      createdBy: 'teacher-1',
      createdAt: '2024-01-01T00:00:00Z',
      totalPoints: 100,
      difficulty: 'medium',
      topics: ['topic1'],
    };

    describe('getAll', () => {
      it('should fetch all quizzes', async () => {
        const mockQuizzes = [mockQuiz];
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockQuizzes,
        });

        const result = await QuizApiClient.getAll();

        expect(global.fetch).toHaveBeenCalledWith('/api/quizzes');
        expect(result).toEqual(mockQuizzes);
      });

      it('should throw error on failed request', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          statusText: 'Internal Server Error',
        });

        await expect(QuizApiClient.getAll()).rejects.toThrow(
          'Failed to fetch quizzes: Internal Server Error'
        );
      });
    });

    describe('getById', () => {
      it('should fetch quiz by ID', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockQuiz,
        });

        const result = await QuizApiClient.getById('quiz-1');

        expect(global.fetch).toHaveBeenCalledWith('/api/quizzes/quiz-1');
        expect(result).toEqual(mockQuiz);
      });

      it('should return null for 404', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          status: 404,
          ok: false,
        });

        const result = await QuizApiClient.getById('non-existent');

        expect(result).toBeNull();
      });

      it('should throw error on other failures', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Server Error',
        });

        await expect(QuizApiClient.getById('quiz-1')).rejects.toThrow(
          'Failed to fetch quiz: Server Error'
        );
      });
    });

    describe('getByCourse', () => {
      it('should fetch quizzes by course ID', async () => {
        const mockQuizzes = [mockQuiz];
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockQuizzes,
        });

        const result = await QuizApiClient.getByCourse('course-1');

        expect(global.fetch).toHaveBeenCalledWith('/api/quizzes?courseId=course-1');
        expect(result).toEqual(mockQuizzes);
      });
    });

    describe('getByTeacher', () => {
      it('should fetch quizzes by teacher ID', async () => {
        const mockQuizzes = [mockQuiz];
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockQuizzes,
        });

        const result = await QuizApiClient.getByTeacher('teacher-1');

        expect(global.fetch).toHaveBeenCalledWith('/api/quizzes?teacherId=teacher-1');
        expect(result).toEqual(mockQuizzes);
      });
    });

    describe('add', () => {
      it('should create a new quiz', async () => {
        const newQuiz = { ...mockQuiz, id: 'quiz-new', createdAt: '2024-01-02T00:00:00Z' };
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => newQuiz,
        });

        const quizData = {
          courseId: 'course-1',
          title: 'Test Quiz',
          description: 'Test Description',
          questions: [],
          createdBy: 'teacher-1',
          totalPoints: 100,
          difficulty: 'medium' as const,
          topics: ['topic1'],
        };

        const result = await QuizApiClient.add(quizData);

        expect(global.fetch).toHaveBeenCalledWith('/api/quizzes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quizData),
        });
        expect(result).toEqual(newQuiz);
      });

      it('should throw error on failed creation', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          statusText: 'Bad Request',
        });

        await expect(QuizApiClient.add({} as any)).rejects.toThrow(
          'Failed to create quiz: Bad Request'
        );
      });
    });

    describe('update', () => {
      it('should update a quiz', async () => {
        const updatedQuiz = { ...mockQuiz, title: 'Updated Title' };
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => updatedQuiz,
        });

        const updates = { title: 'Updated Title' };
        const result = await QuizApiClient.update('quiz-1', updates);

        expect(global.fetch).toHaveBeenCalledWith('/api/quizzes/quiz-1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        expect(result).toEqual(updatedQuiz);
      });
    });

    describe('delete', () => {
      it('should delete a quiz', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          status: 204,
        });

        await QuizApiClient.delete('quiz-1');

        expect(global.fetch).toHaveBeenCalledWith('/api/quizzes/quiz-1', {
          method: 'DELETE',
        });
      });

      it('should handle 204 status code', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 204,
        });

        await expect(QuizApiClient.delete('quiz-1')).resolves.not.toThrow();
      });
    });
  });

  describe('Attempt Operations', () => {
    const mockAttempt: QuizAttempt = {
      id: 'attempt-1',
      quizId: 'quiz-1',
      studentId: 'student-1',
      courseId: 'course-1',
      answers: [],
      score: 80,
      maxScore: 100,
      startedAt: '2024-01-01T00:00:00Z',
      completedAt: '2024-01-01T01:00:00Z',
      status: 'completed',
    };

    describe('getAttemptsByQuiz', () => {
      it('should fetch attempts by quiz ID', async () => {
        const mockAttempts = [mockAttempt];
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockAttempts,
        });

        const result = await QuizApiClient.getAttemptsByQuiz('quiz-1');

        expect(global.fetch).toHaveBeenCalledWith('/api/attempts?quizId=quiz-1');
        expect(result).toEqual(mockAttempts);
      });
    });

    describe('getAttemptsByStudent', () => {
      it('should fetch attempts by student ID', async () => {
        const mockAttempts = [mockAttempt];
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockAttempts,
        });

        const result = await QuizApiClient.getAttemptsByStudent('student-1');

        expect(global.fetch).toHaveBeenCalledWith('/api/attempts?studentId=student-1');
        expect(result).toEqual(mockAttempts);
      });
    });

    describe('getStudentAttempt', () => {
      it('should fetch student attempt for a quiz', async () => {
        const mockAttempts = [mockAttempt];
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockAttempts,
        });

        const result = await QuizApiClient.getStudentAttempt('quiz-1', 'student-1');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/attempts?quizId=quiz-1&studentId=student-1'
        );
        expect(result).toEqual(mockAttempt);
      });

      it('should return null if no attempts found', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

        const result = await QuizApiClient.getStudentAttempt('quiz-1', 'student-1');

        expect(result).toBeNull();
      });
    });

    describe('getAttemptById', () => {
      it('should fetch attempt by ID', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockAttempt,
        });

        const result = await QuizApiClient.getAttemptById('attempt-1');

        expect(global.fetch).toHaveBeenCalledWith('/api/attempts/attempt-1');
        expect(result).toEqual(mockAttempt);
      });

      it('should return null for 404', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          status: 404,
          ok: false,
        });

        const result = await QuizApiClient.getAttemptById('non-existent');

        expect(result).toBeNull();
      });
    });

    describe('createAttempt', () => {
      it('should create a new attempt', async () => {
        const newAttempt = { ...mockAttempt, id: 'attempt-new' };
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => newAttempt,
        });

        const attemptData = {
          quizId: 'quiz-1',
          studentId: 'student-1',
          courseId: 'course-1',
          answers: [],
          score: 0,
          maxScore: 100,
          status: 'in-progress' as const,
        };

        const result = await QuizApiClient.createAttempt(attemptData);

        expect(global.fetch).toHaveBeenCalledWith('/api/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attemptData),
        });
        expect(result).toEqual(newAttempt);
      });
    });

    describe('updateAttempt', () => {
      it('should update an attempt', async () => {
        const updatedAttempt = { ...mockAttempt, score: 90 };
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => updatedAttempt,
        });

        const updates = { score: 90 };
        const result = await QuizApiClient.updateAttempt('attempt-1', updates);

        expect(global.fetch).toHaveBeenCalledWith('/api/attempts/attempt-1', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        expect(result).toEqual(updatedAttempt);
      });
    });

    describe('deleteAttempt', () => {
      it('should delete an attempt', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          status: 204,
        });

        await QuizApiClient.deleteAttempt('attempt-1');

        expect(global.fetch).toHaveBeenCalledWith('/api/attempts/attempt-1', {
          method: 'DELETE',
        });
      });
    });
  });

  describe('External Service URL', () => {
    it('should use external service URL when configured', async () => {
      process.env.NEXT_PUBLIC_QUIZ_SERVICE_URL = 'https://quiz-service.example.com';
      
      // Re-import to get new API_BASE value
      jest.resetModules();
      const { QuizApiClient: ClientWithURL } = await import('../quiz-api-client');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await ClientWithURL.getAll();

      expect(global.fetch).toHaveBeenCalledWith('https://quiz-service.example.com/api/quizzes');
    });
  });
});
