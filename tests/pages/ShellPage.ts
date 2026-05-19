import { expect, Page } from '@playwright/test';

export class ShellPage {
  constructor(private readonly page: Page) {}

  get sidebarMenu() {
    return this.page.getByTestId('sidebar-menu');
  }

  async expectLoaded() {
    await expect(this.sidebarMenu).toBeVisible();
    await expect(this.page.getByTestId('user-avatar-menu-button')).toBeVisible();
  }

  async logout() {
    await this.page.getByTestId('user-avatar-menu-button').click();
    await this.page.getByTestId('logout-button').click();
    await this.page.getByTestId('logout-confirm-submit-button').click();
    await expect(this.page.getByTestId('auth-page-login')).toBeVisible();
    await expect.poll(async () => this.page.evaluate(() => window.localStorage.getItem('nuono-next-session'))).toBeNull();
  }
}
