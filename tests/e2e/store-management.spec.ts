import { expect, test } from '@playwright/test';
import { ensureLoggedInAsAdmin } from '../utils/auth';
import { StoreManagementPage } from '../pages/StoreManagementPage';

test.describe('店铺管理', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedInAsAdmin(page);
  });

  test('店铺管理页签可以正常加载', async ({ page }) => {
    const storePage = new StoreManagementPage(page);
    await storePage.gotoFromRolePage();
    await expect(page.getByTestId('store-create-button')).toBeVisible();
    await expect(page.getByTestId('store-table')).toBeVisible();
    await expect
      .poll(async () =>
        page.getByTestId('store-table').evaluate((table) => {
          const scroller = table.querySelector('.ant-table-body') || table.querySelector('.ant-table-content');
          return scroller ? scroller.scrollWidth - scroller.clientWidth : 0;
        })
      )
      .toBeGreaterThan(1);
    await expect(page.getByTestId('store-table').locator('.ant-table-cell-fix-right').first()).toBeVisible();
  });

  test('测试连通按钮点击后必须展示页面反馈', async ({ page }) => {
    const storePage = new StoreManagementPage(page);
    await storePage.gotoFromRolePage();
    await storePage.testFirstAvailableConnection();
  });

  test('创建店铺弹窗必填校验不应直接提交成功', async ({ page }) => {
    const storePage = new StoreManagementPage(page);
    await storePage.gotoFromRolePage();
    await storePage.openCreateStoreDialog();
    await page.getByTestId('store-create-submit-button').click();
    await expect(page.getByTestId('store-create-form')).toBeVisible();
  });
});
