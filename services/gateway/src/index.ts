/**
 * Atlas Gateway Entry Point
 * Main entry point for the gateway service
 */

import { GatewayServer } from './server';

async function main() {
  // Get configuration from environment variables
  const port = parseInt(process.env.PORT || '3000');
  const host = process.env.HOST || '0.0.0.0';

  console.log(`Starting Atlas Gateway:`);
  console.log(`  Host: ${host}`);
  console.log(`  Port: ${port}`);

  // Create and start server
  const server = new GatewayServer(port);
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  // Start the server
  await server.start(port, host);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
main().catch((error) => {
  console.error('Failed to start gateway:', error);
  process.exit(1);
});
