"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Course, Material } from "@/lib/types";
import { FileText, Presentation, Upload, Trash2, Github, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export function CourseManagementClient({ course: initialCourse, teacherId }: { course: Course; teacherId: string }) {
  const [course, setCourse] = useState(initialCourse);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportingLocal, setIsImportingLocal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [localPath, setLocalPath] = useState('/Users/naser-ir/Desktop/data/ppl');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleSaveChanges = async () => {
    if (!teacherId) {
      toast({
        title: "Error",
        description: "You must be logged in to save changes.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/courses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacherId,
          courseId: course.id,
          updates: {
            learningObjectives: course.learningObjectives,
            learningSkills: course.learningSkills,
            learningTrajectories: course.learningTrajectories,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `Failed to save changes: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const updatedCourse = await response.json();
      setCourse(updatedCourse);

      toast({
        title: "Changes Saved",
        description: `Your changes to "${course.title}" have been saved.`,
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save changes. Please try again.";
      console.error('Save error details:', {
        error,
        message: errorMessage,
        courseId: course.id,
        teacherId,
      });
      toast({
        title: "Save Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportFromGitHub = async () => {
    if (!githubUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a GitHub repository URL.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch(`/api/courses/${course.id}/import-github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          githubUrl: githubUrl.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to import from GitHub');
      }

      const data = await response.json();
      setCourse(data.course);
      setIsImportDialogOpen(false);
      setGithubUrl('');

      toast({
        title: "Import Successful",
        description: `Imported ${data.importedCount} material(s) from GitHub.`,
      });
    } catch (error) {
      console.error('Error importing from GitHub:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import from GitHub. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFromLocal = async () => {
    if (!localPath.trim()) {
      toast({
        title: "Path Required",
        description: "Please enter a local file path.",
        variant: "destructive",
      });
      return;
    }

    setIsImportingLocal(true);
    try {
      const response = await fetch(`/api/courses/${course.id}/import-local`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId,
          localPath: localPath.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to import from local files');
      }

      const data = await response.json();
      setCourse(data.course);

      toast({
        title: "Import Successful",
        description: `Imported ${data.importedCount} file(s) from local directory.`,
      });
    } catch (error) {
      console.error('Error importing from local:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import from local files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImportingLocal(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    const updatedMaterials = course.materials.filter(m => m.id !== materialId);
    setCourse(prev => ({ ...prev, materials: updatedMaterials }));

    if (!teacherId) return;

    try {
      const response = await fetch(`/api/courses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacherId,
          courseId: course.id,
          updates: { materials: updatedMaterials },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete material');
      }

      toast({
        title: "Material Deleted",
        description: "The material has been removed.",
      });
    } catch (error) {
      console.error('Error deleting material:', error);
      // Revert on error
      setCourse(prev => ({ ...prev, materials: course.materials }));
      toast({
        title: "Delete Failed",
        description: "Failed to delete material. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validExtensions = ['.md', '.txt', '.doc', '.docx', '.pdf', '.ppt', '.pptx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload .md, .txt, .doc, .pdf, or .ppt files.",
        variant: "destructive",
      });
      event.target.value = ''; // Reset input
      return;
    }

    // Check file size (limit to 5MB for text content)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 5MB.",
        variant: "destructive",
      });
      event.target.value = ''; // Reset input
      return;
    }

    setIsUploading(true);
    try {
      // Read file content
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;
            if (typeof text !== 'string') {
              reject(new Error('Failed to read file as text'));
              return;
            }
            resolve(text);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = (e) => {
          reject(new Error('Failed to read file: ' + (reader.error?.message || 'Unknown error')));
        };
        
        // For text-based files, read as text
        if (fileExtension === '.md' || fileExtension === '.txt') {
          reader.readAsText(file, 'UTF-8');
        } else if (fileExtension === '.doc' || fileExtension === '.docx') {
          // For DOC files, try reading as text (simple approach)
          // Note: This won't work well for binary .doc/.docx files
          reader.readAsText(file, 'UTF-8');
        } else {
          // For PDF/PPT, we'll store a placeholder or try to extract text
          // For now, store metadata
          resolve(`[File: ${file.name}, Size: ${file.size} bytes, Type: ${fileExtension}]\n\nNote: Full content extraction for ${fileExtension} files is not yet supported.`);
        }
      });

      // Determine material type
      let materialType: Material['type'] = 'DOC';
      if (fileExtension === '.md') {
        materialType = 'MD';
      } else if (fileExtension === '.pdf') {
        materialType = 'PDF';
      } else if (fileExtension === '.ppt' || fileExtension === '.pptx') {
        materialType = 'PPT';
      }

      // Create new material
      const newMaterial: Material = {
        id: `upload-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        title: file.name,
        type: materialType,
        content: content.substring(0, 100000), // Limit content size
      };

      // Add to course materials
      const updatedMaterials = [...course.materials, newMaterial];
      
      // Update course in Firebase
      if (!teacherId) {
        throw new Error('Teacher ID not available');
      }

      const response = await fetch(`/api/courses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacherId,
          courseId: course.id,
          updates: { materials: updatedMaterials },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to upload material: ${response.statusText}`);
      }

      const updatedCourse = await response.json();
      setCourse(updatedCourse);

      toast({
        title: "File Uploaded",
        description: `"${file.name}" has been added to course materials.`,
      });

      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload file. Please try again.";
      console.error('Upload error details:', {
        error,
        message: errorMessage,
        file: file?.name,
        fileSize: file?.size,
        fileType: file?.type,
      });
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input on error
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">{course.title}</h1>
          <p className="text-muted-foreground">{course.description}</p>
        </div>
        <Button onClick={handleSaveChanges} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      <Tabs defaultValue="materials">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="materials">Course Materials</TabsTrigger>
          <TabsTrigger value="objectives">Learning Objectives</TabsTrigger>
        </TabsList>
        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>Manage Materials</CardTitle>
              <CardDescription>Upload and manage course files.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Current Materials</h3>
                <div className="space-y-2">
                  {course.materials.map(material => (
                    <div key={material.id} className="flex items-center gap-4 p-2 border rounded-lg">
                      {material.type === 'PDF' || material.type === 'DOC' ? <FileText className="h-5 w-5 text-primary"/> : <Presentation className="h-5 w-5 text-primary"/>}
                      <span className="flex-1 font-medium">{material.title}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{material.type}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteMaterial(material.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                   {course.materials.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No materials uploaded yet.</p>}
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t">
                 <h3 className="font-semibold">Add Materials</h3>
                 
                 {/* GitHub Import */}
                 <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                   <Label htmlFor="github-url">Import from GitHub Repository</Label>
                   <p className="text-sm text-muted-foreground mb-2">
                     Enter a GitHub repository URL to import .md and .txt files as course materials
                   </p>
                   <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                     <DialogTrigger asChild>
                       <Button variant="outline" className="w-full sm:w-auto">
                         <Github className="mr-2 h-4 w-4" />
                         Import from GitHub
                       </Button>
                     </DialogTrigger>
                     <DialogContent>
                       <DialogHeader>
                         <DialogTitle>Import Materials from GitHub</DialogTitle>
                         <DialogDescription>
                           Enter the GitHub repository URL. The system will import all .md and .txt files from the repository.
                         </DialogDescription>
                       </DialogHeader>
                       <div className="space-y-4 py-4">
                         <div className="space-y-2">
                           <Label htmlFor="github-url">GitHub Repository URL</Label>
                           <Input
                             id="github-url"
                             placeholder="https://github.com/owner/repo/tree/branch/path"
                             value={githubUrl}
                             onChange={(e) => setGithubUrl(e.target.value)}
                           />
                         </div>
                       </div>
                       <DialogFooter>
                         <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                           Cancel
                         </Button>
                         <Button onClick={handleImportFromGitHub} disabled={isImporting}>
                           {isImporting ? (
                             <>
                               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                               Importing...
                             </>
                           ) : (
                             <>
                               <Github className="mr-2 h-4 w-4" />
                               Import
                             </>
                           )}
                         </Button>
                       </DialogFooter>
                     </DialogContent>
                   </Dialog>
                 </div>

                 {/* Local File Import */}
                 <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                   <Label htmlFor="local-path">Import from Local Directory</Label>
                   <p className="text-sm text-muted-foreground mb-2">
                     Import all .md and .txt files from a local directory path (server-side)
                   </p>
                   <div className="flex gap-2">
                     <Input
                       id="local-path"
                       placeholder="/path/to/data/folder"
                       value={localPath}
                       onChange={(e) => setLocalPath(e.target.value)}
                       className="flex-1"
                     />
                     <Button 
                       variant="outline" 
                       onClick={handleImportFromLocal}
                       disabled={isImportingLocal}
                     >
                       {isImportingLocal ? (
                         <>
                           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                           Importing...
                         </>
                       ) : (
                         <>
                           <Upload className="mr-2 h-4 w-4" />
                           Import Local Files
                         </>
                       )}
                     </Button>
                   </div>
                 </div>

                 {/* File Upload */}
                 <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                    <Label htmlFor="material-file">Upload File</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload .md, .txt, .doc, .pdf, or .ppt files (max 5MB)
                    </p>
                     <div className="flex gap-2">
                        <Input 
                          id="material-file" 
                          type="file" 
                          accept=".md,.txt,.doc,.docx,.pdf,.ppt,.pptx"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="cursor-pointer"
                        />
                     </div>
                    {isUploading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </div>
                    )}
                  </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="objectives">
          <Card>
            <CardHeader>
              <CardTitle>Learning Path Definition</CardTitle>
              <CardDescription>Define the objectives, skills, and trajectories for this course.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="objectives">Learning Objectives</Label>
                <Textarea
                  id="objectives"
                  placeholder="e.g., 1. Understand basic Python syntax..."
                  value={course.learningObjectives}
                  onChange={(e) => setCourse(prev => ({...prev, learningObjectives: e.target.value}))}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Learning Skills</Label>
                <Input
                  id="skills"
                  placeholder="e.g., Problem-solving, Algorithmic thinking"
                  value={course.learningSkills}
                  onChange={(e) => setCourse(prev => ({...prev, learningSkills: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trajectories">Learning Trajectories</Label>
                <Input
                  id="trajectories"
                  placeholder="e.g., Beginner -> Intermediate"
                  value={course.learningTrajectories}
                  onChange={(e) => setCourse(prev => ({...prev, learningTrajectories: e.target.value}))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
