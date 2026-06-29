export const productImageDataUri =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2244%22 height=%2244%22%3E%3Crect width=%2244%22 height=%2244%22 fill=%22%230ea5e9%22/%3E%3C/svg%3E'

export const noonImageWithoutExtension =
  'https://f.nooncdn.com/p/pzsku/Z6102D485086CCAA7AE65Z/45/_/1775642294/c16639e3-34e1-42c7-af64-9f89f8a8cb90'

export const contractResponse = {
  transportModes: [
    { code: 'SEA', label: '海运' },
    { code: 'AIR', label: '空运' }
  ],
  destinations: [
    { code: 'RUH', label: '利雅得' },
    { code: 'DB', label: '迪拜' }
  ],
  batchStatuses: [
    { code: 'draft', label: '草稿' },
    { code: 'in_transit', label: '运输中' },
    { code: 'exception', label: '异常' },
    { code: 'completed', label: '已完成' }
  ],
  nodeStatuses: [
    { code: 'created', label: '已登记' },
    { code: 'in_transit', label: '运输中' },
    { code: 'customs_clearance', label: '清关中' },
    { code: 'exception', label: '异常' },
    { code: 'warehouse_received', label: '已入仓' }
  ],
  qualityStatuses: [
    { code: 'forwarder_unmatched', label: '货代未归一' },
    { code: 'forwarder_matched', label: '货代已归一' }
  ],
  purchaseOrderFields: [],
  feeFields: []
}

export const listResponse = {
  mode: 'local-db',
  ready: true,
  totalCount: 3,
  page: 1,
  pageSize: 20,
  items: [
    {
      batchId: 53001,
      createdAt: '2026-06-10T11:20:00',
      standardForwarderId: 51002,
      standardForwarderName: '启客',
      rawForwarderName: '启客',
      forwarderQualityStatus: 'forwarder_matched',
      transportMode: 'SEA',
      batchStatus: 'draft',
      targetStoreCode: 'DB',
      targetSiteCode: null,
      targetWarehouseName: 'FBN-DXB',
      etaDate: '2026-06-08',
      trackingNo: 'TRK-001',
      batchReferenceNo: 'BATCH-001',
      missingFields: ['transportMode', 'targetStoreCode', 'targetWarehouseName'],
      skuCount: null,
      shippedQuantityTotal: null,
      receivedQuantityTotal: null,
      remainingQuantityTotal: null
    },
    {
      batchId: 53002,
      createdAt: '2026-06-12T09:00:00',
      standardForwarderId: 51001,
      standardForwarderName: '义特',
      forwarderQualityStatus: 'forwarder_matched',
      transportMode: 'AIR',
      batchStatus: 'in_transit',
      targetStoreCode: 'RUH',
      targetSiteCode: null,
      targetWarehouseName: 'FBN-RUH',
      etaDate: '2026-06-03',
      domesticReceivedAt: '2026-06-10T08:00:00',
      containerNo: 'CONT-002',
      batchReferenceNo: 'BATCH-002',
      missingFields: [],
      boxCount: 2,
      skuCount: 3,
      shippedQuantityTotal: 160,
      receivedQuantityTotal: 40,
      remainingQuantityTotal: 120,
      cartonCountTotal: 8,
      totalWeightKg: null,
      totalVolumeCbm: null,
      latestNodeStatus: 'customs_clearance',
      latestNodeHappenedAt: '2026-06-01T10:30:00',
      latestNodeDescription: '清关资料已提交'
    },
    {
      batchId: 53004,
      createdAt: '2026-06-08T15:00:00',
      rawForwarderName: '历史货代A',
      normalizedRawForwarderName: '历史货代a',
      forwarderQualityStatus: 'forwarder_unmatched',
      transportMode: 'SEA',
      batchStatus: 'draft',
      targetStoreCode: 'DB',
      targetSiteCode: null,
      targetWarehouseName: 'FBN-DXB',
      etaDate: '2026-06-12',
      batchReferenceNo: 'BATCH-UNMATCHED',
      missingFields: ['standardForwarderId'],
      boxCount: 1,
      skuCount: 1,
      shippedQuantityTotal: 10,
      receivedQuantityTotal: 0,
      remainingQuantityTotal: 10
    }
  ]
}

export const nodeResponse = {
  mode: 'local-db',
  ready: true,
  items: [
    {
      nodeId: 55001,
      batchId: 53002,
      nodeStatus: 'customs_clearance',
      nodeHappenedAt: '2026-06-01T10:30:00',
      description: '清关资料已提交',
      operatorName: '运营A'
    },
    {
      nodeId: 55000,
      batchId: 53002,
      nodeStatus: 'in_transit',
      nodeHappenedAt: '2026-05-30T09:00:00',
      description: '海上运输',
      operatorName: '运营B'
    }
  ]
}

export const lineResponse = {
  mode: 'local-db',
  ready: true,
  items: [
    {
      lineId: 54001,
      batchId: 53002,
      packageId: 58001,
      boxNo: 'XGGEUAE04029-1',
      sku: 'SKU-AE-001',
      msku: 'MSKU-AE-001',
      psku: 'PSKU-AE-001',
      productName: '折叠手机壳',
      matchedProductId: 62001,
      productSkuParent: 'PARENT-AE-001',
      productTitle: 'Noon Folding Phone Case',
      productImageUrl: noonImageWithoutExtension,
      storeCode: 'STR245027-NSA',
      siteCode: 'SA',
      shippedQuantity: 100,
      receivedQuantity: 40,
      remainingQuantity: 60,
      cartonCount: 5,
      unitsPerCarton: 20,
      cartonWeightKg: null,
      cartonVolumeCbm: null
    },
    {
      lineId: 54009,
      batchId: 53002,
      packageId: 58001,
      boxNo: 'XGGEUAE04029-1',
      sku: 'SKU-AE-009',
      msku: 'MSKU-AE-009',
      psku: 'PSKU-AE-009',
      productName: '折叠手机膜',
      storeCode: 'STR245027-NSA',
      siteCode: 'SA',
      shippedQuantity: 60,
      receivedQuantity: 0,
      remainingQuantity: 60,
      cartonCount: 3,
      unitsPerCarton: 20,
      cartonWeightKg: null,
      cartonVolumeCbm: null
    }
  ]
}

export const batchFreightCostResponse = {
  bills: [
    {
      id: 59001,
      batchId: 53002,
      standardForwarderId: 51001,
      forwarderCode: 'YITE',
      forwarderName: '义特',
      transportMode: 'AIR',
      destinationCode: 'RUH',
      targetSiteCode: 'SA',
      sourceSystem: 'YITONG',
      billNo: 'AR25012055917',
      billStatus: 'posted',
      currencyCode: 'CNY',
      cnyTotalAmount: 691.47,
      freightAmountCny: 620.32,
      customsAmountCny: 71.15,
      businessOccurredAt: '2026-06-05T10:00:00'
    }
  ],
  components: [
    {
      id: 60001,
      actualBillId: 59001,
      batchId: 53002,
      packageId: 58001,
      boxNo: 'XGGEUAE04029-1',
      externalBoxNo: 'X25011446217',
      psku: 'PSKU-AE-001',
      rawFeeName: '尾程派送',
      standardFeeType: 'delivery',
      chargeQuantity: 10,
      chargeUnit: 'kg',
      cnyAmount: 432,
      quantity: 100,
      chargeableWeightKg: 10
    }
  ]
}
