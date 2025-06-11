
import React, { useState, useRef, KeyboardEvent } from 'react';
import { Send, Paperclip, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChatContext } from '@/contexts/ChatContext';
import { usePersistentChat } from '@/contexts/PersistentChatContext';
import { useAuth } from '@/contexts/AuthContext';
import FileUpload from '@/components/FileUpload';

const ChatInput = () => {
  const [input, setInput] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isTyping } = useChatContext();
  const { 
    addMessageToCurrentChat, 
    currentChatId, 
    createNewChat 
  } = usePersistentChat();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const messageContent = input.trim();
    setInput('');

    // For authenticated users, use persistent chat
    if (user) {
      let activeChatId = currentChatId;
      
      // Create new chat if none exists
      if (!activeChatId) {
        activeChatId = await createNewChat();
        if (!activeChatId) {
          console.error('Failed to create new chat');
          return;
        }
      }

      // Add user message to persistent chat
      await addMessageToCurrentChat('user', messageContent);

      // Send message through regular chat context for AI response
      await sendMessage(messageContent);
    } else {
      // For guests, use regular chat context
      await sendMessage(messageContent);
    }

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const stopGeneration = () => {
    // Implementation would depend on your AI service
    console.log('Stopping generation...');
  };

  return (
    <div className="relative">
      {showFileUpload && (
        <div className="absolute bottom-full left-0 right-0 mb-2">
          <FileUpload 
            onUploadComplete={() => setShowFileUpload(false)}
            onClose={() => setShowFileUpload(false)}
          />
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="min-h-[48px] max-h-[120px] resize-none pr-12 py-3"
            disabled={isTyping}
          />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowFileUpload(!showFileUpload)}
            className="absolute right-2 top-2 h-8 w-8 p-0"
            disabled={isTyping}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </div>
        
        {isTyping ? (
          <Button
            type="button"
            onClick={stopGeneration}
            variant="outline"
            size="default"
            className="h-12 px-4"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={!input.trim()}
            size="default"
            className="h-12 px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  );
};

export default ChatInput;
