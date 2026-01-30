import { NextResponse } from 'next/server';
import { FirebaseCourseService } from '@/lib/firebase-course-service';
import { Material } from '@/lib/types';
import * as fs from 'fs';
import * as path from 'path';

type RouteParams = {
  params: Promise<{
    courseId: string;
  }>;
};

/**
 * POST /api/courses/[courseId]/import-local
 * Import materials from local file system
 * This is a development utility to import files from /Users/naser-ir/Desktop/data/ppl/
 */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { courseId } = await params;
    const body = await req.json();
    const { teacherId, localPath } = body;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'teacherId is required' },
        { status: 400 }
      );
    }

    // Default path for ppl course data
    const dataPath = localPath || '/Users/naser-ir/Desktop/data/ppl';

    console.log('[API] Importing from local path:', dataPath);

    // Check if directory exists
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json(
        { error: `Directory not found: ${dataPath}` },
        { status: 404 }
      );
    }

    // Fetch course to get existing materials
    const course = await FirebaseCourseService.getById(teacherId, courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Read all files from the directory
    const files = fs.readdirSync(dataPath);
    const newMaterials: Material[] = [];

    for (const file of files) {
      const filePath = path.join(dataPath, file);
      const stats = fs.statSync(filePath);

      // Only process markdown and text files
      if (stats.isFile() && (file.endsWith('.md') || file.endsWith('.txt'))) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          
          newMaterials.push({
            id: `local-${Date.now()}-${Math.random().toString(36).substring(7)}-${file}`,
            title: file,
            type: file.endsWith('.md') ? 'MD' : 'DOC',
            content: content.substring(0, 100000), // Limit content size
          });

          console.log('[API] Imported file:', file);
        } catch (error) {
          console.error(`[API] Failed to read file ${file}:`, error);
        }
      }
    }

    if (newMaterials.length === 0) {
      return NextResponse.json(
        { error: 'No markdown or text files found in the directory' },
        { status: 400 }
      );
    }

    // Merge with existing materials
    const existingMaterials = course.materials || [];
    const updatedMaterials = [...existingMaterials, ...newMaterials];

    // Update course with new materials
    const updatedCourse = await FirebaseCourseService.update(teacherId, courseId, {
      materials: updatedMaterials,
    });

    return NextResponse.json({
      success: true,
      course: updatedCourse,
      importedCount: newMaterials.length,
      importedFiles: newMaterials.map(m => m.title),
    });
  } catch (error: any) {
    console.error('[API] POST /api/courses/[courseId]/import-local error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to import from local files',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
