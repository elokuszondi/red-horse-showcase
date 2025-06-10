interface AzureConfig {
  endpoint: string;
  apiKey: string;
  deploymentName: string;
  apiVersion?: string;
  maxTokens?: number;
  temperature?: number;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AzureOpenAIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface RequestOptions {
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export class AzureOpenAIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'AzureOpenAIError';
  }
}

export class AzureOpenAIService {
  private static readonly DEFAULT_CONFIG = {
    apiVersion: '2024-12-01-preview',
    maxTokens: 4096,
    temperature: 1.0,
  };

  private static readonly CONFIG_STORAGE_KEY = 'azure-ai-config';
  
  private config: AzureConfig | null = null;

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      const stored = localStorage.getItem(AzureOpenAIService.CONFIG_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.validateConfig(parsed);
        this.config = { ...AzureOpenAIService.DEFAULT_CONFIG, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load Azure AI config from localStorage:', error);
      this.config = null;
    }
  }

  private validateConfig(config: any): void {
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid config format');
    }
    
    const required = ['endpoint', 'apiKey', 'deploymentName'];
    for (const field of required) {
      if (!config[field] || typeof config[field] !== 'string') {
        throw new Error(`Missing or invalid required field: ${field}`);
      }
    }

    // Validate endpoint format
    try {
      new URL(config.endpoint);
    } catch {
      throw new Error('Invalid endpoint URL format');
    }
  }

  updateConfig(config: Partial<AzureConfig>): void {
    const newConfig = { ...this.config, ...config };
    this.validateConfig(newConfig);
    
    this.config = { ...AzureOpenAIService.DEFAULT_CONFIG, ...newConfig };
    
    try {
      localStorage.setItem(
        AzureOpenAIService.CONFIG_STORAGE_KEY, 
        JSON.stringify(this.config)
      );
    } catch (error) {
      console.warn('Failed to save config to localStorage:', error);
    }
  }

  getConfig(): Readonly<AzureConfig> | null {
    return this.config ? { ...this.config } : null;
  }

  isConfigured(): boolean {
    return !!(
      this.config?.endpoint && 
      this.config?.apiKey && 
      this.config?.deploymentName
    );
  }

  private buildRequestUrl(): string {
    if (!this.config) {
      throw new AzureOpenAIError('Service not configured');
    }

    const { endpoint, deploymentName, apiVersion } = this.config;
    const baseUrl = endpoint.replace(/\/$/, '');
    return `${baseUrl}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
  }

  private buildRequestBody(
    messages: ChatMessage[], 
    options: RequestOptions = {}
  ): object {
    const body: any = {
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content.trim()
      })),
      model: this.config!.deploymentName,
      stream: false,
    };

    // Only include max_completion_tokens if explicitly provided and not the default
    const maxTokens = options.maxTokens ?? this.config!.maxTokens;
    if (maxTokens !== 4096) {
      body.max_completion_tokens = maxTokens;
    }

    // Only include temperature if explicitly provided and not the default
    const temperature = options.temperature ?? this.config!.temperature;
    if (temperature !== 1.0) {
      body.temperature = temperature;
    }

    return body;
  }

  async sendMessage(
    messages: ChatMessage[], 
    options: RequestOptions = {}
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new AzureOpenAIError(
        'Azure OpenAI is not configured. Please set up your API credentials.'
      );
    }

    if (!messages.length) {
      throw new AzureOpenAIError('Messages array cannot be empty');
    }

    const url = this.buildRequestUrl();
    const requestBody = this.buildRequestBody(messages, options);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config!.apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: options.signal,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      const data: AzureOpenAIResponse = await response.json();
      return this.extractMessageContent(data);

    } catch (error) {
      if (error instanceof AzureOpenAIError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new AzureOpenAIError('Request was cancelled');
        }
        throw new AzureOpenAIError(`Request failed: ${error.message}`);
      }
      
      throw new AzureOpenAIError('Unknown error occurred');
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}`;
    let errorCode: string | undefined;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.message || errorMessage;
      errorCode = errorData.error?.code || errorData.code;
    } catch {
      // If JSON parsing fails, use status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new AzureOpenAIError(
      `Azure OpenAI API error: ${errorMessage}`,
      response.status,
      errorCode
    );
  }

  private extractMessageContent(data: AzureOpenAIResponse): string {
    if (!data.choices?.length) {
      throw new AzureOpenAIError('No response choices received from Azure OpenAI');
    }

    const choice = data.choices[0];
    if (!choice.message?.content) {
      throw new AzureOpenAIError('Empty response content received from Azure OpenAI');
    }

    return choice.message.content.trim();
  }

  // Utility method for streaming responses (if needed later)
  async *sendMessageStream(
    messages: ChatMessage[], 
    options: RequestOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    // Implementation would go here for streaming responses
    // This is a placeholder for future enhancement
    throw new AzureOpenAIError('Streaming not yet implemented');
  }

  // Method to test the connection
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      await this.sendMessage([
        { role: 'user', content: 'Hello' }
      ], { maxTokens: 10 });
      return true;
    } catch {
      return false;
    }
  }

  // Clear stored configuration
  clearConfig(): void {
    this.config = null;
    try {
      localStorage.removeItem(AzureOpenAIService.CONFIG_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear config from localStorage:', error);
    }
  }
}

// Export singleton instance
export const azureOpenAIService = new AzureOpenAIService();
