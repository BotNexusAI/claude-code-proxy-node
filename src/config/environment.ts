import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface Config {
  server: {
    port: number;
    host: string;
  };
  api: {
    anthropic: string | undefined;
    openai: string | undefined;
    gemini: string | undefined;
  };
  models: {
    preferredProvider: 'openai' | 'google';
    bigModel: string;
    smallModel: string;
    openaiModels: string[];
    geminiModels: string[];
  };
  logging: {
    level: string;
  };
}

// OpenAI models
const OPENAI_MODELS = [
  'o3-mini',
  'o1',
  'o1-mini',
  'o1-pro',
  'gpt-4.5-preview',
  'gpt-4o',
  'gpt-4o-audio-preview',
  'chatgpt-4o-latest',
  'gpt-4o-mini',
  'gpt-4o-mini-audio-preview',
  'gpt-4.1',
  'gpt-4.1-mini',
];

// Gemini models
const GEMINI_MODELS = [
  'gemini-2.5-pro-preview-03-25',
  'gemini-2.0-flash',
];

// Get preferred provider
const preferredProvider = (process.env.PREFERRED_PROVIDER?.toLowerCase() || 'openai') as 'openai' | 'google';

// Default models based on provider preference
const defaultBigModel = preferredProvider === 'google' ? 'gemini-2.5-pro-preview-03-25' : 'gpt-4.1';
const defaultSmallModel = preferredProvider === 'google' ? 'gemini-2.0-flash' : 'gpt-4.1-mini';

export const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '8083', 10), // Changed default port to avoid conflict
    host: process.env.HOST || '0.0.0.0',
  },
  api: {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
  },
  models: {
    preferredProvider,
    bigModel: process.env.BIG_MODEL || defaultBigModel,
    smallModel: process.env.SMALL_MODEL || defaultSmallModel,
    openaiModels: OPENAI_MODELS,
    geminiModels: GEMINI_MODELS,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'warn',
  },
};

// Validation
export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.api.openai && !config.api.gemini) {
    errors.push('At least one of OPENAI_API_KEY or GEMINI_API_KEY must be provided');
  }

  if (config.models.preferredProvider === 'google' && !config.api.gemini) {
    errors.push('GEMINI_API_KEY is required when PREFERRED_PROVIDER is "google"');
  }

  if (config.models.preferredProvider === 'openai' && !config.api.openai) {
    errors.push('OPENAI_API_KEY is required when PREFERRED_PROVIDER is "openai"');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}