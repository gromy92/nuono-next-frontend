import { expect, test } from '@playwright/test';

test('system reports store data route renders Noon store data without legacy overview API', async ({ page }) => {
  const legacyOverviewCalls: string[] = [];
  await page.route('**/api/noon-call/store-data', async (route) => {
    await route.fulfill({
      json: {
        title: '店铺数据',
        generatedAt: '2026-05-26T11:00:00',
        metrics: [{ key: 'store_count', title: '店铺站点', value: 1, unit: '个', state: 'ready' }],
        rows: [
          {
            ownerUserId: 307,
            storeName: 'canman',
            storeCode: 'STR108065-NAE',
            siteCode: 'AE',
            overallMarker: 'PENDING_SYNC',
            categories: [
              {
                category: 'PRODUCT_LIST',
                label: '商品列表信息',
                marker: 'PENDING_SYNC',
                latestStatus: 'INCOMPLETE',
                historyStatus: 'NOT_REQUIRED',
                syncable: true
              }
            ]
          }
        ]
      }
    });
  });
  await page.route('**/api/system-reports/store-data/overview**', async (route) => {
    legacyOverviewCalls.push(route.request().url());
    await route.fulfill({
      status: 404,
      json: { message: 'No message available' }
    });
  });

  await page.goto('/system-reports/store-data?devSession=1&grantSystemReports=1');

  await expect(page.getByTestId('noon-call-store-data-workbench')).toBeVisible();
  await expect(page.getByTestId('noon-call-store-data-workbench')).not.toContainText('系统报表 / 店铺数据');
  await expect(page.locator('body')).not.toContainText('系统报表 / 店铺数据');
  await expect(page.getByTestId('workspace-tabs-bar').getByRole('tab', { name: '店铺数据' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '店铺数据' })).toHaveCount(0);
  await expect(page.getByTestId('noon-call-store-data-workbench')).toContainText('canman');
  await expect(page.getByTestId('noon-call-store-data-workbench')).not.toContainText('STR108065-NAE');
  await expect(page.getByTestId('noon-call-cell-PRODUCT_LIST')).not.toContainText('无需补全');
  await expect(page.getByTestId('noon-call-cell-PRODUCT_LIST')).not.toContainText('数据日');
  expect(legacyOverviewCalls).toHaveLength(0);
});

test('noon call store data shows four sync cells and posts category-specific sync actions', async ({ page }) => {
  const syncCalls: string[] = [];
  await page.route('**/api/noon-call/store-data', async (route) => {
    await route.fulfill({
      json: {
        title: '店铺数据',
        generatedAt: '2026-05-25T14:00:00',
        metrics: [
          { key: 'store_count', title: '店铺站点', value: 1, unit: '个', state: 'ready' },
          { key: 'complete_cells', title: '完整数据项', value: 1, unit: '项', state: 'ready' },
          { key: 'pending_cells', title: '待同步数据项', value: 2, unit: '项', state: 'warning' },
          { key: 'failed_cells', title: '失败数据项', value: 1, unit: '项', state: 'warning' }
        ],
        rows: [
          {
            ownerUserId: 307,
            storeName: 'canman',
            storeCode: 'STR108065-NAE',
            siteCode: 'AE',
            overallMarker: 'SYNCING',
            lastSyncAt: '2026-05-25T13:58:00',
            categories: [
              {
                category: 'PRODUCT_LIST',
                label: '商品列表信息',
                completenessId: 900001,
                marker: 'COMPLETE',
                latestStatus: 'READY',
                historyStatus: 'NOT_REQUIRED',
                latestDataDate: '2026-05-24',
                activeGapCount: 0,
                latestTaskId: 130001,
                latestTaskStatus: 'SUCCEEDED',
                lastSyncAt: '2026-05-25T12:00:00',
                syncable: true
              },
              {
                category: 'PRODUCT_DETAIL',
                label: '商品信息',
                completenessId: 900002,
                marker: 'PENDING_SYNC',
                latestStatus: 'INCOMPLETE',
                historyStatus: 'INCOMPLETE',
                activeGapCount: 2,
                syncable: true
              },
              {
                category: 'SALES_ORDER',
                label: '订单数据',
                completenessId: 900003,
                marker: 'FAILED',
                latestStatus: 'FAILED',
                historyStatus: 'INCOMPLETE',
                failureType: 'missing_columns',
                activeGapCount: 1,
                syncable: true
              },
              {
                category: 'SALES_PRODUCT_VIEWS',
                label: '销量数据',
                completenessId: 900004,
                marker: 'SYNCING',
                latestStatus: 'PENDING_CONFIRMATION',
                historyStatus: 'INCOMPLETE',
                latestTaskId: 130004,
                latestTaskStatus: 'RUNNING',
                lastSyncAt: '2026-05-25T13:58:00',
                syncable: true
              }
            ]
          }
        ]
      }
    });
  });
  await page.route('**/api/noon-call/store-data/307/STR108065-NAE/AE/*/sync', async (route) => {
    syncCalls.push(route.request().url());
    await route.fulfill({
      json: {
        plannedTaskCount: 1,
        plannedTaskIds: [130099],
        message: '已提交同步任务。'
      }
    });
  });

  await page.goto('/noon-call/store-data?devSession=1&devRole=boss&grantSystemReports=1');

  await expect(page.getByTestId('noon-call-store-data-workbench')).toBeVisible();
  await expect(page.getByTestId('noon-call-store-data-workbench')).not.toContainText('系统报表 / 店铺数据');
  await expect(page.locator('body')).not.toContainText('系统报表 / 店铺数据');
  await expect(page.getByTestId('workspace-tabs-bar').getByRole('tab', { name: '店铺数据' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '店铺数据' })).toHaveCount(0);
  await expect(page.getByTestId('noon-call-store-data-workbench')).toContainText('canman');
  await expect(page.getByTestId('noon-call-store-data-workbench')).not.toContainText('STR108065-NAE');
  await expect(page.getByRole('columnheader', { name: '整体标记' })).toHaveCount(0);
  await expect(page.getByRole('columnheader', { name: '最近同步' })).toHaveCount(0);
  await expect(page.getByTestId('noon-call-store-cell').first()).toContainText('同步中');
  await expect(page.getByTestId('noon-call-store-data-marker-chart')).toBeVisible();
  await expect(page.getByTestId('noon-call-store-data-category-status-chart')).toBeVisible();
  await expect(page.getByTestId('noon-call-store-data-gap-chart')).toBeVisible();

  const categories = ['PRODUCT_LIST', 'PRODUCT_DETAIL', 'SALES_ORDER', 'SALES_PRODUCT_VIEWS'];
  for (const category of categories) {
    await expect(page.getByTestId(`noon-call-cell-${category}`)).toContainText('同步');
  }
  await expect(page.getByTestId('noon-call-cell-PRODUCT_LIST')).toContainText('完整');
  await expect(page.getByTestId('noon-call-cell-PRODUCT_DETAIL')).toContainText('待同步');
  await expect(page.getByTestId('noon-call-cell-SALES_ORDER')).toContainText('失败');
  await expect(page.getByTestId('noon-call-cell-SALES_PRODUCT_VIEWS')).toContainText('同步中');
  await expect(page.getByTestId('noon-call-cell-PRODUCT_LIST')).not.toContainText('就绪');
  await expect(page.getByTestId('noon-call-cell-PRODUCT_LIST')).not.toContainText('无需补全');
  await expect(page.getByTestId('noon-call-cell-PRODUCT_LIST')).toContainText('数据截至 2026-05-24');
  await expect(page.getByTestId('noon-call-cell-PRODUCT_DETAIL')).not.toContainText('无需补全');
  await expect(page.getByTestId('noon-call-cell-PRODUCT_DETAIL')).not.toContainText('数据日');

  for (const category of categories) {
    await page.getByTestId(`noon-call-cell-${category}`).getByRole('button', { name: /同\s*步/ }).click();
  }

  await expect.poll(() => syncCalls.length).toBe(4);
  for (const category of categories) {
    expect(syncCalls.some((url) => url.includes(`/${category}/sync`))).toBeTruthy();
  }
});

test('noon call store data can batch sync all syncable categories', async ({ page }) => {
  const syncCalls: string[] = [];
  await page.route('**/api/noon-call/store-data', async (route) => {
    await route.fulfill({
      json: {
        title: '店铺数据',
        generatedAt: '2026-05-25T14:00:00',
        metrics: [{ key: 'store_count', title: '店铺站点', value: 1, unit: '个', state: 'ready' }],
        rows: [
          {
            ownerUserId: 307,
            storeName: 'canman',
            storeCode: 'STR108065-NAE',
            siteCode: 'AE',
            overallMarker: 'PENDING_SYNC',
            categories: [
              {
                category: 'PRODUCT_LIST',
                label: '商品列表信息',
                marker: 'PENDING_SYNC',
                latestStatus: 'INCOMPLETE',
                historyStatus: 'INCOMPLETE',
                syncable: true
              },
              {
                category: 'PRODUCT_DETAIL',
                label: '商品信息',
                marker: 'PENDING_SYNC',
                latestStatus: 'INCOMPLETE',
                historyStatus: 'INCOMPLETE',
                syncable: true
              },
              {
                category: 'SALES_ORDER',
                label: '订单数据',
                marker: 'PENDING_SYNC',
                latestStatus: 'INCOMPLETE',
                historyStatus: 'INCOMPLETE',
                syncable: true
              },
              {
                category: 'SALES_PRODUCT_VIEWS',
                label: '销量数据',
                marker: 'PENDING_SYNC',
                latestStatus: 'INCOMPLETE',
                historyStatus: 'INCOMPLETE',
                syncable: true
              }
            ]
          }
        ]
      }
    });
  });
  await page.route('**/api/noon-call/store-data/307/STR108065-NAE/AE/*/sync', async (route) => {
    syncCalls.push(route.request().url());
    await route.fulfill({
      json: {
        plannedTaskCount: 1,
        plannedTaskIds: [130099],
        executedTaskCount: 1,
        failedTaskCount: 0,
        skippedTaskCount: 0,
        message: '已立即执行同步任务。'
      }
    });
  });

  await page.goto('/system-reports/store-data?devSession=1&devRole=boss&grantSystemReports=1');
  await page.getByRole('button', { name: /批量全部同步/ }).click();

  await expect.poll(() => syncCalls.length).toBe(4);
  for (const category of ['PRODUCT_LIST', 'PRODUCT_DETAIL', 'SALES_ORDER', 'SALES_PRODUCT_VIEWS']) {
    expect(syncCalls.some((url) => url.includes(`/${category}/sync`))).toBeTruthy();
  }
});

test('store data table stays within viewport and optimistically marks a clicked item syncing', async ({ page }) => {
  let finishSync: (() => void) | null = null;
  await page.route('**/api/noon-call/store-data', async (route) => {
    await route.fulfill({
      json: {
        title: '店铺数据',
        generatedAt: '2026-05-25T14:00:00',
        metrics: [
          { key: 'store_count', title: '店铺站点', value: 1, unit: '个', state: 'ready' },
          { key: 'pending_cells', title: '待同步数据项', value: 4, unit: '项', state: 'warning' }
        ],
        rows: [
          {
            ownerUserId: 307,
            storeName: 'canman',
            storeCode: 'STR108065-NAE',
            siteCode: 'AE',
            overallMarker: 'PENDING_SYNC',
            categories: [
              {
                category: 'PRODUCT_LIST',
                label: '商品列表信息',
                marker: 'PENDING_SYNC',
                latestStatus: 'INCOMPLETE',
                historyStatus: 'INCOMPLETE',
                syncable: true
              },
              {
                category: 'PRODUCT_DETAIL',
                label: '商品信息',
                marker: 'PENDING_SYNC',
                latestStatus: 'INCOMPLETE',
                historyStatus: 'INCOMPLETE',
                syncable: true
              },
              {
                category: 'SALES_ORDER',
                label: '订单数据',
                marker: 'PENDING_SYNC',
                latestStatus: 'INCOMPLETE',
                historyStatus: 'INCOMPLETE',
                syncable: true
              },
              {
                category: 'SALES_PRODUCT_VIEWS',
                label: '销量数据',
                marker: 'PENDING_SYNC',
                latestStatus: 'INCOMPLETE',
                historyStatus: 'INCOMPLETE',
                syncable: true
              }
            ]
          }
        ]
      }
    });
  });
  await page.route('**/api/noon-call/store-data/307/STR108065-NAE/AE/PRODUCT_DETAIL/sync', async (route) => {
    await new Promise<void>((resolve) => {
      finishSync = resolve;
    });
    await route.fulfill({
      json: {
        plannedTaskCount: 1,
        plannedTaskIds: [130199],
        message: '已提交同步任务。'
      }
    });
  });

  await page.goto('/system-reports/store-data?devSession=1&devRole=boss&grantSystemReports=1');

  await expect(page.getByTestId('noon-call-store-data-workbench')).toContainText('canman');
  await expect(page.getByTestId('noon-call-cell-PRODUCT_DETAIL').getByText('未完成')).toHaveCount(1);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
    .toBe(true);

  await page.getByTestId('noon-call-cell-PRODUCT_DETAIL').getByRole('button', { name: /同\s*步/ }).click();
  await expect(page.getByTestId('noon-call-cell-PRODUCT_DETAIL')).toContainText('同步中');
  finishSync?.();
});

test('system administrator can submit noon call store data sync actions', async ({ page }) => {
  const syncCalls: string[] = [];
  await page.route('**/api/noon-call/store-data', async (route) => {
    await route.fulfill({
      json: {
        title: '店铺数据',
        generatedAt: '2026-05-25T14:00:00',
        metrics: [{ key: 'store_count', title: '店铺站点', value: 1, unit: '个', state: 'ready' }],
        rows: [
          {
            ownerUserId: 307,
            storeCode: 'STR108065-NAE',
            siteCode: 'AE',
            overallMarker: 'PENDING_SYNC',
            categories: [
              {
                category: 'PRODUCT_LIST',
                label: '商品列表信息',
                marker: 'PENDING_SYNC',
                latestStatus: 'INCOMPLETE',
                historyStatus: 'INCOMPLETE',
                syncable: true
              }
            ]
          }
        ]
      }
    });
  });
  await page.route('**/api/noon-call/store-data/307/STR108065-NAE/AE/PRODUCT_LIST/sync', async (route) => {
    syncCalls.push(route.request().url());
    await route.fulfill({
      json: {
        plannedTaskCount: 1,
        plannedTaskIds: [130109],
        message: '已提交同步任务。'
      }
    });
  });

  await page.goto('/noon-call/store-data?devSession=1&grantSystemReports=1');

  const syncButton = page.getByTestId('noon-call-cell-PRODUCT_LIST').getByRole('button', { name: /同\s*步/ });
  await expect(syncButton).toBeEnabled();
  await syncButton.click();

  await expect.poll(() => syncCalls.length).toBe(1);
});
