#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔧 Installing server dependencies...');

try {
  // Read package.json to get server dependencies
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const serverDeps = packageJson.serverDependencies || {};

  if (Object.keys(serverDeps).length === 0) {
    console.log('✅ No server dependencies to install');
    process.exit(0);
  }

  // Install server dependencies
  const deps = Object.entries(serverDeps).map(([name, version]) => `${name}@${version}`).join(' ');
  
  console.log(`📦 Installing: ${deps}`);
  execSync(`npm install ${deps}`, { stdio: 'inherit' });

  console.log('✅ Server dependencies installed successfully!');
  console.log('');
  console.log('🚀 To start the development environment with email server:');
  console.log('   npm run dev:email');
  console.log('');
  console.log('📧 To start just the email server:');
  console.log('   npm run email-server');

} catch (error) {
  console.error('❌ Error installing server dependencies:', error.message);
  process.exit(1);
} 