/**
 * Firebase Firestore service for Course operations
 * Handles CRUD operations for courses in Firebase
 * Courses are stored under /teachers/{teacherId}/courses/{courseId}
 */

import { 
  collection, 
  collectionGroup,
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
import { Course } from './types';

// Detect if we're running on server (Node.js) or client (browser)
const isServer = typeof window === 'undefined';

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
 * Convert Course to Firestore format
 */
function courseToFirestore(course: Omit<Course, 'id'>, useAdminSdk = false): any {
  const base = {
    title: course.title,
    description: course.description,
    imageId: course.imageId || 'course-1',
    materials: course.materials || [],
    learningObjectives: course.learningObjectives || '',
    learningSkills: course.learningSkills || '',
    learningTrajectories: course.learningTrajectories || '',
  };
  
  if (useAdminSdk) {
    return base;
  }
  
  return {
    ...base,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/**
 * Convert Firestore document to Course
 */
function firestoreToCourse(id: string, data: any): Course {
  return {
    ...data,
    id,
  } as Course;
}

export const FirebaseCourseService = {
  /**
   * Get all courses for a teacher
   */
  async getByTeacher(teacherId: string): Promise<Course[]> {
    try {
      const coursesPath = `teachers/${teacherId}/courses`;
      
      if (isServer) {
        // Server-side: use Admin SDK
        const adminDbInstance = getAdminFirestore();
        const snapshot = await adminDbInstance.collection(coursesPath)
          .orderBy('createdAt', 'desc')
          .get();
        
        return snapshot.docs.map(doc => 
          firestoreToCourse(doc.id, doc.data())
        );
      }
      
      // Client-side: use client SDK
      let querySnapshot;
      try {
        querySnapshot = await getDocs(
          query(collection(db, coursesPath), orderBy('createdAt', 'desc'))
        );
      } catch (orderByError: any) {
        // If orderBy fails (e.g., missing index), try without it
        if (orderByError?.code === 'failed-precondition' || orderByError?.message?.includes('index')) {
          console.warn('[FirebaseCourseService] OrderBy index not found, fetching without orderBy');
          querySnapshot = await getDocs(collection(db, coursesPath));
        } else {
          throw orderByError;
        }
      }
      
      return querySnapshot.docs.map(doc => 
        firestoreToCourse(doc.id, doc.data())
      );
    } catch (error) {
      console.error('[FirebaseCourseService] Error getting courses by teacher:', error);
      throw error;
    }
  },

  /**
   * Get a single course by ID
   */
  async getById(teacherId: string, courseId: string): Promise<Course | null> {
    try {
      const coursePath = `teachers/${teacherId}/courses/${courseId}`;
      
      if (isServer) {
        // Server-side: use Admin SDK
        const adminDbInstance = getAdminFirestore();
        const docSnapshot = await adminDbInstance.doc(coursePath).get();
        
        if (!docSnapshot.exists) {
          return null;
        }
        
        return firestoreToCourse(docSnapshot.id, docSnapshot.data());
      }
      
      // Client-side: use client SDK
      const docRef = doc(db, coursePath);
      const docSnapshot = await getDoc(docRef);
      
      if (!docSnapshot.exists()) {
        return null;
      }
      
      return firestoreToCourse(docSnapshot.id, docSnapshot.data());
    } catch (error) {
      console.error('[FirebaseCourseService] Error getting course by ID:', error);
      throw error;
    }
  },

  /**
   * Create a new course
   */
  async add(teacherId: string, course: Omit<Course, 'id'>): Promise<Course> {
    try {
      const coursesPath = `teachers/${teacherId}/courses`;
      
      const courseData = courseToFirestore(course);
      
      let docRef;
      
      if (isServer) {
        // Server-side: use Admin SDK
        const adminDbInstance = getAdminFirestore();
        const courseDataForAdmin = courseToFirestore(course, true);
        const docRefAdmin = adminDbInstance.collection(coursesPath).doc();
        await docRefAdmin.set({
          ...courseDataForAdmin,
          teacherId, // Store teacherId in the document for rules validation
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        docRef = { id: docRefAdmin.id } as any;
      } else {
        // Client-side: use client SDK
        if (!db) {
          throw new Error('Firestore not initialized');
        }
        const docRefClient = await addDoc(collection(db, coursesPath), {
          ...courseData,
          teacherId, // Store teacherId in the document for rules validation
        });
        docRef = docRefClient;
      }
      
      console.log(`[FirebaseCourseService] Added course: ${docRef.id} - "${course.title}"`);
      
      // Return the created course with the generated ID
      return {
        ...course,
        id: docRef.id,
      } as Course;
    } catch (error) {
      console.error('[FirebaseCourseService] Error adding course:', error);
      throw error;
    }
  },

  /**
   * Update an existing course
   */
  async update(teacherId: string, courseId: string, updates: Partial<Course>): Promise<Course> {
    try {
      const coursePath = `teachers/${teacherId}/courses/${courseId}`;
      
      const updateData: any = {
        ...updates,
        updatedAt: isServer 
          ? admin.firestore.FieldValue.serverTimestamp()
          : serverTimestamp(),
      };
      
      // Remove id from updates if present
      delete updateData.id;
      
      if (isServer) {
        // Server-side: use Admin SDK
        const adminDbInstance = getAdminFirestore();
        await adminDbInstance.doc(coursePath).update(updateData);
      } else {
        // Client-side: use client SDK
        if (!db) {
          throw new Error('Firestore not initialized');
        }
        const docRef = doc(db, coursePath);
        await updateDoc(docRef, updateData);
      }
      
      // Fetch and return updated course
      const updatedCourse = await this.getById(teacherId, courseId);
      if (!updatedCourse) {
        throw new Error('Course not found after update');
      }
      
      return updatedCourse;
    } catch (error) {
      console.error('[FirebaseCourseService] Error updating course:', error);
      throw error;
    }
  },

  /**
   * Get all courses from all teachers (for students to browse)
   * Uses collection group query to get all courses
   */
  async getAll(): Promise<Course[]> {
    try {
      if (isServer) {
        // Server-side: use Admin SDK with collection group query
        // Fetch without orderBy to avoid index requirement, sort in memory
        const adminDbInstance = getAdminFirestore();
        const snapshot = await adminDbInstance.collectionGroup('courses').get();
        
        const courses = snapshot.docs.map(doc => 
          firestoreToCourse(doc.id, doc.data())
        );
        
        // Sort in memory by createdAt descending
        return courses.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });
      }
      
      // Client-side: use client SDK with collection group query
      // Note: This requires a Firestore index
      let querySnapshot;
      try {
        querySnapshot = await getDocs(
          query(collectionGroup(db, 'courses'), orderBy('createdAt', 'desc'))
        );
      } catch (orderByError: any) {
        // If orderBy fails (e.g., missing index), try without it
        if (orderByError?.code === 'failed-precondition' || orderByError?.message?.includes('index')) {
          console.warn('[FirebaseCourseService] Collection group index not found, fetching without orderBy');
          querySnapshot = await getDocs(collectionGroup(db, 'courses'));
          // Sort in memory instead
          const docs = querySnapshot.docs.map(doc => firestoreToCourse(doc.id, doc.data()));
          return docs.sort((a, b) => {
            const aDate = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
            const bDate = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
            return bDate - aDate;
          });
        }
        throw orderByError;
      }
      
      return querySnapshot.docs.map(doc => 
        firestoreToCourse(doc.id, doc.data())
      );
    } catch (error) {
      console.error('[FirebaseCourseService] Error getting all courses:', error);
      throw error;
    }
  },

  /**
   * Delete a course
   */
  async delete(teacherId: string, courseId: string): Promise<void> {
    try {
      const coursePath = `teachers/${teacherId}/courses/${courseId}`;
      
      if (isServer) {
        // Server-side: use Admin SDK
        const adminDbInstance = getAdminFirestore();
        await adminDbInstance.doc(coursePath).delete();
      } else {
        // Client-side: use client SDK
        if (!db) {
          throw new Error('Firestore not initialized');
        }
        const docRef = doc(db, coursePath);
        await deleteDoc(docRef);
      }
      
      console.log(`[FirebaseCourseService] Deleted course: ${courseId}`);
    } catch (error) {
      console.error('[FirebaseCourseService] Error deleting course:', error);
      throw error;
    }
  },
};
