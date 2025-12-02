import { test, expect } from '@playwright/test';
import { PageHelpers } from '../helpers/page-helpers';

test.describe('Navigation', () => {
  let helpers: PageHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new PageHelpers(page);
  });

  test('should navigate to student quizzes page', async ({ page }) => {
    await helpers.navigateTo('/student/quizzes');
    await expect(page.getByRole('heading', { name: 'Available Quizzes' })).toBeVisible();
  });

  test('should navigate to teacher quizzes page', async ({ page }) => {
    await helpers.navigateTo('/teacher/quizzes');
    await expect(page.getByRole('heading', { name: 'Quiz Management' })).toBeVisible();
  });

  test('should navigate to quiz generation page', async ({ page }) => {
    await helpers.navigateTo('/teacher/quizzes/generate');
    await expect(page.getByRole('heading', { name: 'Generate Quiz with AI' })).toBeVisible();
  });

  test('should start quiz from list', async ({ page }) => {
    await helpers.navigateTo('/student/quizzes');
    await helpers.waitForQuizCards();
    await helpers.clickStartQuiz();
    await expect(page).toHaveURL(/.*\/student\/quizzes\/.+/);
  });
});
