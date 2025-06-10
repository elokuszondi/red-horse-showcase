
import type { Json } from '@/integrations/supabase/types';
import type { Message } from '@/contexts/ChatContext';

export interface DatabaseChat {
  id: string;
  user_id: string;
  title: string;
  messages: Json;
  created_at: string;
  updated_at: string;
}

export interface SavedChat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// Type guard to check if an object is a valid Message
const isMessage = (obj: any): obj is Message => {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.sender === 'string' &&
    (obj.timestamp instanceof Date || typeof obj.timestamp === 'string');
};

// Conversion utilities
export const dbChatToSavedChat = (dbChat: DatabaseChat): SavedChat => {
  let messages: Message[] = [];
  
  try {
    if (typeof dbChat.messages === 'string') {
      messages = JSON.parse(dbChat.messages);
    } else if (Array.isArray(dbChat.messages)) {
      messages = (dbChat.messages as unknown as any[]).filter(isMessage);
    }
  } catch (error) {
    console.error('Error parsing chat messages:', error);
    messages = [];
  }

  return {
    id: dbChat.id,
    title: dbChat.title,
    messages: messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    })),
    createdAt: new Date(dbChat.created_at),
    updatedAt: new Date(dbChat.updated_at)
  };
};

export const savedChatToDbChat = (chat: SavedChat, userId: string): Partial<DatabaseChat> => ({
  title: chat.title,
  user_id: userId,
  messages: JSON.stringify(chat.messages.map(msg => ({
    ...msg,
    timestamp: msg.timestamp.toISOString()
  }))),
  updated_at: new Date().toISOString()
});
