
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSavedChats } from '@/contexts/SavedChatsContext';
import { useAuth } from '@/contexts/AuthContext';
import { ThinkTankAIService } from '@/services/thinkTankAI';
import { sessionManager, type ChatSession } from '@/services/sessionManager';
import { UploadedFile } from '@/components/FileUpload';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isLoading?: boolean;
  files?: UploadedFile[];
  metadata?: {
    threadId?: string;
    runId?: string;
    assistantId?: string;
  };
}

interface ChatContextType {
  messages: Message[];
  isTyping: boolean;
  sendMessage: (content: string, files?: UploadedFile[]) => Promise<void>;
  retryLastMessage: () => Promise<void>;
  clearMessages: () => void;
  setMessages: (messages: Message[]) => void;
  loadConversation: (sessionId: string) => void;
  startNewConversation: () => void;
  currentSession: ChatSession | null;
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
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);

  const { saveCurrentChat } = useSavedChats();
  const { user } = useAuth();

  // Initialize session management
  useEffect(() => {
    const initializeSession = async () => {
      if (user) {
        // Load user sessions from database
        await sessionManager.loadUserSessions(user.id);
      }

      // Get or create current session
      let session = sessionManager.getCurrentSession();
      if (!session) {
        session = sessionManager.createSession(user?.id || null);
      }

      setCurrentSession(session);
      
      // Convert session history to messages
      if (session.conversationHistory.length > 0) {
        const sessionMessages: Message[] = [];
        session.conversationHistory.forEach((item, index) => {
          sessionMessages.push({
            id: `${item.timestamp}_user_${index}`,
            content: item.query,
            sender: 'user',
            timestamp: new Date(item.timestamp)
          });
          sessionMessages.push({
            id: `${item.timestamp}_ai_${index}`,
            content: item.response,
            sender: 'ai',
            timestamp: new Date(item.timestamp + 1000),
            metadata: item.metadata
          });
        });
        setMessages(sessionMessages);
      }
    };

    initializeSession();

    // Cleanup expired sessions periodically
    const cleanup = setInterval(() => {
      sessionManager.cleanupSessions();
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(cleanup);
  }, [user]);

  // Auto-save session when messages change (for legacy compatibility)
  useEffect(() => {
    if (messages.length > 0 && user) {
      saveCurrentChat(messages);
    }
  }, [messages, saveCurrentChat, user]);

  const sendMessage = useCallback(async (content: string, files?: UploadedFile[]) => {
    if (!user && !currentSession) {
      console.error('No session available for message');
      return;
    }

    const userId = user?.id || 'anonymous';

    if (!content.trim()) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date(),
      files: files?.length ? files : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      console.log('Sending message with session context:', content);
      
      const result = await ThinkTankAIService.sendMessage(content, userId);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: result.response,
        sender: 'ai',
        timestamp: new Date(),
        metadata: {
          threadId: result.threadId,
          runId: result.runId,
          assistantId: result.assistantId,
        },
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update current session state
      const updatedSession = sessionManager.getCurrentSession();
      setCurrentSession(updatedSession);
      
    } catch (error) {
      console.error('Think Tank AI error:', error);
      
      let errorMessage = 'I apologize, but I\'m having trouble connecting to the Think Tank AI system right now. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Think Tank AI service error')) {
          errorMessage = 'There was an issue with the Think Tank AI Assistant. Please check your connection and try again.';
        } else if (error.message.includes('Azure OpenAI API key not configured')) {
          errorMessage = 'The Think Tank AI service is not properly configured. Please contact your administrator.';
        } else {
          errorMessage = `Think Tank AI Error: ${error.message}`;
        }
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: errorMessage,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [user, currentSession]);

  const retryLastMessage = useCallback(async () => {
    const lastUserMessage = [...messages].reverse().find(msg => msg.sender === 'user');
    if (lastUserMessage) {
      // Remove the last AI response if it exists
      setMessages(prev => {
        const lastIndex = prev.length - 1;
        if (lastIndex >= 0 && prev[lastIndex].sender === 'ai') {
          return prev.slice(0, -1);
        }
        return prev;
      });
      
      await sendMessage(lastUserMessage.content, lastUserMessage.files);
    }
  }, [messages, sendMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const startNewConversation = useCallback(() => {
    const userId = user?.id || null;
    const newSession = sessionManager.createSession(userId);
    setCurrentSession(newSession);
    setMessages([]);
    console.log('Started new conversation:', newSession.id);
  }, [user]);

  const loadConversation = useCallback(async (sessionId: string) => {
    try {
      const userId = user?.id || 'anonymous';
      await sessionManager.loadUserSessions(userId);
      sessionManager.setCurrentSession(sessionId);
      
      const session = sessionManager.getCurrentSession();
      if (session) {
        setCurrentSession(session);
        
        // Convert session history to messages
        const sessionMessages: Message[] = [];
        session.conversationHistory.forEach((item, index) => {
          sessionMessages.push({
            id: `${item.timestamp}_user_${index}`,
            content: item.query,
            sender: 'user',
            timestamp: new Date(item.timestamp)
          });
          sessionMessages.push({
            id: `${item.timestamp}_ai_${index}`,
            content: item.response,
            sender: 'ai',
            timestamp: new Date(item.timestamp + 1000),
            metadata: item.metadata
          });
        });
        setMessages(sessionMessages);
        console.log('Loaded conversation:', sessionId, 'with', sessionMessages.length, 'messages');
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  }, [user]);

  return (
    <ChatContext.Provider value={{
      messages,
      isTyping,
      sendMessage,
      retryLastMessage,
      clearMessages,
      setMessages,
      loadConversation,
      startNewConversation,
      currentSession,
    }}>
      {children}
    </ChatContext.Provider>
  );
};
