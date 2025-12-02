import { test, expect } from '@playwright/test';
import { PageHelpers } from '../helpers/page-helpers';

test.describe('Teacher Quiz Analytics', () => {
  let helpers: PageHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new PageHelpers(page);
  });

  test('should display quiz list', async ({ page }) => {
    await helpers.navigateTo('/teacher/quizzes');
    await expect(page.getByRole('heading', { name: 'Quiz Management' })).toBeVisible();
  });

  test('should navigate to quiz details', async ({ page }) => {
    await helpers.navigateTo('/teacher/quizzes');
    
    // Wait for View Details button
    await page.waitForSelector('button:has-text("View Details")', { timeout: 10000 });
    await page.getByRole('button', { name: 'View Details' }).first().click();
    
    await expect(page).toHaveURL(/.*\/teacher\/quizzes\/.+/);
  });
});
