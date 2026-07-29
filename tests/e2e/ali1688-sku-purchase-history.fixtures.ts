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

export const skuPurchaseHistory = {
  items: [
    {
      storeCode: 'PRJ108065',
      siteCode: 'AE',
      skuParent: 'CANMAN-AE-SKU-001',
      partnerSku: 'CANMAN-FLOWER-AE',
      pskuCode: 'N123456789A',
      productTitle: '仿真罂粟花束 6 支装 家居装饰',
      productTitleCn: '商品详情中文名：仿真花束套装',
      productImageUrl: 'https://f.nooncdn.com/p/pzsku/Z005EB950196204061C8AZ/45/_/1774429486/canman-flower',
      purchaseCount: 2,
      totalQuantity: '9',
      totalCost: '244.00',
      averageUnitPrice: '27.11',
      recentUnitPrice: '40.00',
      recentPurchaseTime: '2026-05-27 11:20:00',
      lowestUnitPrice: '11.00',
      highestUnitPrice: '40.00',
      amountBasis: 'paid_amount_allocated',
      dataQualityFlags: [],
      history: [
        {
          orderId: 93002,
          assignmentId: 99002,
          orderNo: 'ALI-ORDER-20260527-002',
          orderTime: '2026-05-27 11:20:00',
          supplierName: '义乌诚信通源头工厂',
          assignedQuantity: '5',
          allocatedCost: '200.00',
          unitPrice: '40.00',
          amountBasis: 'paid_amount_allocated',
          priceQuality: 'ready'
        },
        {
          orderId: 93001,
          assignmentId: 99001,
          orderNo: 'ALI-ORDER-20260525-001',
          orderTime: '2026-05-25 10:30:00',
          supplierName: '任丘市溪潼针织机加工厂',
          assignedQuantity: '4',
          allocatedCost: '44.00',
          unitPrice: '11.00',
          amountBasis: 'paid_amount_allocated',
          priceQuality: 'ok'
        }
      ]
    }
  ],
  unlinkedAssignedLineCount: 1,
  pagination: {
    page: 1,
    pageSize: 20,
    total: 1
  }
};

export const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/l4P0kAAAAABJRU5ErkJggg==',
  'base64'
);
