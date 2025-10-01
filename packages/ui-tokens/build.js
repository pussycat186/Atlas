import { execSync } from 'child_process';
import fs from 'fs';

try {
  // Run Style Dictionary
  execSync('npx style-dictionary build --config config.js', { stdio: 'inherit' });
  
  // Check if output exists
  if (!fs.existsSync('dist/tokens.css') || fs.readFileSync('dist/tokens.css', 'utf8').trim().length === 0) {
    console.error('❌ Style Dictionary output is empty');
    process.exit(1);
  }
  
  console.log('✅ Tokens built successfully with Style Dictionary');
} catch (error) {
  console.error('❌ Style Dictionary build failed:', error.message);
  process.exit(1);
}