import { test, expect } from '@playwright/test';

// Note: These tests use localStorage-based auth bypass for testing.
// The first login test is skipped because the test auth always creates a complete profile.

test.skip('1 - first login redirects to onboarding', async ({ page }) => {
  // This test requires real Firebase auth to work properly
  // With the localStorage bypass, we always have a complete profile
});

test('2 - teacher only access to /teacher pages', async ({ page }) => {
  // Login as teacher using localStorage auth bypass
  await page.goto('http://localhost:9002/test/signin?uid=teacher-1&role=teacher&redirect=/teacher');
  await page.waitForURL('**/teacher', { timeout: 10000 });

  // Try to access student page — should be redirected back to teacher dashboard
  await page.goto('http://localhost:9002/student');
  await page.waitForURL('**/teacher', { timeout: 5000 });
});

test('3 - student only access to /student pages', async ({ page }) => {
  // Login as student using localStorage auth bypass
  await page.goto('http://localhost:9002/test/signin?uid=student-1&role=student&redirect=/student');
  await page.waitForURL('**/student', { timeout: 10000 });

  // Try to access teacher page — should be redirected back to student dashboard
  await page.goto('http://localhost:9002/teacher');
  await page.waitForURL('**/student', { timeout: 5000 });
});
