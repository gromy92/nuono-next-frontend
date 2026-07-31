export type OfficialWarehouseBatchProductIssue = {
  partnerSku?: string
  title?: string
  quantity: number
  reasons: string[]
}

export type OfficialWarehouseStoreProductSummary = {
  storeCode: string
  storeName?: string
  siteCode: string
  totalQuantity: number
  totalSkuCount: number
  bookableQuantity?: number
  bookableSkuCount?: number
  blockedQuantity?: number
  blockedSkuCount?: number
  missingDimensionQuantity?: number
  missingDimensionSkuCount?: number
  blockedItems: OfficialWarehouseBatchProductIssue[]
  missingDimensionItems: OfficialWarehouseBatchProductIssue[]
}

export type OfficialWarehouseBatchProductSummary = {
  totalQuantity: number
  totalSkuCount: number
  totalLineCount: number
  currentStore: OfficialWarehouseStoreProductSummary
  otherStores: OfficialWarehouseStoreProductSummary[]
  unassignedQuantity: number
  unassignedSkuCount: number
  attributionWarning: boolean
}
