export type OrderFinanceQuery = {
  storeCode: string
  siteCode: string
  dateFrom: string
  dateTo: string
  currency?: string
  search?: string
  partnerSkuList?: string[]
}

export type OrderFinanceSyncInput = {
  storeCode: string
  siteCode: string
}

export type OrderFinanceSyncResult = {
  taskId?: number | string | null
  status?: string | null
  sourceBatchId?: string | null
  importedCount?: number
  exceptionCount?: number
  message?: string | null
  dateFrom?: string | null
  dateTo?: string | null
  skipped?: boolean
}

export type OrderFinanceSummary = {
  currency?: string | null
  orderCount: number
  itemCount: number
  transactionRowCount?: number
  orderUpdateRowCount?: number
  netProceeds: number
  referralFee?: number
  fulfillmentLogisticsFee: number
  otherOrderFee?: number
  totalAmount: number
  avgTotalPerOrder?: number | null
  avgFulfillmentFeePerItem?: number | null
  feeRate?: number | null
}

export type OrderFinanceSkuSummaryRow = {
  partnerSku: string
  sku: string
  title: string
  imageUrl?: string | null
  currency: string
  orderCount: number
  itemCount: number
  transactionRowCount: number
  orderUpdateRowCount: number
  netProceeds: number
  referralFee: number
  fulfillmentLogisticsFee: number
  otherOrderFee: number
  totalAmount: number
  avgTotalPerOrder: number | null
  avgFulfillmentFeePerItem: number | null
  feeRate: number | null
  missingPartnerSku: boolean
}

export type OrderFinanceDataStatus = {
  latestSourceBatchId?: string | null
  sourceBatchId?: string | null
  latestTransactionDate?: string | null
  latestSyncStatus?: string | null
  lastSyncStatus?: string | null
  status?: string | null
  latestSyncMessage?: string | null
  message?: string | null
  missingPartnerSkuRowCount?: number
  importedCount?: number
  exceptionCount?: number
}

export type OrderFinanceSkuSummaryView = {
  summary?: OrderFinanceSummary | OrderFinanceSummary[] | null
  rows: OrderFinanceSkuSummaryRow[]
  dataStatus?: OrderFinanceDataStatus | null
}

export type OrderFinanceTransactionLine = {
  referenceNr?: string | null
  orderNr?: string | null
  itemNr?: string | null
  orderDate?: string | null
  transactionDate?: string | null
  title?: string | null
  sku?: string | null
  partnerSku?: string | null
  transactionType: string
  currency: string
  netProceeds: number
  referralFee: number
  fulfillmentLogisticsFee: number
  shippingCredits?: number
  otherOrderFee: number
  orderSubsidies?: number
  nonOrderFees?: number
  nonOrderSubsidies?: number
  others?: number
  totalAmount: number
}

export type OrderFinanceOrderGroup = {
  orderNr: string
  currency: string
  orderDate?: string | null
  transactionDateFrom?: string | null
  transactionDateTo?: string | null
  netProceeds: number
  referralFee: number
  fulfillmentLogisticsFee: number
  otherOrderFee: number
  totalAmount: number
  lines: OrderFinanceTransactionLine[]
}
