import { test, expect } from '@playwright/test';
import { PageHelpers } from '../helpers/page-helpers';

test.describe('Edge Cases', () => {
  let helpers: PageHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new PageHelpers(page);
  });

  test('should show quiz not found for invalid ID', async ({ page }) => {
    await helpers.navigateTo('/student/quizzes/invalid-quiz-id');
    await expect(page.getByText('Quiz not found')).toBeVisible();
  });

  test('should handle quiz submission dialog', async ({ page }) => {
    await helpers.navigateTo('/student/quizzes');
    await helpers.waitForQuizCards();
    await helpers.clickStartQuiz();

    // Answer one question
    await page.locator('label').first().click();
    
    // Navigate to last question (keep clicking Next until Submit Quiz appears)
    while (true) {
      const submitButton = page.getByRole('button', { name: 'Submit Quiz' });
      if (await submitButton.isVisible()) {
        break;
      }
      await page.getByRole('button', { name: 'Next', exact: true }).click();
    }

    // Click submit
    await page.getByRole('button', { name: 'Submit Quiz' }).click();
    
    // Verify dialog appears
    await expect(page.getByText('Submit Quiz?')).toBeVisible();
    
    // Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();
    
    // Still on quiz page
    await expect(page).toHaveURL(/.*\/student\/quizzes\/.+/);
  });
});
