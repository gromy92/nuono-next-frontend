import { expect, test } from '@playwright/test';
import { skuPurchaseHistory, storeSyncOverview } from './ali1688-sku-purchase-history.fixtures';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/store-sync/overview**', async (route) => {
    await route.fulfill({ json: storeSyncOverview });
  });
});

test('user can open the full price trend with order-level rows and no source order action', async ({ page }) => {
  const historyWithMissingPrice = {
    ...skuPurchaseHistory,
    items: [
      {
        ...skuPurchaseHistory.items[0],
        purchaseCount: 3,
        totalQuantity: '10',
        dataQualityFlags: ['missing_price_basis'],
        history: [
          ...skuPurchaseHistory.items[0].history,
          {
            orderId: 93003,
            assignmentId: 99003,
            orderNo: 'ALI-ORDER-20260524-003',
            orderTime: '2026-05-24 08:15:00',
            supplierName: '缺失金额样品供应商',
            assignedQuantity: '1',
            allocatedCost: null,
            unitPrice: null,
            amountBasis: null,
            priceQuality: 'missing_price_basis'
          }
        ]
      }
    ]
  };
  await page.route('**/api/procurement/ali1688-orders/sku-purchase-history**', async (route) => {
    await route.fulfill({ json: historyWithMissingPrice });
  });

  await page.goto('/purchase/ali1688-sku-purchase-history?devSession=1&devRole=procurement&grantAli1688HistoricalOrders=1');

  const sparkline = page.getByTestId('sku-purchase-sparkline-CANMAN-AE-SKU-001');
  await expect(sparkline.locator('circle')).toHaveCount(2);
  await sparkline.click();
  const trendDrawer = page.locator('.ant-drawer').filter({ hasText: '采购单价趋势 · CANMAN-AE-SKU-001' });
  await expect(trendDrawer).toBeVisible();
  const largeTrendChart = trendDrawer.getByTestId('sku-purchase-price-trend-chart');
  await expect(largeTrendChart).toBeVisible();
  await expect(largeTrendChart.locator('canvas')).toBeVisible();
  await expect(trendDrawer.locator('svg[aria-label="全部采购单价趋势"]')).toHaveCount(0);
  await expect(trendDrawer.getByText('最高采购单价: ¥40.00')).toBeVisible();
  await expect(trendDrawer.getByText('最低采购单价: ¥11.00')).toBeVisible();
  await expect(trendDrawer.getByRole('cell', { name: 'ALI-ORDER-20260527-002', exact: true })).toBeVisible();
  await expect(trendDrawer.getByRole('cell', { name: 'ALI-ORDER-20260525-001', exact: true })).toBeVisible();
  const missingPriceRow = trendDrawer.locator('tr').filter({ hasText: 'ALI-ORDER-20260524-003' });
  await expect(missingPriceRow).toBeVisible();
  await expect(missingPriceRow.getByText('未返回信息')).toHaveCount(2);
  await expect(missingPriceRow.getByText('缺失价格基础')).toBeVisible();
  await expect(page.getByText('存在缺失价格点')).toHaveCount(0);
  await expect(trendDrawer.getByRole('button', { name: '查看订单' })).toHaveCount(0);
  await expect(page.locator('.ant-drawer').filter({ hasText: '1688 历史订单详情' })).toHaveCount(0);
  await expect(trendDrawer.getByRole('columnheader', { name: '采购数量' })).toBeVisible();
  await expect(trendDrawer.getByRole('columnheader', { name: '分摊金额' })).toBeVisible();
  await expect(trendDrawer.getByRole('columnheader', { name: '采购单价' })).toBeVisible();
  await expect(trendDrawer.getByRole('columnheader', { name: '价格状态' })).toBeVisible();
});
