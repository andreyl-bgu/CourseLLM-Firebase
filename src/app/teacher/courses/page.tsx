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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { BarChart2, Edit, PlusCircle, Loader2 } from 'lucide-react';

export default function TeacherCoursesPage() {
  const { firebaseUser } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageId: 'course-1',
  });

  // Fetch courses from Firebase
  useEffect(() => {
    if (firebaseUser?.uid) {
      fetchCourses();
    }
  }, [firebaseUser]);

  const fetchCourses = async () => {
    if (!firebaseUser?.uid) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/courses?teacherId=${firebaseUser.uid}`);
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Course title is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!firebaseUser?.uid) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a course.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: firebaseUser.uid,
          ...formData,
          materials: [],
          learningObjectives: '',
          learningSkills: '',
          learningTrajectories: '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create course');
      }

      const newCourse = await response.json();
      
      toast({
        title: 'Course Created!',
        description: `Your course "${newCourse.title}" has been created successfully.`,
      });

      // Reset form and close dialog
      setFormData({ title: '', description: '', imageId: 'course-1' });
      setIsCreateDialogOpen(false);
      
      // Refresh courses list
      await fetchCourses();
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: 'Create Failed',
        description: error instanceof Error ? error.message : 'Failed to create course. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline">Manage Courses</h1>
          <p className="text-muted-foreground">
            Edit materials, define objectives, and view student reports.
          </p>
        </div>
        <Button 
          className="w-full sm:w-auto"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Course
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No courses yet. Create your first course to get started.</p>
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
                <CardFooter className="grid grid-cols-2 gap-2 p-4 pt-0">
                  <Link href={`/teacher/courses/${course.id}`} passHref className="w-full">
                    <Button variant="outline" className="w-full">
                      <Edit className="mr-2 h-4 w-4" />
                      Manage
                    </Button>
                  </Link>
                  <Button variant="secondary" className="w-full" disabled>
                    <BarChart2 className="mr-2 h-4 w-4" />
                    Reports
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Course Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new course. You can add materials and objectives later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Introduction to Python"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the course..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageId">Image ID</Label>
              <Input
                id="imageId"
                placeholder="course-1"
                value={formData.imageId}
                onChange={(e) => setFormData({ ...formData, imageId: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Use placeholder image ID (e.g., course-1, course-2, etc.)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCourse} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Course'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
