/**
 * Playwright global setup
 * Runs before all tests to seed quiz data into Firestore emulator
 * 
 * Note: This runs AFTER Playwright's webServer starts, so we just wait for
 * servers to be ready and seed data. Port cleanup should be done manually
 * before running tests if needed.
 */

import { seedQuizzes } from './helpers/seed-data';

const BASE_URL = process.env.BASE_URL || 'http://localhost:9002';
const MAX_WAIT_TIME = 60000; // 60 seconds
const CHECK_INTERVAL = 1000; // 1 second

/**
 * Wait for a URL to be accessible
 */
async function waitForURL(url: string, maxWait: number = MAX_WAIT_TIME): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok || response.status < 500) {
        return; // URL is accessible
      }
    } catch (error) {
      // URL not ready yet, continue waiting
      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    }
  }
  
  throw new Error(`URL ${url} did not become accessible within ${maxWait}ms`);
}

async function globalSetup(): Promise<void> {
  console.log('[Global Setup] Starting global setup...');
  
  // Step 1: Wait for Firebase emulators to be ready
  // Note: Playwright's webServer should have started emulators, we just wait for UI
  console.log('[Global Setup] Waiting for Firebase emulators...');
  try {
    // Wait for Emulator UI (port 4000) - this confirms emulators are running
    await waitForURL('http://127.0.0.1:4000', 30000); // 30 second timeout
    console.log('[Global Setup] ✓ Emulator UI is ready');
  } catch (error) {
    console.error('[Global Setup] ✗ Emulators did not start in time:', error);
    throw error;
  }
  
  // Step 2: Wait for Next.js dev server to be ready
  console.log('[Global Setup] Waiting for Next.js dev server...');
  try {
    await waitForURL(BASE_URL);
    console.log('[Global Setup] ✓ Next.js dev server is ready');
  } catch (error) {
    console.error('[Global Setup] ✗ Dev server did not start in time:', error);
    throw error;
  }
  
  // Step 3: Seed quiz data
  console.log('[Global Setup] Seeding quiz data...');
  try {
    await seedQuizzes(BASE_URL);
    console.log('[Global Setup] ✓ Quiz data seeded successfully');
  } catch (error) {
    console.error('[Global Setup] ✗ Failed to seed quiz data:', error);
    throw error;
  }
  
  console.log('[Global Setup] Global setup complete!');
}

export default globalSetup;
