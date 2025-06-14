import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger } from '../config/logger.js';

export interface LiteLLMRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string | Array<any>;
  }>;
  max_tokens: number;
  temperature?: number;
  stream?: boolean;
  stop?: string[];
  top_p?: number;
  top_k?: number;
  tools?: Array<{
    type: string;
    function: {
      name: string;
      description: string;
      parameters: Record<string, any>;
    };
  }>;
  tool_choice?: string | { type: string; function: { name: string } };
  api_key?: string;
}

export interface LiteLLMResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: {
          name: string;
          arguments: string;
        };
      }>;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LiteLLMStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
      tool_calls?: Array<{
        index?: number;
        id?: string;
        type?: string;
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class LiteLLMClient {
  private axiosInstance: AxiosInstance;
  private baseURL: string;

  constructor(baseURL?: string) {
    // Default to local LiteLLM proxy if no URL provided
    this.baseURL = baseURL || 'http://localhost:4000';
    
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 60000, // 60 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request/response interceptors for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        logger.debug(`LiteLLM Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('LiteLLM Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response) => {
        logger.debug(`LiteLLM Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('LiteLLM Response Error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  async completion(request: LiteLLMRequest): Promise<LiteLLMResponse> {
    try {
      logger.debug('LiteLLM completion request', { 
        model: request.model, 
        messageCount: request.messages.length,
        stream: request.stream 
      });

      const response: AxiosResponse<LiteLLMResponse> = await this.axiosInstance.post('/chat/completions', request);
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown LiteLLM error';
      const statusCode = error.response?.status || 500;
      
      logger.error('LiteLLM completion error', {
        message: errorMessage,
        statusCode,
        model: request.model,
      });

      throw new Error(`LiteLLM Error (${statusCode}): ${errorMessage}`);
    }
  }

  async *streamCompletion(request: LiteLLMRequest): AsyncGenerator<LiteLLMStreamChunk, void, unknown> {
    try {
      logger.debug('LiteLLM stream completion request', { 
        model: request.model, 
        messageCount: request.messages.length 
      });

      const response = await this.axiosInstance.post('/chat/completions', 
        { ...request, stream: true },
        {
          responseType: 'stream',
          headers: {
            'Accept': 'text/event-stream',
          },
        }
      );

      const stream = response.data;
      let buffer = '';

      for await (const chunk of stream) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = line.substring(6).trim();
            if (data === '[DONE]') {
              return;
            }
            
            try {
              const parsed: LiteLLMStreamChunk = JSON.parse(data);
              yield parsed;
            } catch (parseError) {
              logger.warn('Failed to parse stream chunk', { data, error: parseError });
            }
          }
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown LiteLLM stream error';
      const statusCode = error.response?.status || 500;
      
      logger.error('LiteLLM stream error', {
        message: errorMessage,
        statusCode,
        model: request.model,
      });

      throw new Error(`LiteLLM Stream Error (${statusCode}): ${errorMessage}`);
    }
  }

  async tokenCount(request: Omit<LiteLLMRequest, 'max_tokens'>): Promise<{ input_tokens: number }> {
    try {
      logger.debug('LiteLLM token count request', { 
        model: request.model, 
        messageCount: request.messages.length 
      });

      const response = await this.axiosInstance.post('/token/count', request);
      
      return { input_tokens: response.data.token_count || 0 };
    } catch (error: any) {
      logger.warn('LiteLLM token count failed, using fallback estimate', {
        error: error.message,
        model: request.model,
      });

      // Fallback: rough estimate based on character count
      const textLength = request.messages
        .map(msg => typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content))
        .join(' ')
        .length;
      
      const estimatedTokens = Math.ceil(textLength / 4); // Rough estimate: 4 chars per token
      return { input_tokens: estimatedTokens };
    }
  }
}

// Default client instance
export const litellmClient = new LiteLLMClient();