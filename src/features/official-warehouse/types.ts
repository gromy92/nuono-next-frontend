export type OfficialWarehouseSiteCode = 'SA' | 'AE' | 'EG'

export type OfficialWarehouseTransportMode = 'AIR' | 'SEA'

export type OfficialWarehouseAsnStatus =
  | 'DRAFT'
  | 'WAREHOUSE_CONFIRMED'
  | 'SUBMITTING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'

export type OfficialWarehouseAppointmentStatus =
  | 'NOT_READY'
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'

export type OfficialWarehouseReceiptStatus =
  | 'NOT_STARTED'
  | 'PENDING_PULL'
  | 'PARTIAL_RECEIVED'
  | 'RECEIVED'
  | 'EXCEPTION'

export type OfficialWarehouseDiscrepancyStatus = 'NONE' | 'NEEDS_CORRECTION' | 'CORRECTED'

export type OfficialWarehouseLine = {
  id: string
  psku: string
  noonSku?: string
  zsku?: string
  title: string
  quantity: number
  cartonCount: number
  unitsPerCarton?: number
  grossWeightKg?: number
  volumeCbm?: number
  missingTags: string[]
}

export type OfficialWarehouseAppointmentAttempt = {
  id: string
  attemptedAt: string
  warehouseCode: string
  warehouseName: string
  expectedDateRange: string
  matchedDate?: string
  matchedSlot?: string
  result: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'
  failureReason?: string
  operatorName: string
  noonResponseSummary: string
}

export type OfficialWarehouseReceiptRow = {
  id: string
  source: 'NOON_PULL' | 'MANUAL_ENTRY'
  lineId: string
  psku: string
  shippedQuantity: number
  noonReceivedQuantity?: number
  effectiveReceivedQuantity: number
  discrepancyQuantity: number
  status: 'MATCHED' | 'SHORT_RECEIVED' | 'OVER_RECEIVED' | 'PENDING'
}

export type OfficialWarehouseCorrection = {
  id: string
  correctedAt: string
  operatorName: string
  fieldName: string
  beforeValue: string
  afterValue: string
  reason: string
}

export type OfficialWarehouseInboundOrder = {
  id: string
  inboundNo: string
  dispatchPlanNo: string
  storeCode: string
  storeName: string
  siteCode: OfficialWarehouseSiteCode
  transportMode: OfficialWarehouseTransportMode
  recommendedWarehouseCode: string
  recommendedWarehouseName: string
  confirmedWarehouseCode?: string
  confirmedWarehouseName?: string
  asnNo?: string
  productCount: number
  totalQuantity: number
  cartonCount: number
  asnStatus: OfficialWarehouseAsnStatus
  appointmentStatus: OfficialWarehouseAppointmentStatus
  receiptStatus: OfficialWarehouseReceiptStatus
  discrepancyStatus: OfficialWarehouseDiscrepancyStatus
  appointmentWindow?: string
  arrivedForwarderWarehouse: boolean
  updatedAt: string
  splitReason: string
  issueTags: string[]
  lines: OfficialWarehouseLine[]
  appointmentAttempts: OfficialWarehouseAppointmentAttempt[]
  receiptRows: OfficialWarehouseReceiptRow[]
  corrections: OfficialWarehouseCorrection[]
}

export type OfficialWarehouseSummary = {
  totalInboundOrders: number
  pendingAsn: number
  failedAsn: number
  pendingAppointment: number
  successAppointment: number
  failedAppointment: number
  receiptCorrectionsNeeded: number
}
