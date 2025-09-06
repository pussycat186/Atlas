/**
 * Atlas Witness Node Entry Point
 * Main entry point for the witness node service
 */

// Initialize tracing first - must be before any other imports
import { initTracing } from './tracing';
import { WitnessNode } from './witness';
import { WitnessServer } from './server';
import * as path from 'path';

// Initialize tracing immediately
void initTracing();

async function main() {
  // Get configuration from environment variables
  const witnessId = process.env.WITNESS_ID || 'w1';
  const region = process.env.WITNESS_REGION || 'us-east-1';
  const port = parseInt(process.env.PORT || '8091');
  const securityTrack = (process.env.SECURITY_TRACK as 'Z' | 'L') || 'Z';
  
  // Setup ledger paths
  const dataDir = process.env.DATA_DIR || './data';
  const ledgerPath = path.join(dataDir, `${witnessId}_ledger.ndjson`);
  const mirrorPath = process.env.MIRROR_PATH ? 
    path.join(process.env.MIRROR_PATH, `${witnessId}_ledger.ndjson`) : 
    undefined;

  console.log(`Starting Atlas Witness Node:`);
  console.log(`  Witness ID: ${witnessId}`);
  console.log(`  Region: ${region}`);
  console.log(`  Port: ${port}`);
  console.log(`  Security Track: ${securityTrack}`);
  console.log(`  Ledger Path: ${ledgerPath}`);
  console.log(`  Mirror Path: ${mirrorPath || 'None'}`);

  // Create witness node
  const witness = new WitnessNode(
    witnessId,
    region,
    ledgerPath,
    mirrorPath,
    securityTrack
  );

  // Create and start server
  const server = new WitnessServer(witness, port);
  
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
  await server.start(port);
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
  console.error('Failed to start witness node:', error);
  process.exit(1);
});
