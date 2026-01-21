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
    return {
      ...quiz,
    };
  }
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
      let querySnapshot;
      try {
        querySnapshot = await getDocs(
          query(collection(db, QUIZZES_COLLECTION), orderBy('createdAt', 'desc'))
        );
      } catch (orderByError: any) {
        if (orderByError?.code === 'failed-precondition' || orderByError?.message?.includes('index')) {
          console.warn('[FirebaseQuizService] OrderBy index not found, fetching without orderBy');
          querySnapshot = await getDocs(collection(db, QUIZZES_COLLECTION));
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
      if (isServer) {
        const adminDbInstance = getAdminFirestore();
        const docSnap = await adminDbInstance.collection(QUIZZES_COLLECTION).doc(id).get();
        
        if (!docSnap.exists) {
          return null;
        }
        
        return firestoreToQuiz(docSnap.id, docSnap.data());
      }
      
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
      if (isServer) {
        const adminDbInstance = getAdminFirestore();
        const snapshot = await adminDbInstance.collection(QUIZZES_COLLECTION)
          .where('courseId', '==', courseId)
          .orderBy('createdAt', 'desc')
          .get();
        
        const docs = snapshot.docs.map(doc => firestoreToQuiz(doc.id, doc.data()));
        return docs.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      
      let querySnapshot;
      try {
        const q = query(
          collection(db, QUIZZES_COLLECTION),
          where('courseId', '==', courseId),
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(q);
      } catch (orderByError: any) {
        if (orderByError?.code === 'failed-precondition' || orderByError?.message?.includes('index')) {
          console.warn('[FirebaseQuizService] OrderBy index not found, fetching without orderBy');
          const q = query(
            collection(db, QUIZZES_COLLECTION),
            where('courseId', '==', courseId)
          );
          querySnapshot = await getDocs(q);
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
      if (isServer) {
        const adminDbInstance = getAdminFirestore();
        let snapshot;
        try {
          snapshot = await adminDbInstance.collection(QUIZZES_COLLECTION)
            .where('createdBy', '==', teacherId)
            .orderBy('createdAt', 'desc')
            .get();
        } catch (orderByError: any) {
          if (orderByError?.code === 'failed-precondition' || orderByError?.message?.includes('index')) {
            console.warn('[FirebaseQuizService] OrderBy index not found, fetching without orderBy');
            snapshot = await adminDbInstance.collection(QUIZZES_COLLECTION)
              .where('createdBy', '==', teacherId)
              .get();
          } else {
            throw orderByError;
          }
        }
        
        const docs = snapshot.docs.map(doc => firestoreToQuiz(doc.id, doc.data()));
        return docs.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      
      let querySnapshot;
      try {
        const q = query(
          collection(db, QUIZZES_COLLECTION),
          where('createdBy', '==', teacherId),
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(q);
      } catch (orderByError: any) {
        if (orderByError?.code === 'failed-precondition' || orderByError?.message?.includes('index')) {
          console.warn('[FirebaseQuizService] OrderBy index not found, fetching without orderBy');
          const q = query(
            collection(db, QUIZZES_COLLECTION),
            where('createdBy', '==', teacherId)
          );
          querySnapshot = await getDocs(q);
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
      if (isServer) {
        try {
          const adminDbInstance = getAdminFirestore();
          const quizDataForAdmin = quizToFirestore(quiz as Omit<Quiz, 'id'>, true);
          const docRefAdmin = adminDbInstance.collection(QUIZZES_COLLECTION).doc();
          await docRefAdmin.set({
            ...quizDataForAdmin,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          const docRef = { id: docRefAdmin.id } as any;
          
          console.log(`[FirebaseQuizService] Added quiz: ${docRef.id} - "${quiz.title}"`);
          
          return {
            ...quiz,
            id: docRef.id,
            createdAt: new Date().toISOString(),
          } as Quiz;
        } catch (adminError) {
          console.error('[FirebaseQuizService] Admin SDK error:', adminError);
          throw new Error(`Failed to create quiz using Admin SDK: ${adminError instanceof Error ? adminError.message : String(adminError)}`);
        }
      } else {
        if (!db) {
          throw new Error('Firestore not initialized on client');
        }
        const quizDataForClient = quizToFirestore(quiz as Omit<Quiz, 'id'>, false);
        const docRef = await addDoc(collection(db, QUIZZES_COLLECTION), quizDataForClient);
        
        console.log(`[FirebaseQuizService] Added quiz: ${docRef.id} - "${quiz.title}"`);
        
        return {
          ...quiz,
          id: docRef.id,
          createdAt: new Date().toISOString(),
        } as Quiz;
      }
    } catch (error: any) {
      console.error('[FirebaseQuizService] Error adding quiz:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to create quiz: ${String(error)}`);
    }
  },

  /**
   * Update an existing quiz
   */
  async update(id: string, updates: Partial<Quiz>): Promise<Quiz> {
    try {
      const { id: _, createdAt, ...updateData } = updates as any;
      
      if (isServer) {
        const adminDbInstance = getAdminFirestore();
        await adminDbInstance.collection(QUIZZES_COLLECTION).doc(id).update(updateData);
      } else {
        const docRef = doc(db, QUIZZES_COLLECTION, id);
        await updateDoc(docRef, updateData);
      }
      
      console.log(`[FirebaseQuizService] Updated quiz: ${id}`);
      
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
      if (isServer) {
        const adminDbInstance = getAdminFirestore();
        await adminDbInstance.collection(QUIZZES_COLLECTION).doc(id).delete();
      } else {
        const docRef = doc(db, QUIZZES_COLLECTION, id);
        await deleteDoc(docRef);
      }
      
      console.log(`[FirebaseQuizService] Deleted quiz: ${id}`);
    } catch (error) {
      console.error('[FirebaseQuizService] Error deleting quiz:', error);
      throw error;
    }
  },
};
