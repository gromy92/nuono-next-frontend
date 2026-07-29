import { expect, test } from '@playwright/test';
import { assignmentTargetOptions, authorizedWorkbench, clickAssignmentTarget, missingFieldDetail, missingFieldWorkbench, noAuthorizationWorkbench, partialSuccessWorkbench, mockAliHistoricalOrderDefaults, storeSyncOverview, syncedWorkbench } from './ali1688-historical-orders.fixtures';

test.beforeEach(async ({ page }) => mockAliHistoricalOrderDefaults(page));

test('mark discontinued keeps assigned store scope and quantity', async ({ page }) => {
  const workbench = JSON.parse(JSON.stringify(syncedWorkbench));
  let revokedAssignmentId: string | undefined;
  let discontinuedPayload: any;
  workbench.orders[0].items = [{
    ...workbench.orders[0].items[2],
    assignmentId: 99001,
    assignmentTargetType: 'STORE_SITE',
    assignmentTargetStoreCode: 'PRJ108065',
    assignmentTargetSiteCode: 'AE',
    assignmentBreakdownText: 'PRJ108065 AE 8',
    productLink: undefined
  }];

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: workbench });
  });
  await page.route('**/api/procurement/ali1688-orders/product-link-candidates**', async (route) => {
    await route.fulfill({ json: [] });
  });
  await page.route('**/api/procurement/ali1688-orders/assignments/99001/revoke', async (route) => {
    revokedAssignmentId = '99001';
    await route.fulfill({
      json: {
        status: 'assigned',
        assignedLineCount: 1,
        assignedQuantity: 0
      }
    });
  });
  await page.route('**/api/procurement/ali1688-orders/assignments', async (route) => {
    discontinuedPayload = route.request().postDataJSON();
    await route.fulfill({
      json: {
        status: 'assigned',
        assignedLineCount: 1,
        assignedQuantity: 8
      }
    });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  const row = page.getByText('已分配样品货品').locator('xpath=ancestor::tr');
  await row.locator('.ali1688-product-line-main').getByRole('button', { name: '分配/关联' }).click();
  const dialog = page.getByRole('dialog', { name: '分配/关联' });
  await expect(dialog.getByRole('searchbox', { name: '搜索商品' })).toBeVisible();
  await dialog.getByRole('button', { name: '标记下架数据' }).click();

  await expect.poll(() => revokedAssignmentId).toBe('99001');
  await expect.poll(() => discontinuedPayload).toMatchObject({
    targetType: 'DISCONTINUED',
    targetStoreCode: 'PRJ108065',
    targetSiteCode: 'AE',
    lines: [{ itemId: '94003', quantity: 8 }]
  });
});

test('procurement role sees product link state as read-only', async ({ page }) => {
  const workbench = JSON.parse(JSON.stringify(syncedWorkbench));
  workbench.roleCapabilities = {
    canAuthorize: false,
    canTriggerSync: false,
    canViewOrders: true
  };
  workbench.orders[0].items = [{
    ...workbench.orders[0].items[2],
    assignmentId: 99001,
    assignmentTargetType: 'STORE_SITE',
    assignmentTargetStoreCode: 'PRJ108065',
    assignmentTargetSiteCode: 'AE',
    assignmentBreakdownText: 'PRJ108065 AE 8',
    productLink: {
      status: 'linked',
      skuParent: 'CANMAN-AE-SKU-001',
      partnerSku: 'CM-AE-PARTNER-001',
      pskuCode: 'PSKU-CM-AE-001',
      productTitle: 'canman AE 抽纸盒',
      displayText: '已关联: CANMAN-AE-SKU-001'
    }
  }];

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: workbench });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=procurement&grantAli1688HistoricalOrders=1');

  const row = page.getByText('已分配样品货品').locator('xpath=ancestor::tr');
  await expect(row.getByText('已关联: CM-AE-PARTNER-001')).toBeVisible();
  await expect(row.getByRole('button', { name: '商品关联' })).not.toBeVisible();
  await expect(row.getByRole('button', { name: '改关联' })).not.toBeVisible();
  await expect(row.getByRole('button', { name: '解除关联' })).not.toBeVisible();
});
