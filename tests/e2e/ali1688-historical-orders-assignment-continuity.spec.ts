import { expect, test } from '@playwright/test';
import { assignmentTargetOptions, authorizedWorkbench, clickAssignmentTarget, missingFieldDetail, missingFieldWorkbench, noAuthorizationWorkbench, mockAliHistoricalOrderDefaults, storeSyncOverview, syncedWorkbench } from './ali1688-historical-orders.fixtures';

test.beforeEach(async ({ page }) => mockAliHistoricalOrderDefaults(page));

test('boss can assign and link a product line in the same dialog', async ({ page }) => {
  let workbench = JSON.parse(JSON.stringify(syncedWorkbench));
  const assignedWorkbench = JSON.parse(JSON.stringify(syncedWorkbench));
  let assignmentPayload: any;
  let linkPayload: any;

  workbench.orders[0].items = [{
    ...workbench.orders[0].items[1],
    assignedQuantity: 0,
    remainingQuantity: 10,
    assignmentStatus: 'unassigned',
    assignmentStatusLabel: '未分配',
    assignmentBreakdownText: '',
    assignmentId: undefined,
    assignmentTargetType: undefined,
    assignmentTargetStoreCode: undefined,
    assignmentTargetSiteCode: undefined,
    productLink: undefined
  }];
  assignedWorkbench.orders[0].items = [{
    ...workbench.orders[0].items[0],
    assignedQuantity: 10,
    remainingQuantity: 0,
    assignmentStatus: 'assigned',
    assignmentStatusLabel: '已分配',
    assignmentBreakdownText: 'PRJ108065 AE 10',
    assignmentId: 99003,
    assignmentTargetType: 'STORE_SITE',
    assignmentTargetStoreCode: 'PRJ108065',
    assignmentTargetSiteCode: 'AE'
  }];

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: workbench });
  });
  await page.route('**/api/procurement/ali1688-orders/assignments', async (route) => {
    assignmentPayload = route.request().postDataJSON();
    workbench = assignedWorkbench;
    await route.fulfill({
      json: {
        status: 'assigned',
        assignedLineCount: 1,
        assignedQuantity: 10
      }
    });
  });
  await page.route('**/api/procurement/ali1688-orders/product-link-candidates**', async (route) => {
    await route.fulfill({
      json: [{
        storeCode: 'PRJ108065',
        siteCode: 'AE',
        skuParent: 'CANMAN-AE-SKU-003',
        partnerSku: 'CM-AE-PARTNER-003',
        pskuCode: 'PSKU-CM-AE-003',
        productTitle: 'canman AE 锁心本',
        productImageUrl: 'https://example.com/canman-ae-notebook.jpg',
        linkStatus: 'unlinked',
        linkedAssignmentCount: 0
      }]
    });
  });
  await page.route('**/api/procurement/ali1688-orders/product-links', async (route) => {
    linkPayload = route.request().postDataJSON();
    workbench.orders[0].items[0].productLink = {
      status: 'linked',
      skuParent: 'CANMAN-AE-SKU-003',
      partnerSku: 'CM-AE-PARTNER-003',
      pskuCode: 'PSKU-CM-AE-003',
      productTitle: 'canman AE 锁心本'
    };
    await route.fulfill({
      json: {
        status: 'linked',
        assignmentId: 99003,
        skuParent: 'CANMAN-AE-SKU-003',
        partnerSku: 'CM-AE-PARTNER-003',
        pskuCode: 'PSKU-CM-AE-003',
        productTitle: 'canman AE 锁心本'
      }
    });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  const row = page.getByText('跨境B6复古五角星锁心本').locator('xpath=ancestor::tr');
  await expect(row.getByRole('button', { name: '分配店铺' })).toHaveCount(0);
  await expect(row.getByRole('button', { name: '商品关联' })).toHaveCount(0);
  await row.getByRole('button', { name: '分配/关联' }).click();

  const dialog = page.getByRole('dialog', { name: '分配/关联' });
  await clickAssignmentTarget(dialog, 'canman AE');
  await dialog.getByRole('button', { name: '保存分配并继续关联' }).click();
  await expect.poll(() => assignmentPayload).toMatchObject({
    targetType: 'STORE_SITE',
    targetStoreCode: 'PRJ108065',
    targetSiteCode: 'AE',
    lines: [{ itemId: '94002', quantity: 10 }]
  });
  await expect(dialog.getByText('canman AE 锁心本')).toBeVisible();
  await dialog.getByText('CANMAN-AE-SKU-003').click();
  await dialog.getByRole('button', { name: '确认关联' }).click();

  await expect.poll(() => linkPayload).toMatchObject({
    assignmentId: 99003,
    skuParent: 'CANMAN-AE-SKU-003',
    partnerSku: 'CM-AE-PARTNER-003',
    pskuCode: 'PSKU-CM-AE-003'
  });
  await expect(page.getByText('已关联: CM-AE-PARTNER-003')).toBeVisible();
});

test('assign and continue keeps product search and discontinued action after unassigned filter refreshes away the row', async ({ page }) => {
  const unassignedWorkbench = JSON.parse(JSON.stringify(syncedWorkbench));
  const assignedDetail = JSON.parse(JSON.stringify(syncedWorkbench.orders[0]));
  let assigned = false;
  let assignmentPayload: any;
  const candidateRequests: string[] = [];

  unassignedWorkbench.orders[0].items = [{
    ...unassignedWorkbench.orders[0].items[1],
    assignedQuantity: 0,
    remainingQuantity: 10,
    assignmentStatus: 'unassigned',
    assignmentStatusLabel: '未分配',
    assignmentBreakdownText: '',
    assignmentId: undefined,
    assignmentTargetType: undefined,
    assignmentTargetStoreCode: undefined,
    assignmentTargetSiteCode: undefined,
    productLink: undefined
  }];
  assignedDetail.items = [{
    ...unassignedWorkbench.orders[0].items[0],
    assignedQuantity: 10,
    remainingQuantity: 0,
    assignmentStatus: 'assigned',
    assignmentStatusLabel: '已分配',
    assignmentBreakdownText: 'PRJ108065 AE 10',
    assignmentId: 99003,
    assignmentTargetType: 'STORE_SITE',
    assignmentTargetStoreCode: 'PRJ108065',
    assignmentTargetSiteCode: 'AE',
    productLink: undefined
  }];

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    const search = new URL(route.request().url()).searchParams;
    await route.fulfill({
      json: assigned && search.get('assignmentState') === 'unassigned'
        ? {
          ...unassignedWorkbench,
          orders: [],
          pagination: { page: 1, pageSize: 20, total: 0 }
        }
        : unassignedWorkbench
    });
  });
  await page.route('**/api/procurement/ali1688-orders/93001', async (route) => {
    await route.fulfill({ json: assignedDetail });
  });
  await page.route('**/api/procurement/ali1688-orders/assignments', async (route) => {
    assignmentPayload = route.request().postDataJSON();
    assigned = true;
    await route.fulfill({
      json: {
        status: 'assigned',
        assignedLineCount: 1,
        assignedQuantity: 10
      }
    });
  });
  await page.route('**/api/procurement/ali1688-orders/product-link-candidates**', async (route) => {
    candidateRequests.push(new URL(route.request().url()).search);
    await route.fulfill({
      json: [{
        storeCode: 'PRJ108065',
        siteCode: 'AE',
        skuParent: 'CANMAN-AE-SKU-003',
        partnerSku: 'CM-AE-PARTNER-003',
        pskuCode: 'PSKU-CM-AE-003',
        productTitle: 'canman AE 锁心本',
        productImageUrl: 'https://example.com/canman-ae-notebook.jpg',
        linkStatus: 'unlinked',
        linkedAssignmentCount: 0
      }]
    });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  await page.locator('.ant-select:has(input[aria-label="分配店铺"]) .ant-select-selector').click();
  await page.getByTitle('未分配').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')).toHaveCount(0);
  await expect(page.getByText('跨境B6复古五角星锁心本')).toBeVisible();

  const row = page.getByText('跨境B6复古五角星锁心本').locator('xpath=ancestor::tr');
  await row.locator('.ali1688-product-line-main').getByRole('button', { name: '分配/关联' }).click();
  const dialog = page.getByRole('dialog', { name: '分配/关联' });
  await clickAssignmentTarget(dialog, 'canman AE');
  await dialog.getByRole('button', { name: '保存分配并继续关联' }).click();

  await expect.poll(() => assignmentPayload).toMatchObject({
    targetType: 'STORE_SITE',
    targetStoreCode: 'PRJ108065',
    targetSiteCode: 'AE',
    lines: [{ itemId: '94002', quantity: 10 }]
  });
  await expect.poll(() => candidateRequests[0] || '').toContain('assignmentId=99003');
  await expect(dialog.getByRole('searchbox', { name: '搜索商品' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: '标记下架数据' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: '确认关联' })).toBeVisible();
  await expect(dialog.getByText('canman AE 锁心本')).toBeVisible();
});
