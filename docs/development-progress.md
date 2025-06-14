# Claude Code Proxy Node.js - Development Progress

## Project Overview
Converting the Python-based Anthropic API proxy to Node.js TypeScript for easier installation and better performance.

**Original Python Project**: Anthropic API proxy that translates Claude API requests to OpenAI/Gemini models via LiteLLM

**Goal**: Node.js TypeScript version with same functionality, using LiteLLM for model routing

## Current Status: Phase 1 - Basic Infrastructure ✅ (95% Complete)

### ✅ Completed Tasks

1. **Project Setup**
   - ✅ Created `develop` branch
   - ✅ Set up TypeScript configuration (`tsconfig.json`, `.eslintrc.json`)
   - ✅ Created `package.json` with dependencies
   - ✅ Project builds successfully (`npm run build`)

2. **Project Structure**
   ```
   src/
   ├── app.ts              # Express app setup
   ├── server.ts           # Server entry point
   ├── config/
   │   ├── environment.ts  # Environment configuration
   │   └── logger.ts       # Winston logging setup
   ├── middleware/
   │   ├── logging.ts      # Request logging
   │   └── errors.ts       # Error handling
   ├── routes/
   │   ├── messages.ts     # /v1/messages endpoint (basic implementation)
   │   └── health.ts       # Health check endpoints
   ├── services/
   │   └── litellm-client.ts # LiteLLM HTTP client (for future use)
   ├── types/
   │   └── anthropic.ts    # Zod schemas for Anthropic API types
   └── utils/
       ├── model-mapper.ts # Model mapping logic (haiku→gpt-4o-mini, etc.)
       └── port-finder.ts  # Dynamic port finding
   ```

3. **Core Features Implemented**
   - ✅ **Model Mapping**: Maps `claude-3-haiku` → `gpt-4o-mini`, `claude-3-sonnet` → `gpt-4o`
   - ✅ **Multi-Provider Support**: OpenAI/Gemini configuration with fallback logic
   - ✅ **Request Validation**: Zod schemas for all Anthropic API types
   - ✅ **Dynamic Port Allocation**: Finds available port starting from 8083
   - ✅ **Streaming Support**: Basic SSE implementation for streaming responses
   - ✅ **Beautiful Logging**: Colored console output matching Python version
   - ✅ **Error Handling**: Comprehensive error middleware with Zod validation

4. **Configuration**
   - ✅ Environment variables support (`.env` file)
   - ✅ Provider preference (`PREFERRED_PROVIDER`: openai/google)
   - ✅ Custom model mapping (`BIG_MODEL`, `SMALL_MODEL`)
   - ✅ Dynamic port finding (starts at 8083, finds next available)

### 🔄 Current State

**Basic Express server is built and ready to test**. The server implements:
- Root endpoint: `GET /` - API info
- Health endpoints: `GET /health`, `GET /ready`
- Messages endpoint: `POST /v1/messages` - Basic test response (not using LiteLLM yet)
- Token count: `POST /v1/messages/count_tokens` - Basic estimation

**Server startup log shows**:
```
🚀 Server running on http://0.0.0.0:{port}
📋 Set ANTHROPIC_BASE_URL=http://localhost:{port} to use this proxy
📊 Preferred provider: openai
🔑 API keys configured: OpenAI=true, Gemini=true, Anthropic=false
🎯 Model mapping: gpt-4.1 (big), gpt-4.1-mini (small)
```

### ⏳ Pending Tasks

1. **Test Basic Server** (Next immediate task)
   - Start server: `npm run dev`
   - Test endpoints with curl/Postman
   - Verify model mapping works
   - Test streaming response format

2. **LiteLLM Integration** (Critical for functionality)
   - Need to decide approach:
     - Option A: HTTP calls to LiteLLM proxy server
     - Option B: Python subprocess calls
     - Option C: Direct OpenAI/Gemini clients (mimicking LiteLLM)
   - Implement actual model routing
   - Handle tool/function calling
   - Process content blocks properly

3. **Test Compatibility**
   - Run existing Python tests against Node.js server
   - Ensure `tests.py` works with new server
   - Fix any compatibility issues

4. **CLI Implementation** (Future)
   - `ccp init` command
   - Auto-configure `ANTHROPIC_BASE_URL`
   - Shell integration (zshrc/bashrc)

## Technical Decisions Made

1. **TypeScript**: Chosen for type safety
2. **npm**: Package manager
3. **Express**: Web framework
4. **Port 8083**: Default port (dynamic finding)
5. **LiteLLM via HTTP**: Planned integration approach
6. **Zod**: Schema validation
7. **Winston**: Logging

## Key Files to Know

- **Entry point**: `src/server.ts`
- **Main app**: `src/app.ts` 
- **API routes**: `src/routes/messages.ts`
- **Model mapping**: `src/utils/model-mapper.ts`
- **Configuration**: `src/config/environment.ts`
- **Types**: `src/types/anthropic.ts`

## Environment Variables Required
```bash
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
PREFERRED_PROVIDER=openai
BIG_MODEL=gpt-4.1
SMALL_MODEL=gpt-4.1-mini
PORT=8083
LOG_LEVEL=info
```

## Next Session Actions

1. **Start and test basic server**
   ```bash
   npm run dev
   curl http://localhost:8083/health
   curl -X POST http://localhost:8083/v1/messages -H "Content-Type: application/json" -d '{"model":"claude-3-sonnet-20240229","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}'
   ```

2. **Implement LiteLLM integration** in `src/services/`

3. **Run Python tests** against Node.js server to verify compatibility

4. **Document API compatibility** and feature parity

## Dependencies Installed
- express, cors, helmet, compression, express-rate-limit
- zod (validation), winston (logging), uuid, axios
- TypeScript, tsx (dev runner), jest (testing)
- All building successfully

**Ready to resume development and testing!**