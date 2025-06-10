
import { supabase } from '@/integrations/supabase/client';

export interface DocumentReference {
  id: string;
  title: string;
  url: string;
  snippet: string;
  confidence: number;
  source: string;
}

export interface ProcessedResponse {
  originalResponse: string;
  enhancedResponse: string;
  references: DocumentReference[];
}

class DocumentResolver {
  private documentRegistry: Map<string, DocumentReference> = new Map();
  
  constructor() {
    this.initializeRegistry();
  }

  private async initializeRegistry() {
    // Initialize with known document mappings
    // This would typically sync with Azure blob storage metadata
    const commonDocs = [
      {
        id: 'kb-001',
        title: 'Exchange Server Migration Best Practices',
        url: '/docs/exchange-migration-guide.pdf',
        source: 'SharePoint/IT-Documentation/Exchange',
        snippet: 'Comprehensive guide for Exchange Server migrations'
      },
      {
        id: 'kb-002', 
        title: 'Incident Response Procedures',
        url: '/docs/incident-response-procedures.pdf',
        source: 'Ivanti/Service-Desk/Procedures',
        snippet: 'Standard operating procedures for incident management'
      },
      {
        id: 'kb-003',
        title: 'Network Security Policies',
        url: '/docs/network-security-policies.pdf',
        source: 'SharePoint/Security/Policies',
        snippet: 'Corporate network security guidelines and policies'
      },
      {
        id: 'kb-004',
        title: 'Office 365 Troubleshooting Guide',
        url: '/docs/o365-troubleshooting.pdf',
        source: 'SharePoint/IT-Documentation/Office365',
        snippet: 'Common Office 365 issues and their solutions'
      }
    ];

    commonDocs.forEach(doc => {
      this.documentRegistry.set(doc.id, doc as DocumentReference);
    });
  }

  // Extract document references from AI response
  extractReferences(response: string): string[] {
    const referencePattern = /\[(\d+:\d+)\s+source\]|\[source:\s*([^\]]+)\]|\[([^\]]*?\.(?:pdf|docx|doc|txt))\]/gi;
    const matches = [];
    let match;

    while ((match = referencePattern.exec(response)) !== null) {
      matches.push(match[1] || match[2] || match[3]);
    }

    return [...new Set(matches)]; // Remove duplicates
  }

  // Resolve reference codes to actual documents
  async resolveReference(referenceCode: string): Promise<DocumentReference | null> {
    try {
      // Try direct registry lookup first
      if (this.documentRegistry.has(referenceCode)) {
        return this.documentRegistry.get(referenceCode)!;
      }

      // Parse vector reference format [4:6]
      const vectorMatch = referenceCode.match(/(\d+):(\d+)/);
      if (vectorMatch) {
        const [, start, end] = vectorMatch;
        
        // Map common vector references to known documents
        const vectorMappings: Record<string, string> = {
          '1:2': 'kb-001',
          '2:4': 'kb-002', 
          '3:5': 'kb-003',
          '4:6': 'kb-004',
          '5:7': 'kb-001',
          '6:8': 'kb-002'
        };

        const docId = vectorMappings[`${start}:${end}`];
        if (docId && this.documentRegistry.has(docId)) {
          return this.documentRegistry.get(docId)!;
        }
      }

      // Try filename matching
      if (referenceCode.includes('.')) {
        for (const [id, doc] of this.documentRegistry) {
          if (doc.title.toLowerCase().includes(referenceCode.toLowerCase()) ||
              doc.url.toLowerCase().includes(referenceCode.toLowerCase())) {
            return doc;
          }
        }
      }

      // Create a generic reference for unmatched codes
      return {
        id: referenceCode,
        title: this.extractTitleFromCode(referenceCode),
        url: `/docs/document-${referenceCode.replace(/[^a-zA-Z0-9]/g, '-')}`,
        snippet: 'Referenced document from knowledge base',
        confidence: 75,
        source: 'Knowledge Base'
      };

    } catch (error) {
      console.error('Error resolving document reference:', error);
      return null;
    }
  }

  private extractTitleFromCode(code: string): string {
    if (code.includes('.')) {
      return code.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    }
    return `Document Reference ${code}`;
  }

  // Enhance AI response with clickable document links
  async enhanceResponse(response: string): Promise<ProcessedResponse> {
    const references = this.extractReferences(response);
    const resolvedRefs: DocumentReference[] = [];
    let enhancedResponse = response;

    for (const ref of references) {
      const resolved = await this.resolveReference(ref);
      if (resolved) {
        resolvedRefs.push(resolved);
        
        // Replace reference codes with clickable links
        const linkMarkdown = `[${resolved.title}](${resolved.url})`;
        const patterns = [
          new RegExp(`\\[${ref}\\s+source\\]`, 'gi'),
          new RegExp(`\\[source:\\s*${ref}\\]`, 'gi'),
          new RegExp(`\\[${ref}\\]`, 'gi')
        ];

        patterns.forEach(pattern => {
          enhancedResponse = enhancedResponse.replace(pattern, linkMarkdown);
        });
      }
    }

    return {
      originalResponse: response,
      enhancedResponse,
      references: resolvedRefs
    };
  }

  // Add new document to registry
  addDocument(doc: DocumentReference) {
    this.documentRegistry.set(doc.id, doc);
  }

  // Get all registered documents
  getAllDocuments(): DocumentReference[] {
    return Array.from(this.documentRegistry.values());
  }
}

export const documentResolver = new DocumentResolver();
