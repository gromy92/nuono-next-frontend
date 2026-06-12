import { expect, test } from '@playwright/test';

const PURCHASE_ORDER_URL =
  'http://127.0.0.1:9620/purchase/order?devSession=1&devRole=boss&devStore=STR108065-NSA';

test.describe('采购单 P0 验收辅助能力', () => {
  test('展示站点运输筛选和异常摘要', async ({ page }) => {
    await page.goto(PURCHASE_ORDER_URL, { waitUntil: 'networkidle' });

    await expect(page.getByTestId('purchase-order-page')).toBeVisible();
    const filterBar = page.getByTestId('purchase-order-filter-bar');
    await expect(filterBar).toBeVisible();
    await expect(page.getByTestId('purchase-order-issue-summary')).toBeVisible();
    await expect(filterBar.getByRole('button', { name: /^全部/ })).toBeVisible();
    await expect(filterBar.getByRole('button', { name: /^异常/ })).toBeVisible();
    await expect(filterBar.getByRole('button', { name: /^SA 空/ })).toHaveCount(0);
    await expect(filterBar.getByRole('button', { name: /^SA 海/ })).toHaveCount(0);

    await page.locator('.purchase-order-allocation-summary').getByRole('button', { name: /^SA 空/ }).click();
    await expect(page.getByTestId('purchase-order-active-filter')).toContainText('SA 空');
  });

  test('生成物流计划前先展示预检结果', async ({ page }) => {
    await page.goto(PURCHASE_ORDER_URL, { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: '生成物流计划' }).click();

    const dialog = page.getByRole('dialog', { name: '物流计划预检' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: '生成草稿' })).toBeVisible();
    await expect(dialog.getByText(/缺少物流计划所需|规格和箱规信息完整/)).toBeVisible();
  });
});
