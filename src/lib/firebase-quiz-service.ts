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
import { getAdminFirestore } from './firebase-admin';
import admin from 'firebase-admin';
import { Quiz } from './types';

// Detect if we're running on server (Node.js) or client (browser)
const isServer = typeof window === 'undefined';

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
function quizToFirestore(quiz: Omit<Quiz, 'id'>, useAdminSdk = false): any {
  if (useAdminSdk) {
    // For Admin SDK, we'll set timestamp separately
    return {
      ...quiz,
    };
  }
  // For client SDK, use serverTimestamp()
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
      if (isServer) {
        // Server-side: use Admin SDK
        const adminDbInstance = getAdminFirestore();
        const snapshot = await adminDbInstance.collection(QUIZZES_COLLECTION)
          .orderBy('createdAt', 'desc')
          .get();
        
        return snapshot.docs.map(doc => 
          firestoreToQuiz(doc.id, doc.data())
        );
      }
      
      // Client-side: use client SDK
      // Try with orderBy first, but fallback to simple query if index doesn't exist
      let querySnapshot;
      try {
        querySnapshot = await getDocs(
          query(collection(db, QUIZZES_COLLECTION), orderBy('createdAt', 'desc'))
        );
      } catch (orderByError: any) {
        // If orderBy fails (e.g., missing index), try without it
        if (orderByError?.code === 'failed-precondition' || orderByError?.message?.includes('index')) {
          console.warn('[FirebaseQuizService] OrderBy index not found, fetching without orderBy');
          querySnapshot = await getDocs(collection(db, QUIZZES_COLLECTION));
          // Sort in memory instead
          const docs = querySnapshot.docs.map(doc => firestoreToQuiz(doc.id, doc.data()));
          return docs.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        throw orderByError;
      }
      
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
      let querySnapshot;
      try {
        const q = query(
          collection(db, QUIZZES_COLLECTION),
          where('courseId', '==', courseId),
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(q);
      } catch (orderByError: any) {
        // If orderBy fails (e.g., missing index), try without it
        if (orderByError?.code === 'failed-precondition' || orderByError?.message?.includes('index')) {
          console.warn('[FirebaseQuizService] OrderBy index not found, fetching without orderBy');
          const q = query(
            collection(db, QUIZZES_COLLECTION),
            where('courseId', '==', courseId)
          );
          querySnapshot = await getDocs(q);
          // Sort in memory instead
          const docs = querySnapshot.docs.map(doc => firestoreToQuiz(doc.id, doc.data()));
          return docs.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        throw orderByError;
      }
      
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
      let querySnapshot;
      try {
        const q = query(
          collection(db, QUIZZES_COLLECTION),
          where('createdBy', '==', teacherId),
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(q);
      } catch (orderByError: any) {
        // If orderBy fails (e.g., missing index), try without it
        if (orderByError?.code === 'failed-precondition' || orderByError?.message?.includes('index')) {
          console.warn('[FirebaseQuizService] OrderBy index not found, fetching without orderBy');
          const q = query(
            collection(db, QUIZZES_COLLECTION),
            where('createdBy', '==', teacherId)
          );
          querySnapshot = await getDocs(q);
          // Sort in memory instead
          const docs = querySnapshot.docs.map(doc => firestoreToQuiz(doc.id, doc.data()));
          return docs.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        throw orderByError;
      }
      
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
      // #region agent log
      console.log('[FirebaseQuizService] Adding quiz:', {
        title: quiz.title,
        courseId: quiz.courseId,
        createdBy: quiz.createdBy,
        questionsCount: quiz.questions?.length || 0,
        isServer,
        hasDb: !!db,
        hasAdminDb: !!adminDb,
      });
      // #endregion
      
      const quizData = quizToFirestore(quiz as Omit<Quiz, 'id'>);
      
      // #region agent log
      console.log('[FirebaseQuizService] Quiz data prepared, attempting to add to Firestore...');
      // #endregion
      
      let docRef;
      
      // Use Admin SDK on server, client SDK on client
      if (isServer) {
        const adminDbInstance = getAdminFirestore();
        // Server-side: use Admin SDK
        const quizDataForAdmin = quizToFirestore(quiz as Omit<Quiz, 'id'>, true);
        const docRefAdmin = adminDbInstance.collection(QUIZZES_COLLECTION).doc();
        await docRefAdmin.set({
          ...quizDataForAdmin,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        docRef = { id: docRefAdmin.id } as any;
        // #region agent log
        console.log('[FirebaseQuizService] Quiz added via Admin SDK:', docRef.id);
        // #endregion
      } else {
        // Client-side: use client SDK
        if (!db) {
          throw new Error('Firestore not initialized');
        }
        const quizDataForClient = quizToFirestore(quiz as Omit<Quiz, 'id'>, false);
        docRef = await addDoc(collection(db, QUIZZES_COLLECTION), quizDataForClient);
        // #region agent log
        console.log('[FirebaseQuizService] Quiz added via Client SDK:', docRef.id);
        // #endregion
      }
      
      console.log(`[FirebaseQuizService] Added quiz: ${docRef.id} - "${quiz.title}"`);
      
      // Return the created quiz with the generated ID
      return {
        ...quiz,
        id: docRef.id,
        createdAt: new Date().toISOString(),
      } as Quiz;
    } catch (error: any) {
      // #region agent log
      console.error('[FirebaseQuizService] Error adding quiz - details:', {
        message: error?.message,
        code: error?.code,
        name: error?.name,
        isServer,
        stack: error?.stack?.substring(0, 300),
      });
      // #endregion
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

