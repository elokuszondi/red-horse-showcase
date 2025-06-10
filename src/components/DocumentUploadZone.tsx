
import React, { useState } from 'react';
import { Upload, File, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { uploadPipeline, type DocumentUpload, type UploadProgress } from '@/services/uploadPipeline';
import { useDropzone } from 'react-dropzone';

const DocumentUploadZone: React.FC = () => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState<DocumentUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    if (!user) {
      alert('Please sign in to upload documents');
      return;
    }

    setIsUploading(true);
    
    for (const file of acceptedFiles) {
      try {
        const upload = await uploadPipeline.processDocument(
          file,
          user.id,
          (progress: UploadProgress) => {
            setUploads(prev => 
              prev.map(u => 
                u.id === progress.uploadId 
                  ? { ...u, progress: progress.progress, status: progress.stage as any }
                  : u
              )
            );
          }
        );

        setUploads(prev => [...prev, upload]);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
    
    setIsUploading(false);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: !user || isUploading
  });

  const getStatusIcon = (status: DocumentUpload['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : user 
                  ? 'border-gray-300 hover:border-gray-400' 
                  : 'border-gray-200 bg-gray-50 cursor-not-allowed'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className={`h-8 w-8 mx-auto mb-2 ${user ? 'text-gray-400' : 'text-gray-300'}`} />
            
            {!user ? (
              <div>
                <p className="text-sm text-gray-500 mb-1">Sign in to upload documents</p>
                <p className="text-xs text-gray-400">Add your own documents to the AI knowledge base</p>
              </div>
            ) : isDragActive ? (
              <p className="text-sm text-blue-600">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  Drag & drop documents here, or click to select
                </p>
                <p className="text-xs text-gray-500">
                  Supports PDF, DOC, DOCX, TXT, MD (max 10MB each)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Upload Progress</h3>
            <div className="space-y-3">
              {uploads.map((upload) => (
                <div key={upload.id} className="flex items-center gap-3">
                  {getStatusIcon(upload.status)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {upload.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={upload.progress} className="flex-1 h-2" />
                      <span className="text-xs text-gray-500 min-w-fit">
                        {upload.progress}%
                      </span>
                    </div>
                    {upload.error && (
                      <p className="text-xs text-red-600 mt-1">{upload.error}</p>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {(upload.size / 1024 / 1024).toFixed(1)} MB
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentUploadZone;
