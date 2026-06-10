const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('==========================================');
console.log('      Building EXE Application');
console.log('==========================================');
console.log();

// Step 1: Compile TypeScript
console.log('[1/4] Compiling TypeScript...');
try {
  execSync('npx tsc', { stdio: 'inherit' });
  console.log('      TypeScript compilation complete!');
} catch (err) {
  console.error('[ERROR] TypeScript compilation failed!');
  process.exit(1);
}

// Step 2: Create SEA blob
console.log('[2/4] Creating SEA blob...');
const seaConfig = {
  main: 'server.js',
  output: 'sea-p