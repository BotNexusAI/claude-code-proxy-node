import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { MessagesRequestSchema, TokenCountRequestSchema } from '../types/anthropic.js';
import { mapModel } from '../utils/model-mapper.js';
import { logModelMapping, logRequest } from '../config/logger.js';
import { createApiError } from '../middleware/errors.js';

export const messagesRouter = Router();

// POST /v1/messages
messagesRouter.post('/', async (req: Request, res: Response, next) => {
  try {
    // Parse and validate request
    const requestData = MessagesRequestSchema.parse(req.body);
    
    // Map the model
    const modelMapping = mapModel(requestData.model);
    
    if (modelMapping.wasMapped) {
      logModelMapping(modelMapping.originalModel, modelMapping.mappedModel);
    }

    // For now, return a simple response to test the structure
    const response = {
      id: `msg_${Date.now()}`,
      type: 'message',
      role: 'assistant',
      model: modelMapping.originalModel,
      content: [
        {
          type: 'text',
          text: `Hello! This is a test response from the Node.js proxy. You requested model: ${modelMapping.originalModel}, mapped to: ${modelMapping.mappedModel}`,
        },
      ],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 100,
        output_tokens: 50,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
      },
    };

    // Log the request
    logRequest(
      req.method,
      req.path,
      modelMapping.originalModel,
      modelMapping.mappedModel,
      requestData.messages.length,
      requestData.tools?.length || 0,
      200
    );

    if (requestData.stream) {
      // Handle streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Send message_start event
      const messageStart = {
        type: 'message_start',
        message: {
          id: response.id,
          type: 'message',
          role: 'assistant',
          model: response.model,
          content: [],
          stop_reason: null,
          stop_sequence: null,
          usage: {
            input_tokens: 0,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
            output_tokens: 0,
          },
        },
      };
      res.write(`event: message_start\ndata: ${JSON.stringify(messageStart)}\n\n`);

      // Send content_block_start event
      const blockStart = {
        type: 'content_block_start',
        index: 0,
        content_block: { type: 'text', text: '' },
      };
      res.write(`event: content_block_start\ndata: ${JSON.stringify(blockStart)}\n\n`);

      // Send content_block_delta events
      const text = response.content[0]?.text || '';
      const words = text.split(' ');
      
      for (let i = 0; i < words.length; i++) {
        const delta = {
          type: 'content_block_delta',
          index: 0,
          delta: { type: 'text_delta', text: words[i] + (i < words.length - 1 ? ' ' : '') },
        };
        res.write(`event: content_block_delta\ndata: ${JSON.stringify(delta)}\n\n`);
        
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Send content_block_stop event
      const blockStop = { type: 'content_block_stop', index: 0 };
      res.write(`event: content_block_stop\ndata: ${JSON.stringify(blockStop)}\n\n`);

      // Send message_delta event
      const messageDelta = {
        type: 'message_delta',
        delta: { stop_reason: 'end_turn', stop_sequence: null },
        usage: { output_tokens: 50 },
      };
      res.write(`event: message_delta\ndata: ${JSON.stringify(messageDelta)}\n\n`);

      // Send message_stop event
      const messageStop = { type: 'message_stop' };
      res.write(`event: message_stop\ndata: ${JSON.stringify(messageStop)}\n\n`);

      // Send final [DONE] marker
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      // Non-streaming response
      res.json(response);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(error);
    } else if (error instanceof Error) {
      next(createApiError(error.message, 500));
    } else {
      next(createApiError('Unknown error occurred', 500));
    }
  }
});

// POST /v1/messages/count_tokens
messagesRouter.post('/count_tokens', async (req: Request, res: Response, next) => {
  try {
    // Parse and validate request
    const requestData = TokenCountRequestSchema.parse(req.body);
    
    // Map the model
    const modelMapping = mapModel(requestData.model);
    
    if (modelMapping.wasMapped) {
      logModelMapping(modelMapping.originalModel, modelMapping.mappedModel);
    }

    // For now, return a simple token count estimate
    const textLength = requestData.messages
      .map(msg => typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content))
      .join(' ')
      .length;
    
    const estimatedTokens = Math.ceil(textLength / 4); // Rough estimate: 4 chars per token

    // Log the request
    logRequest(
      req.method,
      req.path,
      modelMapping.originalModel,
      modelMapping.mappedModel,
      requestData.messages.length,
      requestData.tools?.length || 0,
      200
    );

    res.json({
      input_tokens: estimatedTokens,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(error);
    } else if (error instanceof Error) {
      next(createApiError(error.message, 500));
    } else {
      next(createApiError('Unknown error occurred', 500));
    }
  }
});