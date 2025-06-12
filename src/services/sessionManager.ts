
export interface ConversationEntry {
  query: string;
  response: string;
  timestamp: number;
  metadata?: {
    runId?: string;
    assistantId?: string;
    threadId?: string;
  };
}

export interface Session {
  id: string;
  conversationHistory: ConversationEntry[];
  createdAt: number;
  lastAccessed: number;
  assistantId?: string;
  threadId?: string;
  lastActivity: number;
}

class SessionManager {
  private currentSessionId: string | null = null;
  private sessions: Map<string, Session> = new Map();

  getCurrentSession(): Session | null {
    if (!this.currentSessionId) return null;
    return this.sessions.get(this.currentSessionId) || null;
  }

  getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null;
  }

  getUserSessions(): Session[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.lastActivity - a.lastActivity);
  }

  setCurrentSession(sessionId: string): void {
    this.currentSessionId = sessionId;
  }

  createSession(userId: string): Session {
    const sessionId = `session-${Date.now()}-${userId}`;
    const session: Session = {
      id: sessionId,
      conversationHistory: [],
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      lastActivity: Date.now()
    };
    this.sessions.set(sessionId, session);
    this.currentSessionId = sessionId;
    return session;
  }

  createNewSession(): string {
    const sessionId = `session-${Date.now()}`;
    this.sessions.set(sessionId, {
      id: sessionId,
      conversationHistory: [],
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      lastActivity: Date.now()
    });
    this.currentSessionId = sessionId;
    return sessionId;
  }

  addToConversation(query: string, response: string): void {
    if (!this.currentSessionId) {
      this.currentSessionId = `session-${Date.now()}`;
      this.sessions.set(this.currentSessionId, {
        id: this.currentSessionId,
        conversationHistory: [],
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        lastActivity: Date.now()
      });
    }

    const session = this.sessions.get(this.currentSessionId);
    if (session) {
      session.conversationHistory.push({
        query,
        response,
        timestamp: Date.now()
      });
      session.lastAccessed = Date.now();
      session.lastActivity = Date.now();
    }
  }

  addToHistory(query: string, response: string, metadata?: { runId?: string; assistantId?: string; threadId?: string }): void {
    if (!this.currentSessionId) return;

    const session = this.sessions.get(this.currentSessionId);
    if (session) {
      session.conversationHistory.push({
        query,
        response,
        timestamp: Date.now(),
        metadata
      });
      session.lastAccessed = Date.now();
      session.lastActivity = Date.now();
    }
  }

  updateSessionAI(assistantId: string, threadId: string): void {
    if (!this.currentSessionId) return;

    const session = this.sessions.get(this.currentSessionId);
    if (session) {
      session.assistantId = assistantId;
      session.threadId = threadId;
      session.lastActivity = Date.now();
    }
  }

  getConversationContext(): string | null {
    const session = this.getCurrentSession();
    if (!session || session.conversationHistory.length === 0) return null;

    return session.conversationHistory
      .slice(-3) // Get last 3 exchanges for context
      .map(entry => `User: ${entry.query}\nAssistant: ${entry.response}`)
      .join('\n\n');
  }

  clearCurrentSession(): void {
    if (this.currentSessionId) {
      this.sessions.delete(this.currentSessionId);
      this.currentSessionId = null;
    }
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }
  }

  async saveCurrentSession(): Promise<void> {
    // This would typically save to a backend service
    console.log('Saving current session');
  }

  async loadUserSessions(userId: string): Promise<void> {
    // This would typically load from a backend service
    console.log('Loading user sessions for:', userId);
  }
}

export const sessionManager = new SessionManager();
