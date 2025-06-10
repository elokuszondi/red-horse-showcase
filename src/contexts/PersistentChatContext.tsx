
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PersistentChatService, type PersistentChat, type PersistentMessage } from '@/services/persistentChatService';
import type { Message } from '@/contexts/ChatContext';

interface PersistentChatContextType {
  chats: PersistentChat[];
  currentChatId: string | null;
  currentMessages: Message[];
  isLoading: boolean;
  createNewChat: () => Promise<string | null>;
  loadChat: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  addMessageToCurrentChat: (role: 'user' | 'assistant', content: string, metadata?: any) => Promise<void>;
  updateCurrentChatTitle: (title: string) => Promise<void>;
  setCurrentChatId: (chatId: string | null) => void;
  refreshChats: () => Promise<void>;
}

const PersistentChatContext = createContext<PersistentChatContextType | undefined>(undefined);

export const usePersistentChat = () => {
  const context = useContext(PersistentChatContext);
  if (!context) {
    throw new Error('usePersistentChat must be used within a PersistentChatProvider');
  }
  return context;
};

export const PersistentChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<PersistentChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Load user chats when user changes
  useEffect(() => {
    if (user) {
      refreshChats();
    } else {
      setChats([]);
      setCurrentChatId(null);
      setCurrentMessages([]);
    }
  }, [user]);

  const refreshChats = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const userChats = await PersistentChatService.getUserChats(user.id);
      setChats(userChats);
    } catch (error) {
      console.error('Error refreshing chats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createNewChat = useCallback(async (): Promise<string | null> => {
    if (!user) return null;

    setIsLoading(true);
    try {
      const newChat = await PersistentChatService.createChat(user.id, 'New Conversation');
      if (newChat) {
        setChats(prev => [newChat, ...prev]);
        setCurrentChatId(newChat.id);
        setCurrentMessages([]);
        return newChat.id;
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, [user]);

  const loadChat = useCallback(async (chatId: string) => {
    setIsLoading(true);
    try {
      const messages = await PersistentChatService.getChatMessages(chatId);
      const convertedMessages = messages.map(PersistentChatService.persistentMessageToMessage);
      setCurrentMessages(convertedMessages);
      setCurrentChatId(chatId);
    } catch (error) {
      console.error('Error loading chat:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteChat = useCallback(async (chatId: string) => {
    setIsLoading(true);
    try {
      const success = await PersistentChatService.deleteChat(chatId);
      if (success) {
        setChats(prev => prev.filter(chat => chat.id !== chatId));
        if (currentChatId === chatId) {
          setCurrentChatId(null);
          setCurrentMessages([]);
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentChatId]);

  const addMessageToCurrentChat = useCallback(async (
    role: 'user' | 'assistant', 
    content: string, 
    metadata?: any
  ) => {
    if (!currentChatId) return;

    try {
      const persistentMessage = await PersistentChatService.addMessage(
        currentChatId, 
        role, 
        content, 
        metadata
      );
      
      if (persistentMessage) {
        const message = PersistentChatService.persistentMessageToMessage(persistentMessage);
        setCurrentMessages(prev => [...prev, message]);

        // Update the chat's updated_at timestamp in local state
        setChats(prev => prev.map(chat => 
          chat.id === currentChatId 
            ? { ...chat, updatedAt: new Date() }
            : chat
        ));
      }
    } catch (error) {
      console.error('Error adding message to chat:', error);
    }
  }, [currentChatId]);

  const updateCurrentChatTitle = useCallback(async (title: string) => {
    if (!currentChatId) return;

    try {
      const success = await PersistentChatService.updateChatTitle(currentChatId, title);
      if (success) {
        setChats(prev => prev.map(chat => 
          chat.id === currentChatId 
            ? { ...chat, title, updatedAt: new Date() }
            : chat
        ));
      }
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  }, [currentChatId]);

  return (
    <PersistentChatContext.Provider value={{
      chats,
      currentChatId,
      currentMessages,
      isLoading,
      createNewChat,
      loadChat,
      deleteChat,
      addMessageToCurrentChat,
      updateCurrentChatTitle,
      setCurrentChatId,
      refreshChats,
    }}>
      {children}
    </PersistentChatContext.Provider>
  );
};
