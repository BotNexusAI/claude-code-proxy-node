import { createApp } from './app.js';
import { config, validateConfig } from './config/environment.js';
import { logger } from './config/logger.js';
import { findAvailablePort } from './utils/port-finder.js';

async function startServer(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();
    
    // Find available port
    const availablePort = await findAvailablePort(config.server.port);
    if (availablePort !== config.server.port) {
      logger.info(`🔄 Port ${config.server.port} was busy, using port ${availablePort} instead`);
    }
    
    // Create Express app
    const app = createApp();
    
    // Start server
    const server = app.listen(availablePort, config.server.host, () => {
      logger.info(`🚀 Server running on http://${config.server.host}:${availablePort}`);
      logger.info(`📋 Set ANTHROPIC_BASE_URL=http://localhost:${availablePort} to use this proxy`);
      logger.info(`📊 Preferred provider: ${config.models.preferredProvider}`);
      logger.info(`🔑 API keys configured: OpenAI=${!!config.api.openai}, Gemini=${!!config.api.gemini}, Anthropic=${!!config.api.anthropic}`);
      logger.info(`🎯 Model mapping: ${config.models.bigModel} (big), ${config.models.smallModel} (small)`);
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      logger.info(`📴 Received ${signal}, shutting down gracefully...`);
      server.close(() => {
        logger.info('✅ Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  logger.error('❌ Unhandled server error:', error);
  process.exit(1);
});