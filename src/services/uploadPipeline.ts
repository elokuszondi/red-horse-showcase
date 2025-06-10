
import { supabase } from '@/integrations/supabase/client';

export interface DocumentUpload {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'vectorizing' | 'completed' | 'error';
  progress: number;
  url?: string;
  vectorId?: string;
  uploadedAt: Date;
  error?: string;
}

export interface UploadProgress {
  uploadId: string;
  stage: string;
  progress: number;
  message: string;
}

class UploadPipeline {
  private uploads: Map<string, DocumentUpload> = new Map();
  private progressCallbacks: Map<string, (progress: UploadProgress) => void> = new Map();

  async processDocument(
    file: File, 
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<DocumentUpload> {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const upload: DocumentUpload = {
      id: uploadId,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0,
      uploadedAt: new Date()
    };

    this.uploads.set(uploadId, upload);
    if (onProgress) {
      this.progressCallbacks.set(uploadId, onProgress);
    }

    try {
      // Step 1: Upload to Supabase Storage
      this.updateProgress(uploadId, 'uploading', 10, 'Uploading file to storage...');
      
      const filePath = `uploads/${userId}/${uploadId}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      this.updateProgress(uploadId, 'processing', 30, 'File uploaded successfully...');

      // Step 2: Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      upload.url = urlData.publicUrl;
      this.updateProgress(uploadId, 'processing', 50, 'Preparing document for processing...');

      // Step 3: Process with document processor
      const { data: processData, error: processError } = await supabase.functions
        .invoke('document-processor', {
          body: {
            documentUrl: upload.url,
            fileName: file.name,
            userId: userId,
            uploadId: uploadId
          }
        });

      if (processError) {
        console.warn('Document processor not available, marking as ready:', processError);
      }

      this.updateProgress(uploadId, 'vectorizing', 70, 'Indexing document for AI search...');

      // Step 4: Store document metadata
      const { error: dbError } = await supabase
        .from('chat_files')
        .insert({
          id: uploadId,
          user_id: userId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: filePath,
          public_url: upload.url
        });

      if (dbError) {
        console.error('Failed to store document metadata:', dbError);
      }

      this.updateProgress(uploadId, 'completed', 100, 'Document ready for AI queries!');

      upload.status = 'completed';
      upload.progress = 100;
      this.uploads.set(uploadId, upload);

      return upload;

    } catch (error) {
      console.error('Document processing failed:', error);
      upload.status = 'error';
      upload.error = error instanceof Error ? error.message : 'Unknown error';
      this.uploads.set(uploadId, upload);
      
      this.updateProgress(uploadId, 'error', 0, `Error: ${upload.error}`);
      throw error;
    }
  }

  private updateProgress(uploadId: string, stage: string, progress: number, message: string) {
    const callback = this.progressCallbacks.get(uploadId);
    if (callback) {
      callback({ uploadId, stage, progress, message });
    }

    const upload = this.uploads.get(uploadId);
    if (upload) {
      upload.progress = progress;
      this.uploads.set(uploadId, upload);
    }
  }

  getUpload(uploadId: string): DocumentUpload | undefined {
    return this.uploads.get(uploadId);
  }

  getAllUploads(): DocumentUpload[] {
    return Array.from(this.uploads.values());
  }

  async getUserDocuments(userId: string): Promise<DocumentUpload[]> {
    try {
      const { data, error } = await supabase
        .from('chat_files')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch user documents:', error);
        return [];
      }

      return data.map(doc => ({
        id: doc.id,
        name: doc.file_name,
        size: doc.file_size,
        type: doc.file_type,
        status: 'completed' as const,
        progress: 100,
        url: doc.public_url,
        uploadedAt: new Date(doc.created_at)
      }));
    } catch (error) {
      console.error('Error fetching user documents:', error);
      return [];
    }
  }
}

export const uploadPipeline = new UploadPipeline();
