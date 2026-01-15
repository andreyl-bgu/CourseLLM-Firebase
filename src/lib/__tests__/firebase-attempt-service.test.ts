/**
 * Unit tests for FirebaseAttemptService
 * Mocks Firestore operations
 */

import { FirebaseAttemptService } from '../firebase-attempt-service';
import { QuizAttempt } from '../types';

// Mock Firebase Firestore
jest.mock('../firebase', () => ({
  db: {},
}));

// Mock Firestore functions
const mockGetDocs = jest.fn();
const mockGetDoc = jest.fn();
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockServerTimestamp = jest.fn(() => ({ toDate: () => new Date() }));

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

describe('FirebaseAttemptService', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockCollection.mockReturnValue({});
    mockDoc.mockReturnValue({});
    mockQuery.mockReturnValue({});
    mockWhere.mockReturnValue({});
  });

  describe('getByQuiz', () => {
    it('should fetch attempts by quiz ID', async () => {
      const mockDocSnap = {
        id: 'attempt-1',
        data: () => ({
          ...mockAttempt,
          startedAt: { toDate: () => new Date('2024-01-01') },
          completedAt: { toDate: () => new Date('2024-01-01T01:00:00Z') },
        }),
      };

      const mockQueryResult = {};
      mockWhere.mockReturnValue(mockQueryResult);
      mockQuery.mockReturnValue(mockQueryResult);
      mockCollection.mockReturnValue({});
      mockGetDocs.mockResolvedValueOnce({
        docs: [mockDocSnap],
      });

      const result = await FirebaseAttemptService.getByQuiz('quiz-1');

      expect(mockWhere).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('attempt-1');
    });
  });

  describe('getByStudent', () => {
    it('should fetch attempts by student ID', async () => {
      const mockDocSnap = {
        id: 'attempt-1',
        data: () => ({
          ...mockAttempt,
          startedAt: { toDate: () => new Date('2024-01-01') },
          completedAt: { toDate: () => new Date('2024-01-01T01:00:00Z') },
        }),
      };

      const mockQueryResult = {};
      mockWhere.mockReturnValue(mockQueryResult);
      mockQuery.mockReturnValue(mockQueryResult);
      mockCollection.mockReturnValue({});
      mockGetDocs.mockResolvedValueOnce({
        docs: [mockDocSnap],
      });

      const result = await FirebaseAttemptService.getByStudent('student-1');

      expect(mockWhere).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('getById', () => {
    it('should fetch attempt by ID', async () => {
      const mockDocSnap = {
        exists: () => true,
        id: 'attempt-1',
        data: () => ({
          ...mockAttempt,
          startedAt: { toDate: () => new Date('2024-01-01') },
          completedAt: { toDate: () => new Date('2024-01-01T01:00:00Z') },
        }),
      };

      mockGetDoc.mockResolvedValueOnce(mockDocSnap);

      const result = await FirebaseAttemptService.getById('attempt-1');

      expect(mockDoc).toHaveBeenCalledWith({}, 'quiz_attempts', 'attempt-1');
      expect(result).toBeTruthy();
      expect(result?.id).toBe('attempt-1');
    });

    it('should return null if attempt does not exist', async () => {
      const mockDocSnap = {
        exists: () => false,
      };

      mockGetDoc.mockResolvedValueOnce(mockDocSnap);

      const result = await FirebaseAttemptService.getById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getStudentAttempt', () => {
    it('should fetch student attempt for a quiz', async () => {
      const mockDocSnap = {
        id: 'attempt-1',
        data: () => ({
          ...mockAttempt,
          startedAt: { toDate: () => new Date('2024-01-01') },
          completedAt: { toDate: () => new Date('2024-01-01T01:00:00Z') },
        }),
      };

      const mockQueryResult = {};
      mockWhere.mockReturnValue(mockQueryResult);
      mockQuery.mockReturnValue(mockQueryResult);
      mockCollection.mockReturnValue({});
      mockGetDocs.mockResolvedValueOnce({
        docs: [mockDocSnap],
        empty: false,
      });

      const result = await FirebaseAttemptService.getStudentAttempt('quiz-1', 'student-1');

      expect(mockWhere).toHaveBeenCalled();
      expect(result).toBeTruthy();
      expect(result?.id).toBe('attempt-1');
    });

    it('should return null if no attempt found', async () => {
      const mockQueryResult = {};
      mockWhere.mockReturnValue(mockQueryResult);
      mockQuery.mockReturnValue(mockQueryResult);
      mockCollection.mockReturnValue({});
      mockGetDocs.mockResolvedValueOnce({
        docs: [],
        empty: true,
      });

      const result = await FirebaseAttemptService.getStudentAttempt('quiz-1', 'student-1');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new attempt', async () => {
      const mockDocRef = { id: 'attempt-new' };
      mockAddDoc.mockResolvedValueOnce(mockDocRef);

      const attemptData = {
        quizId: 'quiz-1',
        studentId: 'student-1',
        courseId: 'course-1',
        answers: [],
        score: 0,
        maxScore: 100,
        status: 'in-progress' as const,
      };

      const result = await FirebaseAttemptService.create(attemptData);

      expect(mockAddDoc).toHaveBeenCalled();
      expect(result.id).toBe('attempt-new');
      expect(result.quizId).toBe('quiz-1');
    });
  });

  describe('update', () => {
    it('should update an attempt', async () => {
      const mockDocSnap = {
        exists: () => true,
        id: 'attempt-1',
        data: () => ({
          ...mockAttempt,
          score: 90,
          startedAt: { toDate: () => new Date('2024-01-01') },
          completedAt: { toDate: () => new Date('2024-01-01T01:00:00Z') },
        }),
      };

      mockUpdateDoc.mockResolvedValueOnce(undefined);
      mockGetDoc.mockResolvedValueOnce(mockDocSnap);

      const updates = { score: 90, status: 'completed' as const };
      const result = await FirebaseAttemptService.update('attempt-1', updates);

      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(result?.score).toBe(90);
    });
  });

  describe('delete', () => {
    it('should delete an attempt', async () => {
      mockDeleteDoc.mockResolvedValueOnce(undefined);

      await FirebaseAttemptService.delete('attempt-1');

      expect(mockDeleteDoc).toHaveBeenCalled();
    });
  });
});
