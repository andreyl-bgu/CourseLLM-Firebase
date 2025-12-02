import { test, expect } from '@playwright/test';
import { PageHelpers } from '../helpers/page-helpers';
import { QUIZ_FIXTURES } from '../fixtures/quiz-fixtures';
import { loginAsTeacher } from '../helpers/auth-helpers';

test.describe('Teacher Quiz Generation', () => {
  let helpers: PageHelpers;

  test.beforeEach(async ({ page, request }) => {
    helpers = new PageHelpers(page);
    await loginAsTeacher(page, request);
  });

  test('should load quiz generation page', async ({ page }) => {
    await helpers.navigateTo('/teacher/quizzes/generate');
    await expect(page.getByRole('heading', { name: 'Generate Quiz with AI' })).toBeVisible();
  });

  test('should navigate back to quizzes list', async ({ page }) => {
    await helpers.navigateTo('/teacher/quizzes/generate');
    await page.getByRole('button', { name: 'Back to Quizzes' }).click();
    await expect(page).toHaveURL(/.*\/teacher\/quizzes/);
  });

  test('should generate quiz successfully', async ({ page }) => {
    test.skip(process.env.SKIP_SLOW_TESTS === 'true', 'Skipping slow AI test');
    test.setTimeout(120000);

    await helpers.navigateTo('/teacher/quizzes/generate');
    await helpers.fillQuizGenerationForm(QUIZ_FIXTURES.quizGeneration.minimalConfig);
    
    await page.getByRole('button', { name: 'Generate Quiz with AI' }).click();
    await helpers.waitForQuizGeneration(90000);
    
    await expect(page.getByText('Quiz Preview')).toBeVisible();
  });
});
