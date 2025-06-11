
export interface ConversationEntry {
  query: string;
  response: string;
  timestamp: number;
}

export interface Session {
  id: string;
  conversationHistory: ConversationEntry[];
  createdAt: number;
  lastAccessed: number;
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

  setCurrentSession(sessionId: string): void {
    this.currentSessionId = sessionId;
  }

  addToConversation(query: string, response: string): void {
    if (!this.currentSessionId) {
      this.currentSessionId = `session-${Date.now()}`;
      this.sessions.set(this.currentSessionId, {
        id: this.currentSessionId,
        conversationHistory: [],
        createdAt: Date.now(),
        lastAccessed: Date.now()
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
    }
  }

  clearCurrentSession(): void {
    if (this.currentSessionId) {
      this.sessions.delete(this.currentSessionId);
      this.currentSessionId = null;
    }
  }

  createNewSession(): string {
    const sessionId = `session-${Date.now()}`;
    this.sessions.set(sessionId, {
      id: sessionId,
      conversationHistory: [],
      createdAt: Date.now(),
      lastAccessed: Date.now()
    });
    this.currentSessionId = sessionId;
    return sessionId;
  }
}

export const sessionManager = new SessionManager();
