import { expect, test } from '@playwright/test';
import { skuPurchaseHistory, storeSyncOverview, tinyPng } from './ali1688-sku-purchase-history.fixtures';
test.beforeEach(async ({ page }) => {
  await page.route('**/api/store-sync/overview**', async (route) => {
    await route.fulfill({ json: storeSyncOverview });
  });
});

test('procurement can inspect SKU purchase history with summary columns and hover history', async ({ page }) => {
  let requestedUrl = '';
  await page.route('**/api/procurement/ali1688-orders/sku-purchase-history**', async (route) => {
    requestedUrl = route.request().url();
    await route.fulfill({ json: skuPurchaseHistory });
  });
  await page.route('https://f.nooncdn.com/p/pzsku/**', async (route) => {
    if (route.request().url().endsWith('.jpg')) {
      await route.fulfill({ body: tinyPng, contentType: 'image/png' });
      return;
    }
    await route.fulfill({ status: 404, body: '' });
  });

  await page.goto('/purchase/ali1688-sku-purchase-history?devSession=1&devRole=procurement&grantAli1688HistoricalOrders=1');

  await expect(page.getByTestId('workspace-tabs-bar').getByRole('tab', { name: 'SKU 采购历史' })).toBeVisible();
  await expect(page.getByTestId('ali1688-sku-purchase-history-page')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '商品信息' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '采购历史' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '采购单价趋势' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '采购总结' })).toBeVisible();

  const keywordBox = page.getByLabel('名称搜索');
  const filterBox = page.locator('.ali1688-sku-purchase-history-query');
  await expect(keywordBox).toBeVisible();
  await expect(page.getByPlaceholder('名称 / SKU')).toBeVisible();
  await expect(page.getByPlaceholder('搜索商品标题 / SKU Parent / Partner SKU / PSKU')).toHaveCount(0);
  await expect(page.getByTestId('sku-purchase-link-status-filter')).toBeVisible();
  await expect(page.getByRole('combobox', { name: '关联' })).toBeVisible();
  await expect(page.getByTestId('sku-purchase-link-status-filter').locator('.ant-segmented')).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: '店铺' })).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: '站点' })).toHaveCount(0);
  const keywordBounds = await keywordBox.boundingBox();
  const dateRangeBounds = await page.getByPlaceholder('采购开始').boundingBox();
  expect(keywordBounds).not.toBeNull();
  expect(await filterBox.boundingBox()).not.toBeNull();
  expect(dateRangeBounds).not.toBeNull();
  expect(keywordBounds!.x).toBeLessThan(dateRangeBounds!.x);
  expect(keywordBounds!.width).toBeLessThanOrEqual(220);

  const productImage = page.getByRole('img', { name: '仿真罂粟花束 6 支装 家居装饰' });
  await expect(productImage).toBeVisible();
  await expect(productImage).toHaveAttribute('src', /canman-flower\.jpg$/);
  const productImageFrame = productImage.locator('xpath=ancestor::span[contains(@class, "ali1688-sku-product-thumbnail")][1]');
  await expect(productImageFrame).toHaveClass(/ali1688-sku-product-thumbnail--linked/);
  await expect(productImageFrame).toHaveCSS('border-color', 'rgb(34, 197, 94)');
  await expect(page.getByText('CANMAN-AE-SKU-001')).toBeVisible();
  await expect(page.getByText('PSKU: CANMAN-FLOWER-AE')).toBeVisible();
  await expect(page.getByText('SKU: CANMAN-AE-SKU-001')).toBeVisible();
  await expect(page.getByText('Partner SKU: CANMAN-FLOWER-AE')).toHaveCount(0);
  await expect(page.getByText('店铺: PRJ108065 · AE', { exact: true })).toBeVisible();
  await page.getByText('仿真罂粟花束 6 支装 家居装饰', { exact: true }).hover();
  const titleTooltip = page.locator('.ant-tooltip').filter({ hasText: '商品详情中文名：仿真花束套装' });
  await expect(titleTooltip.getByText('中文名', { exact: true })).toBeVisible();
  await expect(titleTooltip.getByText('商品详情中文名：仿真花束套装', { exact: true })).toBeVisible();
  await expect(page.getByText('采购次数: 2')).toBeVisible();
  await expect(page.getByText('采购总费用: ¥244.00')).toBeVisible();
  await expect(page.getByText('采购总件数: 9')).toBeVisible();
  await expect(page.getByText('平均采购单价: ¥27.11')).toBeVisible();
  await expect(page.getByText('最近采购单价: ¥40.00')).toBeVisible();
  await expect(page.getByText('按实付款分摊')).toHaveCount(0);
  await expect(page.getByText('按货品金额分摊')).toHaveCount(0);
  await expect(page.getByTestId('sku-purchase-sparkline-CANMAN-AE-SKU-001')).toBeVisible();
  await expect(page.getByText('1688 未关联纸巾盒')).toHaveCount(0);

  await page.getByTestId('sku-purchase-history-summary-CANMAN-AE-SKU-001').hover();
  const popover = page.locator('.ant-popover');
  await expect(popover.getByText('采购历史摘要')).toBeVisible();
  await expect(popover.getByText('ALI-ORDER-20260527-002', { exact: true })).toBeVisible();
  await expect(popover.getByText('任丘市溪潼针织机加工厂')).toBeVisible();

  expect(new URL(requestedUrl).searchParams.get('storeCode')).toBe('PRJ108065');
  expect(new URL(requestedUrl).searchParams.get('siteCode')).toBe('AE');
  expect(new URL(requestedUrl).searchParams.get('linkStatus')).toBeNull();
});

test('SKU purchase history filters by name and association status', async ({ page }) => {
  const requestedUrls: string[] = [];
  await page.route('**/api/procurement/ali1688-orders/sku-purchase-history**', async (route) => {
    const requestUrl = route.request().url();
    requestedUrls.push(requestUrl);
    const keyword = new URL(requestUrl).searchParams.get('keyword');
    await route.fulfill({
      json: keyword === 'NO-LINK-SKU'
        ? {
          items: [],
          unlinkedAssignedLineCount: 3,
          pagination: {
            page: 1,
            pageSize: 20,
            total: 0
          }
        }
        : skuPurchaseHistory
    });
  });

  await page.goto('/purchase/ali1688-sku-purchase-history?devSession=1&devRole=operator&grantAli1688HistoricalOrders=1');

  await expect(page.getByTestId('ali1688-sku-purchase-history-page')).toBeVisible();
  await expect(page.getByPlaceholder('采购开始')).toBeVisible();
  await expect(page.getByPlaceholder('采购结束')).toBeVisible();
  await page.getByLabel('名称搜索').fill('NO-LINK-SKU');
  const linkStatusSelect = page.getByTestId('sku-purchase-link-status-filter').locator('.ant-select-selector');
  await linkStatusSelect.click();
  await page.locator('.ant-select-dropdown').getByText('未关联', { exact: true }).click();
  await page.getByRole('button', { name: '查询' }).click();

  await expect(page.getByText('当前筛选下没有已关联 SKU 采购历史')).toBeVisible();
  await expect(page.getByText('有 3 条已分配货品行尚未商品关联')).toBeVisible();
  const lastRequestUrl = new URL(requestedUrls[requestedUrls.length - 1]);
  expect(lastRequestUrl.searchParams.get('keyword')).toBe('NO-LINK-SKU');
  expect(lastRequestUrl.searchParams.get('storeCode')).toBe('PRJ108065');
  expect(lastRequestUrl.searchParams.get('siteCode')).toBe('AE');
  expect(lastRequestUrl.searchParams.get('linkStatus')).toBe('unlinked');

  await linkStatusSelect.click();
  await page.locator('.ant-select-dropdown').getByText('已关联', { exact: true }).click();
  await page.getByRole('button', { name: '查询' }).click();
  const linkedRequestUrl = new URL(requestedUrls[requestedUrls.length - 1]);
  expect(linkedRequestUrl.searchParams.get('linkStatus')).toBe('linked');

  await linkStatusSelect.click();
  await page.locator('.ant-select-dropdown').getByText('全部', { exact: true }).click();
  await page.getByRole('button', { name: '查询' }).click();
  const allRequestUrl = new URL(requestedUrls[requestedUrls.length - 1]);
  expect(allRequestUrl.searchParams.get('linkStatus')).toBeNull();
});

test('user can group SKU purchase orders into batches and manually adjust counted quantity and cost', async ({ page }) => {
  let savedBatchRequest: any;
  let returnPersistedBatches = false;
  await page.route('**/api/procurement/ali1688-orders/sku-purchase-history**', async (route) => {
    const response = returnPersistedBatches
      ? {
        ...skuPurchaseHistory,
        items: [
          {
            ...skuPurchaseHistory.items[0],
            purchaseBatches: [
              {
                id: 102001,
                label: '批次 1',
                batchSequence: 1,
                countedQuantity: 3,
                countedCost: '120.00',
                unitPrice: '40.00',
                note: '3个/套换6个/套',
                sources: [
                  {
                    orderId: 93002,
                    itemId: 94002,
                    assignmentId: 99002,
                    orderNo: 'ALI-ORDER-20260527-002',
                    orderTime: '2026-05-27 11:20:00',
                    supplierName: '义乌诚信通源头工厂'
                  },
                  {
                    orderId: 93001,
                    itemId: 94001,
                    assignmentId: 99001,
                    orderNo: 'ALI-ORDER-20260525-001',
                    orderTime: '2026-05-25 10:30:00',
                    supplierName: '任丘市溪潼针织机加工厂'
                  }
                ]
              }
            ]
          }
        ]
      }
      : skuPurchaseHistory;
    await route.fulfill({ json: response });
  });
  await page.route('**/api/procurement/ali1688-orders/sku-purchase-history/batches', async (route) => {
    savedBatchRequest = route.request().postDataJSON();
    returnPersistedBatches = true;
    await route.fulfill({
      json: {
        savedBatchCount: 1,
        savedSourceCount: 2
      }
    });
  });

  await page.goto('/purchase/ali1688-sku-purchase-history?devSession=1&devRole=procurement&grantAli1688HistoricalOrders=1');

  await expect(page.getByText('采购次数: 2')).toBeVisible();
  await expect(page.getByText('采购总费用: ¥244.00')).toBeVisible();
  await page.getByRole('button', { name: '批次明细' }).click();

  const batchDrawer = page.locator('.ant-drawer').filter({ hasText: '采购批次 · CANMAN-AE-SKU-001' });
  await expect(batchDrawer).toBeVisible();
  const sourceTable = batchDrawer.getByTestId('sku-purchase-batch-source-table');
  await expect(sourceTable.getByText('ALI-ORDER-20260527-002', { exact: true })).toBeVisible();
  await expect(sourceTable.getByText('ALI-ORDER-20260525-001', { exact: true })).toBeVisible();

  const firstSourceRow = sourceTable.locator('tr').filter({ hasText: 'ALI-ORDER-20260527-002' });
  const secondSourceRow = sourceTable.locator('tr').filter({ hasText: 'ALI-ORDER-20260525-001' });
  await firstSourceRow.getByRole('checkbox').check();
  await secondSourceRow.getByRole('checkbox').check();
  await batchDrawer.getByRole('button', { name: '合并为批次' }).click();

  const batchRow = batchDrawer.locator('tr').filter({ hasText: '批次 1' });
  await expect(batchRow.getByText('2 单')).toBeVisible();
  const quantityInput = batchRow.getByLabel('批次 1 计入 SKU 数量');
  await quantityInput.fill('2.7');
  await quantityInput.press('Tab');
  await expect(quantityInput).toHaveValue('3');
  await batchRow.getByLabel('批次 1 计入 SKU 成本').fill('120');
  await batchRow.getByLabel('批次 1 备注').fill('3个/套换6个/套');
  await expect(batchRow.getByText('¥40.00')).toBeVisible();
  await expect(batchDrawer.getByText('批次汇总: 采购次数 1 · 总费用 ¥120.00 · 总件数 3')).toBeVisible();

  await batchDrawer.getByRole('button', { name: '保存' }).click();
  expect(savedBatchRequest.storeCode).toBe('PRJ108065');
  expect(savedBatchRequest.siteCode).toBe('AE');
  expect(savedBatchRequest.skuParent).toBe('CANMAN-AE-SKU-001');
  expect(savedBatchRequest.batches).toHaveLength(1);
  expect(savedBatchRequest.batches[0].countedQuantity).toBe(3);
  expect(savedBatchRequest.batches[0].countedCost).toBe(120);
  expect(savedBatchRequest.batches[0].sources.map((source: any) => source.assignmentId)).toEqual([99002, 99001]);
  await expect(page.getByText('采购次数: 1')).toBeVisible();
  await expect(page.getByText('采购总费用: ¥120.00')).toBeVisible();
  await expect(page.getByText('采购总件数: 3')).toBeVisible();
  await expect(page.getByText('平均采购单价: ¥40.00')).toBeVisible();

  await page.reload();
  await expect(page.getByText('采购次数: 1')).toBeVisible();
  await expect(page.getByText('采购总费用: ¥120.00')).toBeVisible();
  await expect(page.getByText('采购总件数: 3')).toBeVisible();
});
