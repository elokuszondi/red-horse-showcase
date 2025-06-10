
import { supabase } from '@/integrations/supabase/client';

export interface ChatSession {
  id: string;
  assistantId?: string;
  threadId?: string;
  userId: string | null;
  conversationHistory: Array<{
    query: string;
    response: string;
    timestamp: number;
    metadata?: any;
  }>;
  createdAt: number;
  lastActivity: number;
  isGuest: boolean;
}

export interface SessionStorage {
  sessions: Map<string, ChatSession>;
  currentSessionId: string | null;
}

class SessionManager {
  private storage: SessionStorage = {
    sessions: new Map(),
    currentSessionId: null
  };

  private readonly GUEST_SESSION_KEY = 'thinktank_guest_sessions';
  private readonly CURRENT_SESSION_KEY = 'thinktank_current_session';
  private readonly MAX_HISTORY_LENGTH = 100;
  private readonly SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor() {
    this.loadSessions();
  }

  // Create new session
  createSession(userId: string | null = null): ChatSession {
    const sessionId = this.generateSessionId();
    const session: ChatSession = {
      id: sessionId,
      userId: userId,
      conversationHistory: [],
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isGuest: !userId
    };

    this.storage.sessions.set(sessionId, session);
    this.storage.currentSessionId = sessionId;
    this.persistSessions();

    console.log('Created new session:', sessionId, 'for user:', userId || 'guest');
    return session;
  }

  // Get current active session
  getCurrentSession(): ChatSession | null {
    if (!this.storage.currentSessionId) {
      return null;
    }
    return this.storage.sessions.get(this.storage.currentSessionId) || null;
  }

  // Set current session
  setCurrentSession(sessionId: string): void {
    if (this.storage.sessions.has(sessionId)) {
      this.storage.currentSessionId = sessionId;
      this.persistSessions();
    }
  }

  // Update session with AI interaction
  addToHistory(query: string, response: string, metadata?: any): void {
    const session = this.getCurrentSession();
    if (!session) return;

    session.conversationHistory.push({
      query,
      response,
      timestamp: Date.now(),
      metadata
    });

    // Prune history if too long
    if (session.conversationHistory.length > this.MAX_HISTORY_LENGTH) {
      session.conversationHistory = session.conversationHistory.slice(-this.MAX_HISTORY_LENGTH);
    }

    session.lastActivity = Date.now();
    this.persistSessions();
  }

  // Update session AI identifiers
  updateSessionAI(assistantId: string, threadId: string): void {
    const session = this.getCurrentSession();
    if (!session) return;

    session.assistantId = assistantId;
    session.threadId = threadId;
    this.persistSessions();
  }

  // Get conversation context for AI
  getConversationContext(): string {
    const session = this.getCurrentSession();
    if (!session || session.conversationHistory.length === 0) {
      return '';
    }

    // Return last 10 exchanges for context
    const recentHistory = session.conversationHistory.slice(-10);
    return recentHistory.map(item => 
      `Previous Query: ${item.query}\nPrevious Response: ${item.response.substring(0, 500)}...`
    ).join('\n\n');
  }

  // Load all user sessions (authenticated users)
  async loadUserSessions(userId: string): Promise<void> {
    try {
      const { data: chats, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Failed to load user sessions:', error);
        return;
      }

      // Convert saved chats to sessions
      chats?.forEach(chat => {
        const session: ChatSession = {
          id: chat.id,
          userId: userId,
          conversationHistory: this.convertMessagesToHistory(chat.messages),
          createdAt: new Date(chat.created_at).getTime(),
          lastActivity: new Date(chat.updated_at).getTime(),
          isGuest: false
        };
        this.storage.sessions.set(chat.id, session);
      });

    } catch (error) {
      console.error('Error loading user sessions:', error);
    }
  }

  // Save current session to database (authenticated users)
  async saveCurrentSession(): Promise<void> {
    const session = this.getCurrentSession();
    if (!session || session.isGuest || !session.userId) return;

    try {
      const messages = this.convertHistoryToMessages(session.conversationHistory);
      const title = this.generateSessionTitle(session);

      const { error } = await supabase
        .from('chats')
        .upsert({
          id: session.id,
          user_id: session.userId,
          title: title,
          messages: messages,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to save session:', error);
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  // Load sessions from storage
  private loadSessions(): void {
    try {
      // Load current session ID
      const currentSessionId = localStorage.getItem(this.CURRENT_SESSION_KEY);
      if (currentSessionId) {
        this.storage.currentSessionId = currentSessionId;
      }

      // Load guest sessions
      const guestData = localStorage.getItem(this.GUEST_SESSION_KEY);
      if (guestData) {
        const parsed = JSON.parse(guestData);
        Object.entries(parsed).forEach(([id, sessionData]: [string, any]) => {
          // Check if session hasn't expired
          if (Date.now() - sessionData.lastActivity < this.SESSION_TIMEOUT) {
            this.storage.sessions.set(id, sessionData);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load sessions from storage:', error);
    }
  }

  // Persist sessions to storage
  private persistSessions(): void {
    try {
      // Save current session ID
      if (this.storage.currentSessionId) {
        localStorage.setItem(this.CURRENT_SESSION_KEY, this.storage.currentSessionId);
      }

      // Save guest sessions only
      const guestSessions: Record<string, ChatSession> = {};
      this.storage.sessions.forEach((session, id) => {
        if (session.isGuest) {
          guestSessions[id] = session;
        }
      });

      localStorage.setItem(this.GUEST_SESSION_KEY, JSON.stringify(guestSessions));
    } catch (error) {
      console.error('Failed to persist sessions:', error);
    }
  }

  // Clear expired sessions
  cleanupSessions(): void {
    const now = Date.now();
    this.storage.sessions.forEach((session, id) => {
      if (now - session.lastActivity > this.SESSION_TIMEOUT) {
        this.storage.sessions.delete(id);
      }
    });
    this.persistSessions();
  }

  // Get all sessions for current user
  getUserSessions(): ChatSession[] {
    return Array.from(this.storage.sessions.values())
      .sort((a, b) => b.lastActivity - a.lastActivity);
  }

  // Delete session
  deleteSession(sessionId: string): void {
    this.storage.sessions.delete(sessionId);
    if (this.storage.currentSessionId === sessionId) {
      this.storage.currentSessionId = null;
    }
    this.persistSessions();
  }

  // Utility methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionTitle(session: ChatSession): string {
    if (session.conversationHistory.length === 0) {
      return 'New Conversation';
    }
    const firstQuery = session.conversationHistory[0].query;
    return firstQuery.length > 50 ? firstQuery.substring(0, 50) + '...' : firstQuery;
  }

  private convertMessagesToHistory(messages: any): ChatSession['conversationHistory'] {
    const history: ChatSession['conversationHistory'] = [];
    
    try {
      let parsedMessages: any[] = [];
      
      // Handle different types of Json input
      if (typeof messages === 'string') {
        parsedMessages = JSON.parse(messages);
      } else if (Array.isArray(messages)) {
        parsedMessages = messages;
      } else if (messages === null || messages === undefined) {
        return history;
      } else {
        console.warn('Unexpected messages format:', typeof messages, messages);
        return history;
      }

      // Ensure we have an array
      if (!Array.isArray(parsedMessages)) {
        console.warn('Messages is not an array after parsing:', parsedMessages);
        return history;
      }

      // Convert pairs of messages to history entries
      for (let i = 0; i < parsedMessages.length; i += 2) {
        const userMsg = parsedMessages[i];
        const aiMsg = parsedMessages[i + 1];
        if (userMsg && aiMsg && userMsg.sender === 'user' && aiMsg.sender === 'ai') {
          history.push({
            query: userMsg.content || '',
            response: aiMsg.content || '',
            timestamp: userMsg.timestamp ? new Date(userMsg.timestamp).getTime() : Date.now(),
            metadata: aiMsg.metadata
          });
        }
      }
    } catch (error) {
      console.error('Error converting messages to history:', error);
    }
    
    return history;
  }

  private convertHistoryToMessages(history: ChatSession['conversationHistory']): any[] {
    const messages: any[] = [];
    history.forEach(item => {
      messages.push({
        id: `${item.timestamp}_user`,
        content: item.query,
        sender: 'user',
        timestamp: new Date(item.timestamp)
      });
      messages.push({
        id: `${item.timestamp}_ai`,
        content: item.response,
        sender: 'ai',
        timestamp: new Date(item.timestamp + 1000),
        metadata: item.metadata
      });
    });
    return messages;
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
