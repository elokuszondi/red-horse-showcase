
import { useState, useRef, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChatContext } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import FileUpload, { UploadedFile } from '@/components/FileUpload';
import GuestModePrompt from './GuestModePrompt';

const ChatInput = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [guestQueryCount, setGuestQueryCount] = useState(0);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage } = useChatContext();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if ((!input.trim() && files.length === 0) || isLoading) return;

    // Handle guest mode limitations
    if (!user) {
      if (guestQueryCount >= 3) {
        setShowGuestPrompt(true);
        return;
      }
      setGuestQueryCount(prev => prev + 1);
    }

    const message = input.trim();
    const attachedFiles = files.length > 0 ? files : undefined;
    
    setInput('');
    setFiles([]);
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await sendMessage(message, attachedFiles);
      
      // Show guest prompt after 2nd query
      if (!user && guestQueryCount === 2) {
        setShowGuestPrompt(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const charCount = input.length;
  const maxChars = 2000;
  const showCharCount = charCount > maxChars * 0.8;
  const canSend = (input.trim() || files.length > 0) && !isLoading && charCount <= maxChars;

  return (
    <div className="space-y-3">
      {/* Guest Mode Prompt */}
      {showGuestPrompt && (
        <GuestModePrompt 
          onDismiss={() => setShowGuestPrompt(false)}
          queryCount={guestQueryCount}
        />
      )}

      {/* Character Counter */}
      {showCharCount && (
        <div className="flex justify-end">
          <span className={`text-xs ${
            charCount > maxChars ? 'text-red-500' : 'text-gray-500'
          }`}>
            {charCount}/{maxChars}
          </span>
        </div>
      )}

      {/* File Upload */}
      <FileUpload files={files} onFilesChange={setFiles} />

      {/* Input Area */}
      <div className="relative bg-gray-50 rounded-xl border border-gray-200 focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all-smooth">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            !user && guestQueryCount >= 3 
              ? "Sign in to continue chatting..." 
              : "Ask about incidents, search knowledge base, find solutions..."
          }
          className="min-h-[52px] max-h-[120px] resize-none border-0 bg-transparent px-4 py-3 pr-12 focus:ring-0 focus:ring-offset-0 placeholder:text-gray-500"
          disabled={isLoading || (!user && guestQueryCount >= 3)}
        />
        
        <div className="absolute bottom-2 right-2">
          <Button
            onClick={handleSubmit}
            disabled={!canSend || (!user && guestQueryCount >= 3)}
            size="sm"
            className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all-smooth"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 text-center">
        {!user && guestQueryCount > 0 && (
          <span className="mr-2">Guest mode: {guestQueryCount}/3 queries</span>
        )}
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
};

export default ChatInput;
