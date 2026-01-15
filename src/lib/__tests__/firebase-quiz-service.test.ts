/**
 * Unit tests for FirebaseQuizService
 * Mocks Firestore operations
 */

import { FirebaseQuizService } from '../firebase-quiz-service';
import { Quiz } from '../types';

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
const mockOrderBy = jest.fn();
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
  orderBy: (...args: any[]) => mockOrderBy(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

describe('FirebaseQuizService', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockCollection.mockReturnValue({});
    mockDoc.mockReturnValue({});
    mockQuery.mockReturnValue({});
    mockWhere.mockReturnValue({});
    mockOrderBy.mockReturnValue({});
  });

  describe('getAll', () => {
    it('should fetch all quizzes', async () => {
      const mockDocSnap = {
        id: 'quiz-1',
        data: () => ({
          ...mockQuiz,
          createdAt: { toDate: () => new Date('2024-01-01') },
        }),
      };

      const mockQueryResult = {};
      mockOrderBy.mockReturnValue(mockQueryResult);
      mockQuery.mockReturnValue(mockQueryResult);
      mockCollection.mockReturnValue({});
      mockGetDocs.mockResolvedValueOnce({
        docs: [mockDocSnap],
      });

      const result = await FirebaseQuizService.getAll();

      expect(mockCollection).toHaveBeenCalled();
      expect(mockGetDocs).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('quiz-1');
    });

    it('should handle errors', async () => {
      const mockQueryResult = {};
      mockOrderBy.mockReturnValue(mockQueryResult);
      mockQuery.mockReturnValue(mockQueryResult);
      mockCollection.mockReturnValue({});
      mockGetDocs.mockRejectedValueOnce(new Error('Firestore error'));

      await expect(FirebaseQuizService.getAll()).rejects.toThrow('Firestore error');
    });
  });

  describe('getById', () => {
    it('should fetch quiz by ID', async () => {
      const mockDocSnap = {
        exists: () => true,
        id: 'quiz-1',
        data: () => ({
          ...mockQuiz,
          createdAt: { toDate: () => new Date('2024-01-01') },
        }),
      };

      mockGetDoc.mockResolvedValueOnce(mockDocSnap);

      const result = await FirebaseQuizService.getById('quiz-1');

      expect(mockDoc).toHaveBeenCalledWith({}, 'quizzes', 'quiz-1');
      expect(result).toBeTruthy();
      expect(result?.id).toBe('quiz-1');
    });

    it('should return null if quiz does not exist', async () => {
      const mockDocSnap = {
        exists: () => false,
      };

      mockGetDoc.mockResolvedValueOnce(mockDocSnap);

      const result = await FirebaseQuizService.getById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getByCourse', () => {
    it('should fetch quizzes by course ID', async () => {
      const mockDocSnap = {
        id: 'quiz-1',
        data: () => ({
          ...mockQuiz,
          createdAt: { toDate: () => new Date('2024-01-01') },
        }),
      };

      const mockQueryResult = {};
      mockOrderBy.mockReturnValue(mockQueryResult);
      mockWhere.mockReturnValue(mockQueryResult);
      mockQuery.mockReturnValue(mockQueryResult);
      mockCollection.mockReturnValue({});
      mockGetDocs.mockResolvedValueOnce({
        docs: [mockDocSnap],
      });

      const result = await FirebaseQuizService.getByCourse('course-1');

      expect(mockWhere).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('getByTeacher', () => {
    it('should fetch quizzes by teacher ID', async () => {
      const mockDocSnap = {
        id: 'quiz-1',
        data: () => ({
          ...mockQuiz,
          createdAt: { toDate: () => new Date('2024-01-01') },
        }),
      };

      const mockQueryResult = {};
      mockOrderBy.mockReturnValue(mockQueryResult);
      mockWhere.mockReturnValue(mockQueryResult);
      mockQuery.mockReturnValue(mockQueryResult);
      mockCollection.mockReturnValue({});
      mockGetDocs.mockResolvedValueOnce({
        docs: [mockDocSnap],
      });

      const result = await FirebaseQuizService.getByTeacher('teacher-1');

      expect(mockWhere).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('add', () => {
    it('should create a new quiz', async () => {
      const mockDocRef = { id: 'quiz-new' };
      mockAddDoc.mockResolvedValueOnce(mockDocRef);

      const quizData = {
        courseId: 'course-1',
        title: 'New Quiz',
        description: 'Description',
        questions: [],
        createdBy: 'teacher-1',
        totalPoints: 100,
        difficulty: 'medium' as const,
        topics: ['topic1'],
      };

      const result = await FirebaseQuizService.add(quizData);

      expect(mockAddDoc).toHaveBeenCalled();
      expect(result.id).toBe('quiz-new');
      expect(result.title).toBe('New Quiz');
    });
  });

  describe('update', () => {
    it('should update a quiz', async () => {
      const mockDocSnap = {
        exists: () => true,
        id: 'quiz-1',
        data: () => ({
          ...mockQuiz,
          title: 'Updated Title',
          createdAt: { toDate: () => new Date('2024-01-01') },
        }),
      };

      mockUpdateDoc.mockResolvedValueOnce(undefined);
      mockGetDoc.mockResolvedValueOnce(mockDocSnap);

      const updates = { title: 'Updated Title' };
      const result = await FirebaseQuizService.update('quiz-1', updates);

      expect(mockUpdateDoc).toHaveBeenCalled();
      expect(result?.title).toBe('Updated Title');
    });
  });

  describe('delete', () => {
    it('should delete a quiz', async () => {
      mockDeleteDoc.mockResolvedValueOnce(undefined);

      await FirebaseQuizService.delete('quiz-1');

      expect(mockDeleteDoc).toHaveBeenCalled();
    });
  });
});
