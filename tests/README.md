# Playwright E2E Tests for Quiz Functionality

This directory contains end-to-end tests for the Quiz feature using Playwright. The tests verify the complete flow from quiz generation by teachers to quiz completion by students.

## Prerequisites

1. **Development Server Running**: The tests require the Next.js dev server to be running on port 9002. The Playwright configuration will automatically start the server if it's not already running.

2. **Environment Variables**: Ensure `.env.local` is configured with Firebase credentials (see main README).

3. **Node.js**: Node.js 20+ is required.

## Installation

Playwright and its dependencies are already installed. If you need to reinstall browsers:

```bash
npx playwright install --with-deps chromium
```

## Running Tests

### Run All Tests

```bash
npm run test:e2e
```

### Run Tests in UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

This opens Playwright's interactive UI where you can:
- See tests running in real-time
- Debug individual tests
- View test results and traces

### Run Tests in Debug Mode

```bash
npm run test:e2e:debug
```

Opens Playwright Inspector for step-by-step debugging.

### Run Tests in Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

Runs tests with visible browser windows (useful for debugging).

### View Test Report

```bash
npm run test:e2e:report
```

Opens the HTML test report in your browser.

## Test Structure

```
tests/
├── helpers/
│   └── page-helpers.ts          # Reusable page interaction helpers
├── fixtures/
│   └── quiz-fixtures.ts         # Test data and fixtures
├── teacher/
│   ├── quiz-generation.spec.ts  # Teacher quiz generation tests
│   └── quiz-analytics.spec.ts  # Teacher analytics tests
├── student/
│   ├── quiz-taking.spec.ts     # Student quiz taking tests
│   └── quiz-results.spec.ts    # Student results tests
├── shared/
│   ├── filters-navigation.spec.ts  # Filter and navigation tests
│   └── edge-cases.spec.ts      # Edge cases and error handling
└── README.md                    # This file
```

## Test Coverage

### Teacher Flow
- ✅ Quiz generation with AI (happy path)
- ✅ Form validation
- ✅ Quiz preview and saving
- ✅ Quiz statistics and analytics
- ✅ Student attempts viewing

### Student Flow
- ✅ Quiz list browsing
- ✅ Quiz taking (all question types)
- ✅ Answer navigation
- ✅ Quiz submission
- ✅ Results viewing
- ✅ Quiz retaking

### Shared Features
- ✅ Filter functionality (course, difficulty, status)
- ✅ Navigation flows
- ✅ Error handling
- ✅ Edge cases

## Writing New Tests

### Using Page Helpers

The `PageHelpers` class provides reusable methods for common interactions:

```typescript
import { PageHelpers } from '../helpers/page-helpers';

test('my test', async ({ page }) => {
  const helpers = new PageHelpers(page);
  
  // Navigate to a page
  await helpers.navigateTo('/student/quizzes');
  
  // Fill quiz generation form
  await helpers.fillQuizGenerationForm({
    course: 'Introduction to Python',
    title: 'Test Quiz',
    numberOfQuestions: 5,
    difficulty: 'medium',
  });
  
  // Answer questions
  await helpers.answerMultipleChoice('Option A');
  await helpers.answerTrueFalse('True');
  await helpers.answerShortAnswer('def');
  
  // Wait for toast notifications
  await helpers.waitForToast('Quiz Generated');
});
```

### Using Test Fixtures

Use predefined test data from fixtures:

```typescript
import { QUIZ_FIXTURES } from '../fixtures/quiz-fixtures';

test('my test', async ({ page }) => {
  const quiz = QUIZ_FIXTURES.quizzes.pythonBasics;
  const course = QUIZ_FIXTURES.courses.python;
  
  // Use fixture data
  await page.goto(`/student/quizzes/${quiz.id}`);
});
```

### Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests.

2. **Wait Strategies**: Use proper wait strategies for async operations:
   ```typescript
   await page.waitForLoadState('networkidle');
   await expect(page.locator('text=Loading')).toBeHidden();
   ```

3. **Selectors**: Prefer stable selectors:
   - Text content: `page.locator('text=Quiz Title')`
   - Role-based: `page.getByRole('button', { name: 'Submit' })`
   - Data attributes: `page.locator('[data-testid="quiz-card"]')`

4. **Timeouts**: The config has a 2-minute timeout for AI generation tests. For specific waits, use:
   ```typescript
   await helpers.waitForQuizGeneration(90000); // 90 seconds
   ```

5. **Assertions**: Use Playwright's built-in assertions:
   ```typescript
   await expect(page.locator('text=Success')).toBeVisible();
   await expect(page).toHaveURL(/.*\/quizzes/);
   ```

## Debugging Tests

### Using Playwright Inspector

1. Run tests in debug mode:
   ```bash
   npm run test:e2e:debug
   ```

2. Use `await page.pause()` in your test to pause execution:
   ```typescript
   test('debug test', async ({ page }) => {
     await page.goto('/student/quizzes');
     await page.pause(); // Execution pauses here
   });
   ```

### Viewing Screenshots and Videos

Screenshots are automatically captured on test failure. Videos can be enabled in `playwright.config.ts`:

```typescript
use: {
  video: 'on-first-retry',
}
```

### Console Logs

View browser console logs:

```typescript
page.on('console', msg => console.log('Browser console:', msg.text()));
```

## Common Issues

### Tests Timing Out

- **AI Generation**: Quiz generation can take 30-90 seconds. Ensure timeouts are sufficient.
- **Network Requests**: Use `waitForLoadState('networkidle')` for pages with async data loading.

### Element Not Found

- **Dynamic Content**: Wait for elements to appear before interacting:
  ```typescript
  await page.waitForSelector('text=Quiz Title');
  ```

- **Selectors**: Verify selectors in browser DevTools before using in tests.

### Flaky Tests

- **Race Conditions**: Use proper wait strategies instead of fixed timeouts.
- **State Management**: Ensure tests start from a clean state (use `beforeEach` hooks).

## CI/CD Integration

For CI/CD pipelines, add to your workflow:

```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps chromium

- name: Run E2E Tests
  run: npm run test:e2e
```

## Mock Data

Tests use mock data from `src/lib/mock-data.ts`. The following quizzes are available:

- **quiz-1**: Python Basics Quiz (4 questions, easy, cs101)
- **quiz-2**: Control Flow Mastery (5 questions, medium, cs101)
- **quiz-3**: Arrays and Complexity Analysis (5 questions, hard, cs202)

## Test Execution Time

- **Fast Tests**: Navigation, filters, UI interactions (~5-10 seconds each)
- **Medium Tests**: Quiz taking flow (~30-60 seconds)
- **Slow Tests**: Quiz generation with AI (~60-120 seconds)

Total test suite execution time: ~10-15 minutes (depending on AI generation speed).

## Additional Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Scenarios Documentation](../docs/features/quiz-e2e-test.md)

## Troubleshooting

### Port Already in Use

If port 9002 is already in use, either:
1. Stop the existing dev server
2. Or modify `playwright.config.ts` to use a different port

### Firebase Connection Issues

Ensure `.env.local` is properly configured with Firebase credentials.

### Browser Installation Issues

Reinstall browsers:
```bash
npx playwright install --with-deps chromium
```

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use `PageHelpers` for common interactions
3. Add fixtures to `quiz-fixtures.ts` for reusable data
4. Update this README if adding new test patterns or utilities
5. Ensure tests are independent and can run in any order

