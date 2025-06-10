
import { supabase } from '@/integrations/supabase/client';
import { sessionManager } from './sessionManager';

interface ThinkTankAIResponse {
  response: string;
  assistantId: string;
  threadId: string;
  runId: string;
  timestamp: string;
}

interface ThinkTankAIError {
  error: string;
  details: string;
}

export class ThinkTankAIService {
  static async sendMessage(message: string, userId: string): Promise<ThinkTankAIResponse> {
    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    try {
      console.log('Sending message to Think Tank AI with session context:', message);

      // Get or create current session
      let currentSession = sessionManager.getCurrentSession();
      if (!currentSession) {
        currentSession = sessionManager.createSession(userId);
        console.log('Created new session for user:', userId);
      }

      // Prepare context-aware message
      const conversationContext = sessionManager.getConversationContext();
      const contextualMessage = conversationContext 
        ? `Previous conversation context:\n${conversationContext}\n\nCurrent query: ${message}`
        : message;

      // Check if we have existing assistant/thread for this session
      const useExistingSession = currentSession.assistantId && currentSession.threadId;
      
      const requestBody: any = {
        message: contextualMessage,
        file_ids: [] // For future file support
      };

      // If we have an existing session, try to continue it
      if (useExistingSession) {
        requestBody.assistantId = currentSession.assistantId;
        requestBody.threadId = currentSession.threadId;
        requestBody.continueSession = true;
      }

      const { data, error } = await supabase.functions.invoke('think-tank-assistant', {
        body: requestBody,
        headers: {
          'user-id': userId
        }
      });

      if (error) {
        console.error('Think Tank AI error:', error);
        throw new Error(`Think Tank AI service error: ${error.message}`);
      }

      if (!data || !data.response) {
        console.error('Invalid response from Think Tank AI:', data);
        throw new Error('Invalid response from Think Tank AI Assistant');
      }

      console.log('Think Tank AI response received:', {
        threadId: data.threadId,
        assistantId: data.assistantId,
        responseLength: data.response.length,
        sessionContinued: useExistingSession
      });

      // Update session with AI identifiers and conversation history
      sessionManager.updateSessionAI(data.assistantId, data.threadId);
      sessionManager.addToHistory(message, data.response, {
        runId: data.runId,
        assistantId: data.assistantId,
        threadId: data.threadId
      });

      // Save session for authenticated users
      if (userId && userId !== 'anonymous') {
        await sessionManager.saveCurrentSession();
      }

      return data as ThinkTankAIResponse;

    } catch (error) {
      console.error('Think Tank AI service error:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Unknown error occurred while communicating with Think Tank AI');
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      const testResponse = await this.sendMessage('Hello', 'test-user');
      return !!testResponse.response;
    } catch (error) {
      console.error('Think Tank AI connection test failed:', error);
      return false;
    }
  }

  // Get conversation history for current session
  static getConversationHistory(): Array<{query: string, response: string, timestamp: number}> {
    const session = sessionManager.getCurrentSession();
    return session ? session.conversationHistory : [];
  }

  // Start new conversation
  static startNewConversation(userId: string): void {
    sessionManager.createSession(userId);
  }

  // Load existing conversation
  static async loadConversation(sessionId: string, userId: string): Promise<boolean> {
    try {
      await sessionManager.loadUserSessions(userId);
      sessionManager.setCurrentSession(sessionId);
      return true;
    } catch (error) {
      console.error('Failed to load conversation:', error);
      return false;
    }
  }
}
