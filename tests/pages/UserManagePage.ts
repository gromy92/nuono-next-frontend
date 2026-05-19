import { expect, Page } from '@playwright/test';

export class UserManagePage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/user/manage');
    await this.expectLoaded();
  }

  async expectLoaded() {
    await expect(this.page.getByTestId('master-data-board-user-account')).toBeVisible();
    await expect(this.page.getByTestId('user-table')).toBeVisible();
  }

  async search(keyword: string) {
    await this.page.getByTestId('user-search-input').fill(keyword);
  }

  async expectSearchInputValue(keyword: string) {
    await expect(this.page.getByTestId('user-search-input')).toHaveValue(keyword);
  }
}
