'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProviderClient';
import { CourseManagementClient } from './_components/course-management-client';
import { Course } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function ManageCoursePage({ params }: { params: { courseId: string } }) {
  const { firebaseUser } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const courseId = typeof params.courseId === 'string' ? params.courseId : params.courseId?.toString() || '';

  useEffect(() => {
    const fetchCourse = async () => {
      if (!firebaseUser?.uid || !courseId) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/courses?teacherId=${firebaseUser.uid}`);
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
        const courses: Course[] = await response.json();
        const foundCourse = courses.find(c => c.id === courseId);
        setCourse(foundCourse || null);
      } catch (error) {
        console.error('Error fetching course:', error);
        setCourse(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [firebaseUser, courseId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Course not found.</p>
      </div>
    );
  }

  return <CourseManagementClient course={course} teacherId={firebaseUser?.uid || ''} />;
}
