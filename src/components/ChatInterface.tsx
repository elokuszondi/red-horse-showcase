
import { useEffect, useRef } from 'react';
import { useChatContext } from '@/contexts/ChatContext';
import MessageBubble from '@/components/MessageBubble';
import ChatInput from '@/components/ChatInput';
import TypingIndicator from '@/components/TypingIndicator';
import EmptyState from '@/components/EmptyState';

const ChatInterface = () => {
  const { messages, isTyping } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto chat-scrollbar">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            {messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message}
              />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <ChatInput />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
