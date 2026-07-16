import {
  DEFAULT_OFFICIAL_WAREHOUSE_APPOINTMENT_FILTER_STATUSES,
  appointmentStatusDisplayMeta,
  buildAppointmentRunOnceFeedback,
  buildAppointmentHistorySummary,
  buildManualAppointmentResultMessage,
  buildOfficialWarehouseAsnSummary,
  buildOfficialWarehouseSummary,
  noonAsnStatusDisplayMeta,
  officialWarehouseBusinessErrorText,
  officialWarehousePublicAsnNo,
  officialWarehouseAppointmentFilterStatus,
  officialWarehouseInboundFilterStatus,
  matchesOfficialWarehouseAsnFilters
} from './domain'
import type { OfficialWarehouseInboundOrder } from './types'

const rows: OfficialWarehouseInboundOrder[] = [
  {
    id: 'inb-1',
    inboundNo: 'NOWH-260611-001',
    dispatchPlanNo: 'DSP-260611-001',
    storeCode: 'STR108065-NSA',
    storeName: 'canman',
    siteCode: 'SA',
    transportMode: 'AIR',
    recommendedWarehouseCode: 'FBN-RUH',
    recommendedWarehouseName: 'Riyadh FBN',
    confirmedWarehouseCode: 'FBN-RUH',
    confirmedWarehouseName: 'Riyadh FBN',
    productCount: 2,
    totalQuantity: 120,
    cartonCount: 10,
    asnStatus: 'SUCCESS',
    appointmentStatus: 'SUCCESS',
    receiptStatus: 'PARTIAL_RECEIVED',
    discrepancyStatus: 'NEEDS_CORRECTION',
    arrivedForwarderWarehouse: true,
    updatedAt: '2026-06-11 15:20',
    splitReason: '店铺/站点/运输方式/目的仓一致',
    issueTags: [],
    lines: [],
    appointmentAttempts: [],
    receiptRows: [],
    corrections: []
  },
  {
    id: 'inb-2',
    inboundNo: 'NOWH-260611-002',
    dispatchPlanNo: 'DSP-260611-001',
    storeCode: 'STR108065-NAE',
    storeName: 'canman',
    siteCode: 'AE',
    transportMode: 'SEA',
    recommendedWarehouseCode: 'FBN-DXB',
    recommendedWarehouseName: 'Dubai FBN',
    productCount: 1,
    totalQuantity: 60,
    cartonCount: 5,
    asnStatus: 'FAILED',
    appointmentStatus: 'NOT_READY',
    receiptStatus: 'NOT_STARTED',
    discrepancyStatus: 'NONE',
    arrivedForwarderWarehouse: false,
    updatedAt: '2026-06-11 15:00',
    splitReason: '站点不同，自动拆分',
    issueTags: ['缺目的仓确认'],
    lines: [],
    appointmentAttempts: [],
    receiptRows: [],
    corrections: []
  },
  {
    id: 'inb-3',
    inboundNo: 'NOWH-260611-003',
    dispatchPlanNo: 'DSP-260611-002',
    storeCode: 'STR69486-NSA',
    storeName: 'SGGR',
    siteCode: 'SA',
    transportMode: 'SEA',
    recommendedWarehouseCode: 'FBN-JED',
    recommendedWarehouseName: 'Jeddah FBN',
    confirmedWarehouseCode: 'FBN-JED',
    confirmedWarehouseName: 'Jeddah FBN',
    productCount: 3,
    totalQuantity: 210,
    cartonCount: 18,
    asnStatus: 'SUCCESS',
    appointmentStatus: 'FAILED',
    receiptStatus: 'NOT_STARTED',
    discrepancyStatus: 'NONE',
    arrivedForwarderWarehouse: true,
    updatedAt: '2026-06-11 14:40',
    splitReason: '目的仓不同，自动拆分',
    issueTags: [],
    lines: [],
    appointmentAttempts: [],
    receiptRows: [],
    corrections: []
  },
  {
    id: 'inb-4',
    inboundNo: 'NOWH-260611-004',
    dispatchPlanNo: 'DSP-260611-003',
    storeCode: 'STR244978-NAE',
    storeName: 'chenwu',
    siteCode: 'AE',
    transportMode: 'AIR',
    recommendedWarehouseCode: 'FBN-DXB',
    recommendedWarehouseName: 'Dubai FBN',
    confirmedWarehouseCode: 'FBN-DXB',
    confirmedWarehouseName: 'Dubai FBN',
    productCount: 1,
    totalQuantity: 80,
    cartonCount: 6,
    asnStatus: 'SUCCESS',
    appointmentStatus: 'PENDING',
    receiptStatus: 'NOT_STARTED',
    discrepancyStatus: 'NONE',
    arrivedForwarderWarehouse: true,
    updatedAt: '2026-06-11 14:30',
    splitReason: '店铺不同，自动拆分',
    issueTags: [],
    lines: [],
    appointmentAttempts: [],
    receiptRows: [],
    corrections: []
  }
]

const summary = buildOfficialWarehouseSummary(rows)

summary.totalInboundOrders satisfies number
summary.pendingAsn satisfies number
summary.failedAsn satisfies number
summary.pendingAppointment satisfies number
summary.successAppointment satisfies number
summary.failedAppointment satisfies number
summary.receiptCorrectionsNeeded satisfies number

if (summary.totalInboundOrders !== 4) {
  throw new Error('expected total inbound count')
}

if (summary.failedAsn !== 1) {
  throw new Error('expected failed ASN count')
}

if (summary.pendingAppointment !== 1) {
  throw new Error('expected pending appointment count')
}

if (summary.successAppointment !== 1 || summary.failedAppointment !== 1) {
  throw new Error('expected appointment result counts')
}

if (summary.receiptCorrectionsNeeded !== 1) {
  throw new Error('expected correction-needed count')
}

const asnSummary = buildOfficialWarehouseAsnSummary([
  { status: 'LINES_CREATED', totalQuantity: 2, appointment: { status: 'PENDING' } },
  { status: 'LINES_CREATED', totalQuantity: 5, appointment: { status: 'SCHEDULED' } },
  { status: 'FAILED', totalQuantity: 1, appointment: { status: 'FAILED' } }
])

if (
  asnSummary.asnTotal !== 3 ||
  asnSummary.asnCreated !== 2 ||
  asnSummary.appointmentPending !== 1 ||
  asnSummary.appointmentSuccess !== 1 ||
  asnSummary.appointmentFailed !== 1 ||
  asnSummary.totalQuantity !== 8
) {
  throw new Error('expected real ASN and appointment summary counts')
}

const manualNoCapacityMessage = buildManualAppointmentResultMessage({
  status: 'FAILED',
  failureType: 'NO_CAPACITY'
})

if (!manualNoCapacityMessage.includes('可调整时间范围后再手动约仓')) {
  throw new Error('expected manual no-capacity message to suggest changing time range')
}

if (manualNoCapacityMessage.includes('已进入自动约仓队列')) {
  throw new Error('manual no-capacity message must not say it was moved into auto queue')
}

const appointmentHistorySummary = buildAppointmentHistorySummary([
  { status: 'PENDING' },
  { status: 'RUNNING' },
  { status: 'SCHEDULED' },
  { status: 'FAILED', failureType: 'NO_CAPACITY' },
  { status: 'FAILED', failureType: 'NOON_CALL' },
  { status: 'CANCELED' }
])

if (
  appointmentHistorySummary.total !== 6 ||
  appointmentHistorySummary.pending !== 2 ||
  appointmentHistorySummary.scheduled !== 1 ||
  appointmentHistorySummary.failed !== 2 ||
  appointmentHistorySummary.canceled !== 1 ||
  appointmentHistorySummary.noCapacity !== 1
) {
  throw new Error('expected appointment history summary counts')
}

if (appointmentStatusDisplayMeta('PENDING').label !== '约仓中') {
  throw new Error('expected pending automatic appointment to display as booking in progress')
}

if (appointmentStatusDisplayMeta('RUNNING').label !== '约仓中') {
  throw new Error('expected running automatic appointment to display as booking in progress')
}

if (noonAsnStatusDisplayMeta('grn_completed').label !== '已入仓') {
  throw new Error('expected Noon grn_completed to display as received')
}

if (noonAsnStatusDisplayMeta('canceled').label !== '已取消') {
  throw new Error('expected Noon canceled to display as canceled')
}

if (noonAsnStatusDisplayMeta('sealed', 'PENDING').label !== '约仓中') {
  throw new Error('expected pending local appointment to keep booking-in-progress label')
}

if (DEFAULT_OFFICIAL_WAREHOUSE_APPOINTMENT_FILTER_STATUSES.join(',') !== 'APPOINTING,SCHEDULED') {
  throw new Error('expected ASN list to default to booking-in-progress and booking-success statuses')
}

const filterRows = [
  { id: 'pending', noonAsnStatus: 'SEALED', appointment: { status: 'PENDING' } },
  { id: 'scheduled', noonAsnStatus: 'SCHEDULED', appointment: { status: 'SCHEDULED' } },
  { id: 'receiving', noonAsnStatus: 'RECEIVING' },
  { id: 'received', noonAsnStatus: 'GRN_COMPLETED' },
  { id: 'not-appointed', noonAsnStatus: 'CREATED' },
  { id: 'failed', noonAsnStatus: 'SEALED', appointment: { status: 'FAILED' } }
]

if (officialWarehouseAppointmentFilterStatus(filterRows[0]) !== 'APPOINTING') {
  throw new Error('expected pending and running appointments to share the booking-in-progress filter')
}

if (officialWarehouseAppointmentFilterStatus(filterRows[2]) !== 'SCHEDULED') {
  throw new Error('expected receiving ASN without a local appointment row to remain under booking success')
}

if (officialWarehouseInboundFilterStatus(filterRows[2]) !== 'RECEIVING') {
  throw new Error('expected Noon receiving status to map to inbound in progress')
}

if (officialWarehouseInboundFilterStatus(filterRows[3]) !== 'COMPLETED') {
  throw new Error('expected Noon GRN completed status to map to inbound completed')
}

const defaultFilteredIds = filterRows
  .filter((row) => matchesOfficialWarehouseAsnFilters(
    row,
    DEFAULT_OFFICIAL_WAREHOUSE_APPOINTMENT_FILTER_STATUSES,
    []
  ))
  .map((row) => row.id)

if (defaultFilteredIds.join(',') !== 'pending,scheduled,receiving,received') {
  throw new Error('expected default ASN filters to keep only booking-in-progress and booking-success rows')
}

const receivedFilteredIds = filterRows
  .filter((row) => matchesOfficialWarehouseAsnFilters(row, [], ['COMPLETED']))
  .map((row) => row.id)

if (receivedFilteredIds.join(',') !== 'received') {
  throw new Error('expected inbound status filter to keep only completed inbound rows')
}

const expiredBusinessError = officialWarehouseBusinessErrorText(
  'Noon ASN 列表状态为 EXPIRED',
  'NOON_ASN_EXPIRED'
)

if (expiredBusinessError.includes('NOON_ASN') || expiredBusinessError !== 'Noon后台显示该 ASN 已过期，不能继续约仓。') {
  throw new Error('expected internal Noon ASN expired code to be hidden from users')
}

const canceledBusinessError = officialWarehouseBusinessErrorText(
  'Noon ASN 列表显示该约仓已失效：canceled',
  'NOON_ASN_CANCELED'
)

if (canceledBusinessError.includes('NOON_ASN') || !canceledBusinessError.includes('已取消')) {
  throw new Error('expected internal Noon ASN canceled code to be hidden from users')
}

if (officialWarehousePublicAsnNo({ localAsnNo: 'OWA-500002', noonAsnNr: 'A05531714PN' }) !== 'A05531714PN') {
  throw new Error('expected public ASN display to use Noon ASN instead of local OWA number')
}

if (officialWarehousePublicAsnNo({ localAsnNo: 'OWA-500002' }) !== '-') {
  throw new Error('expected local OWA number to stay hidden when Noon ASN is missing')
}

const pendingRunFeedback = buildAppointmentRunOnceFeedback({
  status: 'PENDING',
  failureType: 'IllegalStateException',
  errorMessage: 'HTTP 400 {"error":"Already exists"}',
  nextAttemptAt: '2026-06-16 14:44:43'
})

if (pendingRunFeedback.type !== 'warning' || !pendingRunFeedback.message.includes('本次执行未约成功')) {
  throw new Error('expected pending run-once result to warn instead of showing success')
}

if (!pendingRunFeedback.message.includes('14:44:43')) {
  throw new Error('expected pending run-once feedback to include next retry time')
}
