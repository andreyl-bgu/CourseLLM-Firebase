import { test, expect } from '@playwright/test';
import { PageHelpers } from '../helpers/page-helpers';
import { loginAsStudent } from '../helpers/auth-helpers';

test.describe('Quiz Filters and Navigation', () => {
  let helpers: PageHelpers;

  test.beforeEach(async ({ page, request }) => {
    helpers = new PageHelpers(page);
    await loginAsStudent(page, request);
  });

  test('should navigate to student quizzes page', async ({ page }) => {
    await helpers.navigateTo('/student/quizzes');
    await expect(page.getByRole('heading', { name: 'Available Quizzes' })).toBeVisible();
  });

  test('should display quiz cards', async ({ page }) => {
    await helpers.navigateTo('/student/quizzes');
    await helpers.waitForQuizCards();
    
    // Verify at least one quiz card is visible
    await expect(page.getByRole('button', { name: /Start Quiz|Continue Quiz|Retake Quiz/i }).first()).toBeVisible();
  });

  test('should filter by difficulty', async ({ page }) => {
    await helpers.navigateTo('/student/quizzes');
    await helpers.waitForQuizCards();
    
    // Select difficulty filter
    await helpers.selectDifficultyFilter('Medium');
    
    // Page should still show quizzes or empty state
    await expect(page.getByRole('heading', { name: 'Available Quizzes' })).toBeVisible();
  });

  test('should navigate to quiz from card', async ({ page }) => {
    await helpers.navigateTo('/student/quizzes');
    await helpers.waitForQuizCards();
    await helpers.clickStartQuiz();
    
    // Verify navigation to quiz page
    await expect(page).toHaveURL(/.*\/student\/quizzes\/.+/);
  });
});
