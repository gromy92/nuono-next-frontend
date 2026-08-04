import { expect, test } from '@playwright/test';
import { assignmentTargetOptions, authorizedWorkbench, clickAssignmentTarget, missingFieldDetail, missingFieldWorkbench, noAuthorizationWorkbench, mockAliHistoricalOrderDefaults, storeSyncOverview, syncedWorkbench } from './ali1688-historical-orders.fixtures';

test.beforeEach(async ({ page }) => mockAliHistoricalOrderDefaults(page));

test('unassigned filter removes stale split rows with duplicated source item ids', async ({ page }) => {
  const splitWorkbench = JSON.parse(JSON.stringify(syncedWorkbench));
  splitWorkbench.orders = [
    {
      ...splitWorkbench.orders[0],
      goodsTotalText: '¥76.80',
      paidAmountText: '¥76.80',
      items: [{
        ...splitWorkbench.orders[0].items[0],
        quantity: 6,
        assignedQuantity: 6,
        remainingQuantity: 0,
        assignmentStatus: 'assigned',
        assignmentStatusLabel: '已分配',
        assignmentBreakdownText: 'PRJ108065 AE 6',
        amountText: '¥76.80'
      }]
    },
    {
      ...splitWorkbench.orders[0],
      goodsTotalText: '¥51.20',
      paidAmountText: '¥51.20',
      items: [{
        ...splitWorkbench.orders[0].items[0],
        quantity: 4,
        assignedQuantity: 4,
        remainingQuantity: 0,
        assignmentStatus: 'assigned',
        assignmentStatusLabel: '已分配',
        assignmentBreakdownText: 'PRJ108065 SA 4',
        amountText: '¥51.20'
      }]
    },
    {
      ...splitWorkbench.orders[0],
      id: '93002',
      orderNo: 'ALI-ORDER-UNASSIGNED',
      items: [{
        ...splitWorkbench.orders[0].items[1],
        assignmentStatus: 'unassigned',
        assignmentStatusLabel: '未分配',
        assignmentBreakdownText: ''
      }]
    }
  ];
  splitWorkbench.pagination = {
    page: 1,
    pageSize: 20,
    total: 3
  };

  const unassignedWorkbench = JSON.parse(JSON.stringify(splitWorkbench));
  unassignedWorkbench.orders = [splitWorkbench.orders[2]];
  unassignedWorkbench.pagination = {
    page: 1,
    pageSize: 20,
    total: 1
  };

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    const search = new URL(route.request().url()).searchParams;
    await route.fulfill({
      json: search.get('assignmentState') === 'unassigned'
        ? unassignedWorkbench
        : splitWorkbench
    });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  await expect(page.getByText('分配信息 canman AE')).toBeVisible();
  await expect(page.getByText('分配信息 未分配')).toBeVisible();

  await page.getByRole('combobox', { name: '分配店铺' }).click();
  await page.getByTitle('未分配').click();
  await expect(page.getByText('共 1 条货品行')).toBeVisible();
  await expect(page.getByText('分配信息 未分配')).toBeVisible();
  await expect(page.getByText('分配信息 canman AE')).toHaveCount(0);
  await expect(page.getByText('分配信息 canman SA')).toHaveCount(0);
});

test('product link filter shows linked and unlinked assigned product lines', async ({ page }) => {
  const workbench = JSON.parse(JSON.stringify(syncedWorkbench));
  workbench.orders[0].items = [
    {
      ...workbench.orders[0].items[0],
      id: '94001-LINKED',
      title: '已关联采购货品',
      assignmentId: 99001,
      assignmentStatus: 'assigned',
      assignmentTargetType: 'STORE_SITE',
      assignmentTargetStoreCode: 'PRJ108065',
      assignmentTargetSiteCode: 'AE',
      assignmentBreakdownText: 'PRJ108065 AE 6',
      productLink: {
        status: 'linked',
        skuParent: 'CANMAN-AE-SKU-001',
        partnerSku: 'PAPERSAYSB291',
        displayText: '已关联: CANMAN-AE-SKU-001'
      }
    },
    {
      ...workbench.orders[0].items[1],
      id: '94002-UNLINKED',
      title: '未关联采购货品',
      assignmentId: 99002,
      assignmentStatus: 'assigned',
      assignmentTargetType: 'STORE_SITE',
      assignmentTargetStoreCode: 'PRJ108065',
      assignmentTargetSiteCode: 'AE',
      assignmentBreakdownText: 'PRJ108065 AE 10',
      productLink: undefined
    },
    {
      ...workbench.orders[0].items[1],
      id: '94003-UNASSIGNED',
      title: '未分配采购货品',
      assignmentId: undefined,
      assignmentStatus: 'unassigned',
      assignmentBreakdownText: '',
      productLink: undefined
    }
  ];
  const seenQueries: string[] = [];

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    seenQueries.push(new URL(route.request().url()).search);
    await route.fulfill({ json: workbench });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  await expect(page.getByText('已关联采购货品')).toBeVisible();
  await expect(page.getByText('未关联采购货品')).toBeVisible();
  await expect(page.getByText('未分配采购货品')).toBeVisible();

  await page.locator('.ant-select:has(input[aria-label="商品关联"]) .ant-select-selector').click();
  await page.getByTitle('已关联').click();
  await expect.poll(() => seenQueries.at(-1) || '').toContain('productLinkState=linked');
  await expect(page.getByText('已关联采购货品')).toBeVisible();
  await expect(page.getByText('未关联采购货品')).toHaveCount(0);
  await expect(page.getByText('未分配采购货品')).toHaveCount(0);

  await page.locator('.ant-select:has(input[aria-label="商品关联"]) .ant-select-selector').click();
  await page.getByTitle('未关联').click();
  await expect.poll(() => seenQueries.at(-1) || '').toContain('productLinkState=unlinked');
  await expect(page.getByText('已关联采购货品')).toHaveCount(0);
  await expect(page.getByText('未关联采购货品')).toBeVisible();
  await expect(page.getByText('未分配采购货品')).toHaveCount(0);
});

test('toolbar keeps action buttons in the right action group', async ({ page }) => {
  await page.setViewportSize({ width: 1700, height: 1000 });
  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: syncedWorkbench });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');

  const controlsBox = await page.locator('.ali1688-historical-orders-controls').boundingBox();
  const queryBox = await page.locator('.ali1688-historical-orders-query').boundingBox();
  const actionsBox = await page.locator('.ali1688-historical-orders-actions').boundingBox();
  expect(controlsBox).not.toBeNull();
  expect(queryBox).not.toBeNull();
  expect(actionsBox).not.toBeNull();
  expect(actionsBox!.y).toBeGreaterThan(queryBox!.y);
  expect(actionsBox!.x + actionsBox!.width).toBeLessThanOrEqual(controlsBox!.x + controlsBox!.width + 1);
  const supplierBox = await page.getByLabel('供应商').boundingBox();
  expect(supplierBox).not.toBeNull();
  expect(supplierBox!.width).toBeLessThanOrEqual(190);
  await expect(page.locator('.ali1688-historical-orders-actions').getByRole('button', { name: '批量分配/关联' })).toBeVisible();
});
