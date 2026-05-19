import { expect, Page } from '@playwright/test';
import { e2eEnv } from '../utils/env';

export class StoreManagementPage {
  constructor(private readonly page: Page) {}

  async gotoFromRolePage() {
    await this.page.goto(e2eEnv.useDevSession ? '/user/role?devSession=1&devRole=boss&grantRoleAssignment=1' : '/user/role');
    await this.page.getByTestId('role-management-tabs').getByRole('tab', { name: /店铺管理|店铺/i }).click();
    await this.expectLoaded();
  }

  async expectLoaded() {
    await expect(this.page.getByTestId('store-management-board')).toBeVisible();
  }

  async openCreateStoreDialog() {
    await this.page.getByTestId('store-create-button').click();
    await expect(this.page.getByTestId('store-create-form')).toBeVisible();
  }

  async testFirstAvailableConnection() {
    const stableButton = this.page.locator(
      '[data-testid="store-test-connection-button"][data-store-code="PRJ346391"]:not([disabled])'
    );
    const availableButtons = this.page.locator('[data-testid="store-test-connection-button"]:not([disabled])');
    await expect(availableButtons.first()).toBeVisible();
    if (await stableButton.first().isVisible().catch(() => false)) {
      await stableButton.first().click();
    } else {
      await availableButtons.first().click();
    }
    const feedback = this.page.getByTestId('store-test-connection-feedback');
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText(/正在测试|连接/);
  }
}
