import { Router } from 'express';
import { config } from '../config/environment.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    config: {
      preferredProvider: config.models.preferredProvider,
      hasOpenAI: !!config.api.openai,
      hasGemini: !!config.api.gemini,
      hasAnthropic: !!config.api.anthropic,
    },
  };

  res.json(health);
});

healthRouter.get('/ready', (_req, res) => {
  // Check if at least one API key is configured
  const hasApiKey = config.api.openai || config.api.gemini || config.api.anthropic;
  
  if (!hasApiKey) {
    res.status(503).json({
      status: 'not ready',
      message: 'No API keys configured',
    });
    return;
  }

  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
});