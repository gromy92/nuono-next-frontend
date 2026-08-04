import { expect, test } from '@playwright/test';
import { assignmentTargetOptions, authorizedWorkbench, clickAssignmentTarget, missingFieldDetail, missingFieldWorkbench, noAuthorizationWorkbench, mockAliHistoricalOrderDefaults, storeSyncOverview, syncedWorkbench } from './ali1688-historical-orders.fixtures';

test.beforeEach(async ({ page }) => mockAliHistoricalOrderDefaults(page));

test('boss can soft-delete an unassigned historical order from the list', async ({ page }) => {
  const deletableWorkbench = JSON.parse(JSON.stringify(syncedWorkbench));
  deletableWorkbench.orders[0].items = deletableWorkbench.orders[0].items.map((item: any) => ({
    ...item,
    assignedQuantity: 0,
    remainingQuantity: item.originalQuantity ?? item.quantity,
    assignmentStatus: item.quantity === null ? 'quantity_missing' : 'unassigned',
    assignmentStatusLabel: item.quantity === null ? '数量未返回' : '未分配',
    assignmentBreakdownText: ''
  }));
  let workbench = deletableWorkbench;
  let deletePayload: any;

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: workbench });
  });
  await page.route('**/api/procurement/ali1688-orders/93001', async (route) => {
    if (route.request().method() !== 'DELETE') {
      return route.fallback();
    }
    deletePayload = route.request().postDataJSON();
    workbench = {
      ...deletableWorkbench,
      orders: [],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0
      }
    };
    await route.fulfill({
      json: {
        orderId: 93001,
        status: 'deleted',
        reason: '不属于任何店铺'
      }
    });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  await expect(page.getByText('ALI-ORDER-20260525-001').first()).toBeVisible();
  await page.getByRole('button', { name: '删除订单 ALI-ORDER-20260525-001' }).first().click();
  const dialog = page.getByRole('dialog', { name: '删除订单' });
  await expect(dialog.getByText('ALI-ORDER-20260525-001')).toBeVisible();
  await expect(dialog.getByLabel('删除原因')).toHaveValue('不属于任何店铺');
  await dialog.getByRole('button', { name: '确认删除' }).click();

  await expect.poll(() => deletePayload).toEqual({
    reason: '不属于任何店铺'
  });
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('.ali1688-historical-orders-table .ali1688-order-no')).toHaveCount(0);
  await expect(page.getByText('暂无货品')).toBeVisible();
});

test('boss can audit, adjust, and revoke product line assignment records', async ({ page }) => {
  let workbench = syncedWorkbench;
  let assignmentRecords = [
    {
      assignmentId: 99001,
      itemId: '94001',
      targetStoreCode: 'PRJ108065',
      targetSiteCode: 'AE',
      assignedQuantity: 4,
      status: 'active',
      createdBy: 307,
      updatedBy: 307,
      createdAt: '2026-05-26 15:30:00',
      updatedAt: '2026-05-26 15:30:00'
    }
  ];
  let adjustPayload: any;
  const adjustedWorkbench = JSON.parse(JSON.stringify(syncedWorkbench));
  adjustedWorkbench.orders[0].items[0].assignedQuantity = 6;
  adjustedWorkbench.orders[0].items[0].remainingQuantity = 4;
  adjustedWorkbench.orders[0].items[0].assignmentBreakdownText = 'PRJ108065 AE 6';
  const revokedWorkbench = JSON.parse(JSON.stringify(syncedWorkbench));
  revokedWorkbench.orders[0].items[0].assignedQuantity = 0;
  revokedWorkbench.orders[0].items[0].remainingQuantity = 10;
  revokedWorkbench.orders[0].items[0].assignmentStatus = 'unassigned';
  revokedWorkbench.orders[0].items[0].assignmentStatusLabel = '未分配';
  revokedWorkbench.orders[0].items[0].assignmentBreakdownText = '';

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: workbench });
  });
  await page.route('**/api/procurement/ali1688-orders/93001**', async (route) => {
    await route.fulfill({
      json: {
        ...workbench.orders[0],
        sensitiveFields: {
          redactionLevel: 'hidden',
          receiverPhone: '已隐藏',
          receiverAddress: '已隐藏',
          buyerRemark: '已隐藏',
          supplierContact: '已隐藏'
        }
      }
    });
  });
  await page.route('**/api/procurement/ali1688-orders/items/94001/assignments', async (route) => {
    await route.fulfill({ json: assignmentRecords });
  });
  await page.route('**/api/procurement/ali1688-orders/assignments/99001/adjust', async (route) => {
    adjustPayload = route.request().postDataJSON();
    assignmentRecords = [
      {
        ...assignmentRecords[0],
        assignedQuantity: 6,
        updatedBy: 409,
        updatedAt: '2026-05-26 15:40:00'
      }
    ];
    workbench = adjustedWorkbench;
    await route.fulfill({ json: { status: 'assigned', assignedLineCount: 1, assignedQuantity: 6 } });
  });
  await page.route('**/api/procurement/ali1688-orders/assignments/99001/revoke', async (route) => {
    assignmentRecords = [
      {
        ...assignmentRecords[0],
        status: 'revoked',
        updatedBy: 409,
        updatedAt: '2026-05-26 15:45:00'
      }
    ];
    workbench = revokedWorkbench;
    await route.fulfill({ json: { status: 'assigned', assignedLineCount: 1, assignedQuantity: 0 } });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  await page.getByRole('button', { name: '查看货品' }).first().click();
  const drawer = page.getByRole('dialog', { name: '采购货品详情' });
  const assignmentRecordList = drawer.locator('.ali1688-assignment-records');
  await expect(drawer.getByText('分配记录')).toBeVisible();
  await expect(assignmentRecordList.locator('.ant-list-item-meta-title').getByText('PRJ108065 · AE')).toBeVisible();
  await expect(assignmentRecordList.getByText('创建 307 · 2026-05-26 15:30:00')).toBeVisible();
  await drawer.getByRole('spinbutton', { name: '调整数量 PRJ108065 · AE' }).fill('6');
  await drawer.getByRole('button', { name: '调整 PRJ108065 · AE' }).click();

  await expect.poll(() => adjustPayload).toEqual({ quantity: 6 });
  await expect(page.locator('.ali1688-historical-orders-table').getByText('分配信息 canman AE', { exact: true })).toBeVisible();
  await expect(assignmentRecordList.getByText('更新 409 · 2026-05-26 15:40:00')).toBeVisible();
  await drawer.getByRole('button', { name: '撤回 PRJ108065 · AE' }).click();

  await expect(page.locator('.ali1688-historical-orders-table').getByText('分配信息 未分配', { exact: true })).toBeVisible();
  await expect(assignmentRecordList.getByText('已撤回')).toBeVisible();
  await expect(assignmentRecordList.getByText('更新 409 · 2026-05-26 15:45:00')).toBeVisible();
});

test('consumable assignment audit shows shared target and can be revoked without quantity adjustment', async ({ page }) => {
  let workbench = JSON.parse(JSON.stringify(syncedWorkbench));
  workbench.orders[0].items[1] = {
    ...workbench.orders[0].items[1],
    assignedQuantity: 10,
    remainingQuantity: 0,
    assignmentStatus: 'assigned',
    assignmentStatusLabel: '已分配',
    assignmentBreakdownText: '耗材 10'
  };
  let assignmentRecords = [
    {
      assignmentId: 99002,
      itemId: '94002',
      targetType: 'CONSUMABLE',
      assignedQuantity: 10,
      status: 'active',
      createdBy: 307,
      updatedBy: 307,
      createdAt: '2026-05-26 16:30:00',
      updatedAt: '2026-05-26 16:30:00'
    }
  ];
  const revokedWorkbench = JSON.parse(JSON.stringify(workbench));
  revokedWorkbench.orders[0].items[1].assignedQuantity = 0;
  revokedWorkbench.orders[0].items[1].remainingQuantity = 10;
  revokedWorkbench.orders[0].items[1].assignmentStatus = 'unassigned';
  revokedWorkbench.orders[0].items[1].assignmentStatusLabel = '未分配';
  revokedWorkbench.orders[0].items[1].assignmentBreakdownText = '';

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: workbench });
  });
  await page.route('**/api/procurement/ali1688-orders/93001**', async (route) => {
    await route.fulfill({ json: { ...workbench.orders[0], sensitiveFields: { redactionLevel: 'hidden' } } });
  });
  await page.route('**/api/procurement/ali1688-orders/items/94002/assignments', async (route) => {
    await route.fulfill({ json: assignmentRecords });
  });
  await page.route('**/api/procurement/ali1688-orders/assignments/99002/revoke', async (route) => {
    assignmentRecords = [
      {
        ...assignmentRecords[0],
        status: 'revoked',
        updatedBy: 409,
        updatedAt: '2026-05-26 16:45:00'
      }
    ];
    workbench = revokedWorkbench;
    await route.fulfill({ json: { status: 'assigned', assignedLineCount: 1, assignedQuantity: 0 } });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  await expect(page.getByText('分配信息 耗材')).toBeVisible();
  await page.getByText('跨境B6复古五角星锁心本').locator('xpath=ancestor::tr').getByRole('button', { name: '查看货品' }).click();
  const drawer = page.getByRole('dialog', { name: '采购货品详情' });
  const assignmentRecordList = drawer.locator('.ali1688-assignment-records');
  await expect(assignmentRecordList.locator('.ant-list-item-meta-title').getByText('耗材（共用）')).toBeVisible();
  await expect(drawer.getByRole('spinbutton', { name: '调整数量 耗材（共用）' })).toHaveCount(0);
  await expect(drawer.getByRole('button', { name: '调整 耗材（共用）' })).toHaveCount(0);
  await drawer.getByRole('button', { name: '撤回 耗材（共用）' }).click();

  await expect(page.locator('.ali1688-historical-orders-table').getByText('分配信息 未分配', { exact: true })).toBeVisible();
  await expect(assignmentRecordList.getByText('已撤回')).toBeVisible();
});

test('boss cannot delete an order while it still has active consumable assignment', async ({ page }) => {
  const consumableWorkbench = JSON.parse(JSON.stringify(syncedWorkbench));
  let deleteAttempted = false;
  consumableWorkbench.orders[0].items[1] = {
    ...consumableWorkbench.orders[0].items[1],
    assignedQuantity: 10,
    remainingQuantity: 0,
    assignmentStatus: 'assigned',
    assignmentStatusLabel: '已分配',
    assignmentBreakdownText: '耗材 10'
  };

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: consumableWorkbench });
  });
  await page.route('**/api/procurement/ali1688-orders/93001', async (route) => {
    if (route.request().method() === 'DELETE') {
      deleteAttempted = true;
      await route.fulfill({
        status: 400,
        json: { message: '订单已有有效分配记录，请先撤回分配。' }
      });
      return;
    }
    await route.fulfill({ json: consumableWorkbench.orders[0] });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  await expect(page.getByText('分配信息 耗材')).toBeVisible();
  await page.getByText('跨境B6复古五角星锁心本').locator('xpath=ancestor::tr').getByRole('button', { name: '删除订单' }).click();
  const dialog = page.getByRole('dialog', { name: '删除订单' });
  await dialog.getByRole('button', { name: '确认删除' }).click();

  await expect.poll(() => deleteAttempted).toBe(true);
  await expect(dialog).toBeVisible();
  await expect(page.getByText('跨境B6复古五角星锁心本')).toBeVisible();
});
