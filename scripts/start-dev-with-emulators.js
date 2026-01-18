#!/usr/bin/env node
/**
 * Start Firebase emulators and Next.js dev server for E2E tests
 */

const { spawn } = require('child_process');
const { exec } = require('child_process');
const http = require('http');

// Start Firebase emulators
console.log('Starting Firebase emulators...');
const emulators = spawn('firebase', ['emulators:start', '--only', 'firestore,auth'], {
  stdio: 'inherit',
  shell: true
});

// Wait for emulators to be ready
function waitForEmulator(port, maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      const req = http.get(`http://127.0.0.1:${port}`, (res) => {
        resolve();
      });
      req.on('error', () => {
        if (attempts >= maxAttempts) {
          reject(new Error(`Emulator on port ${port} did not start in time`));
        } else {
          setTimeout(check, 1000);
        }
      });
    };
    check();
  });
}

// Wait for Firestore emulator (port 8080)
waitForEmulator(8080)
  .then(() => {
    console.log('Emulators are ready! Starting Next.js dev server...');
    // Start Next.js dev server
    const devServer = spawn('npm', ['run', 'dev'], {
      env: {
        ...process.env,
        ENABLE_TEST_AUTH: 'true',
        FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
        FIREBASE_EMULATOR_HUB: 'http://127.0.0.1:4000',
      },
      stdio: 'inherit',
      shell: true,
    });

    // Cleanup on exit
    process.on('SIGINT', () => {
      emulators.kill();
      devServer.kill();
      process.exit();
    });

    process.on('SIGTERM', () => {
      emulators.kill();
      devServer.kill();
      process.exit();
    });
  })
  .catch((error) => {
    console.error('Failed to start emulators:', error);
    emulators.kill();
    process.exit(1);
  });
