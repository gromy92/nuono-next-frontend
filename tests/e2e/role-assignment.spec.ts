import { expect, test } from '@playwright/test';
import { impossibleKeyword } from '../fixtures/test-data';
import { ensureLoggedInAsAdmin } from '../utils/auth';
import { RoleAssignmentPage } from '../pages/RoleAssignmentPage';

test.describe('角色分配', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedInAsAdmin(page);
  });

  test('角色分配页面可以正常加载', async ({ page }) => {
    const rolePage = new RoleAssignmentPage(page);
    await rolePage.goto();
    await expect(page.getByTestId('role-user-status-filter').locator('.ant-select-selection-item')).toHaveText('启用');
    await expect(page.getByTestId('role-assignment-table')).toBeVisible();
  });

  test('外层工作区 tab 保持低高度且符合老板角色权限', async ({ page }) => {
    const rolePage = new RoleAssignmentPage(page);
    await rolePage.goto();
    const workspaceTabs = page.getByTestId('workspace-tabs-bar');
    await expect(workspaceTabs).toBeVisible();
    await expect
      .poll(async () => workspaceTabs.evaluate((element) => element.getBoundingClientRect().height))
      .toBeLessThanOrEqual(50);

    await expect(workspaceTabs.getByRole('tab', { name: '角色分配' })).toBeVisible();
    await expect(workspaceTabs.getByRole('tab', { name: '账号管理' })).toHaveCount(0);
    await expect(page).toHaveURL(/\/user\/role/);
    await expect(page.getByTestId('role-assignment-table')).toBeVisible();

    await workspaceTabs.getByRole('tab', { name: '角色分配' }).click();
    await expect(page).toHaveURL(/\/user\/role/);
    await expect(page.getByTestId('role-assignment-table')).toBeVisible();
  });

  test('角色分配列表展示负责店铺名称且支持横向滚动', async ({ page }) => {
    const rolePage = new RoleAssignmentPage(page);
    await rolePage.goto();
    await rolePage.searchUser('陆文欢');
    const table = page.getByTestId('role-assignment-table');
    await expect(table).toContainText('canman');
    await expect
      .poll(async () =>
        table.locator('.ant-table-content').evaluate((element) => element.scrollWidth - element.clientWidth)
      )
      .toBeGreaterThan(1);
  });

  test('用户搜索输入后页面保持可用', async ({ page }) => {
    const rolePage = new RoleAssignmentPage(page);
    await rolePage.goto();
    const keyword = impossibleKeyword();
    await rolePage.searchUser(keyword);
    await expect(page.getByTestId('role-user-search-input')).toHaveValue(keyword);
    await expect(page.getByTestId('role-assignment-table')).toBeVisible();
  });
});
