import { z } from 'zod';

// Content block types
export const ContentBlockTextSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

export const ContentBlockImageSchema = z.object({
  type: z.literal('image'),
  source: z.record(z.any()),
});

export const ContentBlockToolUseSchema = z.object({
  type: z.literal('tool_use'),
  id: z.string(),
  name: z.string(),
  input: z.record(z.any()),
});

export const ContentBlockToolResultSchema = z.object({
  type: z.literal('tool_result'),
  tool_use_id: z.string(),
  content: z.union([
    z.string(),
    z.array(z.record(z.any())),
    z.record(z.any()),
    z.array(z.any()),
    z.any(),
  ]),
});

export const ContentBlockSchema = z.union([
  ContentBlockTextSchema,
  ContentBlockImageSchema,
  ContentBlockToolUseSchema,
  ContentBlockToolResultSchema,
]);

// System content
export const SystemContentSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

// Message schema
export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.union([z.string(), z.array(ContentBlockSchema)]),
});

// Tool schema
export const ToolSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  input_schema: z.record(z.any()),
});

// Thinking config
export const ThinkingConfigSchema = z.object({
  enabled: z.boolean(),
});

// Main request schema
export const MessagesRequestSchema = z.object({
  model: z.string(),
  max_tokens: z.number(),
  messages: z.array(MessageSchema),
  system: z.union([z.string(), z.array(SystemContentSchema)]).optional(),
  stop_sequences: z.array(z.string()).optional(),
  stream: z.boolean().optional().default(false),
  temperature: z.number().optional().default(1.0),
  top_p: z.number().optional(),
  top_k: z.number().optional(),
  metadata: z.record(z.any()).optional(),
  tools: z.array(ToolSchema).optional(),
  tool_choice: z.record(z.any()).optional(),
  thinking: ThinkingConfigSchema.optional(),
});

// Token count request
export const TokenCountRequestSchema = z.object({
  model: z.string(),
  messages: z.array(MessageSchema),
  system: z.union([z.string(), z.array(SystemContentSchema)]).optional(),
  tools: z.array(ToolSchema).optional(),
  thinking: ThinkingConfigSchema.optional(),
  tool_choice: z.record(z.any()).optional(),
});

// Usage schema
export const UsageSchema = z.object({
  input_tokens: z.number(),
  output_tokens: z.number(),
  cache_creation_input_tokens: z.number().default(0),
  cache_read_input_tokens: z.number().default(0),
});

// Response schema
export const MessagesResponseSchema = z.object({
  id: z.string(),
  model: z.string(),
  role: z.literal('assistant').default('assistant'),
  content: z.array(z.union([ContentBlockTextSchema, ContentBlockToolUseSchema])),
  type: z.literal('message').default('message'),
  stop_reason: z.enum(['end_turn', 'max_tokens', 'stop_sequence', 'tool_use']).optional(),
  stop_sequence: z.string().optional(),
  usage: UsageSchema,
});

// Token count response
export const TokenCountResponseSchema = z.object({
  input_tokens: z.number(),
});

// Type exports
export type ContentBlockText = z.infer<typeof ContentBlockTextSchema>;
export type ContentBlockImage = z.infer<typeof ContentBlockImageSchema>;
export type ContentBlockToolUse = z.infer<typeof ContentBlockToolUseSchema>;
export type ContentBlockToolResult = z.infer<typeof ContentBlockToolResultSchema>;
export type ContentBlock = z.infer<typeof ContentBlockSchema>;
export type SystemContent = z.infer<typeof SystemContentSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type Tool = z.infer<typeof ToolSchema>;
export type ThinkingConfig = z.infer<typeof ThinkingConfigSchema>;
export type MessagesRequest = z.infer<typeof MessagesRequestSchema>;
export type TokenCountRequest = z.infer<typeof TokenCountRequestSchema>;
export type Usage = z.infer<typeof UsageSchema>;
export type MessagesResponse = z.infer<typeof MessagesResponseSchema>;
export type TokenCountResponse = z.infer<typeof TokenCountResponseSchema>;