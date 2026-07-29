import { expect, test } from '@playwright/test';
import { assignmentTargetOptions, authorizedWorkbench, clickAssignmentTarget, missingFieldDetail, missingFieldWorkbench, noAuthorizationWorkbench, partialSuccessWorkbench, mockAliHistoricalOrderDefaults, storeSyncOverview, syncedWorkbench } from './ali1688-historical-orders.fixtures';

test.beforeEach(async ({ page }) => mockAliHistoricalOrderDefaults(page));

test('boss can start real OpenAPI authorization from modal', async ({ page }) => {
  let workbench = noAuthorizationWorkbench;

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: workbench });
  });
  let startCalled = false;
  await page.route('**/api/procurement/ali1688-orders/authorizations/open-api/start**', async (route) => {
    startCalled = true;
    expect(route.request().headers()['x-nuono-dev-session-user-id']).toBe('307');
    await route.fulfill({
      json: {
        configured: true,
        providerCode: 'ALI1688_OPEN_API',
        authorizationUrl: 'https://auth.1688.com/oauth/authorize?client_id=5890829&state=signed-state',
        message: '请在 1688 页面完成账号授权，系统只读取历史订单。'
      }
    });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  await page.getByRole('button', { name: '授权 1688' }).click();

  const modal = page.getByRole('dialog', { name: '授权 1688' });
  await expect(modal).toBeVisible();
  await expect(modal.getByText('读取 1688 历史订单')).toBeVisible();
  await expect(modal.getByText('不会付款')).toBeVisible();
  await expect(modal.getByText('不会创建订单')).toBeVisible();
  const popupPromise = page.waitForEvent('popup');
  await modal.getByRole('button', { name: '确认授权' }).click();
  const popup = await popupPromise;

  expect(startCalled).toBeTruthy();
  await expect(popup).toHaveURL(/auth\.1688\.com\/oauth\/authorize/);
  await expect(modal).not.toBeVisible();
});

test('boss sees configuration warning without opening a blank authorization popup', async ({ page }) => {
  await page.addInitScript(() => {
    const originalOpen = window.open.bind(window);
    (window as typeof window & { __ali1688OpenCalls?: number }).__ali1688OpenCalls = 0;
    window.open = (...args) => {
      (window as typeof window & { __ali1688OpenCalls?: number }).__ali1688OpenCalls =
        ((window as typeof window & { __ali1688OpenCalls?: number }).__ali1688OpenCalls ?? 0) + 1;
      return originalOpen(...args);
    };
  });
  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: noAuthorizationWorkbench });
  });
  await page.route('**/api/procurement/ali1688-orders/authorizations/open-api/start**', async (route) => {
    await route.fulfill({
      json: {
        configured: false,
        providerCode: 'ALI1688_OPEN_API',
        message: '1688 OpenAPI 尚未配置 AppKey、AppSecret、回调地址或 token 加密密钥。'
      }
    });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  await page.getByRole('button', { name: '授权 1688' }).click();
  const modal = page.getByRole('dialog', { name: '授权 1688' });
  await modal.getByRole('button', { name: '确认授权' }).click();

  await expect(page.getByText('1688 OpenAPI 尚未配置 AppKey、AppSecret、回调地址或 token 加密密钥。')).toBeVisible();
  await expect(modal).toBeVisible();
  await expect.poll(() =>
    page.evaluate(() => (window as typeof window & { __ali1688OpenCalls?: number }).__ali1688OpenCalls ?? 0)
  ).toBe(0);
});

test('operations can view authorization status but cannot mutate it', async ({ page }) => {
  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({
      json: {
        ...noAuthorizationWorkbench,
        roleCapabilities: {
          canAuthorize: false,
          canTriggerSync: false,
          canViewOrders: true
        }
      }
    });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=operator&grantAli1688HistoricalOrders=1');

  await expect(page.getByTestId('ali1688-historical-orders-page')).toBeVisible();
  await expect(page.getByRole('alert').getByText('老板授权后可同步 1688 历史订单')).toBeVisible();
  await expect(page.getByRole('button', { name: '授权 1688' })).not.toBeVisible();
});

test('authorized boss can run fake initial sync and inspect product-line detail drawer', async ({ page }) => {
  let workbench = authorizedWorkbench;

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: workbench });
  });
  await page.route('**/api/procurement/ali1688-orders/sync-tasks/initial-backfill', async (route) => {
    workbench = syncedWorkbench;
    await route.fulfill({ json: syncedWorkbench });
  });
  await page.route('**/api/procurement/ali1688-orders/93001**', async (route) => {
    await route.fulfill({
      json: {
        ...syncedWorkbench.orders[0],
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

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');

  await page.getByRole('button', { name: '同步历史订单' }).click();
  await expect(page.getByText('ALI-ORDER-20260525-001').first()).toBeVisible();
  await expect(page.getByText('2026-05-25 10:30:00').first()).toBeVisible();
  await expect(page.getByText('义乌诚信通源头工厂').first()).toBeVisible();
  await expect(page.getByText('¥340.00').first()).toBeVisible();
  await expect(page.getByText('跨境B6复古五角星锁心本')).toBeVisible();
  await expect(page.getByText('YTO20260525002')).toBeVisible();
  await expect(page.getByText('分配信息 canman AE xingyao AE')).toBeVisible();
  await expect(page.getByText('已分配 4 / 剩余 6')).not.toBeVisible();
  await expect(page.getByText('PRJ108065 AE 2 / PRJ245027 AE 2')).not.toBeVisible();
  await expect(page.getByText('分配信息 未分配')).toBeVisible();
  await expect(page.getByText('分配信息 数量未返回')).toBeVisible();
  const firstProductRow = page.getByText('仿真罂粟花束 6 支装 家居装饰').locator('xpath=ancestor::tr');
  const controls = page.locator('.ali1688-historical-orders-controls');
  await expect(controls).toBeVisible();
  await expect(controls.getByPlaceholder('供应商')).toBeVisible();
  await expect(controls.getByRole('button', { name: '同步历史订单' })).toBeVisible();
  await expect(controls.getByRole('button', { name: '刷新', exact: true })).toHaveCount(0);
  await expect(controls.getByRole('button', { name: '批量分配/关联' })).toBeVisible();
  await expect(page.locator('.ali1688-assignment-toolbar')).toHaveCount(0);
  const controlsBox = await controls.boundingBox();
  const actionButtons = await controls.getByRole('button').all();
  expect(controlsBox).not.toBeNull();
  for (const button of actionButtons) {
    const buttonBox = await button.boundingBox();
    expect(buttonBox).not.toBeNull();
    expect(buttonBox!.x + buttonBox!.width).toBeLessThanOrEqual(controlsBox!.x + controlsBox!.width + 1);
  }
  await expect(page.locator('.ali1688-historical-orders-toolbar')).toHaveCount(0);
  await expect(controls.getByRole('button', { name: '批量分配/关联' })).toBeVisible();
  await expect(page.getByRole('button', { name: '分配到店铺' })).not.toBeVisible();
  const productImage = firstProductRow.getByAltText('仿真罂粟花束 6 支装 家居装饰');
  await expect(productImage).toBeVisible();
  const productImageBox = await productImage.boundingBox();
  expect(productImageBox).not.toBeNull();
  expect(Math.round(productImageBox!.width)).toBe(90);
  expect(Math.round(productImageBox!.height)).toBe(90);
  await expect(firstProductRow.getByText('规格: 红色 / 仿真花束')).toBeVisible();
  await expect(firstProductRow.getByText('货品金额:')).not.toBeVisible();
  await expect(firstProductRow.getByText('订单总价: ¥336.00')).toBeVisible();
  await expect(firstProductRow.getByText('运费: ¥12.00')).toBeVisible();
  await expect(firstProductRow.getByText('涨价/折扣')).not.toBeVisible();
  await expect(firstProductRow.getByText('实付款: ¥340.00')).toBeVisible();
  await expect(firstProductRow.getByText('订单价:')).toHaveCount(0);
  await expect(firstProductRow.getByText('供应商: 义乌诚信通源头工厂')).toBeVisible();
  await expect(firstProductRow.getByText('订单号: ALI-ORDER-20260525-001')).toBeVisible();
  await expect(firstProductRow.getByText('等待买家收货')).toBeVisible();
  await expect(firstProductRow.getByText('waitbuyerreceive')).toHaveCount(0);
  await expect(firstProductRow.locator('.ali1688-product-line-tags').getByText('Offer')).not.toBeVisible();
  await expect(firstProductRow.locator('.ali1688-product-line-tags').getByText('SKU')).not.toBeVisible();
  await expect(firstProductRow.locator('.ali1688-order-context-cell').getByText('Offer 745612345678')).toBeVisible();
  await expect(firstProductRow.locator('.ali1688-order-context-cell').getByText('SKU SKU-745612345678-RED')).toBeVisible();
  await expect(firstProductRow.getByText('运单:')).not.toBeVisible();
  await firstProductRow.locator('.ali1688-product-line-title').hover();
  await expect(page.getByRole('tooltip')).toContainText('仿真罂粟花束 6 支装 家居装饰');
  await firstProductRow.getByText('分配信息 canman AE xingyao AE').hover();
  await expect(page.getByRole('tooltip', { name: /部分分配/ })).not.toBeVisible();

  await page.getByRole('button', { name: '查看货品' }).first().click();
  const drawer = page.getByRole('dialog', { name: '采购货品详情' });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('tab', { name: '货品信息' })).toBeVisible();
  await expect(drawer.getByRole('tab', { name: '订单信息' })).toBeVisible();
  await expect(drawer.getByRole('tab', { name: '物流信息' })).toBeVisible();
  await expect(drawer.getByRole('tab', { name: '收货与备注' })).toBeVisible();
  await expect(drawer.getByText('仿真罂粟花束 6 支装 家居装饰')).toBeVisible();
  await expect(drawer.getByText('745612345678', { exact: true })).toBeVisible();
  await expect(drawer.getByText('红色')).toBeVisible();
  await expect(drawer.getByText('SKU-745612345678-RED')).toBeVisible();
  await drawer.getByRole('tab', { name: '订单信息' }).click();
  await expect(drawer.getByText('ALI-ORDER-20260525-001')).toBeVisible();
  await expect(drawer.getByText('涨价或折扣')).not.toBeVisible();
  await expect(drawer.getByText('¥336.00')).toBeVisible();
  await expect(drawer.getByText('¥340.00')).toBeVisible();
  await drawer.getByRole('tab', { name: '物流信息' }).click();
  await expect(drawer.getByText('中通快递(ZTO)')).toBeVisible();
  await expect(drawer.getByText('ZTO20260525001')).toBeVisible();
});

test('partial success keeps synced orders visible and shows failure reason', async ({ page }) => {
  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: partialSuccessWorkbench });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');

  await expect(page.getByRole('alert').getByText('部分成功')).toBeVisible();
  await expect(page.getByRole('alert').getByText('部分订单详情字段未返回。')).toBeVisible();
  await expect(page.getByText('ALI-ORDER-20260525-001').first()).toBeVisible();
});

test('missing fields are explicit and sensitive values never render', async ({ page }) => {
  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: missingFieldWorkbench });
  });
  await page.route('**/api/procurement/ali1688-orders/93003**', async (route) => {
    await route.fulfill({ json: missingFieldDetail });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');

  await expect(page.getByRole('alert').getByText('订单部分字段未返回，可稍后刷新。')).toBeVisible();
  await expect(page.getByText('ALI-ORDER-20260525-MISSING')).toBeVisible();
  const missingRow = page.getByText('ALI-ORDER-20260525-MISSING').locator('xpath=ancestor::tr');
  await expect(missingRow.getByText('未返回信息')).toHaveCount(1);
  await expect(missingRow.locator('.ali1688-product-line-main').getByText('未返回信息')).toHaveCount(0);
  await expect(missingRow.locator('.ali1688-logistics-cell').getByText('未返回信息')).toBeVisible();
  const missingInfo = missingRow.getByText('未返回信息').first();
  await expect(missingInfo).toBeVisible();
  await expect(page.getByText('未返回: 金额 / 物流 / 供应商 / 原始链接')).not.toBeVisible();
  await missingInfo.hover();
  await expect(page.getByRole('tooltip')).toContainText(/金额.*物流.*供应商.*规格.*图片.*原始链接/);
  await expect(page.getByText('¥0')).not.toBeVisible();
  await expect(page.getByText('13800138000')).not.toBeVisible();
  await expect(page.getByText('西湖区文三路')).not.toBeVisible();
  await expect(page.getByText('周五前发货')).not.toBeVisible();
  await expect(page.getByText('supplier-contact')).not.toBeVisible();

  await page.getByRole('button', { name: '查看货品' }).click();
  const drawer = page.getByRole('dialog', { name: '采购货品详情' });
  const drawerMissingInfo = drawer.getByText('未返回信息').first();
  await expect(drawerMissingInfo).toBeVisible();
  await drawerMissingInfo.hover();
  await expect(page.getByRole('tooltip')).toContainText('规格 / 图片');
  await drawer.getByRole('tab', { name: '收货与备注' }).click();
  await expect(drawer.getByText('已隐藏').first()).toBeVisible();
  await expect(drawer.getByText('13800138000')).not.toBeVisible();
});
