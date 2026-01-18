/**
 * Playwright global teardown
 * Runs after all tests complete for cleanup
 */

async function globalTeardown(): Promise<void> {
  console.log('[Global Teardown] Starting global teardown...');
  
  // Note: Playwright's webServer handles stopping emulators and dev server
  // This hook is available for any additional cleanup if needed in the future
  
  console.log('[Global Teardown] Global teardown complete!');
}

export default globalTeardown;
