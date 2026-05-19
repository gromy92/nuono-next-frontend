import { expect, test } from '@playwright/test';
import { ensureLoggedInAsAdmin } from '../utils/auth';
import { e2eEnv } from '../utils/env';

test.describe('组织架构与权限总览', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedInAsAdmin(page);
    await page.goto(e2eEnv.useDevSession ? '/user/role?devSession=1&devRole=boss&grantRoleAssignment=1' : '/user/role');
    await expect(page.getByTestId('role-management-tabs')).toBeVisible();
  });

  test('组织架构页签可以打开', async ({ page }) => {
    await page.getByTestId('role-management-tabs').getByRole('tab', { name: /组织架构|组织/i }).click();
    await expect(page.getByTestId('org-tree-board')).toBeVisible();
  });

  test('权限总览页签可以打开', async ({ page }) => {
    await page.getByTestId('role-management-tabs').getByRole('tab', { name: /权限总览|权限/i }).click();
    await expect(page.getByTestId('permission-overview-board')).toBeVisible();
  });
});
