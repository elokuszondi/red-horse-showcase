
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/contexts/ChatContext';
import { dbChatToSavedChat, savedChatToDbChat, type SavedChat, type DatabaseChat } from '@/types/supabase';

interface SavedChatsContextType {
  savedChats: SavedChat[];
  currentChatId: string | null;
  createNewChat: () => void;
  saveCurrentChat: (messages: Message[]) => void;
  loadChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  setCurrentChatId: (chatId: string | null) => void;
  isLoading: boolean;
}

const SavedChatsContext = createContext<SavedChatsContextType | undefined>(undefined);

export const useSavedChats = () => {
  const context = useContext(SavedChatsContext);
  if (!context) {
    throw new Error('useSavedChats must be used within a SavedChatsProvider');
  }
  return context;
};

export const SavedChatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Load chats from database on mount and auth changes
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await loadChatsFromDatabase();
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadChatsFromDatabase();
        } else if (event === 'SIGNED_OUT') {
          setSavedChats([]);
          setCurrentChatId(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadChatsFromDatabase = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading chats:', error);
        return;
      }

      const chats: SavedChat[] = (data as DatabaseChat[] || []).map(dbChatToSavedChat);
      setSavedChats(chats);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = useCallback(() => {
    if (!user) return;
    
    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);
  }, [user]);

  const saveCurrentChat = useCallback(async (messages: Message[]) => {
    if (!user || messages.length === 0) return;

    setIsLoading(true);
    const title = messages[0]?.content?.slice(0, 50) + '...' || 'New Conversation';
    
    try {
      // Check if this is an existing chat or a new one
      const existingChat = savedChats.find(chat => 
        chat.messages.length > 0 && 
        chat.messages[0]?.id === messages[0]?.id
      );

      if (existingChat) {
        // Update existing chat
        const updatedChat: SavedChat = {
          ...existingChat,
          title,
          messages,
          updatedAt: new Date()
        };

        const dbChatData = savedChatToDbChat(updatedChat, user.id);

        const { error } = await supabase
          .from('chats')
          .update(dbChatData)
          .eq('id', existingChat.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating chat:', error);
          return;
        }

        setSavedChats(prev => 
          prev.map(chat => 
            chat.id === existingChat.id ? updatedChat : chat
          )
        );
      } else {
        // Create new chat
        const newChat: SavedChat = {
          id: currentChatId || Date.now().toString(),
          title,
          messages,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const dbChatData = savedChatToDbChat(newChat, user.id);

        const { data, error } = await supabase
          .from('chats')
          .insert({
            id: newChat.id,
            title: dbChatData.title!,
            user_id: dbChatData.user_id!,
            messages: dbChatData.messages!,
            created_at: new Date().toISOString(),
            updated_at: dbChatData.updated_at!
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating chat:', error);
          return;
        }

        const savedChat = dbChatToSavedChat(data as DatabaseChat);
        setSavedChats(prev => [savedChat, ...prev]);
        setCurrentChatId(savedChat.id);
      }
    } catch (error) {
      console.error('Error saving chat:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, savedChats, currentChatId]);

  const loadChat = useCallback((chatId: string) => {
    const chat = savedChats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
    }
  }, [savedChats]);

  const deleteChat = useCallback(async (chatId: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting chat:', error);
        return;
      }

      setSavedChats(prev => prev.filter(chat => chat.id !== chatId));
      
      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentChatId, user]);

  return (
    <SavedChatsContext.Provider value={{
      savedChats,
      currentChatId,
      createNewChat,
      saveCurrentChat,
      loadChat,
      deleteChat,
      setCurrentChatId,
      isLoading,
    }}>
      {children}
    </SavedChatsContext.Provider>
  );
};
