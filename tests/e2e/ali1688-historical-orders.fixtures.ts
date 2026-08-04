import type { Locator, Page } from '@playwright/test';

export const storeSyncOverview = {
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

export const noAuthorizationWorkbench = {
  ready: true,
  mode: 'local-db',
  authorization: {
    status: 'not_authorized',
    message: '老板授权后系统会每日自动拉取 1688 历史订单'
  },
  roleCapabilities: {
    canAuthorize: true,
    canViewOrders: true
  },
  orders: [],
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0
  }
};

export const authorizedWorkbench = {
  ...noAuthorizationWorkbench,
  authorization: {
    status: 'authorized',
    authorizationId: 91001,
    accountLabel: '1688 开发授权账号',
    scopeSummary: '读取 1688 历史订单，不会付款或创建订单。'
  },
  roleCapabilities: {
    canAuthorize: true,
    canViewOrders: true
  }
};

export const syncedWorkbench = {
  ...authorizedWorkbench,
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

export const missingFieldWorkbench = {
  ...syncedWorkbench,
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

export const missingFieldDetail = {
  ...missingFieldWorkbench.orders[0],
  sensitiveFields: {
    redactionLevel: 'hidden',
    receiverPhone: '已隐藏',
    receiverAddress: '已隐藏',
    buyerRemark: '已隐藏',
    supplierContact: '已隐藏'
  }
};

export async function mockAliHistoricalOrderDefaults(page: Page) {
  await page.route('**/api/store-sync/overview**', async (route) => {
    await route.fulfill({ json: storeSyncOverview });
  });
  await page.route('**/api/procurement/ali1688-orders/items/*/assignments', async (route) => {
    await route.fulfill({ json: [] });
  });
}

export function assignmentTargetOptions(dialog: Locator) {
  return dialog.locator('.ali1688-assignment-target-options');
}

export async function clickAssignmentTarget(dialog: Locator, label: string) {
  await assignmentTargetOptions(dialog).getByRole('button', { name: label }).click();
}
