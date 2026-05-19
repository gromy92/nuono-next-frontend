import { expect, Page } from '@playwright/test';

export class SystemMenuPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/system/menu');
    await this.expectLoaded();
  }

  async expectLoaded() {
    await expect(this.page.getByTestId('master-data-board-system-menu')).toBeVisible();
    await expect(this.page.getByTestId('menu-table')).toBeVisible();
  }

  async search(keyword: string) {
    await this.page.getByTestId('menu-search-input').fill(keyword);
  }

  async openCreateDialog() {
    await this.page.getByTestId('menu-create-button').click();
    await expect(this.page.getByTestId('menu-form')).toBeVisible();
  }

  async createMenu(data: { name: string; path: string }) {
    await this.openCreateDialog();
    const form = this.page.getByTestId('menu-form');
    await form.getByTestId('menu-name-input').fill(data.name);
    await form.getByTestId('menu-url-path-input').fill(data.path);
    await this.page.getByTestId('menu-submit-button').click();
    await expect(this.page.getByTestId('menu-form')).toHaveCount(0);
    await this.search(data.name);
    await expect(this.page.getByTestId('menu-table').getByText(data.name)).toBeVisible();
  }

  rowByText(text: string) {
    return this.page.getByTestId('menu-table').locator('tr').filter({ hasText: text }).first();
  }
}
