"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProviderClient';
import { getPlaceholderImage } from '@/lib/placeholder-images';
import { Course } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function BrowseCoursesPage() {
  const { firebaseUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all courses from all teachers
  useEffect(() => {
    const fetchAllCourses = async () => {
      setIsLoading(true);
      try {
        // Fetch all courses from all teachers (no teacherId parameter)
        const response = await fetch('/api/courses');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch courses');
        }
        
        const data = await response.json();
        console.log('[StudentCourses] Fetched courses:', data.length, data);
        
        // Ensure we have an array
        if (Array.isArray(data)) {
          setCourses(data);
        } else {
          console.warn('[StudentCourses] Received non-array data:', data);
          setCourses([]);
        }
      } catch (error) {
        console.error('[StudentCourses] Error fetching courses:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load courses. Please try again.',
          variant: 'destructive',
        });
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllCourses();
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold font-headline">Explore Courses</h1>
        <p className="text-muted-foreground">
          Browse available courses and start your learning journey.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No courses available yet. Check back later!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const image = getPlaceholderImage(course.imageId || 'course-1');
            return (
              <Card key={course.id} className="flex flex-col">
                <CardHeader className="p-0">
                  {image && (
                    <Image
                      src={image.imageUrl}
                      alt={image.description}
                      data-ai-hint={image.imageHint}
                      width={600}
                      height={400}
                      className="rounded-t-lg object-cover aspect-[3/2]"
                    />
                  )}
                </CardHeader>
                <CardContent className="flex-1 p-4">
                  <CardTitle className="text-xl mb-2">{course.title}</CardTitle>
                  <CardDescription>{course.description || 'No description'}</CardDescription>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Link href={`/student/courses/${course.id}`} passHref className="w-full">
                    <Button variant="secondary" className="w-full">
                      View Course
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
