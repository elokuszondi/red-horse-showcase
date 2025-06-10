
import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/contexts/ChatContext';

export interface PersistentChat {
  id: string;
  title: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersistentMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export class PersistentChatService {
  static async createChat(userId: string, title: string): Promise<PersistentChat | null> {
    try {
      const { data, error } = await supabase
        .from('user_chats')
        .insert({
          user_id: userId,
          title: title.slice(0, 100) // Ensure title isn't too long
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat:', error);
        return null;
      }

      return {
        id: data.id,
        title: data.title,
        userId: data.user_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  }

  static async getUserChats(userId: string): Promise<PersistentChat[]> {
    try {
      const { data, error } = await supabase
        .from('user_chats')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching user chats:', error);
        return [];
      }

      return data.map(chat => ({
        id: chat.id,
        title: chat.title,
        userId: chat.user_id,
        createdAt: new Date(chat.created_at),
        updatedAt: new Date(chat.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching user chats:', error);
      return [];
    }
  }

  static async getChatMessages(chatId: string): Promise<PersistentMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching chat messages:', error);
        return [];
      }

      return data.map(msg => ({
        id: msg.id,
        chatId: msg.chat_id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        metadata: msg.metadata
      }));
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }
  }

  static async addMessage(
    chatId: string, 
    role: 'user' | 'assistant', 
    content: string, 
    metadata?: any
  ): Promise<PersistentMessage | null> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          role,
          content,
          metadata: metadata || {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding message:', error);
        return null;
      }

      // Update chat's updated_at timestamp
      await supabase
        .from('user_chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);

      return {
        id: data.id,
        chatId: data.chat_id,
        role: data.role as 'user' | 'assistant',
        content: data.content,
        timestamp: new Date(data.timestamp),
        metadata: data.metadata
      };
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }

  static async updateChatTitle(chatId: string, title: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_chats')
        .update({ 
          title: title.slice(0, 100),
          updated_at: new Date().toISOString()
        })
        .eq('id', chatId);

      if (error) {
        console.error('Error updating chat title:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating chat title:', error);
      return false;
    }
  }

  static async deleteChat(chatId: string): Promise<boolean> {
    try {
      // Messages will be deleted automatically due to CASCADE
      const { error } = await supabase
        .from('user_chats')
        .delete()
        .eq('id', chatId);

      if (error) {
        console.error('Error deleting chat:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting chat:', error);
      return false;
    }
  }

  // Convert between legacy Message format and PersistentMessage
  static persistentMessageToMessage(persistentMsg: PersistentMessage): Message {
    return {
      id: persistentMsg.id,
      content: persistentMsg.content,
      sender: persistentMsg.role === 'user' ? 'user' : 'ai',
      timestamp: persistentMsg.timestamp,
      metadata: persistentMsg.metadata
    };
  }

  static messageToPersistentMessage(msg: Message, chatId: string): Omit<PersistentMessage, 'id' | 'timestamp'> {
    return {
      chatId,
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content,
      metadata: msg.metadata
    };
  }
}
