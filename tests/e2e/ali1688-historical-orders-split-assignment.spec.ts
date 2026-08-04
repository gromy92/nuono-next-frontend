import { expect, test } from '@playwright/test';
import { assignmentTargetOptions, authorizedWorkbench, clickAssignmentTarget, missingFieldDetail, missingFieldWorkbench, noAuthorizationWorkbench, mockAliHistoricalOrderDefaults, storeSyncOverview, syncedWorkbench } from './ali1688-historical-orders.fixtures';

test.beforeEach(async ({ page }) => mockAliHistoricalOrderDefaults(page));
test('boss can assign a single product line before product linking', async ({ page }) => {
  let workbench = syncedWorkbench;
  let assignmentPayload: any;
  const assignedWorkbench = JSON.parse(JSON.stringify(syncedWorkbench));
  assignedWorkbench.orders[0].items[1].assignedQuantity = 10;
  assignedWorkbench.orders[0].items[1].remainingQuantity = 0;
  assignedWorkbench.orders[0].items[1].assignmentStatus = 'assigned';
  assignedWorkbench.orders[0].items[1].assignmentStatusLabel = '已分配';
  assignedWorkbench.orders[0].items[1].assignmentBreakdownText = 'PRJ108065 SA 10';
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
  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  const row = page.getByText('跨境B6复古五角星锁心本').locator('xpath=ancestor::tr');
  const productCell = row.locator('.ali1688-product-line-main');
  await expect(productCell.getByRole('button', { name: '分配店铺' })).toHaveCount(0);
  await expect(productCell.getByRole('button', { name: '商品关联' })).toHaveCount(0);
  await expect(productCell.getByRole('button', { name: '分配/关联' })).toBeVisible();
  await expect(row.locator('td').last().getByRole('button', { name: '分配店铺' })).toHaveCount(0);
  const productActionOrder = await productCell.locator('button').evaluateAll((buttons) =>
    buttons.map((button) => button.textContent?.trim()).filter(Boolean)
  );
  expect(productActionOrder).toEqual(['分配/关联', '删除订单']);
  await productCell.getByRole('button', { name: '分配/关联' }).click();
  const dialog = page.getByRole('dialog', { name: '分配/关联' });
  await expect(dialog.getByText('单个货品可拆分到多个店铺，请为每个店铺填写数量。')).toBeVisible();
  await clickAssignmentTarget(dialog, 'canman SA');
  await expect(dialog.getByRole('spinbutton', { name: '分配数量 canman SA 跨境B6复古五角星锁心本' })).toHaveValue('10');
  await dialog.getByRole('button', { name: '确认分配' }).click();
  await expect.poll(() => assignmentPayload).toMatchObject({
    targetType: 'STORE_SITE',
    targetStoreCode: 'PRJ108065',
    targetSiteCode: 'SA',
    lines: [{ itemId: '94002', quantity: 10 }]
  });
  await expect(page.getByText('分配信息 canman SA')).toBeVisible();
});
test('boss can split multiple selected product lines across two target stores with quantities', async ({ page }) => {
  let workbench = syncedWorkbench;
  const assignmentPayloads: any[] = [];
  const assignedWorkbench = JSON.parse(JSON.stringify(syncedWorkbench));
  assignedWorkbench.orders[0].items[0].assignedQuantity = 6;
  assignedWorkbench.orders[0].items[0].remainingQuantity = 0;
  assignedWorkbench.orders[0].items[0].assignmentStatus = 'assigned';
  assignedWorkbench.orders[0].items[0].assignmentStatusLabel = '已分配';
  assignedWorkbench.orders[0].items[0].assignmentBreakdownText = 'PRJ108065 SA 2 / PRJ245027 AE 4';
  assignedWorkbench.orders[0].items[1].assignedQuantity = 10;
  assignedWorkbench.orders[0].items[1].remainingQuantity = 0;
  assignedWorkbench.orders[0].items[1].assignmentStatus = 'assigned';
  assignedWorkbench.orders[0].items[1].assignmentStatusLabel = '已分配';
  assignedWorkbench.orders[0].items[1].assignmentBreakdownText = 'PRJ108065 SA 3 / PRJ245027 AE 7';
  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: workbench });
  });
  await page.route('**/api/procurement/ali1688-orders/assignments/batch', async (route) => {
    assignmentPayloads.push(route.request().postDataJSON());
    workbench = assignedWorkbench;
    await route.fulfill({
      json: {
        status: 'assigned',
        assignedLineCount: 4,
        assignedQuantity: 16
      }
    });
  });
  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  await page.getByText('仿真罂粟花束 6 支装 家居装饰').locator('xpath=ancestor::tr').getByRole('checkbox').check();
  await page.getByText('跨境B6复古五角星锁心本').locator('xpath=ancestor::tr').getByRole('checkbox').check();
  await page.getByRole('button', { name: '批量分配/关联' }).click();
  const dialog = page.getByRole('dialog', { name: '分配/关联' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('多选货品可拆分到多个店铺，请为每个店铺和货品填写数量。')).toBeVisible();
  await expect(page.locator('.ant-modal:visible')).toHaveCSS('width', '1180px');
  await clickAssignmentTarget(dialog, 'canman SA');
  await expect(dialog.locator('.ali1688-assignment-matrix')).toBeVisible();
  await expect(dialog.locator('.ali1688-assignment-matrix thead th').nth(0)).toContainText('商品');
  await expect(dialog.locator('.ali1688-assignment-matrix thead th').nth(1)).toContainText('canman SA');
  await expect(dialog.getByRole('spinbutton', { name: '分配数量 canman SA 仿真罂粟花束 6 支装 家居装饰' })).toHaveValue('6');
  await expect(dialog.getByRole('spinbutton', { name: '分配数量 canman SA 跨境B6复古五角星锁心本' })).toHaveValue('10');
  await clickAssignmentTarget(dialog, 'xingyao AE');
  await expect(dialog.locator('.ali1688-assignment-matrix thead th').nth(2)).toContainText('xingyao AE');
  await expect(dialog.getByRole('spinbutton', { name: '分配数量 canman SA 仿真罂粟花束 6 支装 家居装饰' })).toHaveValue('3');
  await expect(dialog.getByRole('spinbutton', { name: '分配数量 xingyao AE 仿真罂粟花束 6 支装 家居装饰' })).toHaveValue('3');
  await expect(dialog.getByRole('spinbutton', { name: '分配数量 canman SA 跨境B6复古五角星锁心本' })).toHaveValue('5');
  await expect(dialog.getByRole('spinbutton', { name: '分配数量 xingyao AE 跨境B6复古五角星锁心本' })).toHaveValue('5');
  await dialog.getByRole('spinbutton', { name: '分配数量 canman SA 仿真罂粟花束 6 支装 家居装饰' }).fill('6');
  await expect(dialog.getByRole('spinbutton', { name: '分配数量 xingyao AE 仿真罂粟花束 6 支装 家居装饰' })).toHaveValue('0');
  await dialog.getByRole('spinbutton', { name: '分配数量 canman SA 仿真罂粟花束 6 支装 家居装饰' }).fill('2');
  await dialog.getByRole('spinbutton', { name: '分配数量 xingyao AE 仿真罂粟花束 6 支装 家居装饰' }).fill('4');
  await expect(dialog.getByRole('spinbutton', { name: '分配数量 canman SA 仿真罂粟花束 6 支装 家居装饰' })).toHaveValue('2');
  await dialog.getByRole('spinbutton', { name: '分配数量 canman SA 跨境B6复古五角星锁心本' }).fill('3');
  await dialog.getByRole('spinbutton', { name: '分配数量 xingyao AE 跨境B6复古五角星锁心本' }).fill('7');
  await dialog.getByRole('button', { name: '确认分配' }).click();
  await expect.poll(() => assignmentPayloads).toEqual([{
    assignments: [
      {
        targetType: 'STORE_SITE',
        targetStoreCode: 'PRJ108065',
        targetSiteCode: 'SA',
        lines: [
          { itemId: '94001', quantity: 2 },
          { itemId: '94002', quantity: 3 }
        ]
      },
      {
        targetType: 'STORE_SITE',
        targetStoreCode: 'PRJ245027',
        targetSiteCode: 'AE',
        lines: [
          { itemId: '94001', quantity: 4 },
          { itemId: '94002', quantity: 7 }
        ]
      }
    ]
  }]);
  await expect(page.getByText('分配信息 canman SA xingyao AE')).toHaveCount(2);
});
test('boss can filter and assign product lines to shared consumables', async ({ page }) => {
  let workbench = JSON.parse(JSON.stringify(syncedWorkbench));
  const consumableWorkbench = JSON.parse(JSON.stringify(syncedWorkbench));
  let assignmentPayload: any;
  const seenQueries: string[] = [];
  workbench.orders[0].items[0] = {
    ...workbench.orders[0].items[0],
    assignedQuantity: 0,
    remainingQuantity: 10,
    assignmentStatus: 'unassigned',
    assignmentStatusLabel: '未分配',
    assignmentBreakdownText: ''
  };
  consumableWorkbench.orders[0].items[0] = {
    ...consumableWorkbench.orders[0].items[0],
    assignedQuantity: 10,
    remainingQuantity: 0,
    assignmentStatus: 'assigned',
    assignmentStatusLabel: '已分配',
    assignmentBreakdownText: '耗材 10'
  };
  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    seenQueries.push(new URL(route.request().url()).search);
    await route.fulfill({ json: workbench });
  });
  await page.route('**/api/procurement/ali1688-orders/assignments', async (route) => {
    assignmentPayload = route.request().postDataJSON();
    workbench = consumableWorkbench;
    await route.fulfill({
      json: {
        status: 'assigned',
        assignedLineCount: 1,
        assignedQuantity: 10
      }
    });
  });
  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  await page.getByText('仿真罂粟花束 6 支装 家居装饰').locator('xpath=ancestor::tr').getByRole('checkbox').check();
  await page.getByRole('button', { name: '批量分配/关联' }).click();
  const dialog = page.getByRole('dialog', { name: '分配/关联' });
  await clickAssignmentTarget(dialog, '耗材（共用）');
  await expect(dialog.getByRole('spinbutton')).toHaveCount(0);
  await dialog.getByRole('button', { name: '确认分配' }).click();
  await expect.poll(() => assignmentPayload).toMatchObject({
    targetType: 'CONSUMABLE',
    lines: [{ itemId: '94001' }]
  });
  expect(assignmentPayload.targetStoreCode).toBeUndefined();
  expect(assignmentPayload.targetSiteCode).toBeUndefined();
  expect(assignmentPayload.lines[0].quantity).toBeUndefined();
  await expect(page.getByText('分配信息 耗材')).toBeVisible();
  await page.getByRole('combobox', { name: '分配店铺' }).click();
  await page.getByTitle('耗材').click();
  await expect.poll(() => seenQueries.at(-1) || '').toContain('assignmentState=consumable');
});
test('boss can split one selected product line across multiple owner stores', async ({ page }) => {
  let workbench = syncedWorkbench;
  const assignmentPayloads: any[] = [];
  const assignedWorkbench = JSON.parse(JSON.stringify(syncedWorkbench));
  assignedWorkbench.orders = [
    {
      ...assignedWorkbench.orders[0],
      goodsTotalText: '¥25.60',
      freightText: '¥2.40',
      adjustmentText: '-¥1.60',
      paidAmountText: '¥68.00',
      items: [{
        ...assignedWorkbench.orders[0].items[0],
        quantity: 2,
        assignedQuantity: 2,
        remainingQuantity: 0,
        assignmentStatus: 'assigned',
        assignmentStatusLabel: '已分配',
        assignmentBreakdownText: 'PRJ108065 SA 2',
        amountText: '¥25.60'
      }]
    },
    {
      ...assignedWorkbench.orders[0],
      goodsTotalText: '¥51.20',
      freightText: '¥4.80',
      adjustmentText: '-¥3.20',
      paidAmountText: '¥136.00',
      items: [{
        ...assignedWorkbench.orders[0].items[0],
        quantity: 4,
        assignedQuantity: 4,
        remainingQuantity: 0,
        assignmentStatus: 'assigned',
        assignmentStatusLabel: '已分配',
        assignmentBreakdownText: 'PRJ245027 AE 4',
        amountText: '¥51.20'
      }]
    }
  ];
  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: workbench });
  });
  await page.route('**/api/procurement/ali1688-orders/assignments/batch', async (route) => {
    assignmentPayloads.push(route.request().postDataJSON());
    workbench = assignedWorkbench;
    await route.fulfill({
      json: {
        status: 'assigned',
        assignedLineCount: 2,
        assignedQuantity: 6
      }
    });
  });
  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  await page.getByText('仿真罂粟花束 6 支装 家居装饰').locator('xpath=ancestor::tr').getByRole('checkbox').check();
  await page.getByRole('button', { name: '批量分配/关联' }).click();
  const dialog = page.getByRole('dialog', { name: '分配/关联' });
  await expect(dialog.getByText('单个货品可拆分到多个店铺，请为每个店铺填写数量。')).toBeVisible();
  await clickAssignmentTarget(dialog, 'canman SA');
  await clickAssignmentTarget(dialog, 'xingyao AE');
  await expect(dialog.getByText('canman AE')).toBeVisible();
  await expect(dialog.getByText('chenwu AE')).toBeVisible();
  await expect(dialog.getByText('YI WU SHI SONG GUO GUO ER DIAN ZI SHANG WU YOU XIAN GONG SI SA')).toBeVisible();
  await dialog.getByRole('spinbutton', { name: '分配数量 canman SA' }).fill('2');
  await dialog.getByRole('spinbutton', { name: '分配数量 xingyao AE' }).fill('4');
  await dialog.getByRole('button', { name: '确认分配' }).click();
  await expect.poll(() => assignmentPayloads).toEqual([{
    assignments: [
      {
        targetType: 'STORE_SITE',
        targetStoreCode: 'PRJ108065',
        targetSiteCode: 'SA',
        lines: [{ itemId: '94001', quantity: 2 }]
      },
      {
        targetType: 'STORE_SITE',
        targetStoreCode: 'PRJ245027',
        targetSiteCode: 'AE',
        lines: [{ itemId: '94001', quantity: 4 }]
      }
    ]
  }]);
  const canmanRow = page.getByText('分配信息 canman SA').locator('xpath=ancestor::tr');
  const xingyaoRow = page.getByText('分配信息 xingyao AE').locator('xpath=ancestor::tr');
  await expect(canmanRow).toBeVisible();
  await expect(xingyaoRow).toBeVisible();
  await expect(page.getByText('分配信息 canman SA xingyao AE')).toHaveCount(0);
  await expect(canmanRow.getByText('数量: 2套')).toBeVisible();
  await expect(canmanRow.getByText('订单总价: ¥25.60')).toBeVisible();
  await expect(canmanRow.getByText('实付款: ¥68.00')).toBeVisible();
  await expect(canmanRow.getByText('订单价:')).toHaveCount(0);
  await expect(xingyaoRow.getByText('数量: 4套')).toBeVisible();
  await expect(xingyaoRow.getByText('订单总价: ¥51.20')).toBeVisible();
});
