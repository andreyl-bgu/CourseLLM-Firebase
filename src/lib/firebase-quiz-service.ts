/**
 * Firebase Firestore service for Quiz operations
 * Handles CRUD operations for quizzes in Firebase
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Quiz } from './types';

const QUIZZES_COLLECTION = 'quizzes';

/**
 * Convert Firebase Timestamp to ISO string
 */
function timestampToISO(timestamp: any): string {
  if (timestamp?.toDate) {
    return timestamp.toDate().toISOString();
  }
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  return new Date().toISOString();
}

/**
 * Convert Quiz to Firestore format
 */
function quizToFirestore(quiz: Omit<Quiz, 'id'>): any {
  return {
    ...quiz,
    createdAt: serverTimestamp(),
  };
}

/**
 * Convert Firestore document to Quiz
 */
function firestoreToQuiz(id: string, data: any): Quiz {
  return {
    ...data,
    id,
    createdAt: timestampToISO(data.createdAt),
  } as Quiz;
}

export const FirebaseQuizService = {
  /**
   * Get all quizzes
   */
  async getAll(): Promise<Quiz[]> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, QUIZZES_COLLECTION), orderBy('createdAt', 'desc'))
      );
      
      return querySnapshot.docs.map(doc => 
        firestoreToQuiz(doc.id, doc.data())
      );
    } catch (error) {
      console.error('[FirebaseQuizService] Error getting all quizzes:', error);
      throw error;
    }
  },

  /**
   * Get quiz by ID
   */
  async getById(id: string): Promise<Quiz | null> {
    try {
      const docRef = doc(db, QUIZZES_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return firestoreToQuiz(docSnap.id, docSnap.data());
    } catch (error) {
      console.error('[FirebaseQuizService] Error getting quiz by ID:', error);
      throw error;
    }
  },

  /**
   * Get quizzes by course ID
   */
  async getByCourse(courseId: string): Promise<Quiz[]> {
    try {
      const q = query(
        collection(db, QUIZZES_COLLECTION),
        where('courseId', '==', courseId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        firestoreToQuiz(doc.id, doc.data())
      );
    } catch (error) {
      console.error('[FirebaseQuizService] Error getting quizzes by course:', error);
      throw error;
    }
  },

  /**
   * Get quizzes by teacher ID
   */
  async getByTeacher(teacherId: string): Promise<Quiz[]> {
    try {
      const q = query(
        collection(db, QUIZZES_COLLECTION),
        where('createdBy', '==', teacherId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        firestoreToQuiz(doc.id, doc.data())
      );
    } catch (error) {
      console.error('[FirebaseQuizService] Error getting quizzes by teacher:', error);
      throw error;
    }
  },

  /**
   * Add a new quiz
   */
  async add(quiz: Omit<Quiz, 'id' | 'createdAt'>): Promise<Quiz> {
    try {
      const quizData = quizToFirestore(quiz as Omit<Quiz, 'id'>);
      const docRef = await addDoc(collection(db, QUIZZES_COLLECTION), quizData);
      
      console.log(`[FirebaseQuizService] Added quiz: ${docRef.id} - "${quiz.title}"`);
      
      // Return the created quiz with the generated ID
      return {
        ...quiz,
        id: docRef.id,
        createdAt: new Date().toISOString(),
      } as Quiz;
    } catch (error) {
      console.error('[FirebaseQuizService] Error adding quiz:', error);
      throw error;
    }
  },

  /**
   * Update an existing quiz
   */
  async update(id: string, updates: Partial<Quiz>): Promise<Quiz> {
    try {
      const docRef = doc(db, QUIZZES_COLLECTION, id);
      
      // Remove id and createdAt from updates
      const { id: _, createdAt, ...updateData } = updates as any;
      
      await updateDoc(docRef, updateData);
      
      console.log(`[FirebaseQuizService] Updated quiz: ${id}`);
      
      // Fetch and return updated quiz
      const updated = await this.getById(id);
      if (!updated) {
        throw new Error('Quiz not found after update');
      }
      
      return updated;
    } catch (error) {
      console.error('[FirebaseQuizService] Error updating quiz:', error);
      throw error;
    }
  },

  /**
   * Delete a quiz
   */
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, QUIZZES_COLLECTION, id);
      await deleteDoc(docRef);
      
      console.log(`[FirebaseQuizService] Deleted quiz: ${id}`);
    } catch (error) {
      console.error('[FirebaseQuizService] Error deleting quiz:', error);
      throw error;
    }
  },
};

