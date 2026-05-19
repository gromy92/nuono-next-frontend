import { expect, Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/login');
    await this.expectLoaded();
  }

  async expectLoaded() {
    await expect(this.page.getByTestId('auth-page-login')).toBeVisible();
    await expect(this.page.getByTestId('login-form')).toBeVisible();
  }

  async login(username: string, password: string) {
    await this.page.getByTestId('login-username-input').fill(username);
    await this.page.getByTestId('login-password-input').fill(password);
    await this.page.getByTestId('login-submit-button').click();
  }

  async expectError(pattern: RegExp | string = /错误|失败|不能为空|invalid|error/i) {
    const alert = this.page.getByTestId('login-error-alert').or(this.page.getByRole('alert'));
    await expect(alert.filter({ hasText: pattern }).first()).toBeVisible();
  }
}
