import { Page, APIRequestContext, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:9002';

/**
 * Login as a student user for testing.
 * Uses localStorage-based test auth bypass.
 */
export async function loginAsStudent(page: Page, request: APIRequestContext) {
  // Navigate to test signin page with uid and role
  const signinUrl = `${BASE_URL}/test/signin?uid=test-student&role=student&redirect=/student`;
  await page.goto(signinUrl);
  
  // Wait for redirect to student dashboard
  await expect(page).toHaveURL(/\/student/, { timeout: 30000 });
  
  // Wait for the page to fully load and auth state to stabilize
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for the dashboard content to appear (confirms auth is working)
  await page.waitForFunction(() => {
    const body = document.body.innerText;
    return !body.includes('Loading...') && !body.includes('Signing in');
  }, { timeout: 10000 });
}

/**
 * Login as a teacher user for testing.
 * Uses localStorage-based test auth bypass.
 */
export async function loginAsTeacher(page: Page, request: APIRequestContext) {
  // Navigate to test signin page with uid and role
  const signinUrl = `${BASE_URL}/test/signin?uid=test-teacher&role=teacher&redirect=/teacher`;
  await page.goto(signinUrl);
  
  // Wait for redirect to teacher dashboard
  await expect(page).toHaveURL(/\/teacher/, { timeout: 30000 });
  
  // Wait for the page to fully load and auth state to stabilize
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for the dashboard content to appear
  await page.waitForFunction(() => {
    const body = document.body.innerText;
    return !body.includes('Loading...') && !body.includes('Signing in');
  }, { timeout: 10000 });
}

