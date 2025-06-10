
import React from 'react';
import { FileText, ExternalLink, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DocumentReference } from '@/services/documentResolver';

interface DocumentReferencesProps {
  references: DocumentReference[];
  className?: string;
}

const DocumentReferences: React.FC<DocumentReferencesProps> = ({ references, className = '' }) => {
  if (references.length === 0) return null;

  const handleDocumentClick = (url: string) => {
    // For now, just log the click. In production this would open the document
    console.log('Opening document:', url);
    
    // Try to open in new tab, fallback to download link
    if (url.startsWith('http')) {
      window.open(url, '_blank');
    } else {
      // Create a mock blob URL for demonstration
      const mockContent = `This would open the actual document: ${url}`;
      const blob = new Blob([mockContent], { type: 'text/plain' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    }
  };

  return (
    <Card className={`mt-4 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Referenced Documents ({references.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {references.map((ref, index) => (
          <div
            key={ref.id || index}
            onClick={() => handleDocumentClick(ref.url)}
            className="flex items-start gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100"
          >
            <FileText className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {ref.title}
                </h4>
                <ExternalLink className="h-3 w-3 text-gray-400" />
              </div>
              
              <p className="text-xs text-gray-600 mb-2">{ref.snippet}</p>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {ref.source}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {ref.confidence}% relevance
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DocumentReferences;
