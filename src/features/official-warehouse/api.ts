import type { ApiProblem } from '../../shared/api'
import type { OfficialWarehouseAppointment } from './officialWarehouseAppointmentTypes'

export * from './officialWarehouseApiClient'
export type * from './officialWarehouseAppointmentTypes'

export type OfficialWarehouseApiProblem = ApiProblem

export type OfficialWarehouseProductCandidate = {
  productVariantId: string
  productSiteOfferId?: string
  storeCode: string
  storeName?: string
  siteCode: string
  skuParent?: string
  partnerSku?: string
  childSku?: string
  pskuCode: string
  noonSku: string
  title?: string
  titleEn?: string
  brand?: string
  imageUrl?: string
  productLengthCm?: number
  productWidthCm?: number
  productHeightCm?: number
  productWeightG?: number
  cubicFeet?: number
  cartonLengthCm?: number
  cartonWidthCm?: number
  cartonHeightCm?: number
  cartonWeightKg?: number
  cartonQuantity?: number
  storageTypeCode: string
  logisticsProfileStatus?: string
  batteryElectricType?: string
  magneticType?: string
  liquidType?: string
  powderType?: string
  woodenMaterialType?: string
  bladeWeaponType?: string
  manualConfirmRequired?: boolean
  batchAvailableQuantity?: number
  missingTags?: string[]
}

export type OfficialWarehouseAsnLine = {
  id: string
  productVariantId: string
  productSiteOfferId?: string
  skuParent?: string
  partnerSku?: string
  childSku?: string
  pskuCode: string
  noonSku: string
  title?: string
  titleEn?: string
  brand?: string
  imageUrl?: string
  quantity: number
  productLengthCm?: number
  productWidthCm?: number
  productHeightCm?: number
  productWeightG?: number
  cubicFeet?: number
  storageTypeCode: string
  noonPartnerAsnLineId?: string
  noonClusterCode?: string
  noonAsnStatus?: string
  noonCountryCode?: string
  labeled?: boolean
  replToolAsn?: boolean
  lineStatus: string
  errorMessage?: string
  shippingBatchLinks?: OfficialWarehouseAsnShippingBatchLink[]
}

export type OfficialWarehouseShippingBatchCandidate = {
  id: string
  sourceKind?: string
  batchNo: string
  trackingNo?: string
  externalShipmentNo?: string
  forwarderName?: string
  transportMode?: string
  status: string
  latestNodeStatus?: string
  selectedOptionId?: string
  totalQuantity?: number
  storeSiteQuantity?: number
  linkedQuantity?: number
  remainingQuantity?: number
  scheduledAppointmentQuantity?: number
  alreadyAppointed?: boolean
  batchUsedByAsn?: boolean
  batchUsageLabel?: string
  skuCount?: number
  purchaseOrderCount?: number
  updatedAt?: string
}

export type OfficialWarehouseAsnShippingBatchLink = {
  id: string
  asnId?: string
  asnLineId?: string
  shippingBatchId?: string
  shippingBatchNo?: string
  shippingBatchSourceId?: string
  inTransitBatchId?: string
  batchReferenceNo?: string
  trackingNo?: string
  externalShipmentNo?: string
  forwarderName?: string
  transportMode?: string
  latestNodeStatus?: string
  inTransitGoodsLineId?: string
  fulfillmentBalanceId?: string
  purchaseOrderId?: string
  purchaseOrderNo?: string
  purchaseOrderItemId?: string
  purchaseOrderItemSiteId?: string
  productMasterId?: string
  productVariantId?: string
  partnerSku?: string
  pskuCode?: string
  quantity?: number
  relationStatus?: string
  relationBasis?: string
  createdAt?: string
}

export type OfficialWarehouseRoutingWarehouse = {
  partnerCode?: string
  code?: string
  lat?: number
  lng?: number
}

export type OfficialWarehouseAsnInboundSummary = {
  reportConnected: boolean
  asnQuantity: number
  expectedQuantity: number
  receivedQuantity: number
  qcFailedQuantity: number
  unidentifiedQuantity: number
  shortQuantity: number
  overQuantity: number
  receiptLineCount: number
  exceptionLineCount: number
  unmatchedLineCount: number
  latestImportedAt?: string
}

export type OfficialWarehouseAsnInboundLine = {
  asnLineId?: string
  productVariantId?: string
  productSiteOfferId?: string
  partnerSku?: string
  pskuCode?: string
  noonSku?: string
  title?: string
  imageUrl?: string
  asnQuantity: number
  expectedQuantity: number
  receivedQuantity: number
  qcFailedQuantity: number
  unidentifiedQuantity: number
  shortQuantity: number
  overQuantity: number
  receiptLineCount: number
  reportOnly: boolean
  inboundStatus?: string
  matchStatus?: string
  qcFailedReason?: string
  partnerWarehouse?: string
  noonWarehouse?: string
  asnCompletedAt?: string
  latestImportedAt?: string
}

export type OfficialWarehouseAsnInboundDetail = {
  asnId: string
  localAsnNo?: string
  noonAsnNr?: string
  storeCode?: string
  siteCode?: string
  sourceType?: string
  summary: OfficialWarehouseAsnInboundSummary
  lines: OfficialWarehouseAsnInboundLine[]
}

export type OfficialWarehouseAsn = {
  id: string
  inboundNo: string
  localAsnNo: string
  sourceType?: string
  storeCode: string
  storeName?: string
  siteCode: string
  projectCode?: string
  partnerId?: string
  status: string
  asnNo?: string
  noonAsnNr?: string
  noonAsnStatus?: string
  noonUser?: string
  noonPartnerAsnId?: string
  productCount: number
  totalQuantity: number
  selectedWarehouseCode?: string
  selectedWarehousePartnerCode?: string
  selectedWarehouseName?: string
  routingIsTransfer?: boolean
  errorStage?: string
  failureType?: string
  errorMessage?: string
  submittedAt?: string
  finishedAt?: string
  createdAt?: string
  updatedAt?: string
  routingWarehouses?: OfficialWarehouseRoutingWarehouse[]
  lines?: OfficialWarehouseAsnLine[]
  shippingBatchLinks?: OfficialWarehouseAsnShippingBatchLink[]
  inboundSummary?: OfficialWarehouseAsnInboundSummary
  appointment?: OfficialWarehouseAppointment
}

export type CreateOfficialWarehouseAsnPayload = {
  storeCode: string
  siteCode: string
  sourceType?: string
  shippingBatchIds?: string[]
  partialBatchConfirmed?: boolean
  lines: Array<{
    productVariantId: number
    productSiteOfferId?: number
    partnerSku?: string
    quantity: number
  }>
}

export type OfficialWarehouseMissingBatchItem = {
  title?: string
  partnerSku?: string
  noonSku?: string
  missingQuantity: number
}

export type OfficialWarehouseMissingBatch = {
  shippingBatchId?: string
  batchNo?: string
  items: OfficialWarehouseMissingBatchItem[]
}

export type OfficialWarehouseAsnValidation = {
  valid: boolean
  completeBatchSelection: boolean
  missingBatches: OfficialWarehouseMissingBatch[]
}

export type OfficialWarehouseAsnListSyncResult = {
  fetched: number
  created: number
  updated: number
  scheduled: number
  corrected: number
  failed: number
  skipped: number
  pages: number
}
