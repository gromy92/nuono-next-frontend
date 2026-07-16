import { ApiError, apiFetch, normalizeError, parseApiResponse, type ApiProblem } from '../../shared/api'

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

export type OfficialWarehouseAppointment = {
  id: string
  asnId?: string
  localAsnNo?: string
  noonAsnNr?: string
  storeCode?: string
  siteCode?: string
  status: string
  warehouseFrom: string
  warehouseToPartnerCode: string
  warehouseToCode?: string
  apStartDate: string
  apEndDate: string
  apTimeRange?: string
  availableToday?: boolean
  appointmentDate?: string
  appointmentSlotId?: number
  appointmentTime?: string
  gate?: string
  docks?: string
  attemptCount?: number
  lastAttemptAt?: string
  nextAttemptAt?: string
  apSuccessTime?: string
  failureType?: string
  errorStage?: string
  errorMessage?: string
  createdAt?: string
  updatedAt?: string
}

export type OfficialWarehouseAppointmentAvailability = {
  date?: string
  slotId?: number
  time?: string
  warehouseFrom?: string
  warehouseFromCode?: string
  label?: string
}

export type NoonHttpCallLog = {
  id: string
  occurredAt?: string
  sourceModule?: string
  operation?: string
  storeCode?: string
  siteCode?: string
  projectCode?: string
  partnerId?: string
  businessType?: string
  businessId?: string
  businessRef?: string
  httpMethod?: string
  host?: string
  path?: string
  responseStatusCode?: number
  elapsedMs?: number
  status?: string
  failureType?: string
  errorMessage?: string
  requestSummaryJson?: string
  responseSummaryJson?: string
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

export type UpsertOfficialWarehouseAppointmentPayload = {
  warehouseToPartnerCode: string
  warehouseToCode?: string
  apStartDate: string
  apEndDate: string
  apTimeRange?: string
  availableToday?: boolean
  appointmentDate?: string
  appointmentSlotId?: number
  appointmentTime?: string
}

export type CorrectOfficialWarehouseAppointmentPayload = {
  status: string
  appointmentDate?: string
  appointmentSlotId?: number
  appointmentTime?: string
  failureType?: string
  errorStage?: string
  errorMessage?: string
}

type AsnFilters = {
  storeCode?: string
  siteCode?: string
  keyword?: string
}

type AppointmentFilters = {
  storeCode?: string
  siteCode?: string
  status?: string
  keyword?: string
}

type CandidateFilters = {
  storeCode: string
  siteCode: string
  keyword?: string
  shippingBatchIds?: string[]
  partnerSkus?: string[]
}

export async function loadOfficialWarehouseAsns(filters: AsnFilters = {}) {
  const params = new URLSearchParams()
  appendParam(params, 'storeCode', filters.storeCode)
  appendParam(params, 'siteCode', filters.siteCode)
  appendParam(params, 'keyword', filters.keyword)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  const response = await apiFetch(`/api/warehouse/official-warehouse/asns${suffix}`)
  return parseApiResponse<OfficialWarehouseAsn[]>(response, '读取 Noon 官方仓 ASN 失败')
}

export async function loadOfficialWarehouseAsn(asnId: string) {
  const response = await apiFetch(`/api/warehouse/official-warehouse/asns/${encodeURIComponent(asnId)}`)
  return parseApiResponse<OfficialWarehouseAsn>(response, '读取 Noon 官方仓 ASN 详情失败')
}

export async function loadOfficialWarehouseAsnInboundDetail(asnId: string) {
  const response = await apiFetch(
    `/api/warehouse/official-warehouse/asns/${encodeURIComponent(asnId)}/inbound-detail`
  )
  return parseApiResponse<OfficialWarehouseAsnInboundDetail>(response, '读取 ASN 商品入仓详情失败')
}

export async function syncOfficialWarehouseNoonAsnList(filters: { storeCode: string; siteCode: string }) {
  const params = new URLSearchParams()
  appendParam(params, 'storeCode', filters.storeCode)
  appendParam(params, 'siteCode', filters.siteCode)
  const response = await apiFetch(`/api/warehouse/official-warehouse/asns/sync-noon-list?${params.toString()}`, {
    method: 'POST'
  })
  return parseApiResponse<OfficialWarehouseAsnListSyncResult>(response, '同步 Noon ASN 列表失败')
}

export async function loadOfficialWarehouseCandidates(filters: CandidateFilters) {
  const params = new URLSearchParams()
  appendParam(params, 'storeCode', filters.storeCode)
  appendParam(params, 'siteCode', filters.siteCode)
  appendParam(params, 'keyword', filters.keyword)
  filters.shippingBatchIds?.forEach((id) => appendParam(params, 'shippingBatchIds', id))
  filters.partnerSkus?.forEach((psku) => appendParam(params, 'partnerSkus', psku))
  const response = await apiFetch(`/api/warehouse/official-warehouse/product-candidates?${params.toString()}`)
  return parseApiResponse<OfficialWarehouseProductCandidate[]>(response, '读取可创建 ASN 商品失败')
}

export async function loadOfficialWarehouseShippingBatches(filters: CandidateFilters) {
  const params = new URLSearchParams()
  appendParam(params, 'storeCode', filters.storeCode)
  appendParam(params, 'siteCode', filters.siteCode)
  appendParam(params, 'keyword', filters.keyword)
  const response = await apiFetch(`/api/warehouse/official-warehouse/shipping-batches?${params.toString()}`)
  return parseApiResponse<OfficialWarehouseShippingBatchCandidate[]>(response, '读取物流批次失败')
}

export async function createOfficialWarehouseAsn(payload: CreateOfficialWarehouseAsnPayload) {
  const response = await apiFetch('/api/warehouse/official-warehouse/asns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return parseApiResponse<OfficialWarehouseAsn>(response, '创建 Noon 官方仓 ASN 失败')
}

export async function validateOfficialWarehouseAsn(payload: CreateOfficialWarehouseAsnPayload) {
  const response = await apiFetch('/api/warehouse/official-warehouse/asns/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return parseApiResponse<OfficialWarehouseAsnValidation>(response, '校验 Noon 官方仓 ASN 商品失败')
}

export async function loadOfficialWarehouseNoonCalls(asnId: string) {
  const response = await apiFetch(
    `/api/warehouse/official-warehouse/asns/${encodeURIComponent(asnId)}/noon-calls`
  )
  return parseApiResponse<NoonHttpCallLog[]>(response, '读取 Noon 调用日志失败')
}

export async function loadOfficialWarehouseAppointments(filters: AppointmentFilters = {}) {
  const params = new URLSearchParams()
  appendParam(params, 'storeCode', filters.storeCode)
  appendParam(params, 'siteCode', filters.siteCode)
  appendParam(params, 'status', filters.status)
  appendParam(params, 'keyword', filters.keyword)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  const response = await apiFetch(`/api/warehouse/official-warehouse/appointments${suffix}`)
  return parseApiResponse<OfficialWarehouseAppointment[]>(response, '读取约仓历史失败')
}

export async function queryOfficialWarehouseAppointmentAvailability(
  asnId: string,
  payload: UpsertOfficialWarehouseAppointmentPayload
) {
  const response = await apiFetch(
    `/api/warehouse/official-warehouse/asns/${encodeURIComponent(asnId)}/appointment/availability`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  )
  return parseApiResponse<OfficialWarehouseAppointmentAvailability[]>(response, '查询约仓仓位失败')
}

export async function upsertOfficialWarehouseAppointment(
  asnId: string,
  payload: UpsertOfficialWarehouseAppointmentPayload
) {
  const response = await apiFetch(
    `/api/warehouse/official-warehouse/asns/${encodeURIComponent(asnId)}/appointment`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  )
  return parseApiResponse<OfficialWarehouseAppointment>(response, '提交自动约仓失败')
}

export async function submitManualOfficialWarehouseAppointment(
  asnId: string,
  payload: UpsertOfficialWarehouseAppointmentPayload
) {
  const response = await apiFetch(
    `/api/warehouse/official-warehouse/asns/${encodeURIComponent(asnId)}/appointment/manual`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  )
  return parseApiResponse<OfficialWarehouseAppointment>(response, '手动约仓失败')
}

export async function runOfficialWarehouseAppointmentOnce(appointmentId: string) {
  const response = await apiFetch(
    `/api/warehouse/official-warehouse/appointments/${encodeURIComponent(appointmentId)}/run-once`,
    { method: 'POST' }
  )
  return parseApiResponse<OfficialWarehouseAppointment>(response, '执行自动约仓失败')
}

export async function cancelOfficialWarehouseAppointment(appointmentId: string) {
  const response = await apiFetch(
    `/api/warehouse/official-warehouse/appointments/${encodeURIComponent(appointmentId)}/cancel`,
    { method: 'POST' }
  )
  return parseApiResponse<OfficialWarehouseAppointment>(response, '取消自动约仓失败')
}

export async function correctOfficialWarehouseAppointment(
  appointmentId: string,
  payload: CorrectOfficialWarehouseAppointmentPayload
) {
  const response = await apiFetch(
    `/api/warehouse/official-warehouse/appointments/${encodeURIComponent(appointmentId)}/correction`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  )
  return parseApiResponse<OfficialWarehouseAppointment>(response, '订正约仓记录失败')
}

export async function loadOfficialWarehouseAppointmentNoonCalls(appointmentId: string) {
  const response = await apiFetch(
    `/api/warehouse/official-warehouse/appointments/${encodeURIComponent(appointmentId)}/noon-calls`
  )
  return parseApiResponse<NoonHttpCallLog[]>(response, '读取约仓 Noon 调用日志失败')
}

export function officialWarehouseError(error: unknown, fallback: string) {
  return normalizeError(error, fallback)
}

export function officialWarehouseProblem(error: unknown) {
  return error instanceof ApiError ? error.problem : undefined
}

function appendParam(params: URLSearchParams, key: string, value?: string) {
  if (value?.trim()) {
    params.append(key, value.trim())
  }
}
