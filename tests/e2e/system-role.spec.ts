import { expect, test } from '@playwright/test';
import { testRoleData } from '../fixtures/test-data';
import { ensureLoggedInAsAdmin } from '../utils/auth';
import { e2eEnv } from '../utils/env';
import { SystemRolePage } from '../pages/SystemRolePage';

test.describe('系统角色管理', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedInAsAdmin(page);
  });

  test('角色管理页面可以正常加载', async ({ page }) => {
    const rolePage = new SystemRolePage(page);
    await rolePage.goto();
    await expect(page.getByTestId('role-create-button')).toBeVisible();
  });

  test('新增角色弹窗必填校验不应直接提交成功', async ({ page }) => {
    const rolePage = new SystemRolePage(page);
    await rolePage.goto();
    await rolePage.openCreateDialog();
    await page.getByTestId('role-submit-button').click();
    await expect(page.getByTestId('role-form')).toBeVisible();
  });

  test('可创建并删除测试角色', async ({ page }) => {
    test.skip(!e2eEnv.allowWriteTests, 'Set E2E_ALLOW_WRITE_TESTS=true to run write tests.');
    const rolePage = new SystemRolePage(page);
    await rolePage.goto();
    const role = testRoleData();
    await rolePage.createRole(role);
    const row = rolePage.rowByText(role.name);
    await expect(row).toBeVisible();
    await row.getByTestId('role-delete-button').click();
    await page.getByTestId('confirm-submit-button').click();
    await expect(rolePage.rowByText(role.name)).toHaveCount(0);
  });
});
