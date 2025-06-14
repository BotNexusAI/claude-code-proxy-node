import winston from 'winston';
import { config } from './environment.js';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Custom format for beautiful console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      debug: '\x1b[90m', // Gray
    };
    const reset = '\x1b[0m';
    const color = colors[level as keyof typeof colors] || reset;
    
    let output = `${color}[${timestamp}] ${level.toUpperCase()}${reset}: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      output += ` ${JSON.stringify(meta)}`;
    }
    
    return output;
  })
);

// Create logger
export const logger = winston.createLogger({
  levels,
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

// Model mapping logger with special formatting
export function logModelMapping(originalModel: string, mappedModel: string): void {
  const cyan = '\x1b[96m';
  const green = '\x1b[92m';
  const reset = '\x1b[0m';
  const bold = '\x1b[1m';
  
  const output = `${bold}📌 MODEL MAPPING${reset}: '${cyan}${originalModel}${reset}' ➡️ '${green}${mappedModel}${reset}'`;
  logger.debug(output);
}

// Request logger with beautiful formatting
export function logRequest(
  method: string,
  path: string,
  claudeModel: string,
  backendModel: string,
  numMessages: number,
  numTools: number,
  statusCode: number
): void {
  const cyan = '\x1b[96m';
  const green = '\x1b[92m';
  const blue = '\x1b[94m';
  const magenta = '\x1b[95m';
  const reset = '\x1b[0m';
  const bold = '\x1b[1m';
  
  // Format endpoint
  const endpoint = path.includes('?') ? path.split('?')[0] : path;
  
  // Extract clean model names
  const backendClean = backendModel.includes('/') ? backendModel.split('/').pop() : backendModel;
  
  // Format status
  const statusStr = statusCode === 200 ? `${green}✓ ${statusCode} OK${reset}` : `${reset}✗ ${statusCode}${reset}`;
  
  // Format tools and messages
  const toolsStr = `${magenta}${numTools} tools${reset}`;
  const messagesStr = `${blue}${numMessages} messages${reset}`;
  
  // Create log lines
  const logLine = `${bold}${method} ${endpoint}${reset} ${statusStr}`;
  const modelLine = `${cyan}${claudeModel}${reset} → ${green}${backendClean}${reset} ${toolsStr} ${messagesStr}`;
  
  // Log to console directly for better formatting
  console.log(logLine);
  console.log(modelLine);
}