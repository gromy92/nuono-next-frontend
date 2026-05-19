import { expect, test } from '@playwright/test';
import { impossibleKeyword, testMenuData } from '../fixtures/test-data';
import { ensureLoggedInAsAdmin } from '../utils/auth';
import { e2eEnv } from '../utils/env';
import { SystemMenuPage } from '../pages/SystemMenuPage';

test.describe('系统菜单维护', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedInAsAdmin(page);
  });

  test('菜单维护页面可以正常加载', async ({ page }) => {
    const menuPage = new SystemMenuPage(page);
    await menuPage.goto();
    await expect(page.getByTestId('menu-create-button')).toBeVisible();
  });

  test('菜单搜索输入后页面保持可用', async ({ page }) => {
    const menuPage = new SystemMenuPage(page);
    await menuPage.goto();
    const keyword = impossibleKeyword();
    await menuPage.search(keyword);
    await expect(page.getByTestId('menu-search-input')).toHaveValue(keyword);
    await expect(page.getByTestId('menu-table')).toBeVisible();
  });

  test('新增菜单弹窗必填校验不应直接提交成功', async ({ page }) => {
    const menuPage = new SystemMenuPage(page);
    await menuPage.goto();
    await menuPage.openCreateDialog();
    await page.getByTestId('menu-submit-button').click();
    await expect(page.getByTestId('menu-form')).toBeVisible();
  });

  test('可创建并删除测试菜单', async ({ page }) => {
    test.skip(!e2eEnv.allowWriteTests, 'Set E2E_ALLOW_WRITE_TESTS=true to run write tests.');
    const menuPage = new SystemMenuPage(page);
    await menuPage.goto();
    const menu = testMenuData();
    await menuPage.createMenu(menu);
    const row = menuPage.rowByText(menu.name);
    await expect(row).toBeVisible();
    await row.getByTestId('menu-delete-button').click();
    await page.getByTestId('confirm-submit-button').click();
    await expect(menuPage.rowByText(menu.name)).toHaveCount(0);
  });
});
