import { NextResponse } from 'next/server';
import { FirebaseCourseService } from '@/lib/firebase-course-service';

/**
 * GET /api/courses
 * List courses:
 * - If teacherId query param provided: returns courses for that teacher
 * - If no teacherId: returns all courses from all teachers (for students)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get('teacherId');

    let courses;
    if (teacherId) {
      // Get courses for specific teacher
      courses = await FirebaseCourseService.getByTeacher(teacherId);
    } else {
      // Get all courses from all teachers (for students)
      courses = await FirebaseCourseService.getAll();
    }

    return NextResponse.json(courses);
  } catch (error) {
    console.error('[API] GET /api/courses error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/courses
 * Update an existing course
 * Requires teacherId, courseId, and updates in request body
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { teacherId, courseId, updates } = body;

    console.log('[API] PUT /api/courses - Received update request:', {
      teacherId,
      courseId,
      hasUpdates: !!updates,
      updateKeys: updates ? Object.keys(updates) : [],
    });

    if (!teacherId) {
      return NextResponse.json(
        { error: 'teacherId is required in request body' },
        { status: 400 }
      );
    }

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId is required in request body' },
        { status: 400 }
      );
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'updates object is required and cannot be empty' },
        { status: 400 }
      );
    }

    const updatedCourse = await FirebaseCourseService.update(teacherId, courseId, updates);

    console.log('[API] PUT /api/courses - Course updated successfully:', updatedCourse.id);

    return NextResponse.json(updatedCourse);
  } catch (error: any) {
    console.error('[API] PUT /api/courses error:', error);
    console.error('[API] PUT /api/courses - Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack?.substring(0, 200),
    });
    return NextResponse.json(
      { 
        error: 'Failed to update course',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses
 * Create a new course
 * Requires teacherId and course data in request body
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { teacherId, ...courseData } = body;
    
    if (!teacherId) {
      return NextResponse.json(
        { error: 'teacherId is required in request body' },
        { status: 400 }
      );
    }

    if (!courseData.title) {
      return NextResponse.json(
        { error: 'title is required in request body' },
        { status: 400 }
      );
    }

    console.log('[API] POST /api/courses - Received course data:', {
      teacherId,
      hasTitle: !!courseData.title,
      hasDescription: !!courseData.description,
    });
    
    const course = await FirebaseCourseService.add(teacherId, courseData);
    
    console.log('[API] POST /api/courses - Course created successfully:', course.id);
    
    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    console.error('[API] POST /api/courses error:', error);
    console.error('[API] POST /api/courses - Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack?.substring(0, 200),
    });
    return NextResponse.json(
      { 
        error: 'Failed to create course',
        message: error?.message || 'Unknown error',
        code: error?.code || 'UNKNOWN',
      },
      { status: 500 }
    );
  }
}
