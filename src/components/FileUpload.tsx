
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'completed' | 'error';
  progress?: number;
  file?: File;
  url?: string;
  storageKey?: string;
}

interface FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  files,
  onFilesChange,
  maxFiles = 5, 
  maxSizeMB = 10,
  acceptedTypes = ['image/*', 'text/*', '.pdf', '.doc', '.docx']
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Date.now().toString() + Math.random().toString(36),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
      progress: 0,
      file,
    }));

    const updatedFiles = [...files, ...newFiles];
    onFilesChange(updatedFiles);

    // Simulate upload progress
    newFiles.forEach((newFile) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          const completedFiles = updatedFiles.map(file => 
            file.id === newFile.id 
              ? { ...file, status: 'completed' as const, progress: 100 }
              : file
          );
          onFilesChange(completedFiles);
        } else {
          const progressFiles = updatedFiles.map(file => 
            file.id === newFile.id 
              ? { ...file, progress }
              : file
          );
          onFilesChange(progressFiles);
        }
      }, 100);
    });
  }, [files, onFilesChange]);

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(file => file.id !== fileId);
    onFilesChange(updatedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize: maxSizeMB * 1024 * 1024,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
  });

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.includes('text') || type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        {isDragActive ? (
          <p className="text-sm text-gray-600">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-1">
              Drag & drop files here, or click to select
            </p>
            <p className="text-xs text-gray-500">
              Max {maxFiles} files, {maxSizeMB}MB each
            </p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploaded Files</h4>
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {getFileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {file.status === 'uploading' && file.progress !== undefined && (
                  <Progress value={file.progress} className="mt-1 h-1" />
                )}
              </div>
              <div className="flex items-center gap-2">
                {file.status === 'completed' && (
                  <span className="text-xs text-green-600">✓</span>
                )}
                {file.status === 'error' && (
                  <span className="text-xs text-red-600">✗</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
