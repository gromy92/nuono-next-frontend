import { expect, test } from '@playwright/test';
import { impossibleKeyword } from '../fixtures/test-data';
import { ensureLoggedInAsAdmin } from '../utils/auth';
import { UserManagePage } from '../pages/UserManagePage';

test.describe('账号管理', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedInAsAdmin(page);
  });

  test('账号管理页面可以正常加载', async ({ page }) => {
    const userManage = new UserManagePage(page);
    await userManage.goto();
    await expect(page.getByTestId('user-search-input')).toBeVisible();
    await expect(page.getByTestId('user-create-button')).toBeVisible();
  });

  test('账号搜索输入后保留关键字，并展示列表或空状态', async ({ page }) => {
    const userManage = new UserManagePage(page);
    await userManage.goto();
    const keyword = impossibleKeyword();
    await userManage.search(keyword);
    await userManage.expectSearchInputValue(keyword);
    await expect(page.getByTestId('user-table')).toBeVisible();
  });

  test('新增账号弹窗必填校验不应直接提交成功', async ({ page }) => {
    const userManage = new UserManagePage(page);
    await userManage.goto();
    await page.getByTestId('user-create-button').click();
    await expect(page.getByTestId('user-form')).toBeVisible();
    await page.getByTestId('user-submit-button').click();
    await expect(page.getByTestId('user-form')).toBeVisible();
  });
});
