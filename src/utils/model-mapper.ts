import { config } from '../config/environment.js';

export interface ModelMapping {
  originalModel: string;
  mappedModel: string;
  provider: 'openai' | 'gemini' | 'anthropic';
  wasMapped: boolean;
}

export function mapModel(inputModel: string): ModelMapping {
  const originalModel = inputModel;
  let mappedModel = inputModel;
  let wasMapped = false;

  // Remove provider prefixes for easier matching
  let cleanModel = inputModel;
  if (cleanModel.startsWith('anthropic/')) {
    cleanModel = cleanModel.substring(10);
  } else if (cleanModel.startsWith('openai/')) {
    cleanModel = cleanModel.substring(7);
  } else if (cleanModel.startsWith('gemini/')) {
    cleanModel = cleanModel.substring(7);
  }

  // Map Haiku to SMALL_MODEL based on provider preference
  if (cleanModel.toLowerCase().includes('haiku')) {
    if (config.models.preferredProvider === 'google' && 
        config.models.geminiModels.includes(config.models.smallModel)) {
      mappedModel = `gemini/${config.models.smallModel}`;
      wasMapped = true;
    } else {
      mappedModel = `openai/${config.models.smallModel}`;
      wasMapped = true;
    }
  }
  // Map Sonnet to BIG_MODEL based on provider preference
  else if (cleanModel.toLowerCase().includes('sonnet')) {
    if (config.models.preferredProvider === 'google' && 
        config.models.geminiModels.includes(config.models.bigModel)) {
      mappedModel = `gemini/${config.models.bigModel}`;
      wasMapped = true;
    } else {
      mappedModel = `openai/${config.models.bigModel}`;
      wasMapped = true;
    }
  }
  // Add prefixes to non-mapped models if they match known lists
  else {
    if (config.models.geminiModels.includes(cleanModel) && !inputModel.startsWith('gemini/')) {
      mappedModel = `gemini/${cleanModel}`;
      wasMapped = true;
    } else if (config.models.openaiModels.includes(cleanModel) && !inputModel.startsWith('openai/')) {
      mappedModel = `openai/${cleanModel}`;
      wasMapped = true;
    }
  }

  // Determine provider
  let provider: 'openai' | 'gemini' | 'anthropic';
  if (mappedModel.startsWith('openai/')) {
    provider = 'openai';
  } else if (mappedModel.startsWith('gemini/')) {
    provider = 'gemini';
  } else {
    provider = 'anthropic';
  }

  return {
    originalModel,
    mappedModel,
    provider,
    wasMapped,
  };
}

export function getCleanModelName(model: string): string {
  if (model.startsWith('openai/')) {
    return model.substring(7);
  } else if (model.startsWith('gemini/')) {
    return model.substring(7);
  } else if (model.startsWith('anthropic/')) {
    return model.substring(10);
  }
  return model;
}