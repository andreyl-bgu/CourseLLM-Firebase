import { test, expect } from '@playwright/test';
import { PageHelpers } from '../helpers/page-helpers';
import { loginAsStudent } from '../helpers/auth-helpers';

test.describe('Student Quiz Results', () => {
  let helpers: PageHelpers;

  test.beforeEach(async ({ page, request }) => {
    helpers = new PageHelpers(page);
    await loginAsStudent(page, request);
  });

  test('should display results after completing quiz', async ({ page }) => {
    // Navigate and start quiz
    await helpers.navigateTo('/student/quizzes');
    await helpers.waitForQuizCards();
    await helpers.clickStartQuiz();
    
    // Answer questions until Submit Quiz button appears
    while (true) {
      const textarea = page.locator('textarea');
      if (await textarea.count() > 0) {
        await textarea.first().fill('test');
      } else {
        await page.locator('label').first().click();
      }

      const submitButton = page.getByRole('button', { name: 'Submit Quiz' });
      if (await submitButton.isVisible()) {
        break;
      }

      await page.getByRole('button', { name: 'Next', exact: true }).click();
    }
    
    // Submit
    await helpers.submitQuiz();

    // Verify results
    await expect(page.getByText('Quiz Results')).toBeVisible();
  });
});
