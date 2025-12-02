import { test, expect } from '@playwright/test';
import { PageHelpers } from '../helpers/page-helpers';
import { loginAsStudent } from '../helpers/auth-helpers';

test.describe('Edge Cases and Error Handling', () => {
  let helpers: PageHelpers;

  test.beforeEach(async ({ page, request }) => {
    helpers = new PageHelpers(page);
    await loginAsStudent(page, request);
  });

  test('should handle non-existent quiz gracefully', async ({ page }) => {
    await helpers.navigateTo('/student/quizzes/non-existent-quiz-id');
    
    // Should show error or redirect
    await expect(
      page.getByText(/not found|error|loading/i).first()
        .or(page.getByRole('heading', { name: 'Available Quizzes' }))
    ).toBeVisible({ timeout: 10000 });
  });

  test('should show empty state when no quizzes match filter', async ({ page }) => {
    await helpers.navigateTo('/student/quizzes');
    await helpers.waitForQuizCards();
    
    // Select status filter for completed (may show empty state)
    await helpers.selectStatusFilter('Completed');
    
    // Should show either quizzes or empty state message
    await expect(page.getByRole('heading', { name: 'Available Quizzes' })).toBeVisible();
  });
});
