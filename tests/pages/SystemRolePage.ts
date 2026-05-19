import { expect, Page } from '@playwright/test';
import { e2eEnv } from '../utils/env';

export class SystemRolePage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto(e2eEnv.useDevSession ? '/system/role?devSession=1&grantSystemRole=1' : '/system/role');
    await this.expectLoaded();
  }

  async expectLoaded() {
    await expect(this.page.getByTestId('master-data-board-system-role')).toBeVisible();
    await expect(this.page.getByTestId('role-table')).toBeVisible();
  }

  async openCreateDialog() {
    await this.page.getByTestId('role-create-button').click();
    await expect(this.page.getByTestId('role-form')).toBeVisible();
  }

  async submitRoleForm() {
    await this.page.getByTestId('role-submit-button').click();
  }

  async createRole(data: { name: string; code: string; description?: string }) {
    await this.openCreateDialog();
    const form = this.page.getByTestId('role-form');
    await form.getByTestId('role-name-input').fill(data.name);
    await form.getByTestId('role-code-input').fill(data.code);
    await form.getByTestId('role-description-input').fill(data.description ?? 'Created by Playwright E2E');
    await this.submitRoleForm();
    await expect(this.page.getByTestId('role-table').getByText(data.name)).toBeVisible();
  }

  rowByText(text: string) {
    return this.page.getByTestId('role-table').locator('tr').filter({ hasText: text }).first();
  }
}
