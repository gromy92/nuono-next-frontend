import { expect, test, type Locator } from '@playwright/test';

const storeSyncOverview = {
  mode: 'mock',
  ready: true,
  selectedOwnerId: 307,
  summary: {
    totalStores: 1,
    connectedStores: 1,
    pendingStores: 0,
    managerLinks: 0
  },
  ownerOptions: [],
  stores: [],
  syncedRules: [],
  missingCoreTables: []
};

const noAuthorizationWorkbench = {
  ready: true,
  mode: 'local-db',
  authorization: {
    status: 'not_authorized',
    message: '老板授权后可同步 1688 历史订单'
  },
  roleCapabilities: {
    canAuthorize: true,
    canTriggerSync: false,
    canViewOrders: true
  },
  syncSummary: {
    latestTaskStatus: 'not_started',
    totalOrderCount: 0,
    totalItemCount: 0
  },
  orders: [],
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0
  }
};

const authorizedWorkbench = {
  ...noAuthorizationWorkbench,
  authorization: {
    status: 'authorized',
    authorizationId: 91001,
    accountLabel: '1688 开发授权账号',
    scopeSummary: '读取 1688 历史订单，不会付款或创建订单。'
  },
  roleCapabilities: {
    canAuthorize: true,
    canTriggerSync: true,
    canViewOrders: true
  }
};

const syncedWorkbench = {
  ...authorizedWorkbench,
  syncSummary: {
    latestTaskStatus: 'success',
    totalOrderCount: 1,
    totalItemCount: 4,
    processedCount: 1,
    importedCount: 4,
    failedCount: 0,
    progressPercent: 100
  },
  orders: [
    {
      id: '93001',
      orderNo: 'ALI-ORDER-20260525-001',
      orderTime: '2026-05-25 10:30:00',
      supplierName: '义乌诚信通源头工厂',
      goodsTotalText: '336',
      freightText: '¥12.00',
      adjustmentText: '-¥8.00',
      paidAmountText: '340',
      amountText: '¥128.00',
      orderStatus: 'waitbuyerreceive',
      logisticsStatus: '待发货',
      originalUrl: 'https://trade.1688.com/order/new_step_order_detail.htm?orderId=ALI-ORDER-20260525-001',
      items: [
        {
          id: '94001',
          offerId: '745612345678',
          skuId: 'SKU-745612345678-RED',
          title: '仿真罂粟花束 6 支装 家居装饰',
          skuText: '红色',
          modelText: '仿真花束',
          productCode: '彩虹蛋糕',
          singleProductCode: 'MX-001',
          quantity: 10,
          originalQuantity: 10,
          assignedQuantity: 4,
          remainingQuantity: 6,
          assignmentStatus: 'partially_assigned',
          assignmentStatusLabel: '部分分配',
          assignmentBreakdownText: 'PRJ108065 AE 2 / PRJ245027 AE 2',
          unit: '套',
          unitPriceText: '¥12.80',
          amountText: '¥128.00',
          imageUrl: 'https://example.com/ali-order-item.jpg',
          logisticsCompany: '中通快递(ZTO)',
          trackingNo: 'ZTO20260525001'
        },
        {
          id: '94002',
          offerId: '745612349999',
          skuId: 'SKU-745612349999-PINK',
          title: '跨境B6复古五角星锁心本',
          skuText: '粉红色-锁芯款 / B6',
          modelText: 'B6',
          productCode: 'HS020',
          singleProductCode: 'YH-020',
          quantity: 10,
          originalQuantity: 10,
          assignedQuantity: 0,
          remainingQuantity: 10,
          assignmentStatus: 'unassigned',
          assignmentStatusLabel: '未分配',
          unit: '件',
          unitPriceText: '¥20.80',
          amountText: '¥208.00',
          logisticsCompany: '圆通速递(YTO)',
          trackingNo: 'YTO20260525002'
        },
        {
          id: '94003',
          offerId: '745612348888',
          skuId: 'SKU-745612348888-FULL',
          title: '已分配样品货品',
          skuText: '黑色',
          modelText: '常规',
          productCode: 'FULL-001',
          singleProductCode: 'FULL-SINGLE-001',
          quantity: 8,
          originalQuantity: 8,
          assignedQuantity: 8,
          remainingQuantity: 0,
          assignmentStatus: 'assigned',
          assignmentStatusLabel: '已分配',
          unit: '件',
          unitPriceText: '¥9.00',
          amountText: '¥72.00'
        },
        {
          id: '94004',
          offerId: '745612347777',
          skuId: 'SKU-745612347777-MISSING',
          title: '数量未返回样品货品',
          skuText: '默认',
          modelText: '常规',
          productCode: 'MISS-001',
          singleProductCode: 'MISS-SINGLE-001',
          quantity: null,
          originalQuantity: null,
          assignedQuantity: 0,
          remainingQuantity: null,
          assignmentStatus: 'quantity_missing',
          assignmentStatusLabel: '数量未返回',
          unit: '件',
          unitPriceText: '¥9.00',
          amountText: null
        }
      ]
    }
  ],
  pagination: {
    page: 1,
    pageSize: 20,
    total: 1
  }
};

const partialSuccessWorkbench = {
  ...syncedWorkbench,
  syncSummary: {
    latestTaskStatus: 'partial_success',
    totalOrderCount: 1,
    totalItemCount: 1,
    processedCount: 1,
    importedCount: 1,
    failedCount: 1,
    progressPercent: 100,
    failureCode: 'missing_fields',
    failureMessage: '部分订单详情字段未返回。'
  }
};

const missingFieldWorkbench = {
  ...syncedWorkbench,
  syncSummary: {
    latestTaskStatus: 'partial_success',
    totalOrderCount: 1,
    totalItemCount: 1,
    processedCount: 1,
    importedCount: 1,
    failedCount: 1,
    progressPercent: 100,
    failureCode: 'missing_fields',
    failureMessage: '订单部分字段未返回，可稍后刷新。'
  },
  orders: [
    {
      id: '93003',
      orderNo: 'ALI-ORDER-20260525-MISSING',
      orderTime: '2026-05-25 11:30:00',
      supplierName: null,
      amountText: null,
      orderStatus: '已付款',
      logisticsStatus: null,
      originalUrl: null,
      receiverPhone: '13800138000',
      receiverAddress: '浙江省杭州市西湖区文三路 99 号 3 幢 501 室',
      buyerRemark: '周五前发货，联系采购小王',
      supplierContact: '旺旺：supplier-contact',
      missingFields: ['supplier', 'amount', 'logistics', 'sourceLink'],
      items: [
        {
          id: '94003',
          offerId: '745612345678',
          title: '仿真罂粟花束 6 支装 家居装饰',
          skuText: null,
          quantity: 10,
          unitPriceText: '¥12.80',
          amountText: '¥128.00',
          imageUrl: null,
          missingFields: ['sku', 'image']
        }
      ]
    }
  ]
};

const missingFieldDetail = {
  ...missingFieldWorkbench.orders[0],
  sensitiveFields: {
    redactionLevel: 'hidden',
    receiverPhone: '已隐藏',
    receiverAddress: '已隐藏',
    buyerRemark: '已隐藏',
    supplierContact: '已隐藏'
  }
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/store-sync/overview**', async (route) => {
    await route.fulfill({ json: storeSyncOverview });
  });
  await page.route('**/api/procurement/ali1688-orders/items/*/assignments', async (route) => {
    await route.fulfill({ json: [] });
  });
});

function assignmentTargetOptions(dialog: Locator) {
  return dialog.locator('.ali1688-assignment-target-options');
}

async function clickAssignmentTarget(dialog: Locator, label: string) {
  await assignmentTargetOptions(dialog).getByRole('button', { name: label }).click();
}

test('boss sees historical order page no-auth empty state from real API', async ({ page }) => {
  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: noAuthorizationWorkbench });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');

  await expect(page.getByTestId('workspace-tabs-bar').getByRole('tab', { name: '1688 历史订单' })).toBeVisible();
  await expect(page.getByTestId('ali1688-historical-orders-page')).toBeVisible();
  await expect(page.getByRole('heading', { name: '1688 历史订单' })).not.toBeVisible();
  await expect(page.getByRole('alert').getByText('老板授权后可同步 1688 历史订单')).toBeVisible();
  await expect(page.getByRole('button', { name: '授权 1688' })).toBeVisible();
  await expect(page.getByText('暂无 1688 历史订单')).toBeVisible();
  await expect(page.getByText('PO-DEMO')).not.toBeVisible();
});

test('boss dev session is forwarded to historical order API requests', async ({ page }) => {
  let requestHeaders: Record<string, string> | undefined;

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    requestHeaders = route.request().headers();
    await route.fulfill({ json: noAuthorizationWorkbench });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  await expect(page.getByTestId('ali1688-historical-orders-page')).toBeVisible();

  expect(requestHeaders?.['x-nuono-dev-session-user-id']).toBe('307');
  expect(requestHeaders?.['x-nuono-dev-session-role-id']).toBe('2');
  expect(requestHeaders?.['x-nuono-dev-session-level']).toBe('1');
});

test('non-boss local acceptance roles can open historical order page with real dev users', async ({ page }) => {
  const roles = [
    { role: 'ops-manager', userId: '90005', roleId: '3', level: '2' },
    { role: 'operator', userId: '90003', roleId: '4', level: '3' },
    { role: 'procurement', userId: '90001', roleId: '5', level: '3' },
    { role: 'warehouse', userId: '90004', roleId: '6', level: '3' }
  ];

  for (const role of roles) {
    let requestHeaders: Record<string, string> | undefined;
    await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
      requestHeaders = route.request().headers();
      await route.fulfill({
        json: {
          ...syncedWorkbench,
          roleCapabilities: {
            canAuthorize: false,
            canTriggerSync: false,
            canViewOrders: true
          }
        }
      });
    });

    await page.goto(`/purchase/ali1688-orders?devSession=1&devRole=${role.role}&grantAli1688HistoricalOrders=1`);
    await expect(page.getByTestId('ali1688-historical-orders-page')).toBeVisible();
    await expect(page.getByText('ALI-ORDER-20260525-001').first()).toBeVisible();
    await expect(page.getByRole('button', { name: '授权 1688' })).not.toBeVisible();

    expect(requestHeaders?.['x-nuono-dev-session-user-id']).toBe(role.userId);
    expect(requestHeaders?.['x-nuono-dev-session-role-id']).toBe(role.roleId);
    expect(requestHeaders?.['x-nuono-dev-session-level']).toBe(role.level);

    await page.unroute('**/api/procurement/ali1688-orders/workbench');
  }
});

test('boss can open Excel import entry while operations cannot upload', async ({ page }) => {
  let workbench = noAuthorizationWorkbench;

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: workbench });
  });
  await page.route('**/api/procurement/ali1688-orders/excel-imports/sources**', async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');

  await expect(page.getByRole('button', { name: 'Excel 导入' })).toBeVisible();
  await page.getByRole('button', { name: 'Excel 导入' }).click();
  const importDialog = page.getByRole('dialog', { name: 'Excel 导入' });
  await expect(importDialog).toBeVisible();
  await expect(importDialog.getByText('导入目标')).not.toBeVisible();
  await expect(importDialog.getByText('PRJ108065 · AE', { exact: true })).not.toBeVisible();
  await expect(importDialog.getByRole('button', { name: '上传' })).toBeVisible();
  await expect(importDialog.getByText('Excel 来源')).not.toBeVisible();
  await expect(importDialog.getByText('创建来源')).not.toBeVisible();

  workbench = {
    ...noAuthorizationWorkbench,
    roleCapabilities: {
      canAuthorize: false,
      canTriggerSync: false,
      canViewOrders: true
    }
  };
  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=operator&grantAli1688HistoricalOrders=1');
  await expect(page.getByRole('button', { name: 'Excel 导入' })).not.toBeVisible();
});

test('boss can upload and audit a sanitized Excel import without a preview confirmation step', async ({ page }) => {
  let workbench = noAuthorizationWorkbench;

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: workbench });
  });
  await page.route('**/api/procurement/ali1688-orders/excel-imports/sources**', async (route) => {
    await route.fulfill({
      json: [
        {
          authorizationId: 91008,
          providerCode: 'ALI1688_EXCEL_UPLOAD',
          accountLabel: '沁雪冰菏 Excel 导入',
          storeCode: 'PRJ108065',
          siteCode: 'AE',
          status: 'authorized'
        }
      ]
    });
  });
  await page.route('**/api/procurement/ali1688-orders/excel-imports/preview**', async (route) => {
    await route.fulfill({
      json: {
        batchId: 97001,
        status: 'preview_ready',
        fileName: 'sanitized-1688-order-export.xlsx',
        fileSize: 4096,
        fileHash: 'safe-hash',
        storeCode: 'PRJ108065',
        siteCode: 'AE',
        source: {
          authorizationId: 91008,
          providerCode: 'ALI1688_EXCEL_UPLOAD',
          accountLabel: '沁雪冰菏 Excel 导入'
        },
        headerValidation: {
          valid: true,
          expectedHeaderCount: 49,
          actualHeaderCount: 49
        },
        summary: {
          totalDataRowCount: 3,
          orderHeaderRowCount: 2,
          productLineCount: 3,
          logisticsLineCount: 2,
          validRowCount: 3,
          duplicateCandidateCount: 0
        },
        rowErrors: [],
        rowWarnings: []
      }
    });
  });
  await page.route('**/api/procurement/ali1688-orders/excel-imports/97001/commit**', async (route) => {
    workbench = syncedWorkbench;
    await route.fulfill({
      json: {
        batchId: 97001,
        status: 'committed',
        counts: {
          insertedOrderCount: 2,
          updatedOrderCount: 0,
          skippedOrderCount: 0,
          insertedItemCount: 3,
          updatedItemCount: 0,
          skippedItemCount: 0,
          insertedLogisticsCount: 2,
          updatedLogisticsCount: 0,
          skippedLogisticsCount: 0
        }
      }
    });
  });
  await page.route(/\/api\/procurement\/ali1688-orders\/excel-imports(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      json: [
        {
          batchId: 97001,
          status: 'committed',
          fileName: 'sanitized-1688-order-export.xlsx',
          fileSize: 4096,
          fileHash: 'safe-hash',
          accountLabel: '沁雪冰菏 Excel 导入',
          storeCode: 'PRJ108065',
          siteCode: 'AE',
          productLineCount: 3,
          createdAt: '2026-05-26 12:00:00'
        }
      ]
    });
  });
  await page.route(/\/api\/procurement\/ali1688-orders\/excel-imports\/97001(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      json: {
        batchId: 97001,
        status: 'committed',
        fileName: 'sanitized-1688-order-export.xlsx',
        fileSize: 4096,
        fileHash: 'safe-hash',
        accountLabel: '沁雪冰菏 Excel 导入',
        storeCode: 'PRJ108065',
        siteCode: 'AE',
        headerVersion: 'ali1688_historical_order_export_v1',
        orderHeaderRowCount: 2,
        productLineCount: 3,
        logisticsLineCount: 2,
        validRowCount: 3,
        duplicateCandidateCount: 0,
        errorCount: 0,
        warningCount: 0,
        createdBy: 307,
        createdAt: '2026-05-26 12:00:00',
        errorSummaryJson: '{"rowErrors":0,"rowWarnings":0}'
      }
    });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  await page.getByRole('button', { name: 'Excel 导入' }).click();
  const importDialog = page.getByRole('dialog', { name: 'Excel 导入' });
  await expect(importDialog).toBeVisible();
  await page.locator('.ant-upload input[type="file"]').setInputFiles({
    name: 'sanitized-1688-order-export.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from('sanitized 1688 fixture placeholder')
  });
  await importDialog.getByRole('button', { name: '上传' }).click();

  await expect(importDialog.getByText('导入完成，列表已刷新')).toBeVisible();
  await expect(importDialog.getByText('预览批次 97001')).not.toBeVisible();
  await expect(importDialog.getByRole('button', { name: '确认导入' })).not.toBeVisible();
  await expect(importDialog.getByText('新增货品')).toBeVisible();
  await importDialog.getByRole('button', { name: '关 闭' }).click();

  await expect(page.getByText('ALI-ORDER-20260525-001').first()).toBeVisible();
  await page.getByRole('button', { name: '导入历史' }).click();
  const historyDrawer = page.getByRole('dialog', { name: 'Excel 导入历史' });
  await expect(historyDrawer).toBeVisible();
  await expect(historyDrawer.getByText('sanitized-1688-order-export.xlsx')).toBeVisible();
  await expect(historyDrawer.getByText('safe-hash')).not.toBeVisible();
  await historyDrawer.getByRole('button', { name: '查看详情' }).click();
  await expect(historyDrawer.getByText('safe-hash')).toBeVisible();
  await expect(historyDrawer.getByText('ali1688_historical_order_export_v1')).toBeVisible();
});

test('boss sees safe validation feedback for a wrong Excel template', async ({ page }) => {
  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: noAuthorizationWorkbench });
  });
  await page.route('**/api/procurement/ali1688-orders/excel-imports/sources**', async (route) => {
    await route.fulfill({
      json: [
        {
          authorizationId: 91008,
          providerCode: 'ALI1688_EXCEL_UPLOAD',
          accountLabel: '沁雪冰菏 Excel 导入',
          storeCode: 'PRJ108065',
          siteCode: 'AE',
          status: 'authorized'
        }
      ]
    });
  });
  await page.route('**/api/procurement/ali1688-orders/excel-imports/preview**', async (route) => {
    await route.fulfill({
      json: {
        batchId: 97002,
        status: 'validation_failed',
        fileName: 'wrong-template.xlsx',
        summary: {
          totalDataRowCount: 0,
          orderHeaderRowCount: 0,
          productLineCount: 0,
          logisticsLineCount: 0,
          validRowCount: 0,
          duplicateCandidateCount: 0
        },
        headerValidation: {
          valid: false,
          expectedHeaderCount: 49,
          actualHeaderCount: 2,
          message: '表头不匹配，请重新导出 1688 历史订单 Excel。',
          mismatchedHeaders: [
            {
              columnIndex: 1,
              expected: '订单编号',
              actual: '错误列'
            }
          ]
        },
        rowErrors: [],
        rowWarnings: []
      }
    });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  await page.getByRole('button', { name: 'Excel 导入' }).click();
  const importDialog = page.getByRole('dialog', { name: 'Excel 导入' });
  await page.locator('.ant-upload input[type="file"]').setInputFiles({
    name: 'wrong-template.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from('wrong template placeholder')
  });
  await importDialog.getByRole('button', { name: '上传' }).click();

  await expect(importDialog.getByText('表头不匹配，请重新导出 1688 历史订单 Excel。')).toBeVisible();
  await expect(importDialog.getByText('第 1 列：应为 订单编号，实际为 错误列')).toBeVisible();
  await expect(importDialog.getByRole('button', { name: '确认导入' })).not.toBeVisible();
});

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

test('user can link an assigned 1688 product line to a store SKU', async ({ page }) => {
  let linked = false;
  let linkPayload: any;
  const candidateRequests: string[] = [];
  let unlinkRequested = false;
  const workbench = JSON.parse(JSON.stringify(syncedWorkbench));
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
    const response = JSON.parse(JSON.stringify(workbench));
    if (linked) {
      response.orders[0].items[0].productLink = {
        status: 'linked',
        skuParent: 'CANMAN-AE-SKU-001',
        partnerSku: 'CM-AE-PARTNER-001',
        pskuCode: 'PSKU-CM-AE-001',
        productTitle: 'canman AE 抽纸盒',
        displayText: '已关联: Z6F6FB9180C80122C7EA5Z'
      };
    }
    await route.fulfill({ json: response });
  });
  await page.route('**/api/procurement/ali1688-orders/product-link-candidates**', async (route) => {
    const url = new URL(route.request().url());
    candidateRequests.push(url.search);
    const linkStatus = url.searchParams.get('linkStatus') || 'all';
    const linkedCandidate = linkStatus === 'linked';
    await route.fulfill({
      json: [{
        storeCode: 'PRJ108065',
        siteCode: 'AE',
        skuParent: linkedCandidate ? 'CANMAN-AE-SKU-001' : 'CANMAN-AE-SKU-002',
        partnerSku: linkedCandidate ? 'CM-AE-PARTNER-001' : 'CM-AE-PARTNER-002',
        pskuCode: linkedCandidate ? 'PSKU-CM-AE-001' : 'PSKU-CM-AE-002',
        productTitle: linkedCandidate ? '已关联 canman 商品' : '未关联 canman 商品',
        productImageUrl: linkedCandidate ? 'https://example.com/canman-ae-linked.jpg' : 'https://example.com/canman-ae-unlinked.jpg',
        linkStatus: linkedCandidate ? 'linked' : 'unlinked',
        linkedAssignmentCount: linkedCandidate ? 1 : 0
      }]
    });
  });
  await page.route('**/api/procurement/ali1688-orders/product-links', async (route) => {
    linkPayload = route.request().postDataJSON();
    linked = true;
    await route.fulfill({
      json: {
        status: 'linked',
        assignmentId: 99001,
        skuParent: 'CANMAN-AE-SKU-001',
        partnerSku: 'CM-AE-PARTNER-001',
        pskuCode: 'PSKU-CM-AE-001',
        productTitle: 'canman AE 抽纸盒',
        displayText: '已关联: CANMAN-AE-SKU-001'
      }
    });
  });
  await page.route('**/api/procurement/ali1688-orders/product-links/99001/unlink', async (route) => {
    unlinkRequested = true;
    linked = false;
    await route.fulfill({
      json: {
        status: 'unlinked',
        assignmentId: 99001,
        displayText: '未关联'
      }
    });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  const row = page.getByText('已分配样品货品').locator('xpath=ancestor::tr');
  const productCell = row.locator('.ali1688-product-line-main');
  await expect(productCell.getByText('分配信息 canman AE')).toBeVisible();
  await expect(productCell.getByRole('button', { name: '商品关联' })).toHaveCount(0);
  await expect(productCell.getByRole('button', { name: '分配店铺' })).toHaveCount(0);
  await expect(row.locator('td').last().getByRole('button', { name: '分配/关联' })).toHaveCount(0);
  await productCell.getByRole('button', { name: '分配/关联' }).click();

  const dialog = page.getByRole('dialog', { name: '分配/关联' });
  await expect(dialog.getByText('已分配样品货品')).toBeVisible();
  await expect.poll(() => candidateRequests[0] || '').toContain('assignmentId=99001');
  await expect.poll(() => new URLSearchParams(candidateRequests[0] || '').get('linkStatus')).toBeNull();
  await expect(dialog.locator('.ali1688-product-link-filter').getByText('全部')).toBeVisible();
  await expect(dialog.getByText('未关联 canman 商品')).toBeVisible();
  await expect(dialog.getByText('PSKU PSKU-CM-AE-002')).toBeVisible();
  await expect(dialog.locator('.ant-avatar-image')).toBeVisible();

  await dialog.locator('.ali1688-product-link-filter').getByText('已关联').click();
  await expect.poll(() => candidateRequests.some((query) => query.includes('linkStatus=linked'))).toBeTruthy();
  await expect(dialog.getByText('已关联 canman 商品')).toBeVisible();

  await dialog.locator('.ali1688-product-link-filter').getByText('未关联').click();
  await expect.poll(() => candidateRequests.filter((query) => query.includes('linkStatus=unlinked')).length).toBeGreaterThan(0);
  await dialog.getByRole('searchbox', { name: '搜索商品' }).fill('CANMAN-AE-SKU-002');
  await dialog.getByText('CANMAN-AE-SKU-002').click();
  await dialog.getByRole('button', { name: '确认关联' }).click();

  await expect.poll(() => linkPayload).toMatchObject({
    assignmentId: 99001,
    skuParent: 'CANMAN-AE-SKU-002',
    partnerSku: 'CM-AE-PARTNER-002',
    pskuCode: 'PSKU-CM-AE-002',
    productTitle: '未关联 canman 商品'
  });
  await expect(page.getByText('已关联: CM-AE-PARTNER-001')).toBeVisible();
  await expect(page.getByText('已关联: Z6F6FB9180C80122C7EA5Z')).toHaveCount(0);
  await expect(productCell.getByRole('button', { name: '改关联' })).toHaveCount(0);
  await expect(productCell.getByRole('button', { name: '分配/关联' })).toBeVisible();
  await expect(productCell.getByRole('button', { name: '解除关联' })).toHaveCount(0);
  await productCell.getByRole('button', { name: '分配/关联' }).click();
  await expect(dialog.getByText('当前关联')).toBeVisible();
  await expect(dialog.getByText('已关联: CM-AE-PARTNER-001')).toBeVisible();
  await dialog.getByRole('button', { name: '解除关联' }).click();
  await expect.poll(() => unlinkRequested).toBeTruthy();
  await expect(page.getByText('已关联: CM-AE-PARTNER-001')).toHaveCount(0);
});

test('product link search queries backend instead of filtering only the first candidate page', async ({ page }) => {
  const candidateRequests: string[] = [];
  const workbench = JSON.parse(JSON.stringify(syncedWorkbench));
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
    const url = new URL(route.request().url());
    candidateRequests.push(url.search);
    const keyword = url.searchParams.get('keyword') || '';
    await route.fulfill({
      json: keyword === 'DEEP-SKU-999'
        ? [{
          storeCode: 'PRJ108065',
          siteCode: 'AE',
          skuParent: 'DEEP-SKU-999',
          partnerSku: 'DEEP-PARTNER-999',
          pskuCode: 'PSKU-DEEP-999',
          productTitle: '分页后面的目标商品',
          productImageUrl: 'https://example.com/deep-sku-999.jpg',
          linkStatus: 'unlinked',
          linkedAssignmentCount: 0
        }]
        : [{
          storeCode: 'PRJ108065',
          siteCode: 'AE',
          skuParent: 'FIRST-PAGE-SKU-001',
          partnerSku: 'FIRST-PARTNER-001',
          pskuCode: 'PSKU-FIRST-001',
          productTitle: '默认第一页商品',
          productImageUrl: 'https://example.com/first-page-sku-001.jpg',
          linkStatus: 'unlinked',
          linkedAssignmentCount: 0
        }]
    });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  await page.getByText('已分配样品货品').locator('xpath=ancestor::tr').locator('.ali1688-product-line-main')
    .getByRole('button', { name: '分配/关联' })
    .click();

  const dialog = page.getByRole('dialog', { name: '分配/关联' });
  await expect(dialog.getByText('默认第一页商品')).toBeVisible();
  await dialog.getByRole('searchbox', { name: '搜索商品' }).fill('DEEP-SKU-999');

  await expect.poll(() => candidateRequests.some((query) => new URLSearchParams(query).get('keyword') === 'DEEP-SKU-999'))
    .toBeTruthy();
  await expect(dialog.getByText('分页后面的目标商品')).toBeVisible();
  await expect(dialog.getByText('默认第一页商品')).toHaveCount(0);
});

test('boss can link multiple assigned product lines to the same store SKU', async ({ page }) => {
  const workbench = JSON.parse(JSON.stringify(syncedWorkbench));
  workbench.orders[0].items = [
    {
      ...workbench.orders[0].items[2],
      id: '94003-A',
      title: '金属油画书签 向日葵',
      assignmentId: 99001,
      assignmentTargetType: 'STORE_SITE',
      assignmentTargetStoreCode: 'PRJ108065',
      assignmentTargetSiteCode: 'AE',
      assignmentBreakdownText: 'PRJ108065 AE 20',
      productLink: undefined
    },
    {
      ...workbench.orders[0].items[2],
      id: '94003-B',
      title: '金属油画书签 睡莲',
      assignmentId: 99002,
      assignmentTargetType: 'STORE_SITE',
      assignmentTargetStoreCode: 'PRJ108065',
      assignmentTargetSiteCode: 'AE',
      assignmentBreakdownText: 'PRJ108065 AE 20',
      productLink: undefined
    }
  ];
  const candidateRequests: string[] = [];
  const linkPayloads: any[] = [];

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: workbench });
  });
  await page.route('**/api/procurement/ali1688-orders/product-link-candidates**', async (route) => {
    const url = new URL(route.request().url());
    candidateRequests.push(url.search);
    await route.fulfill({
      json: [{
        storeCode: 'PRJ108065',
        siteCode: 'AE',
        skuParent: 'CANMAN-AE-SKU-001',
        partnerSku: 'PAPERSAYSB291',
        pskuCode: 'PSKU-PAPER-291',
        productTitle: 'PAPERSAYSB291 书签套装',
        productImageUrl: 'https://example.com/papersaysb291.jpg',
        linkStatus: 'linked',
        linkedAssignmentCount: 1
      }]
    });
  });
  await page.route('**/api/procurement/ali1688-orders/product-links/batch', async (route) => {
    linkPayloads.push(route.request().postDataJSON());
    await route.fulfill({
      json: {
        status: 'linked',
        linkedLineCount: 2,
        skuParent: 'CANMAN-AE-SKU-001'
      }
    });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');

  await page.getByLabel('选择 金属油画书签 向日葵').check();
  await page.getByLabel('选择 金属油画书签 睡莲').check();
  await expect(page.getByRole('button', { name: '批量商品关联' })).toHaveCount(0);
  await page.getByRole('button', { name: '批量分配/关联' }).click();

  const dialog = page.getByRole('dialog', { name: '分配/关联' });
  await expect(dialog.getByText('已选 2 条货品行')).toBeVisible();
  await expect.poll(() => candidateRequests[0] || '').toContain('assignmentId=99001');
  await expect.poll(() => new URLSearchParams(candidateRequests[0] || '').get('linkStatus')).toBeNull();
  await expect(dialog.getByText('PAPERSAYSB291 书签套装')).toBeVisible();
  await dialog.getByText('CANMAN-AE-SKU-001').click();
  await dialog.getByRole('button', { name: '确认关联' }).click();

  await expect.poll(() => linkPayloads).toHaveLength(1);
  expect(linkPayloads[0]).toEqual({
    links: [
      expect.objectContaining({
        assignmentId: 99001,
        skuParent: 'CANMAN-AE-SKU-001',
        partnerSku: 'PAPERSAYSB291',
        pskuCode: 'PSKU-PAPER-291'
      }),
      expect.objectContaining({
        assignmentId: 99002,
        skuParent: 'CANMAN-AE-SKU-001',
        partnerSku: 'PAPERSAYSB291',
        pskuCode: 'PSKU-PAPER-291'
      })
    ]
  });
});

test('boss can open product link entry before assigning product line', async ({ page }) => {
  const workbench = JSON.parse(JSON.stringify(syncedWorkbench));
  workbench.orders[0].items = [workbench.orders[0].items[1]];

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: workbench });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');

  const row = page.getByText('跨境B6复古五角星锁心本').locator('xpath=ancestor::tr');
  const productCell = row.locator('.ali1688-product-line-main');
  await expect(productCell.getByText('分配信息 未分配')).toBeVisible();
  await expect(productCell.getByRole('button', { name: '分配店铺' })).toHaveCount(0);
  await expect(productCell.getByRole('button', { name: '商品关联' })).toHaveCount(0);
  const actionButton = productCell.getByRole('button', { name: '分配/关联' });
  await expect(actionButton).toBeVisible();
  await expect(actionButton).toBeEnabled();
  await actionButton.click();
  const dialog = page.getByRole('dialog', { name: '分配/关联' });
  await expect(dialog.getByText('保存分配后选择店铺商品。')).toHaveCount(0);
  await expect(assignmentTargetOptions(dialog).getByRole('button', { name: 'canman AE' })).toBeVisible();
  await expect(dialog.getByRole('combobox', { name: '目标店铺' })).toHaveCount(0);
});

test('historical order product image border reflects product and store assignment state', async ({ page }) => {
  const workbench = JSON.parse(JSON.stringify(syncedWorkbench));
  workbench.orders[0].items = [
    {
      ...workbench.orders[0].items[0],
      id: '94001-LINKED-IMAGE',
      title: '已关联商品图片',
      imageUrl: 'https://example.com/linked-item.jpg',
      assignmentId: undefined,
      assignmentStatus: 'unassigned',
      assignmentStatusLabel: '未分配',
      assignmentTargetType: undefined,
      assignmentTargetStoreCode: undefined,
      assignmentTargetSiteCode: undefined,
      productLink: {
        status: 'linked',
        skuParent: 'CANMAN-AE-SKU-LINKED',
        partnerSku: 'CM-AE-LINKED',
        pskuCode: 'PSKU-CM-AE-LINKED'
      }
    },
    {
      ...workbench.orders[0].items[2],
      id: '94002-STORE-LINKED-IMAGE',
      title: '已分配且已关联商品图片',
      imageUrl: 'https://example.com/store-linked-item.jpg',
      assignmentId: 99002,
      assignmentStatus: 'assigned',
      assignmentStatusLabel: '已分配',
      assignmentTargetType: 'STORE_SITE',
      assignmentTargetStoreCode: 'PRJ108065',
      assignmentTargetSiteCode: 'AE',
      assignmentBreakdownText: 'PRJ108065 AE 8',
      productLink: {
        status: 'linked',
        skuParent: 'CANMAN-AE-SKU-STORE',
        partnerSku: 'CM-AE-STORE',
        pskuCode: 'PSKU-CM-AE-STORE'
      }
    },
    {
      ...workbench.orders[0].items[2],
      id: '94003-STORE-ONLY-IMAGE',
      title: '仅分配店铺商品图片',
      imageUrl: 'https://example.com/store-only-item.jpg',
      assignmentId: 99003,
      assignmentStatus: 'assigned',
      assignmentStatusLabel: '已分配',
      assignmentTargetType: 'STORE_SITE',
      assignmentTargetStoreCode: 'PRJ108065',
      assignmentTargetSiteCode: 'AE',
      assignmentBreakdownText: 'PRJ108065 AE 8',
      productLink: undefined
    }
  ];

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: workbench });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');

  const productLinkedImage = page.getByRole('img', { name: '已关联商品图片', exact: true });
  await expect(productLinkedImage).toHaveClass(/ali1688-product-line-image--product-linked/);
  await expect(productLinkedImage).toHaveCSS('border-color', 'rgb(34, 197, 94)');

  const assignedAndProductLinkedImage = page.getByRole('img', { name: '已分配且已关联商品图片', exact: true });
  await expect(assignedAndProductLinkedImage).toHaveClass(/ali1688-product-line-image--product-linked/);
  await expect(assignedAndProductLinkedImage).not.toHaveClass(/ali1688-product-line-image--store-linked/);
  await expect(assignedAndProductLinkedImage).toHaveCSS('border-color', 'rgb(34, 197, 94)');

  const assignedStoreOnlyImage = page.getByRole('img', { name: '仅分配店铺商品图片', exact: true });
  await expect(assignedStoreOnlyImage).toHaveClass(/ali1688-product-line-image--store-linked/);
  await expect(assignedStoreOnlyImage).not.toHaveClass(/ali1688-product-line-image--product-linked/);
  await expect(assignedStoreOnlyImage).toHaveCSS('border-color', 'rgb(37, 99, 235)');
});

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
      syncSummary: {
        ...deletableWorkbench.syncSummary,
        totalOrderCount: 0,
        totalItemCount: 0
      },
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

test('authorized operations manager can trigger manual refresh without authorization mutation', async ({ page }) => {
  let refreshCalled = false;
  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({
      json: {
        ...syncedWorkbench,
        roleCapabilities: {
          canAuthorize: false,
          canTriggerSync: true,
          canViewOrders: true
        }
      }
    });
  });
  await page.route('**/api/procurement/ali1688-orders/sync-tasks/manual-refresh', async (route) => {
    refreshCalled = true;
    await route.fulfill({ json: syncedWorkbench });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=operator-manager&grantAli1688HistoricalOrders=1');

  await expect(page.getByRole('button', { name: '授权 1688' })).not.toBeVisible();
  await page.getByRole('button', { name: '同步历史订单' }).click();
  await expect.poll(() => refreshCalled).toBe(true);
});
