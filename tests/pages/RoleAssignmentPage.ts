import { expect, Page } from '@playwright/test';
import { e2eEnv } from '../utils/env';

export class RoleAssignmentPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto(e2eEnv.useDevSession ? '/user/role?devSession=1&devRole=boss&grantRoleAssignment=1' : '/user/role');
    await this.expectLoaded();
  }

  async expectLoaded() {
    await expect(this.page.getByTestId('role-management-tabs')).toBeVisible();
    await expect(this.page.getByTestId('master-data-board-user-role')).toBeVisible();
  }

  async searchUser(keyword: string) {
    await this.page.getByTestId('role-user-search-input').fill(keyword);
  }
}
