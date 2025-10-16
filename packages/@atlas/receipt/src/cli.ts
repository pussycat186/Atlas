#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFile, writeFile } from 'fs/promises';
import { RFC9421Signer, RFC9421Verifier, AtlasKeyManager, type Receipt } from './index.js';

const program = new Command();

program
  .name('atlas-receipt')
  .description('Atlas RFC 9421 receipt generation and verification CLI')
  .version('0.1.0');

// Key generation commands
program
  .command('generate-keys')
  .description('Generate Ed25519 key pair for receipt signing')
  .option('-o, --output <prefix>', 'Output file prefix', 'atlas-receipt')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔐 Generating Ed25519 key pair...'));
      
      const { privateKey, publicKey } = await AtlasKeyManager.generateEd25519KeyPair();
      const keyId = `atlas-${Date.now()}`;
      
      // Export keys
      const publicJWK = await AtlasKeyManager.exportPublicKeyJWK(publicKey, keyId);
      const privateJWK = await AtlasKeyManager.exportPublicKeyJWK(privateKey, keyId); // Will include private components
      
      // Save to files
      await writeFile(`${options.output}-public.jwk`, JSON.stringify(publicJWK, null, 2));
      await writeFile(`${options.output}-private.jwk`, JSON.stringify(privateJWK, null, 2));
      
      console.log(chalk.green('✅ Key pair generated successfully!'));
      console.log(chalk.gray(`Key ID: ${keyId}`));
      console.log(chalk.gray(`Public key: ${options.output}-public.jwk`));
      console.log(chalk.gray(`Private key: ${options.output}-private.jwk`));
      
    } catch (error) {
      console.error(chalk.red('❌ Error generating keys:'), error);
      process.exit(1);
    }
  });

// Receipt signing command
program
  .command('sign')
  .description('Create a signed receipt')
  .requiredOption('-k, --key <file>', 'Private key file (JWK format)')
  .requiredOption('-s, --subject <subject>', 'Receipt subject')
  .requiredOption('-a, --actor <actor>', 'Actor performing the action')
  .requiredOption('-c, --action <action>', 'Action being performed')
  .option('-d, --data <data>', 'JSON data to include in receipt')
  .option('-o, --output <file>', 'Output file for receipt')
  .action(async (options) => {
    try {
      console.log(chalk.blue('📝 Creating signed receipt...'));
      
      // Load private key
      const keyData = JSON.parse(await readFile(options.key, 'utf-8'));
      const privateKey = await AtlasKeyManager.importPublicKeyJWK(keyData);
      
      // Parse additional data
      const additionalData = options.data ? JSON.parse(options.data) : {};
      
      // Create signer
      const signer = new RFC9421Signer(privateKey, keyData.kid || 'default', 'Ed25519');
      
      // Create receipt content
      const content = {
        ...additionalData,
        timestamp: Date.now(),
        hash: crypto.randomUUID() // Simplified for demo
      };
      
      // Generate receipt
      const receipt = await signer.createReceipt(
        options.subject,
        options.actor,
        options.action,
        content
      );
      
      // Output receipt
      const receiptJson = JSON.stringify(receipt, null, 2);
      
      if (options.output) {
        await writeFile(options.output, receiptJson);
        console.log(chalk.green(`✅ Receipt saved to ${options.output}`));
      } else {
        console.log(receiptJson);
      }
      
      console.log(chalk.gray(`Receipt ID: ${receipt.id}`));
      console.log(chalk.gray(`Timestamp: ${new Date(receipt.at).toISOString()}`));
      
    } catch (error) {
      console.error(chalk.red('❌ Error creating receipt:'), error);
      process.exit(1);
    }
  });

// Receipt verification command
program
  .command('verify')
  .description('Verify a signed receipt')
  .requiredOption('-r, --receipt <file>', 'Receipt file to verify')
  .requiredOption('-k, --key <file>', 'Public key file (JWK format)')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔍 Verifying receipt...'));
      
      // Load receipt and public key
      const receiptData: Receipt = JSON.parse(await readFile(options.receipt, 'utf-8'));
      const keyData = JSON.parse(await readFile(options.key, 'utf-8'));
      const publicKey = await AtlasKeyManager.importPublicKeyJWK(keyData);
      
      // Create verifier
      const verifier = new RFC9421Verifier();
      verifier.addPublicKey(keyData.kid || 'default', publicKey);
      
      // Verify receipt
      const isValid = await verifier.verifyReceipt(receiptData);
      
      if (isValid) {
        console.log(chalk.green('✅ Receipt verification PASSED'));
        console.log(chalk.gray(`Receipt ID: ${receiptData.id}`));
        console.log(chalk.gray(`Subject: ${receiptData.subject}`));
        console.log(chalk.gray(`Actor: ${receiptData.actor}`));
        console.log(chalk.gray(`Action: ${receiptData.action}`));
        console.log(chalk.gray(`Timestamp: ${new Date(receiptData.at).toISOString()}`));
      } else {
        console.log(chalk.red('❌ Receipt verification FAILED'));
        process.exit(1);
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error verifying receipt:'), error);
      process.exit(1);
    }
  });

// JWKS generation command
program
  .command('jwks')
  .description('Generate JWKS from public keys')
  .requiredOption('-k, --keys <files...>', 'Public key files (JWK format)')
  .option('-o, --output <file>', 'Output JWKS file')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔑 Generating JWKS...'));
      
      const keys = [];
      
      for (const keyFile of options.keys) {
        const keyData = JSON.parse(await readFile(keyFile, 'utf-8'));
        keys.push(keyData);
      }
      
      const jwks = {
        keys,
        generated: new Date().toISOString(),
        issuer: 'atlas.chat'
      };
      
      const jwksJson = JSON.stringify(jwks, null, 2);
      
      if (options.output) {
        await writeFile(options.output, jwksJson);
        console.log(chalk.green(`✅ JWKS saved to ${options.output}`));
      } else {
        console.log(jwksJson);
      }
      
      console.log(chalk.gray(`Keys included: ${keys.length}`));
      
    } catch (error) {
      console.error(chalk.red('❌ Error generating JWKS:'), error);
      process.exit(1);
    }
  });

program.parse();