import { createServer } from 'net';

/**
 * Find an available port starting from the given port number
 */
export function findAvailablePort(startPort: number = 8083, maxAttempts: number = 100): Promise<number> {
  return new Promise((resolve, reject) => {
    let currentPort = startPort;
    let attempts = 0;

    function tryPort(port: number): void {
      if (attempts >= maxAttempts) {
        reject(new Error(`Could not find an available port after ${maxAttempts} attempts starting from ${startPort}`));
        return;
      }

      const server = createServer();
      
      server.listen(port, '0.0.0.0', () => {
        server.close(() => {
          resolve(port);
        });
      });

      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          attempts++;
          currentPort++;
          tryPort(currentPort);
        } else {
          reject(err);
        }
      });
    }

    tryPort(currentPort);
  });
}

/**
 * Check if a specific port is available
 */
export function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.listen(port, '0.0.0.0', () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.on('error', () => {
      resolve(false);
    });
  });
}