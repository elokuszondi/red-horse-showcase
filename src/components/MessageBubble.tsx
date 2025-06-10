
import React, { useState, useEffect } from 'react';
import { User, Bot, Copy, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useChatContext } from '@/contexts/ChatContext';
import type { Message } from '@/contexts/ChatContext';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { documentResolver, type ProcessedResponse } from '@/services/documentResolver';
import DocumentReferences from './DocumentReferences';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { retryLastMessage } = useChatContext();
  const [processedResponse, setProcessedResponse] = useState<ProcessedResponse | null>(null);

  useEffect(() => {
    if (message.sender === 'ai' && message.content) {
      // Process AI response for document references
      documentResolver.enhanceResponse(message.content).then(setProcessedResponse);
    }
  }, [message.content, message.sender]);

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isUser = message.sender === 'user';
  const displayContent = processedResponse?.enhancedResponse || message.content;

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''} mb-6`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
      }`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block p-4 rounded-lg ${
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted/50 border'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                components={{
                  code({ className, children }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match;
                    
                    return isInline ? (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    ) : (
                      <SyntaxHighlighter
                        language={match[1]}
                        PreTag="div"
                        className="rounded-md"
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    );
                  },
                  a({ href, children }) {
                    return (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {children}
                      </a>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse border border-gray-300">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return (
                      <th className="border border-gray-300 px-4 py-2 bg-gray-50 font-semibold text-left">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="border border-gray-300 px-4 py-2">
                        {children}
                      </td>
                    );
                  },
                }}
              >
                {displayContent}
              </ReactMarkdown>
            </div>
          )}

          {/* File attachments */}
          {message.files && message.files.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.files.map((file) => (
                <div key={file.id} className="flex items-center gap-2 text-xs opacity-80">
                  <span>📎</span>
                  <span>{file.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document References */}
        {!isUser && processedResponse?.references && processedResponse.references.length > 0 && (
          <DocumentReferences references={processedResponse.references} />
        )}

        {/* Message Footer */}
        <div className={`flex items-center gap-2 mt-2 text-xs text-muted-foreground ${
          isUser ? 'justify-end' : 'justify-start'
        }`}>
          <span>{formatTime(message.timestamp)}</span>
          
          {message.metadata?.assistantId && (
            <Badge variant="secondary" className="text-xs">
              Think Tank AI
            </Badge>
          )}

          {!isUser && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(message.content)}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={retryLastMessage}
                className="h-6 w-6 p-0"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
