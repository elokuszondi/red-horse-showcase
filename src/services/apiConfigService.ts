
import { supabase } from '@/integrations/supabase/client';

interface ApiConfig {
  configName: string;
  apiKey: string;
  endpointUrl: string;
}

interface ApiConfigResponse {
  success: boolean;
  data?: any;
  error?: string;
}

class ApiConfigService {
  private static readonly EDGE_FUNCTION_NAME = 'auth-config-manager';

  static async saveApiConfig(config: ApiConfig): Promise<ApiConfigResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { success: false, error: 'No active session found' };
      }

      const { data, error } = await supabase.functions.invoke(this.EDGE_FUNCTION_NAME, {
        body: {
          config_name: config.configName,
          api_key: config.apiKey,
          endpoint_url: config.endpointUrl,
          action: 'save'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        return { success: false, error: 'Failed to save API configuration' };
      }

      return { success: true, data };
    } catch (error) {
      console.error('API config save error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  static async getApiConfig(configName: string): Promise<ApiConfigResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { success: false, error: 'No active session found' };
      }

      const { data, error } = await supabase.functions.invoke(this.EDGE_FUNCTION_NAME, {
        body: {
          config_name: configName,
          action: 'get'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        return { success: false, error: 'Failed to retrieve API configuration' };
      }

      return { success: true, data };
    } catch (error) {
      console.error('API config get error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  static async listApiConfigs(): Promise<ApiConfigResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { success: false, error: 'No active session found' };
      }

      const { data, error } = await supabase.functions.invoke(this.EDGE_FUNCTION_NAME, {
        body: {
          action: 'list'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        return { success: false, error: 'Failed to list API configurations' };
      }

      return { success: true, data };
    } catch (error) {
      console.error('API config list error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  static async deleteApiConfig(configName: string): Promise<ApiConfigResponse> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { success: false, error: 'No active session found' };
      }

      const { data, error } = await supabase.functions.invoke(this.EDGE_FUNCTION_NAME, {
        body: {
          config_name: configName,
          action: 'delete'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        return { success: false, error: 'Failed to delete API configuration' };
      }

      return { success: true, data };
    } catch (error) {
      console.error('API config delete error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
}

export default ApiConfigService;
