import { Page, Locator, expect } from '@playwright/test';

/**
 * Simplified helper functions for common page interactions in quiz tests
 */

export class PageHelpers {
  constructor(private page: Page) {}

  /**
   * Navigate to a quiz page
   */
  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Wait for toast notification
   */
  async waitForToast(expectedText?: string | RegExp, timeout = 5000) {
    await this.page.waitForSelector('[data-state="open"]', { timeout });
    if (expectedText) {
      const toast = this.page.locator('[data-state="open"]').first();
      await expect(toast).toContainText(expectedText, { timeout });
    }
  }

  /**
   * Select an option from a Radix UI Select component
   */
  async selectRadixOption(triggerSelector: string | Locator, optionText: string) {
    const trigger = typeof triggerSelector === 'string' 
      ? this.page.locator(triggerSelector)
      : triggerSelector;
    
    await trigger.click();
    await this.page.waitForSelector('[role="option"]', { timeout: 5000 });
    await this.page.getByRole('option', { name: optionText }).click();
  }

  /**
   * Wait for quiz generation to complete
   */
  async waitForQuizGeneration(timeout = 60000) {
    await this.page.waitForSelector('text=Quiz Preview', { timeout });
  }

  /**
   * Fill quiz generation form
   */
  async fillQuizGenerationForm(config: {
    course?: string;
    title?: string;
    description?: string;
    numberOfQuestions?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    topics?: string;
  }) {
    if (config.course) {
      await this.selectRadixOption('[id="course"]', config.course);
    }

    if (config.title) {
      await this.page.locator('[id="title"]').fill(config.title);
    }

    if (config.description) {
      await this.page.locator('[id="description"]').fill(config.description);
    }

    if (config.numberOfQuestions !== undefined) {
      await this.page.locator('[id="numQuestions"]').fill(config.numberOfQuestions.toString());
    }

    if (config.difficulty) {
      const difficultyLabels: Record<string, string> = {
        easy: 'Easy - Basic recall and understanding',
        medium: 'Medium - Application and analysis',
        hard: 'Hard - Synthesis and evaluation',
      };
      await this.selectRadixOption('[id="difficulty"]', difficultyLabels[config.difficulty]);
    }

    if (config.topics) {
      await this.page.locator('[id="topics"]').fill(config.topics);
    }
  }

  /**
   * Answer multiple choice question
   */
  async answerMultipleChoice(optionText: string) {
    await this.page.getByLabel(optionText).click();
  }

  /**
   * Answer true/false question
   */
  async answerTrueFalse(answer: 'True' | 'False') {
    await this.page.getByLabel(answer).click();
  }

  /**
   * Answer short answer question
   */
  async answerShortAnswer(answer: string) {
    await this.page.locator('textarea').first().fill(answer);
  }

  /**
   * Navigate to next question
   */
  async goToNextQuestion() {
    await this.page.getByRole('button', { name: 'Next', exact: true }).click();
  }

  /**
   * Navigate to previous question
   */
  async goToPreviousQuestion() {
    await this.page.getByRole('button', { name: 'Previous' }).click();
  }

  /**
   * Submit quiz
   */
  async submitQuiz() {
    await this.page.getByRole('button', { name: 'Submit Quiz' }).click();
    await this.page.waitForSelector('text=Submit Quiz?');
    await this.page.getByRole('button', { name: 'Submit' }).last().click();
  }

  /**
   * Wait for any quiz card to appear
   */
  async waitForQuizCards(timeout = 10000) {
    // Wait for Start Quiz button to appear (indicates quiz cards loaded)
    await this.page.waitForSelector('button:has-text("Start Quiz"), a:has-text("Start Quiz")', { timeout });
  }

  /**
   * Click Start Quiz button and wait for navigation
   */
  async clickStartQuiz() {
    await this.page.getByRole('button', { name: /Start Quiz|Continue Quiz|Retake Quiz/i }).first().click();
    // Wait for navigation to quiz page
    await this.page.waitForURL(/.*\/student\/quizzes\/.+/);
  }

  /**
   * Select difficulty filter
   */
  async selectDifficultyFilter(difficulty: string) {
    // Find the difficulty filter trigger (usually has "Difficulty" or "All Difficulties" text)
    const trigger = this.page.locator('button:has-text("Difficulty"), button:has-text("All Difficulties")').first();
    await trigger.click();
    await this.page.waitForSelector('[role="option"]', { timeout: 5000 });
    await this.page.getByRole('option', { name: difficulty }).click();
  }

  /**
   * Select status filter
   */
  async selectStatusFilter(status: string) {
    // Find the status filter trigger (usually has "Status" or "All Statuses" text)
    const trigger = this.page.locator('button:has-text("Status"), button:has-text("All Statuses")').first();
    await trigger.click();
    await this.page.waitForSelector('[role="option"]', { timeout: 5000 });
    await this.page.getByRole('option', { name: status }).click();
  }

  /**
   * Select course filter
   */
  async selectCourseFilter(course: string) {
    // Find the course filter trigger
    const trigger = this.page.locator('button:has-text("Course"), button:has-text("All Courses")').first();
    await trigger.click();
    await this.page.waitForSelector('[role="option"]', { timeout: 5000 });
    await this.page.getByRole('option', { name: course }).click();
  }
}
