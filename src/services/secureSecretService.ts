
import { supabase } from '@/integrations/supabase/client';

interface SecretStorageRequest {
  secret: string;
  keyName?: string;
}

interface SecretStorageResponse {
  success: boolean;
  message?: string;
  error?: string;
}

class SecureSecretService {
  private static readonly MAX_REQUESTS_PER_MINUTE = 3;
  private static requestCounts = new Map<string, { count: number; resetTime: number }>();

  private static checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requestCounts.get(userId);

    if (!userRequests || now > userRequests.resetTime) {
      // Reset or initialize counter
      this.requestCounts.set(userId, {
        count: 1,
        resetTime: now + 60000 // 1 minute from now
      });
      return true;
    }

    if (userRequests.count >= this.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }

    userRequests.count++;
    return true;
  }

  static async storeSecret(request: SecretStorageRequest): Promise<SecretStorageResponse> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check rate limit
      if (!this.checkRateLimit(user.id)) {
        return { 
          success: false, 
          error: 'Too many requests. Please wait before trying again.' 
        };
      }

      // Validate secret
      if (!request.secret || request.secret.trim().length === 0) {
        return { success: false, error: 'Secret value cannot be empty' };
      }

      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { success: false, error: 'No valid session found' };
      }

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('store-secret', {
        body: {
          secret: request.secret,
          key_name: request.keyName
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        return { success: false, error: 'Failed to store secret securely' };
      }

      return data as SecretStorageResponse;

    } catch (error) {
      console.error('Secret storage error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  static async retrieveSecret(keyName: string): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_secrets')
        .select('secret_value')
        .eq('user_id', user.id)
        .eq('key_name', keyName)
        .single();

      if (error || !data) return null;
      
      return data.secret_value;
    } catch (error) {
      console.error('Secret retrieval error:', error);
      return null;
    }
  }
}

export default SecureSecretService;
