export const skuFreightHistoryResponse = {
  items: [
    {
      psku: 'PSKU-AE-001',
      targetSiteCode: 'SA',
      transportMode: 'AIR',
      destinationCode: 'RUH',
      standardForwarderId: 51001,
      forwarderName: '义特',
      standardFeeType: 'delivery',
      quantity: 100,
      chargeQuantity: 10,
      chargeUnit: 'kg',
      totalAmountCny: 432,
      unitAmountCny: 4.32,
      businessOccurredAt: '2026-06-05T10:00:00'
    }
  ]
}

export const forwarderFreightComparisonResponse = {
  items: [
    {
      standardForwarderId: 51001,
      forwarderCode: 'YITE',
      forwarderName: '义特',
      transportMode: 'AIR',
      destinationCode: 'RUH',
      targetSiteCode: 'SA',
      standardFeeType: 'delivery',
      chargeUnit: 'kg',
      totalAmountCny: 432,
      totalChargeQuantity: 10,
      totalQuantity: 100,
      amountPerUnit: 43.2,
      shipmentCount: 1
    }
  ]
}

export const storeOverview = {
  mode: 'local-db',
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
}
