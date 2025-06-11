
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePersistentChat } from '@/contexts/PersistentChatContext';
import { sessionManager } from '@/services/sessionManager';
import { azureOpenAIService } from '@/services/azureOpenAI';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  metadata?: any;
}

interface ChatContextType {
  messages: Message[];
  isTyping: boolean;
  sendMessage: (content: string, metadata?: any) => Promise<void>;
  clearMessages: () => void;
  setMessages: (messages: Message[]) => void;
  loadConversation: (sessionId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();
  const persistentChat = usePersistentChat();

  // Initialize with current session messages for guests
  useEffect(() => {
    if (!user) {
      const currentSession = sessionManager.getCurrentSession();
      if (currentSession && currentSession.conversationHistory.length > 0) {
        const sessionMessages: Message[] = [];
        currentSession.conversationHistory.forEach(entry => {
          sessionMessages.push({
            id: `user-${Date.now()}-${Math.random()}`,
            content: entry.query,
            sender: 'user',
            timestamp: new Date(entry.timestamp),
          });
          sessionMessages.push({
            id: `ai-${Date.now()}-${Math.random()}`,
            content: entry.response,
            sender: 'ai',
            timestamp: new Date(entry.timestamp + 1000),
          });
        });
        setMessages(sessionMessages);
      }
    }
  }, [user]);

  const sendMessage = useCallback(async (content: string, metadata?: any) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random()}`,
      content: content.trim(),
      sender: 'user',
      timestamp: new Date(),
      metadata
    };

    // For guests, add message to local state
    if (!user) {
      setMessages(prev => [...prev, userMessage]);
    }

    setIsTyping(true);

    try {
      // Get AI response
      const response = await azureOpenAIService.generateResponse([
        ...(user ? persistentChat.currentMessages : messages),
        userMessage
      ]);

      const aiMessage: Message = {
        id: `ai-${Date.now()}-${Math.random()}`,
        content: response,
        sender: 'ai',
        timestamp: new Date(),
      };

      if (user && persistentChat.currentChatId) {
        // Add AI response to persistent chat
        await persistentChat.addMessageToCurrentChat('assistant', response);
      } else {
        // Add AI response to local state for guests
        setMessages(prev => [...prev, aiMessage]);
        
        // Save to session manager for guests
        sessionManager.addToConversation(content.trim(), response);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}-${Math.random()}`,
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };

      if (user && persistentChat.currentChatId) {
        await persistentChat.addMessageToCurrentChat('assistant', errorMessage.content);
      } else {
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsTyping(false);
    }
  }, [user, messages, persistentChat]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    if (!user) {
      sessionManager.clearCurrentSession();
    }
  }, [user]);

  const loadConversation = useCallback(async (sessionId: string) => {
    if (user) {
      // For authenticated users, load from persistent chat
      await persistentChat.loadChat(sessionId);
    } else {
      // For guests, load from session manager
      const session = sessionManager.getSession(sessionId);
      if (session) {
        sessionManager.setCurrentSession(sessionId);
        const sessionMessages: Message[] = [];
        session.conversationHistory.forEach(entry => {
          sessionMessages.push({
            id: `user-${entry.timestamp}`,
            content: entry.query,
            sender: 'user',
            timestamp: new Date(entry.timestamp),
          });
          sessionMessages.push({
            id: `ai-${entry.timestamp}`,
            content: entry.response,
            sender: 'ai',
            timestamp: new Date(entry.timestamp + 1000),
          });
        });
        setMessages(sessionMessages);
      }
    }
  }, [user, persistentChat]);

  return (
    <ChatContext.Provider value={{
      messages,
      isTyping,
      sendMessage,
      clearMessages,
      setMessages,
      loadConversation,
    }}>
      {children}
    </ChatContext.Provider>
  );
};
