import { expect, test } from '@playwright/test';
import { assignmentTargetOptions, authorizedWorkbench, clickAssignmentTarget, missingFieldDetail, missingFieldWorkbench, noAuthorizationWorkbench, partialSuccessWorkbench, mockAliHistoricalOrderDefaults, storeSyncOverview, syncedWorkbench } from './ali1688-historical-orders.fixtures';

test.beforeEach(async ({ page }) => mockAliHistoricalOrderDefaults(page));

test('filters and search drive owner-level backend query and table shows item summary', async ({ page }) => {
  const seenQueries: string[] = [];
  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    seenQueries.push(new URL(route.request().url()).search);
    await route.fulfill({ json: syncedWorkbench });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');

  await expect.poll(() => new URLSearchParams(seenQueries[0] || '').get('storeCode')).toBeNull();
  await expect.poll(() => new URLSearchParams(seenQueries[0] || '').get('siteCode')).toBeNull();
  await page.getByLabel('供应商').fill('义乌');
  await page.getByRole('combobox', { name: '订单状态' }).click();
  await page.getByTitle('已付款').click();
  await page.getByPlaceholder('订单号 / 商品 / offerId / SKU / 货号').fill('745612345678');
  await expect(page.getByText('仿真罂粟花束 6 支装 家居装饰')).toBeVisible();
  await expect.poll(() => seenQueries.at(-1) || '').toContain('supplierKeyword=%E4%B9%89%E4%B9%8C');
  await expect.poll(() => seenQueries.at(-1) || '').toContain('orderStatus=%E5%B7%B2%E4%BB%98%E6%AC%BE');
  await expect.poll(() => seenQueries.at(-1) || '').toContain('keyword=745612345678');

  await page.locator('.ant-select:has(input[aria-label="分配店铺"]) .ant-select-selector').click();
  await page.getByTitle('未分配').click();
  await expect.poll(() => seenQueries.at(-1) || '').toContain('assignmentState=unassigned');
  await expect(page.getByText('仿真罂粟花束 6 支装 家居装饰')).not.toBeVisible();
  await expect(page.getByText('跨境B6复古五角星锁心本')).toBeVisible();

  await page.locator('.ant-select:has(input[aria-label="分配店铺"]) .ant-select-selector').click();
  await page.getByTitle('canman AE').click();
  await expect.poll(() => seenQueries.at(-1) || '').toContain('assignmentTargetStoreCode=PRJ108065');
  await expect.poll(() => seenQueries.at(-1) || '').toContain('assignmentTargetSiteCode=AE');
  await expect.poll(() => new URLSearchParams(seenQueries.at(-1) || '').get('storeCode')).toBeNull();
  await expect.poll(() => new URLSearchParams(seenQueries.at(-1) || '').get('siteCode')).toBeNull();

  await page.locator('.ant-select:has(input[aria-label="商品关联"]) .ant-select-selector').click();
  await page.getByTitle('已关联').click();
  await expect.poll(() => seenQueries.at(-1) || '').toContain('productLinkState=linked');

  await page.locator('.ant-select:has(input[aria-label="商品关联"]) .ant-select-selector').click();
  await page.getByTitle('未关联').click();
  await expect.poll(() => seenQueries.at(-1) || '').toContain('productLinkState=unlinked');
});

test('keyword search is the first historical order filter control', async ({ page }) => {
  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: syncedWorkbench });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');

  const firstFilterControl = page.locator('.ali1688-historical-orders-query > *').first();
  await expect(firstFilterControl.locator('input[placeholder="订单号 / 商品 / offerId / SKU / 货号"]')).toBeVisible();
  await expect(page.getByRole('button', { name: '查询' })).toHaveCount(0);
});

test('filters update pagination total and search fields can be cleared', async ({ page }) => {
  let workbench = {
    ...JSON.parse(JSON.stringify(syncedWorkbench)),
    syncSummary: {
      ...syncedWorkbench.syncSummary,
      totalItemCount: 4373
    },
    pagination: {
      page: 1,
      pageSize: 20,
      total: 23
    }
  };

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    const search = new URL(route.request().url()).searchParams;
    if (search.get('keyword') === '锁心本') {
      const filtered = JSON.parse(JSON.stringify(syncedWorkbench));
      filtered.syncSummary.totalItemCount = 4373;
      filtered.orders[0].items = [filtered.orders[0].items[1]];
      filtered.pagination = {
        page: 1,
        pageSize: 20,
        total: 21
      };
      workbench = filtered;
    }
    await route.fulfill({ json: workbench });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  await expect(page.getByText('共 23 条货品行')).toBeVisible();

  const keywordInput = page.getByPlaceholder('订单号 / 商品 / offerId / SKU / 货号');
  await keywordInput.fill('锁心本');
  const keywordWrapper = keywordInput.locator('xpath=ancestor::*[contains(@class, "ant-input-affix-wrapper")][1]');
  await expect(keywordWrapper.locator('.ant-input-clear-icon')).toBeVisible();
  await expect(page.getByText('共 21 条货品行')).toBeVisible();

  await keywordWrapper.locator('.ant-input-clear-icon').click();
  await expect(keywordInput).toHaveValue('');
});

test('server pagination renders the rows returned for the selected page', async ({ page }) => {
  const pageOneWorkbench = JSON.parse(JSON.stringify(syncedWorkbench));
  pageOneWorkbench.orders[0].items = [{
    ...pageOneWorkbench.orders[0].items[0],
    id: '94001-PAGE-1',
    title: '第一页服务端货品'
  }];
  pageOneWorkbench.pagination = {
    page: 1,
    pageSize: 20,
    total: 40
  };

  const pageTwoWorkbench = JSON.parse(JSON.stringify(syncedWorkbench));
  pageTwoWorkbench.orders[0].items = Array.from({ length: 23 }, (_, index) => ({
    ...pageTwoWorkbench.orders[0].items[1],
    id: `94002-PAGE-2-${index + 1}`,
    title: `第二页第 ${index + 1} 条服务端货品`
  }));
  pageTwoWorkbench.pagination = {
    page: 2,
    pageSize: 20,
    total: 40
  };

  const seenPages: string[] = [];
  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    const requestedPage = new URL(route.request().url()).searchParams.get('page') || '1';
    seenPages.push(requestedPage);
    await route.fulfill({ json: requestedPage === '2' ? pageTwoWorkbench : pageOneWorkbench });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  await expect(page.getByText('第一页服务端货品')).toBeVisible();

  await page.locator('.ant-pagination-item-2').click();

  await expect.poll(() => seenPages).toContain('2');
  await expect(page.getByText('第二页第 1 条服务端货品')).toBeVisible();
  await expect(page.getByText('第一页服务端货品')).toHaveCount(0);
});
