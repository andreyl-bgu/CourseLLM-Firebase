import { test, expect } from '@playwright/test';
import { PageHelpers } from '../helpers/page-helpers';
import { loginAsStudent } from '../helpers/auth-helpers';

test.describe('Student Quiz Taking', () => {
  let helpers: PageHelpers;

  test.beforeEach(async ({ page, request }) => {
    helpers = new PageHelpers(page);
    await loginAsStudent(page, request);
  });

  test('should take quiz and submit', async ({ page }) => {
    await helpers.navigateTo('/student/quizzes');
    
    // Wait for quiz cards to load
    await helpers.waitForQuizCards();
    await helpers.clickStartQuiz();

    // clickStartQuiz already waits for navigation

    // Answer questions until Submit Quiz button appears
    while (true) {
      // Answer the current question
      const textarea = page.locator('textarea');
      if (await textarea.count() > 0) {
        await textarea.first().fill('test answer');
      } else {
        await page.locator('label').first().click();
      }

      // Check if Submit Quiz button is visible
      const submitButton = page.getByRole('button', { name: 'Submit Quiz' });
      if (await submitButton.isVisible()) {
        break;
      }

      // Otherwise click Next
      await helpers.goToNextQuestion();
    }

    // Submit
    await helpers.submitQuiz();
    
    // Verify results page
    await expect(page).toHaveURL(/.*\/results\/.*/);
    await expect(page.getByText('Quiz Results')).toBeVisible();
  });

  test('should navigate between questions', async ({ page }) => {
    await helpers.navigateTo('/student/quizzes');
    await helpers.waitForQuizCards();
    await helpers.clickStartQuiz();

    // Verify first question - use more specific selector
    await expect(page.getByText('Question 1', { exact: true })).toBeVisible();

    // Answer and navigate forward
    await page.locator('label').first().click();
    await helpers.goToNextQuestion();
    await expect(page.getByText('Question 2', { exact: true })).toBeVisible();

    // Navigate back
    await helpers.goToPreviousQuestion();
    await expect(page.getByText('Question 1', { exact: true })).toBeVisible();
  });
});
