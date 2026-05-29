export type Ali1688HistoricalOrderAuthorization = {
  authorizationId?: number
  status: 'not_authorized' | 'authorized' | 'expired' | 'revoked' | string
  message?: string
  providerCode?: string
  providerAccountId?: string
  accountLabel?: string
  scopeSummary?: string
  expiresAt?: string
}

export type Ali1688HistoricalOrderRoleCapabilities = {
  canAuthorize: boolean
  canTriggerSync: boolean
  canViewOrders: boolean
}

export type Ali1688HistoricalOrderSyncSummary = {
  latestTaskStatus?: string
  totalOrderCount: number
  totalItemCount: number
  processedCount?: number
  importedCount?: number
  failedCount?: number
  progressPercent?: number
  failureCode?: string
  failureMessage?: string
  checkpointJson?: string
}

export type Ali1688HistoricalOrderPagination = {
  page: number
  pageSize: number
  total: number
}

export type Ali1688HistoricalOrderQuery = {
  placedTimeFrom?: string
  placedTimeTo?: string
  orderStatus?: string
  supplierKeyword?: string
  keyword?: string
  storeCode?: string
  siteCode?: string
  assignmentState?: string
  assignmentTargetStoreCode?: string
  assignmentTargetSiteCode?: string
  page?: number
  pageSize?: number
}

export type Ali1688SkuPurchaseHistoryQuery = {
  storeCode?: string
  siteCode?: string
  keyword?: string
  linkStatus?: 'linked' | 'unlinked' | string
  purchaseTimeFrom?: string
  purchaseTimeTo?: string
  page?: number
  pageSize?: number
}

export type Ali1688HistoricalOrderStoreScope = {
  status?: 'owner_scope' | 'bound' | 'unbound' | 'no_authorization' | string
  storeCode?: string
  siteCode?: string
  message?: string
  matchedAuthorizationIds?: string[]
}

export type Ali1688HistoricalOrderRow = {
  id?: string
  orderNo?: string
  orderTime?: string
  paidAt?: string
  supplierName?: string
  buyerCompanyName?: string
  buyerMemberName?: string
  sellerMemberName?: string
  goodsTotalText?: string
  freightText?: string
  adjustmentText?: string
  paidAmountText?: string
  amountText?: string
  orderStatus?: string
  logisticsStatus?: string
  shipperName?: string
  originalUrl?: string
  receiverName?: string
  receiverPostalCode?: string
  receiverTelephone?: string
  receiverMobile?: string
  initiatorLoginName?: string
  sourceBatchNo?: string
  downstreamOrderNo?: string
  missingFields?: string[]
  items?: Ali1688HistoricalOrderItem[]
}

export type Ali1688HistoricalOrderItem = {
  id?: string
  offerId?: string
  skuId?: string
  title?: string
  skuText?: string
  modelText?: string
  productCode?: string
  singleProductCode?: string
  quantity?: number | null
  originalQuantity?: number | null
  assignedQuantity?: number | null
  remainingQuantity?: number | null
  assignmentStatus?: 'unassigned' | 'partially_assigned' | 'assigned' | 'quantity_missing' | string
  assignmentStatusLabel?: string
  assignmentBreakdownText?: string
  assignmentId?: number
  assignmentTargetType?: 'STORE_SITE' | 'CONSUMABLE' | string
  assignmentTargetStoreCode?: string
  assignmentTargetSiteCode?: string
  productLink?: Ali1688HistoricalOrderProductLink
  unit?: string
  unitPriceText?: string
  amountText?: string
  imageUrl?: string
  logisticsCompany?: string
  trackingNo?: string
  missingFields?: string[]
}

export type Ali1688HistoricalOrderProductLink = {
  status?: 'linked' | string
  skuParent?: string
  partnerSku?: string
  pskuCode?: string
  productTitle?: string
  productTitleCn?: string
  productImageUrl?: string
  displayText?: string
}

export type Ali1688HistoricalOrderSensitiveFields = {
  redactionLevel?: 'hidden' | 'masked' | string
  receiverPhone?: string
  receiverAddress?: string
  buyerRemark?: string
  supplierContact?: string
}

export type Ali1688HistoricalOrderDetail = Ali1688HistoricalOrderRow & {
  sensitiveFields?: Ali1688HistoricalOrderSensitiveFields
}

export type Ali1688HistoricalOrderAssignmentLine = {
  itemId: string
  quantity?: number
}

export type Ali1688HistoricalOrderAssignmentRequest = {
  targetType?: 'STORE_SITE' | 'CONSUMABLE' | string
  targetStoreCode?: string
  targetSiteCode?: string
  lines: Ali1688HistoricalOrderAssignmentLine[]
}

export type Ali1688HistoricalOrderAssignmentResult = {
  status?: string
  assignedLineCount: number
  assignedQuantity: number
}

export type Ali1688HistoricalOrderAssignmentRecord = {
  assignmentId?: number
  itemId?: string
  targetType?: 'STORE_SITE' | 'CONSUMABLE' | string
  targetStoreCode?: string
  targetSiteCode?: string
  assignedQuantity?: number
  status?: 'active' | 'revoked' | string
  createdBy?: number
  updatedBy?: number
  createdAt?: string
  updatedAt?: string
}

export type Ali1688HistoricalOrderAssignmentAdjustRequest = {
  quantity: number
}

export type Ali1688HistoricalOrderDeleteRequest = {
  storeCode?: string
  siteCode?: string
  reason: string
}

export type Ali1688HistoricalOrderDeleteResult = {
  orderId: number
  status: 'deleted' | string
  reason?: string
}

export type Ali1688HistoricalOrderProductLinkRequest = {
  assignmentId: number
  skuParent: string
  partnerSku?: string
  pskuCode?: string
  productTitle?: string
  productImageUrl?: string
}

export type Ali1688HistoricalOrderProductLinkResult = Ali1688HistoricalOrderProductLink & {
  assignmentId?: number
}

export type Ali1688HistoricalOrderProductLinkCandidate = {
  storeCode?: string
  siteCode?: string
  skuParent: string
  partnerSku?: string
  pskuCode?: string
  offerCode?: string
  productTitle?: string
  productImageUrl?: string
  linkStatus?: 'linked' | 'unlinked' | string
  linkedAssignmentCount?: number
}

export type Ali1688HistoricalOrderProductLinkAudit = {
  auditId?: number
  assignmentId?: number
  actionType?: 'link' | 'relink' | 'unlink' | string
  oldLinkId?: number
  newLinkId?: number
  oldSkuParent?: string
  newSkuParent?: string
  createdBy?: number
  createdAt?: string
}

export type Ali1688HistoricalOrderWorkbench = {
  ready: boolean
  mode?: string
  message?: string
  authorization: Ali1688HistoricalOrderAuthorization
  storeScope?: Ali1688HistoricalOrderStoreScope
  roleCapabilities: Ali1688HistoricalOrderRoleCapabilities
  syncSummary: Ali1688HistoricalOrderSyncSummary
  orders: Ali1688HistoricalOrderRow[]
  pagination: Ali1688HistoricalOrderPagination
}

export type Ali1688SkuPurchaseHistoryRecord = {
  orderId?: number
  itemId?: number
  assignmentId?: number
  productLinkId?: number
  orderNo?: string
  orderTime?: string
  supplierName?: string
  assignedQuantity?: string
  allocatedCost?: string
  unitPrice?: string
  amountBasis?: string
  priceQuality?: 'ok' | 'missing_price_basis' | string
}

export type Ali1688SkuPurchaseHistoryItem = {
  storeCode?: string
  siteCode?: string
  linkStatus?: 'linked' | 'unlinked' | string
  assignmentId?: number
  orderId?: number
  itemId?: number
  orderNo?: string
  orderTime?: string
  supplierName?: string
  skuParent?: string
  partnerSku?: string
  pskuCode?: string
  productTitle?: string
  productTitleCn?: string
  productImageUrl?: string
  sourceOfferId?: string
  sourceSkuId?: string
  sourceProductCode?: string
  sourceSingleProductCode?: string
  purchaseCount?: number
  totalQuantity?: string
  totalCost?: string
  averageUnitPrice?: string
  recentUnitPrice?: string
  recentPurchaseTime?: string
  lowestUnitPrice?: string
  highestUnitPrice?: string
  amountBasis?: string
  dataQualityFlags?: string[]
  history?: Ali1688SkuPurchaseHistoryRecord[]
}

export type Ali1688SkuPurchaseHistoryView = {
  items: Ali1688SkuPurchaseHistoryItem[]
  pagination: Ali1688HistoricalOrderPagination
  unlinkedAssignedLineCount?: number
}

export type Ali1688ExcelImportSource = {
  authorizationId?: number
  providerCode?: string
  accountLabel?: string
  storeCode?: string
  siteCode?: string
  status?: string
}

export type Ali1688ExcelImportSourceCreateRequest = {
  accountLabel: string
  storeCode?: string
  siteCode?: string
}

export type Ali1688ExcelImportSummary = {
  totalDataRowCount: number
  orderHeaderRowCount: number
  productLineCount: number
  logisticsLineCount: number
  validRowCount: number
  duplicateCandidateCount: number
}

export type Ali1688ExcelImportHeaderValidation = {
  valid: boolean
  expectedHeaderCount: number
  actualHeaderCount: number
  message?: string
  missingHeaders?: string[]
  mismatchedHeaders?: Array<{
    columnIndex: number
    expected?: string
    actual?: string
  }>
}

export type Ali1688ExcelImportRowMessage = {
  rowNumber: number
  fieldName?: string
  code?: string
  message?: string
}

export type Ali1688ExcelImportPreview = {
  batchId: number
  status: 'preview_ready' | 'validation_failed' | string
  fileName?: string
  fileSize?: number
  fileHash?: string
  source?: Ali1688ExcelImportSource
  storeCode?: string
  siteCode?: string
  headerValidation?: Ali1688ExcelImportHeaderValidation
  summary: Ali1688ExcelImportSummary
  rowErrors?: Ali1688ExcelImportRowMessage[]
  rowWarnings?: Ali1688ExcelImportRowMessage[]
}

export type Ali1688ExcelImportPreviewRequest = {
  authorizationId: number
  storeCode?: string
  siteCode?: string
  file: File
}

export type Ali1688ExcelImportCommitCounts = {
  insertedOrderCount: number
  updatedOrderCount: number
  skippedOrderCount: number
  insertedItemCount: number
  updatedItemCount: number
  skippedItemCount: number
  insertedLogisticsCount: number
  updatedLogisticsCount: number
  skippedLogisticsCount: number
}

export type Ali1688ExcelImportCommitResult = {
  batchId: number
  status: 'committed' | string
  counts: Ali1688ExcelImportCommitCounts
}

export type Ali1688ExcelImportBatch = {
  batchId: number
  authorizationId?: number
  providerCode?: string
  accountLabel?: string
  storeCode?: string
  siteCode?: string
  fileName?: string
  fileSize?: number
  fileHash?: string
  status?: string
  headerVersion?: string
  orderHeaderRowCount?: number
  productLineCount?: number
  logisticsLineCount?: number
  validRowCount?: number
  duplicateCandidateCount?: number
  errorCount?: number
  warningCount?: number
  failureCode?: string
  failureMessage?: string
  createdBy?: number
  createdAt?: string
  updatedAt?: string
}

export type Ali1688ExcelImportBatchDetail = Ali1688ExcelImportBatch & {
  errorSummaryJson?: string
}
