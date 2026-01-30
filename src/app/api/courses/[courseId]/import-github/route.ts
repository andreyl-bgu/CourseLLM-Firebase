import { NextResponse } from 'next/server';
import { FirebaseCourseService } from '@/lib/firebase-course-service';
import { Material } from '@/lib/types';

type RouteParams = {
  params: Promise<{
    courseId: string;
  }>;
};

/**
 * POST /api/courses/[courseId]/import-github
 * Import materials from a GitHub repository
 */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { courseId } = await params;
    const body = await req.json();
    const { teacherId, githubUrl } = body;

    if (!teacherId) {
      return NextResponse.json(
        { error: 'teacherId is required' },
        { status: 400 }
      );
    }

    if (!githubUrl) {
      return NextResponse.json(
        { error: 'githubUrl is required' },
        { status: 400 }
      );
    }

    // Parse GitHub URL
    // Format: https://github.com/owner/repo/tree/main/path
    const githubUrlMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+)(?:\/(.+))?)?/);
    if (!githubUrlMatch) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL format. Expected: https://github.com/owner/repo/tree/branch/path' },
        { status: 400 }
      );
    }

    const [, owner, repo, branch = 'main', path = ''] = githubUrlMatch;

    console.log('[API] Parsed GitHub URL:', { owner, repo, branch, path });

    // Fetch course to get existing materials
    const course = await FirebaseCourseService.getById(teacherId, courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Fetch repository contents using GitHub API
    // Include ref (branch) parameter for correct path
    const encodedPath = path ? encodeURIComponent(path) : '';
    const githubApiUrl = path 
      ? `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${branch}`
      : `https://api.github.com/repos/${owner}/${repo}/contents?ref=${branch}`;
    
    console.log('[API] Fetching from GitHub API:', githubApiUrl);
    
    const githubResponse = await fetch(githubApiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'CourseLLM-Firebase',
      },
    });

    if (!githubResponse.ok) {
      const errorText = await githubResponse.text();
      console.error('[API] GitHub API error:', githubResponse.status, githubResponse.statusText, errorText);
      let errorMessage = `Failed to fetch from GitHub: ${githubResponse.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // Use default error message
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: githubResponse.status }
      );
    }

    const contents = await githubResponse.json();

    // Process files (handle both files and directories)
    const newMaterials: Material[] = [];
    
    // Helper function to fetch file contents recursively
    async function fetchFileContents(item: any): Promise<void> {
      if (item.type === 'file' && (item.name.endsWith('.md') || item.name.endsWith('.txt'))) {
        // Fetch raw file content
        const fileResponse = await fetch(item.download_url, {
          headers: {
            'Accept': 'text/plain',
            'User-Agent': 'CourseLLM-Firebase',
          },
        });
        
        if (fileResponse.ok) {
          const content = await fileResponse.text();
          newMaterials.push({
            id: `github-${item.sha.substring(0, 8)}`,
            title: item.name,
            type: item.name.endsWith('.md') ? 'MD' : 'DOC',
            content: content.substring(0, 100000), // Limit content size
          });
        }
      } else if (item.type === 'dir') {
        // Recursively fetch directory contents
        // Use the directory URL with branch ref if available
        const dirUrl = item.url ? `${item.url}?ref=${branch}` : null;
        if (!dirUrl) {
          console.warn('[API] Directory item has no URL:', item.name);
          return;
        }
        
        const dirResponse = await fetch(dirUrl, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'CourseLLM-Firebase',
          },
        });
        
        if (dirResponse.ok) {
          const dirContents = await dirResponse.json();
          for (const subItem of dirContents) {
            await fetchFileContents(subItem);
          }
        } else {
          console.warn('[API] Failed to fetch directory:', item.name, dirResponse.status);
        }
      }
    }

    // Handle both single file and array of items
    const items = Array.isArray(contents) ? contents : [contents];
    for (const item of items) {
      await fetchFileContents(item);
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
    });
  } catch (error: any) {
    console.error('[API] POST /api/courses/[courseId]/import-github error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to import from GitHub',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
