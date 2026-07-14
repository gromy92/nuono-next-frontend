import {
  CalendarOutlined,
  DownloadOutlined,
  EyeOutlined,
  LeftOutlined,
  PlusOutlined,
  ReloadOutlined,
  RightOutlined,
  SearchOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Checkbox,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Image,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Key } from 'react'
import type { AuthSession } from '../auth/session'
import {
  cancelOfficialWarehouseAppointment,
  correctOfficialWarehouseAppointment,
  createOfficialWarehouseAsn,
  loadOfficialWarehouseAsn,
  loadOfficialWarehouseAppointments,
  loadOfficialWarehouseAsns,
  loadOfficialWarehouseCandidates,
  loadOfficialWarehouseShippingBatches,
  officialWarehouseError,
  queryOfficialWarehouseAppointmentAvailability,
  runOfficialWarehouseAppointmentOnce,
  submitManualOfficialWarehouseAppointment,
  syncOfficialWarehouseNoonAsnList,
  upsertOfficialWarehouseAppointment,
  type CorrectOfficialWarehouseAppointmentPayload,
  type OfficialWarehouseAsn,
  type OfficialWarehouseAsnLine,
  type OfficialWarehouseAppointment,
  type OfficialWarehouseAppointmentAvailability,
  type OfficialWarehouseProductCandidate,
  type OfficialWarehouseRoutingWarehouse,
  type OfficialWarehouseShippingBatchCandidate,
  type UpsertOfficialWarehouseAppointmentPayload
} from './api'
import {
  appointmentStatusDisplayMeta,
  buildAppointmentRunOnceFeedback,
  buildAppointmentHistorySummary,
  buildManualAppointmentResultMessage,
  buildOfficialWarehouseAsnSummary,
  noonAsnStatusDisplayMeta,
  officialWarehouseBusinessErrorText,
  officialWarehousePublicAsnNo
} from './domain'
import { printFbnTransferPdf } from './printFbnTransferPdf'
import { loadOfficialWarehouseInboundStatistics } from './statisticsApi'
import { inboundStageLabel } from './statisticsDomain'
import type { OfficialWarehouseInboundStatisticsRow } from './statisticsTypes'
import './OfficialWarehousePage.css'

const { Text } = Typography

type OfficialWarehousePageProps = {
  session?: AuthSession | null
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '本地草稿', color: 'default' },
  ASN_CREATED: { label: 'ASN已生成', color: 'blue' },
  ROUTED: { label: '已路由仓', color: 'cyan' },
  LINES_CREATED: { label: '行已创建', color: 'green' },
  FAILED: { label: '失败', color: 'red' }
}

const APPOINTMENT_STATUS_OPTIONS = [
  { label: '待约仓', value: 'PENDING' },
  { label: '约仓中', value: 'RUNNING' },
  { label: '约仓成功', value: 'SCHEDULED' },
  { label: '约仓失败', value: 'FAILED' },
  { label: '已取消', value: 'CANCELED' }
]

const APPOINTMENT_CORRECTION_STATUS_OPTIONS = APPOINTMENT_STATUS_OPTIONS.filter((item) => item.value !== 'RUNNING')

const PRODUCT_IMAGE_FALLBACK =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2284%22 height=%2284%22 viewBox=%220 0 84 84%22%3E%3Crect width=%2284%22 height=%2284%22 rx=%2210%22 fill=%22%23f8fafc%22/%3E%3Cpath d=%22M18 58h48L51 39 40 51l-7-8-15 15z%22 fill=%22%23cbd5e1%22/%3E%3Ccircle cx=%2231%22 cy=%2230%22 r=%226%22 fill=%22%23cbd5e1%22/%3E%3C/svg%3E'

function statusTag(status?: string) {
  const meta = STATUS_META[status || ''] || { label: status || '-', color: 'default' }
  return <Tag color={meta.color}>{meta.label}</Tag>
}

function appointmentStatusTag(status?: string) {
  const meta = appointmentStatusDisplayMeta(status)
  return <Tag color={meta.color}>{meta.label}</Tag>
}

function noonAsnStatusTag(status?: string, appointmentStatus?: string) {
  const meta = noonAsnStatusDisplayMeta(status, appointmentStatus)
  return <Tag color={meta.color}>{meta.label}</Tag>
}

function toNumber(value?: string | number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function formatDimension(row: Pick<OfficialWarehouseProductCandidate, 'productLengthCm' | 'productWidthCm' | 'productHeightCm'>) {
  if (!row.productLengthCm || !row.productWidthCm || !row.productHeightCm) {
    return '-'
  }
  return `${row.productLengthCm} x ${row.productWidthCm} x ${row.productHeightCm} cm`
}

function displayPsku(row: Pick<OfficialWarehouseProductCandidate, 'partnerSku' | 'skuParent' | 'childSku'>) {
  return row.partnerSku || row.skuParent || row.childSku || '-'
}

function officialWarehouseCandidateKey(row: OfficialWarehouseProductCandidate) {
  const store = row.storeCode?.trim() || ''
  const site = row.siteCode?.trim() || ''
  const partnerSku = row.partnerSku?.trim() || ''
  if (store && site && partnerSku) {
    return `${store}::${site}::psku:${partnerSku}`
  }
  return `legacy-row:${row.productVariantId || row.productSiteOfferId || row.noonSku || row.pskuCode}`
}

function formatCubicFeet(value?: number) {
  if (value == null || Number.isNaN(Number(value))) {
    return '-'
  }
  return `${Number(value).toFixed(5).replace(/\.?0+$/, '')} ft³`
}

function shippingBatchStatusText(status?: string) {
  const normalized = (status || '').toLowerCase()
  if (normalized === 'shipped') return '已出库'
  if (normalized === 'in_transit') return '运输中'
  if (normalized === 'customs_clearance') return '清关中'
  if (normalized === 'delivering') return '派送中'
  if (normalized === 'warehouse_received') return '已到海外仓'
  if (normalized === 'completed') return '已完成'
  if (normalized === 'cancelled') return '已取消'
  if (normalized === 'departed_origin') return '已离港'
  if (normalized === 'arrived_port') return '已到港'
  if (normalized === 'customs_released') return '已放行'
  const legacy = (status || '').toUpperCase()
  if (legacy === 'OUTBOUND_CREATED') return '已出库'
  if (legacy === 'OPTION_SELECTED') return '已选方案'
  return status || '-'
}

function shippingBatchOptionText(row: OfficialWarehouseShippingBatchCandidate) {
  const quantity = Number(row.remainingQuantity ?? row.storeSiteQuantity ?? 0).toLocaleString()
  const linkedQuantity = Number(row.linkedQuantity || 0)
  const scheduledAppointmentQuantity = Number(row.scheduledAppointmentQuantity || 0)
  const appointedQuantity = row.alreadyAppointed ? Math.max(scheduledAppointmentQuantity, 0) : 0
  const asnOnlyQuantity = row.batchUsedByAsn ? Math.max(linkedQuantity - appointedQuantity, 0) : 0
  const skuCount = Number(row.skuCount || 0).toLocaleString()
  const poCount = Number(row.purchaseOrderCount || 0).toLocaleString()
  const batchNo = row.batchNo || row.trackingNo || row.externalShipmentNo || row.id
  const forwarder = row.forwarderName ? ` · ${row.forwarderName}` : ''
  const transport = row.transportMode ? ` · ${row.transportMode === 'AIR' ? '空运' : row.transportMode === 'SEA' ? '海运' : row.transportMode}` : ''
  const purchaseText = poCount === '0' ? '' : ` · ${poCount} PO`
  const usageParts = [
    row.alreadyAppointed ? `已约仓 ${Number(appointedQuantity || linkedQuantity || 0).toLocaleString()}件` : '',
    row.batchUsedByAsn && asnOnlyQuantity > 0 ? `已建ASN ${asnOnlyQuantity.toLocaleString()}件` : ''
  ].filter(Boolean)
  const fallbackUsageText = row.batchUsageLabel && row.batchUsageLabel !== '可约仓' ? ` · ${row.batchUsageLabel}` : ''
  const appointmentText = usageParts.length ? ` · ${usageParts.join(' · ')}` : fallbackUsageText
  return `${batchNo}${forwarder}${transport} · ${shippingBatchStatusText(row.latestNodeStatus || row.status)}${appointmentText} · 待约仓 ${quantity}件 · ${skuCount} SKU${purchaseText}`
}

function lineStatusTag(status?: string) {
  const normalized = (status || '').toUpperCase()
  if (normalized === 'CREATED') {
    return <Tag color="green">已创建</Tag>
  }
  if (normalized === 'FAILED') {
    return <Tag color="red">失败</Tag>
  }
  if (normalized === 'PENDING') {
    return <Tag color="blue">待创建</Tag>
  }
  return <Tag>{status || '-'}</Tag>
}

function inboundStageTag(status?: string) {
  const normalized = (status || '').trim().toUpperCase()
  if (normalized === 'GRN_COMPLETED') {
    return <Tag color="green">{inboundStageLabel(status)}</Tag>
  }
  if (normalized === 'RECEIVING') {
    return <Tag color="blue">{inboundStageLabel(status)}</Tag>
  }
  if (normalized === 'FAILED') {
    return <Tag color="red">{inboundStageLabel(status)}</Tag>
  }
  return <Tag>{inboundStageLabel(status)}</Tag>
}

function normalizeAsnStatus(status?: string) {
  return (status || '').trim().toUpperCase()
}

function asnInboundStage(row: Pick<OfficialWarehouseAsn, 'status' | 'noonAsnStatus'>) {
  const noonStatus = normalizeAsnStatus(row.noonAsnStatus)
  if (noonStatus === 'GRN_COMPLETED' || noonStatus === 'PUTAWAY_COMPLETED') {
    return 'GRN_COMPLETED'
  }
  if (noonStatus === 'RECEIVING') {
    return 'RECEIVING'
  }
  if (['EXPIRED', 'CANCELED', 'CANCELLED'].includes(noonStatus) || normalizeAsnStatus(row.status) === 'FAILED') {
    return 'FAILED'
  }
  return noonStatus || normalizeAsnStatus(row.status)
}

function asnHasInboundResult(row: Pick<OfficialWarehouseAsn, 'status' | 'noonAsnStatus'>) {
  return ['GRN_COMPLETED', 'RECEIVING'].includes(asnInboundStage(row))
}

function asnIsExpired(row: Pick<OfficialWarehouseAsn, 'noonAsnStatus'>) {
  return normalizeAsnStatus(row.noonAsnStatus) === 'EXPIRED'
}

function appointmentAwareWarehouseLabel(
  row: Pick<OfficialWarehouseAsn, 'selectedWarehousePartnerCode' | 'selectedWarehouseName' | 'appointment'>
) {
  const appointmentWarehouse = row.appointment?.warehouseToPartnerCode || row.appointment?.warehouseToCode
  const routeWarehouse = row.selectedWarehousePartnerCode || row.selectedWarehouseName
  if (!appointmentWarehouse) {
    return <Text type="secondary">{routeWarehouse || '-'}</Text>
  }
  return (
    <>
      <Text type="secondary">{appointmentWarehouse}</Text>
      {routeWarehouse && routeWarehouse !== appointmentWarehouse ? (
        <Text type="secondary">ASN路由 {routeWarehouse}</Text>
      ) : null}
    </>
  )
}

function businessErrorText(message?: string, failureType?: string) {
  return officialWarehouseBusinessErrorText(message, failureType)
}

function inboundDetailSearchKeyword(row: OfficialWarehouseAsn) {
  const publicAsnNo = officialWarehousePublicAsnNo(row)
  return publicAsnNo !== '-' ? publicAsnNo : row.localAsnNo || row.inboundNo || row.id
}

function normalizedInboundLookupKey(value?: string | number) {
  return String(value ?? '').trim().toUpperCase()
}

function inboundLookupKeys(values: Array<string | number | undefined>) {
  return values.map(normalizedInboundLookupKey).filter(Boolean)
}

function filterInboundDetailRows(rows: OfficialWarehouseInboundStatisticsRow[], asn: OfficialWarehouseAsn) {
  const publicAsnNo = officialWarehousePublicAsnNo(asn)
  const asnKeys = new Set(
    inboundLookupKeys([
      asn.id,
      asn.inboundNo,
      asn.localAsnNo,
      asn.asnNo,
      asn.noonAsnNr,
      publicAsnNo !== '-' ? publicAsnNo : undefined
    ])
  )
  const matchedRows = rows.filter((row) =>
    inboundLookupKeys([row.asnId, row.localAsnNo, row.noonAsnNr]).some((key) => asnKeys.has(key))
  )
  if (matchedRows.length || rows.length !== 1) {
    return matchedRows
  }
  return rows
}

function appointmentDurationText(appointment?: OfficialWarehouseAppointment) {
  if (!appointment?.createdAt) {
    return '-'
  }
  const start = dayjs(appointment.createdAt)
  if (!start.isValid()) {
    return '-'
  }
  const isActive = appointment.status === 'PENDING' || appointment.status === 'RUNNING'
  const isCompleted = appointment.status === 'SCHEDULED'
  const endText = appointment.apSuccessTime || (!isActive ? appointment.updatedAt : undefined)
  if (isCompleted && (!appointment.apSuccessTime || !Number(appointment.attemptCount || 0))) {
    return '-'
  }
  if (!isActive && !endText) {
    return '-'
  }
  const end = isActive ? dayjs() : dayjs(endText)
  if (!end.isValid()) {
    return '-'
  }
  const totalMinutes = Math.max(0, end.diff(start, 'minute'))
  const duration = formatDuration(totalMinutes)
  return isActive ? `已等待 ${duration}` : `总用时 ${duration}`
}

function appointmentDeliveryTimeText(appointment?: OfficialWarehouseAppointment) {
  if (!appointment) {
    return ''
  }
  if (appointment.appointmentDate) {
    return `${appointment.appointmentDate} ${appointment.appointmentTime || ''}`.trim()
  }
  if (appointment.apStartDate && appointment.apEndDate) {
    return `${appointment.apStartDate} - ${appointment.apEndDate}`
  }
  return ''
}

function asnProductCountText(asn: OfficialWarehouseAsn) {
  const productCount = Number(asn.productCount || 0)
  const lineCount = Number(asn.lines?.length || 0)
  const resolvedCount = productCount > 0 ? productCount : lineCount
  return resolvedCount > 0 ? `${resolvedCount.toLocaleString()} SKU` : '-'
}

function formatDuration(totalMinutes: number) {
  if (totalMinutes < 1) {
    return '<1分钟'
  }
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) {
    return `${days}天${hours ? `${hours}小时` : ''}`
  }
  if (hours > 0) {
    return `${hours}小时${minutes ? `${minutes}分钟` : ''}`
  }
  return `${minutes}分钟`
}

function isAutoAppointmentRunning(row: OfficialWarehouseAsn) {
  const status = row.appointment?.status
  return status === 'PENDING' || status === 'RUNNING'
}

function shippingLinkSummaryItems(asn: OfficialWarehouseAsn) {
  const grouped = new Map<string, { batchNo: string; quantity: number; purchaseOrders: Set<string> }>()
  ;(asn.shippingBatchLinks || []).forEach((link) => {
    const batchNo = link.batchReferenceNo || link.trackingNo || link.externalShipmentNo || link.shippingBatchNo
    const key = link.inTransitBatchId || link.shippingBatchId || batchNo || link.id
    if (!key) return
    const item = grouped.get(key) || {
      batchNo: batchNo || key,
      quantity: 0,
      purchaseOrders: new Set<string>()
    }
    item.quantity += Number(link.quantity || 0)
    if (link.purchaseOrderNo) {
      item.purchaseOrders.add(link.purchaseOrderNo)
    }
    grouped.set(key, item)
  })
  return Array.from(grouped.entries()).map(([key, value]) => ({
    key,
    batchNo: value.batchNo,
    quantity: value.quantity,
    purchaseOrders: Array.from(value.purchaseOrders)
  }))
}

type AppointmentFormState = {
  warehouseToPartnerCode: string
  warehouseToCode?: string
  apDates: [Dayjs, Dayjs] | null
  apTimeRange: string[]
  availableToday: boolean
  selectedSlotKey?: string
}

type AppointmentSubmitMode = 'manual' | 'auto'

type AppointmentSubmitFeedback = {
  type: 'success' | 'info' | 'warning' | 'error'
  message: string
}

type AppointmentOpenRequest = {
  row: OfficialWarehouseAsn
  mode: AppointmentSubmitMode
}

type CorrectionFormState = {
  status: string
  appointmentDate: Dayjs | null
  appointmentSlotId?: number
  appointmentTime: string
  failureType: string
  errorStage: string
  errorMessage: string
}

export function OfficialWarehousePage({ session }: OfficialWarehousePageProps) {
  const activeStoreCode = session?.currentStore?.storeCode || session?.userStores?.[0]?.storeCode || ''
  const activeSiteCode = (session?.currentStore?.site || session?.userStores?.[0]?.site || 'SA').toUpperCase()
  const initialStore = activeStoreCode
  const initialSite = activeSiteCode
  const [storeCode, setStoreCode] = useState(initialStore)
  const [siteCode, setSiteCode] = useState(initialSite)
  const [keyword, setKeyword] = useState('')
  const [asns, setAsns] = useState<OfficialWarehouseAsn[]>([])
  const [appointments, setAppointments] = useState<OfficialWarehouseAppointment[]>([])
  const [loading, setLoading] = useState(false)
  const [appointmentHistoryLoading, setAppointmentHistoryLoading] = useState(false)
  const [loadError, setLoadError] = useState<string>()
  const [asnSyncing, setAsnSyncing] = useState(false)
  const [asnSyncFeedback, setAsnSyncFeedback] = useState<AppointmentSubmitFeedback>()
  const [selectedAsn, setSelectedAsn] = useState<OfficialWarehouseAsn>()
  const [selectedInboundRows, setSelectedInboundRows] = useState<OfficialWarehouseInboundStatisticsRow[]>([])
  const [selectedInboundLoading, setSelectedInboundLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [candidateKeyword, setCandidateKeyword] = useState('')
  const [candidateLoading, setCandidateLoading] = useState(false)
  const [candidates, setCandidates] = useState<OfficialWarehouseProductCandidate[]>([])
  const [shippingBatchKeyword, setShippingBatchKeyword] = useState('')
  const [shippingBatchLoading, setShippingBatchLoading] = useState(false)
  const [shippingBatches, setShippingBatches] = useState<OfficialWarehouseShippingBatchCandidate[]>([])
  const [selectedShippingBatchIds, setSelectedShippingBatchIds] = useState<string[]>([])
  const [selectedCandidateKeys, setSelectedCandidateKeys] = useState<Key[]>([])
  const [quantityByCandidateKey, setQuantityByCandidateKey] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [appointmentOpen, setAppointmentOpen] = useState(false)
  const [appointmentTarget, setAppointmentTarget] = useState<OfficialWarehouseAsn>()
  const [appointmentMode, setAppointmentMode] = useState<AppointmentSubmitMode>('auto')
  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormState>(() => defaultAppointmentForm())
  const [appointmentSubmitting, setAppointmentSubmitting] = useState(false)
  const [appointmentSubmitFeedback, setAppointmentSubmitFeedback] = useState<AppointmentSubmitFeedback>()
  const [appointmentRunFeedback, setAppointmentRunFeedback] = useState<AppointmentSubmitFeedback>()
  const [appointmentRunningId, setAppointmentRunningId] = useState<string>()
  const [pdfPrintingAsnId, setPdfPrintingAsnId] = useState<string>()
  const [appointmentHistoryOpen, setAppointmentHistoryOpen] = useState(false)
  const [rescheduleConfirm, setRescheduleConfirm] = useState<AppointmentOpenRequest>()
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilitySlots, setAvailabilitySlots] = useState<OfficialWarehouseAppointmentAvailability[]>([])
  const [availabilityError, setAvailabilityError] = useState<string>()
  const [manualDateOffset, setManualDateOffset] = useState(0)
  const [manualSelectedDate, setManualSelectedDate] = useState<string>()
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState<string>()
  const [appointmentKeyword, setAppointmentKeyword] = useState('')
  const [correctionOpen, setCorrectionOpen] = useState(false)
  const [correctionTarget, setCorrectionTarget] = useState<OfficialWarehouseAppointment>()
  const [correctionForm, setCorrectionForm] = useState<CorrectionFormState>(() => defaultCorrectionForm())
  const [correctionSubmitting, setCorrectionSubmitting] = useState(false)
  const availabilityInFlightKeyRef = useRef<string | null>(null)
  const appointmentStatusFilterInitializedRef = useRef(false)
  const inboundDetailRequestRef = useRef(0)

  const visibleAsns = useMemo(
    () => (keyword.trim() ? asns : asns.filter((row) => !asnIsExpired(row))),
    [asns, keyword]
  )
  const summary = useMemo(() => buildOfficialWarehouseAsnSummary(visibleAsns), [visibleAsns])
  const appointmentHistorySummary = useMemo(() => buildAppointmentHistorySummary(appointments), [appointments])

  const appointmentTimeOptions = useMemo(
    () =>
      Array.from({ length: 24 }, (_, hour) => ({
        label: `${hour.toString().padStart(2, '0')}:00`,
        value: hourToNoonToken(hour)
      })),
    []
  )

  const appointmentWarehouseOptions = useMemo(() => {
    const warehouses = appointmentTarget?.routingWarehouses || []
    const selectedWarehousePartnerCode = appointmentTarget?.selectedWarehousePartnerCode?.trim()
    const selectedWarehouseCode = appointmentTarget?.selectedWarehouseCode?.trim()
    const hasCurrentAsnWarehouse = Boolean(selectedWarehousePartnerCode || selectedWarehouseCode)
    const matchesCurrentAsnWarehouse = (warehouse: OfficialWarehouseRoutingWarehouse) =>
      Boolean(
        (selectedWarehousePartnerCode && warehouse.partnerCode === selectedWarehousePartnerCode) ||
        (selectedWarehouseCode && warehouse.code === selectedWarehouseCode)
      )
    const needsCurrentWarehouseFallback = hasCurrentAsnWarehouse && !warehouses.some(matchesCurrentAsnWarehouse)
    const optionWarehouses = needsCurrentWarehouseFallback
      ? [{ partnerCode: selectedWarehousePartnerCode, code: selectedWarehouseCode }, ...warehouses]
      : warehouses
    return optionWarehouses.map((warehouse) => (
      {
        label: `${warehouse.partnerCode || '-'} / ${warehouse.code || '-'}`,
        value: warehouse.partnerCode || warehouse.code || '',
        code: warehouse.code
      }
    )).filter((item) => item.value)
  }, [appointmentTarget])

  const shippingBatchOptions = useMemo(
    () => shippingBatches.map((batch) => ({ label: shippingBatchOptionText(batch), value: batch.id })),
    [shippingBatches]
  )
  const selectedShippingBatches = useMemo(
    () => shippingBatches.filter((batch) => selectedShippingBatchIds.includes(batch.id)),
    [shippingBatches, selectedShippingBatchIds]
  )
  const selectedShippingBatchesNoRemaining = selectedShippingBatchIds.length > 0 &&
    selectedShippingBatches.length > 0 &&
    selectedShippingBatches.every((batch) => Number(batch.remainingQuantity ?? batch.storeSiteQuantity ?? 0) <= 0)
  const candidateEmptyDescription = selectedShippingBatchIds.length
    ? selectedShippingBatchesNoRemaining
      ? '所选物流批次已无剩余待约仓商品'
      : '所选物流批次没有匹配当前站点商品'
    : '暂无可创建 ASN 的商品'

  const manualCalendarDates = useMemo(() => {
    if (!appointmentForm.apDates) {
      return []
    }
    const start = appointmentForm.apDates[0].startOf('day')
    const end = appointmentForm.apDates[1].startOf('day')
    const days = end.diff(start, 'day')
    if (days < 0) {
      return []
    }
    return Array.from({ length: Math.min(days + 1, 60) }, (_, index) =>
      start.add(index, 'day').format('YYYY-MM-DD')
    )
  }, [appointmentForm.apDates])
  const selectedManualSlot = useMemo(
    () => availabilitySlots.find((slot) => availabilitySlotKey(slot) === appointmentForm.selectedSlotKey),
    [availabilitySlots, appointmentForm.selectedSlotKey]
  )
  const selectedManualDate = selectedManualSlot?.date || manualSelectedDate || manualCalendarDates[manualDateOffset] || manualCalendarDates[0]
  const manualVisibleDates = manualCalendarDates.slice(manualDateOffset, manualDateOffset + 5)
  const manualSlotsForSelectedDate = availabilitySlots.filter((slot) => slot.date === selectedManualDate)
  const manualMonthLabel = selectedManualDate ? dayjs(selectedManualDate).format('MMMM YYYY') : dayjs().format('MMMM YYYY')

  const manualAvailabilityQueryKey = useMemo(() => {
    if (
      appointmentMode !== 'manual' ||
      !appointmentOpen ||
      !appointmentTarget ||
      !appointmentForm.apDates ||
      !appointmentForm.warehouseToPartnerCode.trim()
    ) {
      return ''
    }
    return [
      appointmentTarget.id,
      appointmentForm.warehouseToPartnerCode.trim(),
      appointmentForm.warehouseToCode || '',
      selectedManualDate || '',
      appointmentForm.apTimeRange.join(','),
      appointmentForm.availableToday ? '1' : '0'
    ].join('|')
  }, [appointmentMode, appointmentOpen, appointmentTarget, appointmentForm, selectedManualDate])

  useEffect(() => {
    setStoreCode(activeStoreCode)
    setSiteCode(activeSiteCode)
  }, [activeStoreCode, activeSiteCode])

  useEffect(() => {
    void loadAsns()
    void loadAppointmentHistory()
  }, [storeCode, siteCode])

  useEffect(() => {
    if (!appointmentStatusFilterInitializedRef.current) {
      appointmentStatusFilterInitializedRef.current = true
      return
    }
    void loadAppointmentHistory()
  }, [appointmentStatusFilter])

  useEffect(() => {
    if (createOpen) {
      setCandidateKeyword('')
      setSelectedShippingBatchIds([])
      void loadCandidates([], '')
      void loadShippingBatches()
    }
  }, [createOpen])

  useEffect(() => {
    if (!manualAvailabilityQueryKey) {
      setAvailabilitySlots([])
      setAvailabilityError(undefined)
      return
    }
    const timer = window.setTimeout(() => {
      void loadManualAvailability()
    }, 350)
    return () => window.clearTimeout(timer)
  }, [manualAvailabilityQueryKey])

  async function loadAsns() {
    setLoading(true)
    setLoadError(undefined)
    try {
      const rows = await loadOfficialWarehouseAsns({ storeCode, siteCode, keyword })
      setAsns(rows)
    } catch (error) {
      const text = officialWarehouseError(error, '读取 Noon 官方仓 ASN 失败')
      setLoadError(text)
      message.error(text)
    } finally {
      setLoading(false)
    }
  }

  async function syncNoonAsnList() {
    if (!storeCode || !siteCode) {
      message.warning('请选择店铺和站点')
      return
    }
    setAsnSyncing(true)
    setAsnSyncFeedback(undefined)
    try {
      const result = await syncOfficialWarehouseNoonAsnList({ storeCode, siteCode })
      const feedbackMessage = [
        `同步完成：拉取 ${result.fetched || 0} 条`,
        `新增 ${result.created || 0} 条`,
        `更新 ${result.updated || 0} 条`,
        `约仓同步 ${result.scheduled || 0} 条`,
        `状态订正 ${result.corrected || 0} 条`,
        `跳过 ${result.skipped || 0} 条`
      ].join('，')
      const feedbackType: AppointmentSubmitFeedback['type'] = result.corrected || result.failed ? 'warning' : 'success'
      setAsnSyncFeedback({ type: feedbackType, message: feedbackMessage })
      if (feedbackType === 'warning') {
        message.warning(feedbackMessage)
      } else {
        message.success(feedbackMessage)
      }
      await loadAsns()
      await loadAppointmentHistory()
    } catch (error) {
      const errorMessage = officialWarehouseError(error, '同步 Noon ASN 列表失败')
      setAsnSyncFeedback({ type: 'error', message: errorMessage })
      message.error(errorMessage)
    } finally {
      setAsnSyncing(false)
    }
  }

  async function loadAppointmentHistory() {
    setAppointmentHistoryLoading(true)
    try {
      const rows = await loadOfficialWarehouseAppointments({
        storeCode,
        siteCode,
        status: appointmentStatusFilter,
        keyword: appointmentKeyword
      })
      setAppointments(rows)
    } catch (error) {
      message.error(officialWarehouseError(error, '读取约仓历史失败'))
    } finally {
      setAppointmentHistoryLoading(false)
    }
  }

  function buildAppointmentPayload(): UpsertOfficialWarehouseAppointmentPayload | null {
    if (!appointmentForm.apDates) {
      return null
    }
    return {
      warehouseToPartnerCode: appointmentForm.warehouseToPartnerCode.trim(),
      warehouseToCode: appointmentForm.warehouseToCode,
      apStartDate: appointmentForm.apDates[0].format('YYYY-MM-DD'),
      apEndDate: appointmentForm.apDates[1].format('YYYY-MM-DD'),
      apTimeRange: appointmentForm.apTimeRange.join(','),
      availableToday: appointmentForm.availableToday
    }
  }

  async function loadManualAvailability() {
    if (!appointmentTarget) return
    const requestKey = manualAvailabilityQueryKey
    if (!requestKey || availabilityInFlightKeyRef.current === requestKey) {
      return
    }
    const payload = buildAppointmentPayload()
    if (!payload || !payload.warehouseToPartnerCode || !selectedManualDate) {
      return
    }
    payload.apStartDate = selectedManualDate
    payload.apEndDate = selectedManualDate
    availabilityInFlightKeyRef.current = requestKey
    setAvailabilityLoading(true)
    setAvailabilityError(undefined)
    setAppointmentSubmitFeedback(undefined)
    try {
      const rows = await queryOfficialWarehouseAppointmentAvailability(appointmentTarget.id, payload)
      setAvailabilitySlots(rows)
      setAppointmentForm((current) => {
        const selectedStillAvailable = rows.some((slot) => availabilitySlotKey(slot) === current.selectedSlotKey)
        return {
          ...current,
          selectedSlotKey: selectedStillAvailable ? current.selectedSlotKey : rows[0] ? availabilitySlotKey(rows[0]) : undefined
        }
      })
    } catch (error) {
      setAvailabilitySlots([])
      setAppointmentForm((current) => ({ ...current, selectedSlotKey: undefined }))
      setAvailabilityError(officialWarehouseError(error, '查询约仓仓位失败'))
    } finally {
      if (availabilityInFlightKeyRef.current === requestKey) {
        availabilityInFlightKeyRef.current = null
      }
      setAvailabilityLoading(false)
    }
  }

  async function loadCandidates(
    batchIds: string[] = selectedShippingBatchIds,
    keywordValue: string = candidateKeyword
  ) {
    if (!storeCode || !siteCode) {
      message.warning('请选择店铺和站点')
      return
    }
    setCandidateLoading(true)
    try {
      const rows = await loadOfficialWarehouseCandidates({
        storeCode,
        siteCode,
        keyword: keywordValue,
        shippingBatchIds: batchIds
      })
      setCandidates(rows)
      setSelectedCandidateKeys([])
      setQuantityByCandidateKey(
        rows.reduce<Record<string, number>>((next, row) => {
          const batchQuantity = Number(row.batchAvailableQuantity || 0)
          next[officialWarehouseCandidateKey(row)] = batchIds.length && batchQuantity > 0 ? batchQuantity : 1
          return next
        }, {})
      )
    } catch (error) {
      message.error(officialWarehouseError(error, '读取可创建 ASN 商品失败'))
    } finally {
      setCandidateLoading(false)
    }
  }

  async function loadShippingBatches() {
    if (!storeCode || !siteCode) {
      message.warning('请选择店铺和站点')
      return
    }
    setShippingBatchLoading(true)
    try {
      const rows = await loadOfficialWarehouseShippingBatches({
        storeCode,
        siteCode,
        keyword: shippingBatchKeyword
      })
      setShippingBatches(rows)
      setSelectedShippingBatchIds((current) => current.filter((id) => rows.some((row) => row.id === id)))
    } catch (error) {
      message.error(officialWarehouseError(error, '读取物流批次失败'))
    } finally {
      setShippingBatchLoading(false)
    }
  }

  async function submitCreateAsn() {
    const selectedRows = candidates.filter((candidate) => selectedCandidateKeys.includes(officialWarehouseCandidateKey(candidate)))
    if (!selectedRows.length) {
      message.warning('请选择至少一个商品')
      return
    }
    const invalid = selectedRows.find((row) => (quantityByCandidateKey[officialWarehouseCandidateKey(row)] || 0) <= 0)
    if (invalid) {
      message.warning(`${displayPsku(invalid)} 数量必须大于 0`)
      return
    }
    const overLimit = selectedRows.find((row) => {
      const batchLimit = selectedShippingBatchIds.length ? Number(row.batchAvailableQuantity || 0) : 0
      return batchLimit > 0 && (quantityByCandidateKey[officialWarehouseCandidateKey(row)] || 0) > batchLimit
    })
    if (overLimit) {
      message.warning(`${displayPsku(overLimit)} 数量超过所选物流批次可用数量`)
      return
    }
    setSubmitting(true)
    try {
      await createOfficialWarehouseAsn({
        storeCode,
        siteCode,
        sourceType: 'MANUAL',
        shippingBatchIds: selectedShippingBatchIds,
        lines: selectedRows.map((row) => ({
          productVariantId: Number(row.productVariantId),
          productSiteOfferId: toNumber(row.productSiteOfferId),
          partnerSku: row.partnerSku,
          quantity: quantityByCandidateKey[officialWarehouseCandidateKey(row)] || 1
        }))
      })
      message.success('Noon ASN 已创建')
      setCreateOpen(false)
      await loadAsns()
      await loadAppointmentHistory()
    } catch (error) {
      message.error(officialWarehouseError(error, '创建 Noon ASN 失败'))
      await loadAsns()
      await loadAppointmentHistory()
    } finally {
      setSubmitting(false)
    }
  }

  async function openDetail(row: OfficialWarehouseAsn) {
    setSelectedAsn(row)
    setSelectedInboundRows([])
    if (!storeCode || !siteCode) {
      return
    }
    const requestId = inboundDetailRequestRef.current + 1
    inboundDetailRequestRef.current = requestId
    setSelectedInboundLoading(true)
    try {
      const view = await loadOfficialWarehouseInboundStatistics({
        storeCode,
        siteCode,
        keyword: inboundDetailSearchKeyword(row)
      })
      if (inboundDetailRequestRef.current !== requestId) {
        return
      }
      setSelectedInboundRows(filterInboundDetailRows(view.rows || [], row))
    } catch (error) {
      if (inboundDetailRequestRef.current === requestId) {
        message.error(officialWarehouseError(error, '读取 ASN 入仓详情失败'))
      }
    } finally {
      if (inboundDetailRequestRef.current === requestId) {
        setSelectedInboundLoading(false)
      }
    }
  }

  function closeDetail() {
    inboundDetailRequestRef.current += 1
    setSelectedAsn(undefined)
    setSelectedInboundRows([])
    setSelectedInboundLoading(false)
  }

  function requestOpenAppointment(row: OfficialWarehouseAsn, mode: AppointmentSubmitMode) {
    if (mode === 'manual' && isAutoAppointmentRunning(row)) {
      message.warning('自动约仓处理中，不能手动约仓。')
      return
    }
    if (row.appointment?.status === 'SCHEDULED') {
      setRescheduleConfirm({ row, mode })
      return
    }
    openAppointment(row, mode)
  }

  function confirmRescheduleAppointment() {
    if (!rescheduleConfirm) return
    const next = rescheduleConfirm
    setRescheduleConfirm(undefined)
    openAppointment(next.row, next.mode)
  }

  function openAppointment(row: OfficialWarehouseAsn, mode: AppointmentSubmitMode) {
    const firstWarehouse = row.routingWarehouses?.[0]
    const appointment = row.appointment
    setAppointmentTarget(row)
    setAppointmentMode(mode)
    setAppointmentForm({
      warehouseToPartnerCode:
        appointment?.warehouseToPartnerCode ||
        row.selectedWarehousePartnerCode ||
        firstWarehouse?.partnerCode ||
        '',
      warehouseToCode: appointment?.warehouseToCode || row.selectedWarehouseCode || firstWarehouse?.code,
      apDates: appointment?.apStartDate && appointment.apEndDate
        ? [dayjs(appointment.apStartDate), dayjs(appointment.apEndDate)]
        : [dayjs().add(1, 'day'), dayjs().add(30, 'day')],
      apTimeRange: parseNoonTimeRange(appointment?.apTimeRange),
      availableToday: Boolean(appointment?.availableToday),
      selectedSlotKey: undefined
    })
    setAvailabilitySlots([])
    setAvailabilityError(undefined)
    setAppointmentSubmitFeedback(undefined)
    setManualDateOffset(0)
    setManualSelectedDate(undefined)
    setAppointmentOpen(true)
  }

  async function submitAppointment() {
    if (!appointmentTarget) return
    if (!appointmentForm.apDates) {
      message.warning('请选择约仓日期范围')
      return
    }
    if (!appointmentForm.warehouseToPartnerCode.trim()) {
      message.warning('请选择到达仓库')
      return
    }
    const payload = buildAppointmentPayload()
    if (!payload) {
      message.warning('请选择约仓日期范围')
      return
    }
    setAppointmentSubmitting(true)
    try {
      if (appointmentMode === 'manual') {
        const selectedSlot = availabilitySlots.find((slot) => availabilitySlotKey(slot) === appointmentForm.selectedSlotKey)
        if (!selectedSlot) {
          setAppointmentSubmitFeedback({
            type: 'warning',
            message: '当前没有可用仓位，请调整仓库或时间后重试'
          })
          message.warning('当前没有可用仓位，请调整仓库或时间后重试')
          return
        }
        setAppointmentSubmitFeedback(undefined)
        const result = await submitManualOfficialWarehouseAppointment(appointmentTarget.id, {
          ...payload,
          appointmentDate: selectedSlot.date,
          appointmentSlotId: selectedSlot.slotId,
          appointmentTime: selectedSlot.time
        })
        const resultMessage = buildManualAppointmentResultMessage(result)
        if (result.status === 'SCHEDULED') {
          message.success(resultMessage)
          setAppointmentOpen(false)
        } else if (result.failureType === 'NO_CAPACITY') {
          setAppointmentSubmitFeedback({ type: 'warning', message: resultMessage })
          message.warning(resultMessage)
        } else {
          setAppointmentSubmitFeedback({ type: 'error', message: compactAppointmentFeedbackMessage(resultMessage) })
          message.error(resultMessage)
        }
      } else {
        await upsertOfficialWarehouseAppointment(appointmentTarget.id, payload)
        message.success('自动约仓已提交')
        setAppointmentOpen(false)
      }
      await loadAsns()
      await loadAppointmentHistory()
    } catch (error) {
      const errorMessage = officialWarehouseError(error, appointmentMode === 'manual' ? '手动约仓失败' : '提交自动约仓失败')
      setAppointmentSubmitFeedback({ type: 'error', message: compactAppointmentFeedbackMessage(errorMessage) })
      message.error(errorMessage)
    } finally {
      setAppointmentSubmitting(false)
    }
  }

  async function runAppointmentNow(appointment: OfficialWarehouseAppointment) {
    setAppointmentRunningId(appointment.id)
    setAppointmentRunFeedback(undefined)
    try {
      const result = await runOfficialWarehouseAppointmentOnce(appointment.id)
      const feedback = buildAppointmentRunOnceFeedback(result)
      const feedbackPrefix = feedback.message.split('。原因：')[0]
      const feedbackDetail = result.errorMessage || result.failureType
        ? businessErrorText(result.errorMessage, result.failureType)
        : ''
      const feedbackMessage = feedbackDetail && feedback.type !== 'success'
        ? `${feedbackPrefix}。原因：${feedbackDetail}`
        : feedback.message
      setAppointmentRunFeedback({ type: feedback.type, message: feedbackMessage })
      if (feedback.type === 'success') {
        message.success(feedbackMessage)
      } else if (feedback.type === 'warning') {
        message.warning(feedbackMessage)
      } else {
        message.error(feedbackMessage)
      }
      await loadAsns()
      await loadAppointmentHistory()
    } catch (error) {
      const errorMessage = officialWarehouseError(error, '执行自动约仓失败')
      setAppointmentRunFeedback({ type: 'error', message: errorMessage })
      message.error(errorMessage)
      await loadAsns()
      await loadAppointmentHistory()
    } finally {
      setAppointmentRunningId(undefined)
    }
  }

  async function cancelAppointment(appointment: OfficialWarehouseAppointment) {
    setAppointmentRunningId(appointment.id)
    try {
      await cancelOfficialWarehouseAppointment(appointment.id)
      message.success('自动约仓已取消')
      await loadAsns()
      await loadAppointmentHistory()
    } catch (error) {
      message.error(officialWarehouseError(error, '取消自动约仓失败'))
      await loadAppointmentHistory()
    } finally {
      setAppointmentRunningId(undefined)
    }
  }

  async function downloadFbnTransferPdf(row: OfficialWarehouseAsn) {
    if (row.appointment?.status !== 'SCHEDULED') {
      message.warning('只有约仓成功后才能下载 PDF')
      return
    }
    setPdfPrintingAsnId(row.id)
    try {
      const detail = await loadOfficialWarehouseAsn(row.id)
      if (detail.appointment?.status !== 'SCHEDULED') {
        message.warning('当前 ASN 尚未确认约仓成功，请先同步 ASN 列表后再下载 PDF')
        return
      }
      await printFbnTransferPdf(detail, {
        printedBy: detail.noonUser || ''
      })
    } catch (error) {
      message.error(officialWarehouseError(error, '生成约仓 PDF 失败'))
    } finally {
      setPdfPrintingAsnId(undefined)
    }
  }

  function openCorrection(appointment: OfficialWarehouseAppointment) {
    setCorrectionTarget(appointment)
    setCorrectionForm({
      status: appointment.status || 'PENDING',
      appointmentDate: appointment.appointmentDate ? dayjs(appointment.appointmentDate) : null,
      appointmentSlotId: appointment.appointmentSlotId,
      appointmentTime: appointment.appointmentTime || '',
      failureType: appointment.failureType || '',
      errorStage: appointment.errorStage || 'MANUAL_CORRECTION',
      errorMessage: appointment.errorMessage || ''
    })
    setCorrectionOpen(true)
  }

  async function submitCorrection() {
    if (!correctionTarget) return
    if (correctionForm.status === 'SCHEDULED' && !correctionForm.appointmentDate) {
      message.warning('订正为约仓成功时必须填写约仓日期')
      return
    }
    const payload: CorrectOfficialWarehouseAppointmentPayload = {
      status: correctionForm.status
    }
    if (correctionForm.status === 'SCHEDULED') {
      payload.appointmentDate = correctionForm.appointmentDate?.format('YYYY-MM-DD')
      payload.appointmentSlotId = correctionForm.appointmentSlotId
      payload.appointmentTime = correctionForm.appointmentTime.trim()
    }
    if (correctionForm.status === 'FAILED') {
      payload.failureType = correctionForm.failureType.trim() || 'MANUAL_CORRECTION'
      payload.errorStage = correctionForm.errorStage.trim() || 'MANUAL_CORRECTION'
      payload.errorMessage = correctionForm.errorMessage.trim()
    }
    setCorrectionSubmitting(true)
    try {
      await correctOfficialWarehouseAppointment(correctionTarget.id, payload)
      message.success('约仓记录已订正')
      setCorrectionOpen(false)
      await loadAsns()
      await loadAppointmentHistory()
    } catch (error) {
      message.error(officialWarehouseError(error, '订正约仓记录失败'))
    } finally {
      setCorrectionSubmitting(false)
    }
  }

  const asnColumns: ColumnsType<OfficialWarehouseAsn> = [
    {
      title: 'ASN / 状态',
      width: 150,
      fixed: 'left',
      render: (_, row) => {
        const asnNo = officialWarehousePublicAsnNo(row)
        return (
          <div className="official-warehouse-identity">
            <Text
              strong
              copyable={asnNo !== '-' ? { text: asnNo, tooltips: ['复制 ASN', '已复制'] } : false}
              className="official-warehouse-asn-copy"
            >
              {asnNo}
            </Text>
            {statusTag(row.status)}
          </div>
        )
      }
    },
    {
      title: '货量 / 仓库',
      width: 120,
      render: (_, row) => (
        <div className="official-warehouse-stack">
          <div className="official-warehouse-quantity">
            <span>{Number(row.totalQuantity || 0).toLocaleString()} 件</span>
          </div>
          {appointmentAwareWarehouseLabel(row)}
        </div>
      )
    },
    {
      title: '状态',
      width: 190,
      render: (_, row) => {
        if (asnHasInboundResult(row)) {
          return (
            <div className="official-warehouse-stack">
              {inboundStageTag(asnInboundStage(row))}
            </div>
          )
        }
        const appointment = row.appointment
        if (!appointment) {
          return (
            <div className="official-warehouse-stack">
              {row.noonAsnStatus ? noonAsnStatusTag(row.noonAsnStatus) : <Text type="secondary">未提交</Text>}
              {row.noonAsnStatus ? <Text type="secondary">{row.noonAsnStatus}</Text> : null}
            </div>
          )
        }
        const deliveryTimeText = appointmentDeliveryTimeText(appointment)
        const shouldLabelDeliveryTime = appointment.status === 'SCHEDULED' && !asnHasInboundResult(row)
        return (
          <div className="official-warehouse-stack">
            {appointmentStatusTag(appointment.status)}
            {deliveryTimeText ? (
              shouldLabelDeliveryTime ? (
                <Text className="official-warehouse-delivery-time">送仓时间：{deliveryTimeText}</Text>
              ) : (
                <Text type="secondary">{deliveryTimeText}</Text>
              )
            ) : null}
          </div>
        )
      }
    },
    {
      title: '创建时间',
      render: (_, row) => (
        <div className="official-warehouse-stack">
          <Text>{row.createdAt || '-'}</Text>
          <Text type="secondary">{appointmentDurationText(row.appointment)}</Text>
        </div>
      )
    },
    {
      title: '操作',
      width: 400,
      fixed: 'right',
      render: (_, row) => {
        const inboundOnly = asnHasInboundResult(row)
        return (
          <Space size={4} wrap className="official-warehouse-actions">
            <Button size="small" icon={<EyeOutlined />} onClick={() => void openDetail(row)}>
              {inboundOnly ? '入仓详情' : '查看'}
            </Button>
            {!inboundOnly && row.appointment?.status === 'SCHEDULED' ? (
              <Button
                size="small"
                icon={<DownloadOutlined />}
                loading={pdfPrintingAsnId === row.id}
                onClick={() => void downloadFbnTransferPdf(row)}
              >
                下载 PDF
              </Button>
            ) : null}
            {!inboundOnly && row.status === 'LINES_CREATED' ? (
              <Button
                size="small"
                icon={<ThunderboltOutlined />}
                disabled={isAutoAppointmentRunning(row)}
                title={isAutoAppointmentRunning(row) ? '自动约仓处理中，不能手动约仓' : undefined}
                onClick={() => requestOpenAppointment(row, 'manual')}
              >
                手动约仓
              </Button>
            ) : null}
            {!inboundOnly && row.status === 'LINES_CREATED' ? (
              <Button size="small" icon={<CalendarOutlined />} onClick={() => requestOpenAppointment(row, 'auto')}>
                自动约仓
              </Button>
            ) : null}
            {!inboundOnly && row.appointment && !['SCHEDULED', 'CANCELED'].includes(row.appointment.status) ? (
              <Button
                size="small"
                icon={<ThunderboltOutlined />}
                loading={appointmentRunningId === row.appointment.id}
                onClick={() => void runAppointmentNow(row.appointment!)}
              >
                执行一次
              </Button>
            ) : null}
            {!inboundOnly && row.appointment && ['PENDING', 'RUNNING', 'FAILED'].includes(row.appointment.status) ? (
              <Button
                size="small"
                danger
                loading={appointmentRunningId === row.appointment.id}
                onClick={() => void cancelAppointment(row.appointment!)}
              >
                取消
              </Button>
            ) : null}
          </Space>
        )
      }
    }
  ]

  const appointmentColumns: ColumnsType<OfficialWarehouseAppointment> = [
    {
      title: 'ASN / 状态',
      width: 170,
      fixed: 'left',
      render: (_, row) => {
        const asnNo = officialWarehousePublicAsnNo(row)
        return (
          <div className="official-warehouse-identity">
            <Text
              strong
              copyable={asnNo !== '-' ? { text: asnNo, tooltips: ['复制 ASN', '已复制'] } : false}
              className="official-warehouse-asn-copy"
            >
              {asnNo}
            </Text>
            {appointmentStatusTag(row.status)}
          </div>
        )
      }
    },
    {
      title: '店铺/站点',
      width: 150,
      render: (_, row) => (
        <div className="official-warehouse-stack">
          <Text>{row.storeCode || '-'}</Text>
          <Text type="secondary">{row.siteCode || '-'}</Text>
        </div>
      )
    },
    {
      title: '仓库',
      width: 160,
      render: (_, row) => (
        <div className="official-warehouse-stack">
          <Text>{row.warehouseToPartnerCode || '-'}</Text>
          <Text type="secondary">{row.warehouseFrom || '-'}</Text>
        </div>
      )
    },
    {
      title: '预约范围',
      width: 210,
      render: (_, row) => (
        <div className="official-warehouse-stack">
          <Text>{row.apStartDate} - {row.apEndDate}</Text>
          <Text type="secondary">{row.apTimeRange || '全天'}</Text>
        </div>
      )
    },
    {
      title: '预约结果',
      width: 170,
      render: (_, row) => row.appointmentDate
        ? `${row.appointmentDate} ${row.appointmentTime || ''}`.trim()
        : '-'
    },
    {
      title: '尝试',
      width: 130,
      render: (_, row) => (
        <div className="official-warehouse-stack">
          <Text>{row.attemptCount || 0} 次</Text>
          <Text type="secondary">{row.lastAttemptAt || '-'}</Text>
        </div>
      )
    },
    {
      title: '失败原因',
      width: 260,
      ellipsis: true,
      render: (_, row) => row.failureType || row.errorMessage
        ? <Text type="danger">{businessErrorText(row.errorMessage, row.failureType)}</Text>
        : '-'
    },
    {
      title: '创建时间',
      width: 170,
      render: (_, row) => (
        <div className="official-warehouse-stack">
          <Text>{row.createdAt || '-'}</Text>
          <Text type="secondary">{appointmentDurationText(row)}</Text>
        </div>
      )
    },
    {
      title: '操作',
      width: 96,
      fixed: 'right',
      render: (_, row) => (
        <Button size="small" onClick={() => openCorrection(row)}>
          订正
        </Button>
      )
    }
  ]

  const candidateColumns: ColumnsType<OfficialWarehouseProductCandidate> = [
    {
      title: '商品',
      width: 330,
      render: (_, row) => (
        <div className="official-warehouse-product-cell official-warehouse-product-cell--candidate">
          {row.imageUrl ? (
            <Image
              src={row.imageUrl}
              fallback={PRODUCT_IMAGE_FALLBACK}
              width={60}
              height={60}
              preview={{ mask: '查看大图' }}
            />
          ) : (
            <div className="official-warehouse-image-placeholder" />
          )}
          <div className="official-warehouse-stack">
            <Text strong>{row.title || displayPsku(row)}</Text>
            <Text className="official-warehouse-code-line" type="secondary" copyable>
              PSKU: {displayPsku(row)}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: 'Noon SKU',
      width: 260,
      render: (_, row) => {
        const batchLimit = selectedShippingBatchIds.length ? Number(row.batchAvailableQuantity || 0) : 0
        return (
          <div className="official-warehouse-stack">
            <Text copyable>{row.noonSku}</Text>
            {batchLimit > 0 ? <Text type="secondary">批次可用 {batchLimit}</Text> : null}
          </div>
        )
      }
    },
    {
      title: '尺寸 / 体积',
      width: 180,
      render: (_, row) => (
        <div className="official-warehouse-stack">
          <Text>{formatDimension(row)}</Text>
          <Text type="secondary">{row.cubicFeet ?? '-'} ft³</Text>
        </div>
      )
    },
    {
      title: 'Storage',
      dataIndex: 'storageTypeCode',
      width: 106,
      render: (value?: string) => <Tag>{value || 'standard'}</Tag>
    },
    {
      title: '数量',
      width: 120,
      render: (_, row) => {
        const batchLimit = selectedShippingBatchIds.length ? Number(row.batchAvailableQuantity || 0) : 0
        const maxQuantity = batchLimit > 0 ? batchLimit : undefined
        const candidateKey = officialWarehouseCandidateKey(row)
        const quantity = quantityByCandidateKey[candidateKey] || maxQuantity || 1
        return (
          <div className="official-warehouse-stack">
            <InputNumber
              min={1}
              max={maxQuantity}
              precision={0}
              value={quantity}
              onChange={(value) =>
                setQuantityByCandidateKey((current) => {
                  const normalized = Math.max(1, Number(value || 0))
                  return {
                    ...current,
                    [candidateKey]: maxQuantity ? Math.min(normalized, maxQuantity) : normalized
                  }
                })
              }
            />
          </div>
        )
      }
    },
    {
      title: '数据状态',
      width: 160,
      render: (_, row) => (
        <Space size={4} wrap>
          {row.missingTags?.length ? row.missingTags.map((tag) => <Tag key={tag} color="red">{tag}</Tag>) : <Tag color="green">可创建</Tag>}
        </Space>
      )
    }
  ]

  const lineColumns: ColumnsType<OfficialWarehouseAsnLine> = [
    {
      title: '商品',
      width: 300,
      render: (_, row) => (
        <div className="official-warehouse-product-cell">
          {row.imageUrl ? (
            <Image
              src={row.imageUrl}
              fallback={PRODUCT_IMAGE_FALLBACK}
              width={42}
              height={42}
              preview={false}
            />
          ) : (
            <div className="official-warehouse-image-placeholder" />
          )}
          <div className="official-warehouse-stack">
            <Text strong>{row.title || displayPsku(row)}</Text>
            <Text type="secondary">PSKU：{displayPsku(row)}</Text>
          </div>
        </div>
      )
    },
    { title: 'Noon SKU', dataIndex: 'noonSku', width: 180 },
    { title: '数量', dataIndex: 'quantity', width: 72 },
    { title: '单件体积', dataIndex: 'cubicFeet', width: 110, render: formatCubicFeet },
    { title: '存储类型', dataIndex: 'storageTypeCode', width: 104, render: (value?: string) => <Tag>{value || 'standard'}</Tag> },
    { title: '商品状态', dataIndex: 'lineStatus', width: 96, render: lineStatusTag }
  ]

  const inboundDetailColumns: ColumnsType<OfficialWarehouseInboundStatisticsRow> = [
    {
      title: 'ASN / 入仓单',
      width: 190,
      render: (_, row) => (
        <div className="official-warehouse-stack">
          <Text strong>{row.noonAsnNr || row.localAsnNo || '-'}</Text>
          {row.localAsnNo && row.noonAsnNr !== row.localAsnNo ? <Text type="secondary">{row.localAsnNo}</Text> : null}
        </div>
      )
    },
    {
      title: '入仓状态',
      dataIndex: 'inboundStage',
      width: 110,
      render: inboundStageTag
    },
    {
      title: '件数',
      dataIndex: 'totalQuantity',
      width: 88,
      render: (value: number) => Number(value || 0).toLocaleString()
    },
    {
      title: '预约状态',
      dataIndex: 'appointmentStatus',
      width: 110,
      render: appointmentStatusTag
    },
    {
      title: 'Noon状态',
      dataIndex: 'noonAsnStatus',
      width: 120,
      render: (value: string | undefined, row) => noonAsnStatusTag(value, row.appointmentStatus)
    },
    {
      title: 'Noon仓',
      width: 150,
      render: (_, row) => row.selectedWarehousePartnerCode || '-'
    }
  ]

  return (
    <div className="official-warehouse-page">
      <div className="official-warehouse-toolbar">
        <div className="official-warehouse-toolbar-left">
          <Input
            className="official-warehouse-search"
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Noon ASN"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onPressEnter={() => void loadAsns()}
          />
          <Button icon={<ReloadOutlined />} onClick={() => void loadAsns()} loading={loading}>
            刷新
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => void syncNoonAsnList()} loading={asnSyncing}>
            同步 ASN 列表
          </Button>
        </div>
        <div className="official-warehouse-toolbar-right">
          <Button icon={<CalendarOutlined />} onClick={() => setAppointmentHistoryOpen(true)}>
            约仓历史
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            创建 ASN
          </Button>
        </div>
      </div>

      {loadError ? <Alert type="error" showIcon message={loadError} /> : null}
      {asnSyncFeedback ? (
        <Alert
          type={asnSyncFeedback.type}
          showIcon
          closable
          message={asnSyncFeedback.message}
          onClose={() => setAsnSyncFeedback(undefined)}
        />
      ) : null}
      {appointmentRunFeedback ? (
        <Alert
          type={appointmentRunFeedback.type}
          showIcon
          closable
          message={appointmentRunFeedback.message}
          onClose={() => setAppointmentRunFeedback(undefined)}
        />
      ) : null}

      <div className="official-warehouse-metrics">
        <Metric label="ASN批次" value={summary.asnTotal} />
        <Metric label="创建成功" value={summary.asnCreated} tone="green" />
        <Metric label="处理中" value={summary.asnProcessing} tone="blue" />
        <Metric label="失败" value={summary.asnFailed} tone="red" />
        <Metric label="约仓中" value={summary.appointmentPending} tone="blue" />
        <Metric label="约仓成功" value={summary.appointmentSuccess} tone="green" />
        <Metric label="约仓失败" value={summary.appointmentFailed} tone="red" />
        <Metric label="总件数" value={summary.totalQuantity} />
      </div>

      <div className="official-warehouse-table-panel">
        <Table
          className="official-warehouse-asn-table"
          rowKey="id"
          size="small"
          loading={loading}
          columns={asnColumns}
          dataSource={visibleAsns}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          scroll={{ x: 1320 }}
          locale={{ emptyText: <Empty description="暂无 Noon 官方仓 ASN" /> }}
        />
      </div>

      <Modal
        title="约仓历史"
        open={appointmentHistoryOpen}
        width={1280}
        footer={null}
        onCancel={() => setAppointmentHistoryOpen(false)}
        destroyOnClose={false}
      >
        <div className="official-warehouse-history-modal-content">
          <div className="official-warehouse-section-header">
            <Text type="secondary">记录手动约仓、自动约仓、失败原因和人工订正结果</Text>
            <Space wrap>
              <Select
                allowClear
                className="official-warehouse-status-filter"
                placeholder="约仓状态"
                value={appointmentStatusFilter}
                options={APPOINTMENT_STATUS_OPTIONS}
                onChange={(value) => setAppointmentStatusFilter(value)}
              />
              <Input
                className="official-warehouse-search"
                allowClear
                prefix={<SearchOutlined />}
                placeholder="ASN / 仓库"
                value={appointmentKeyword}
                onChange={(event) => setAppointmentKeyword(event.target.value)}
                onPressEnter={() => void loadAppointmentHistory()}
              />
              <Button icon={<ReloadOutlined />} onClick={() => void loadAppointmentHistory()} loading={appointmentHistoryLoading}>
                刷新历史
              </Button>
            </Space>
          </div>
          <div className="official-warehouse-metrics official-warehouse-history-metrics">
            <Metric label="约仓记录" value={appointmentHistorySummary.total} />
            <Metric label="约仓中" value={appointmentHistorySummary.pending} tone="blue" />
            <Metric label="成功" value={appointmentHistorySummary.scheduled} tone="green" />
            <Metric label="失败" value={appointmentHistorySummary.failed} tone="red" />
            <Metric label="已取消" value={appointmentHistorySummary.canceled} />
            <Metric label="无仓位" value={appointmentHistorySummary.noCapacity} tone="red" />
          </div>
          <Table
            rowKey="id"
            size="small"
            loading={appointmentHistoryLoading}
            columns={appointmentColumns}
            dataSource={appointments}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 1420 }}
            locale={{ emptyText: <Empty description="暂无约仓历史" /> }}
          />
        </div>
      </Modal>

      <Modal
        title="选择商品创建 Noon ASN"
        open={createOpen}
        width={1040}
        onCancel={() => setCreateOpen(false)}
        onOk={() => void submitCreateAsn()}
        confirmLoading={submitting}
        okText="创建 ASN"
        destroyOnClose
      >
        <div className="official-warehouse-modal-body">
          <div className="official-warehouse-shipping-picker">
            <div className="official-warehouse-shipping-picker-header">
              <div className="official-warehouse-stack">
                <Text strong>物流批次号</Text>
                <Text type="secondary">可多选；显示可约仓批次、已建ASN批次和已约仓批次；已使用批次排在下方并标注。</Text>
              </div>
              <Space>
                <Input
                  className="official-warehouse-batch-search"
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="搜索物流批次号"
                  value={shippingBatchKeyword}
                  onChange={(event) => setShippingBatchKeyword(event.target.value)}
                  onPressEnter={() => void loadShippingBatches()}
                />
                <Button icon={<SearchOutlined />} onClick={() => void loadShippingBatches()} loading={shippingBatchLoading}>
                  搜索物流批次号
                </Button>
              </Space>
            </div>
            <Select
              mode="multiple"
              allowClear
              showSearch
              placeholder="选择物流批次号"
              loading={shippingBatchLoading}
              value={selectedShippingBatchIds}
              options={shippingBatchOptions}
              filterOption={(input, option) =>
                String(option?.label || '').toLowerCase().includes(input.toLowerCase())
              }
              onChange={(value) => {
                const nextBatchIds = Array.isArray(value) ? value : []
                setSelectedShippingBatchIds(nextBatchIds)
                void loadCandidates(nextBatchIds, candidateKeyword)
              }}
              maxTagCount="responsive"
            />
          </div>
          <div className="official-warehouse-toolbar official-warehouse-modal-toolbar">
            <div className="official-warehouse-toolbar-left">
              <Input
                className="official-warehouse-search"
                allowClear
                prefix={<SearchOutlined />}
                placeholder="搜索 SKU / PSKU / 中文标题 / 英文标题"
                value={candidateKeyword}
                onChange={(event) => setCandidateKeyword(event.target.value)}
                onPressEnter={() => void loadCandidates(selectedShippingBatchIds, candidateKeyword)}
              />
              <Button
                icon={<SearchOutlined />}
                onClick={() => void loadCandidates(selectedShippingBatchIds, candidateKeyword)}
                loading={candidateLoading}
              >
                搜索
              </Button>
            </div>
          </div>
          <Table
            rowKey={officialWarehouseCandidateKey}
            size="small"
            loading={candidateLoading}
            columns={candidateColumns}
            dataSource={candidates}
            pagination={false}
            scroll={{ x: 1160 }}
            rowSelection={{
              selectedRowKeys: selectedCandidateKeys,
              onChange: setSelectedCandidateKeys,
              getCheckboxProps: (row) => ({
                disabled: Boolean(row.missingTags?.length || !row.partnerSku),
                title: row.partnerSku ? undefined : '缺少 PSKU，不能创建 ASN'
              })
            }}
            locale={{
              emptyText: (
                <Empty
                  description={candidateEmptyDescription}
                />
              )
            }}
          />
        </div>
      </Modal>

      <Modal
        title="确认重新约仓"
        open={Boolean(rescheduleConfirm)}
        onCancel={() => setRescheduleConfirm(undefined)}
        onOk={confirmRescheduleAppointment}
        okText={rescheduleConfirm?.mode === 'manual' ? '继续手动约仓' : '继续自动约仓'}
        cancelText="取消"
        destroyOnClose
      >
        <Text>
          当前 ASN 已约仓成功。继续操作会取消当前约仓，并按新的仓库和时间重新约仓。
        </Text>
      </Modal>

      <Modal
        title={appointmentTarget ? `${officialWarehousePublicAsnNo(appointmentTarget)} ${appointmentMode === 'manual' ? '手动约仓' : '自动约仓'}` : appointmentMode === 'manual' ? '手动约仓' : '自动约仓'}
        open={appointmentOpen}
        width={appointmentMode === 'manual' ? 980 : 560}
        onCancel={() => setAppointmentOpen(false)}
        onOk={() => void submitAppointment()}
        confirmLoading={appointmentSubmitting}
        okText={appointmentMode === 'manual' ? '立即约仓' : '提交自动约仓'}
        destroyOnClose
      >
        {appointmentMode === 'manual' ? (
          <div className="official-warehouse-manual-picker">
            <div className="official-warehouse-appointment-form official-warehouse-manual-basic-form">
              <label className="official-warehouse-field">
                <span>到达仓库</span>
                <Select
                  value={appointmentForm.warehouseToPartnerCode || undefined}
                  options={appointmentWarehouseOptions}
                  placeholder="请选择 Noon 路由仓"
                  onChange={(value, option) => {
                    const selected = Array.isArray(option) ? option[0] : option
                    setAppointmentForm((current) => ({
                      ...current,
                      warehouseToPartnerCode: value,
                      warehouseToCode: selected?.code,
                      selectedSlotKey: undefined
                    }))
                    setAvailabilitySlots([])
                    setAvailabilityError(undefined)
                    setAppointmentSubmitFeedback(undefined)
                    setManualSelectedDate(undefined)
                  }}
                />
              </label>
            </div>
            <div className="official-warehouse-month-label">
              <span>{manualMonthLabel}</span>
            </div>
            <div className="official-warehouse-date-row">
              <Button
                shape="circle"
                className="official-warehouse-date-arrow"
                icon={<LeftOutlined />}
                disabled={availabilityLoading || manualDateOffset <= 0}
                onClick={() => setManualDateOffset((current) => Math.max(0, current - 1))}
              />
              <div className="official-warehouse-date-pills">
                {manualVisibleDates.map((date) => {
                  const active = date === selectedManualDate
                  return (
                    <button
                      key={date}
                      type="button"
                      disabled={availabilityLoading}
                      className={`official-warehouse-date-pill${active ? ' official-warehouse-date-pill-active' : ''}`}
                      onClick={() => {
                        const firstSlot = availabilitySlots.find((slot) => slot.date === date)
                        setManualSelectedDate(date)
                        setAppointmentSubmitFeedback(undefined)
                        setAppointmentForm((current) => ({
                          ...current,
                          selectedSlotKey: firstSlot ? availabilitySlotKey(firstSlot) : undefined
                        }))
                      }}
                    >
                      {dayjs(date).format('D')}
                    </button>
                  )
                })}
              </div>
              <Button
                shape="circle"
                className="official-warehouse-date-arrow"
                icon={<RightOutlined />}
                disabled={availabilityLoading || manualDateOffset + 5 >= manualCalendarDates.length}
                onClick={() =>
                  setManualDateOffset((current) => Math.min(Math.max(0, manualCalendarDates.length - 5), current + 1))
                }
              />
            </div>
            {availabilityLoading ? (
              <div className="official-warehouse-slot-empty">正在查询 Noon 仓位...</div>
            ) : null}
            {availabilityError ? <Alert type="error" showIcon message={availabilityError} /> : null}
            {appointmentSubmitFeedback ? (
              <Alert type={appointmentSubmitFeedback.type} showIcon message={appointmentSubmitFeedback.message} />
            ) : null}
            {!availabilityLoading && !availabilityError && manualAvailabilityQueryKey && !availabilitySlots.length ? (
              <Alert
                type="warning"
                showIcon
                message="当前仓库和时间暂无可用仓位，可调整时间范围后再手动约仓，或另行提交自动约仓。"
              />
            ) : null}
            <div className="official-warehouse-slot-grid">
              {manualSlotsForSelectedDate.map((slot) => {
                const active = availabilitySlotKey(slot) === appointmentForm.selectedSlotKey
                const [from, to] = splitSlotTime(slot.time)
                return (
                  <button
                    key={availabilitySlotKey(slot)}
                    type="button"
                    className={`official-warehouse-slot-card${active ? ' official-warehouse-slot-card-active' : ''}`}
                    onClick={() => {
                      setAppointmentSubmitFeedback(undefined)
                      setAppointmentForm((current) => ({ ...current, selectedSlotKey: availabilitySlotKey(slot) }))
                    }}
                  >
                    <span className="official-warehouse-slot-caption">From</span>
                    <span className="official-warehouse-slot-caption official-warehouse-slot-caption-to">To</span>
                    <span className="official-warehouse-slot-time">{from}</span>
                    <span className="official-warehouse-slot-dash">-</span>
                    <span className="official-warehouse-slot-time">{to}</span>
                  </button>
                )
              })}
            </div>
            {!availabilityLoading && !availabilityError && manualAvailabilityQueryKey && selectedManualDate && !manualSlotsForSelectedDate.length ? (
              <div className="official-warehouse-slot-empty">当前日期暂无可用时段</div>
            ) : null}
          </div>
        ) : (
          <div className="official-warehouse-appointment-form">
            <label className="official-warehouse-field">
              <span>到达仓库</span>
              <Select
                value={appointmentForm.warehouseToPartnerCode || undefined}
                options={appointmentWarehouseOptions}
                placeholder="请选择 Noon 路由仓"
                onChange={(value, option) => {
                  const selected = Array.isArray(option) ? option[0] : option
                  setAppointmentForm((current) => ({
                    ...current,
                    warehouseToPartnerCode: value,
                    warehouseToCode: selected?.code
                  }))
                }}
              />
            </label>
            <label className="official-warehouse-field">
              <span>约仓日期</span>
              <DatePicker.RangePicker
                value={appointmentForm.apDates}
                disabledDate={(current) => Boolean(current && current < dayjs().startOf('day'))}
                onChange={(dates) =>
                  setAppointmentForm((current) => ({
                    ...current,
                    apDates: dates?.[0] && dates?.[1] ? [dates[0], dates[1]] : null
                  }))
                }
              />
            </label>
            <label className="official-warehouse-field">
              <span>约仓时间</span>
              <Select
                mode="multiple"
                allowClear
                maxTagCount={4}
                value={appointmentForm.apTimeRange}
                options={appointmentTimeOptions}
                placeholder="不选表示全天"
                onChange={(values) =>
                  setAppointmentForm((current) => ({ ...current, apTimeRange: values }))
                }
              />
            </label>
            <Checkbox
              checked={appointmentForm.availableToday}
              onChange={(event) =>
                setAppointmentForm((current) => ({ ...current, availableToday: event.target.checked }))
              }
            >
              可约当天
            </Checkbox>
            {appointmentSubmitFeedback ? (
              <Alert type={appointmentSubmitFeedback.type} showIcon message={appointmentSubmitFeedback.message} />
            ) : null}
          </div>
        )}
      </Modal>

      <Modal
        title={correctionTarget ? `${officialWarehousePublicAsnNo(correctionTarget)} 约仓订正` : '约仓订正'}
        open={correctionOpen}
        width={560}
        onCancel={() => setCorrectionOpen(false)}
        onOk={() => void submitCorrection()}
        confirmLoading={correctionSubmitting}
        okText="保存订正"
        destroyOnClose
      >
        <div className="official-warehouse-appointment-form">
          <label className="official-warehouse-field">
            <span>订正状态</span>
            <Select
              value={correctionForm.status}
              options={APPOINTMENT_CORRECTION_STATUS_OPTIONS}
              onChange={(value) => setCorrectionForm((current) => ({ ...current, status: value }))}
            />
          </label>
          {correctionForm.status === 'SCHEDULED' ? (
            <>
              <label className="official-warehouse-field">
                <span>约仓日期</span>
                <DatePicker
                  value={correctionForm.appointmentDate}
                  onChange={(date) => setCorrectionForm((current) => ({ ...current, appointmentDate: date }))}
                />
              </label>
              <label className="official-warehouse-field">
                <span>Slot ID</span>
                <InputNumber
                  min={1}
                  value={correctionForm.appointmentSlotId}
                  onChange={(value) => setCorrectionForm((current) => ({ ...current, appointmentSlotId: value || undefined }))}
                />
              </label>
              <label className="official-warehouse-field">
                <span>约仓时段</span>
                <Input
                  value={correctionForm.appointmentTime}
                  onChange={(event) => setCorrectionForm((current) => ({ ...current, appointmentTime: event.target.value }))}
                  placeholder="例如 9am-10am"
                />
              </label>
            </>
          ) : null}
          {correctionForm.status === 'FAILED' ? (
            <>
              <label className="official-warehouse-field">
                <span>失败类型</span>
                <Input
                  value={correctionForm.failureType}
                  onChange={(event) => setCorrectionForm((current) => ({ ...current, failureType: event.target.value }))}
                  placeholder="例如 NO_CAPACITY"
                />
              </label>
              <label className="official-warehouse-field">
                <span>失败阶段</span>
                <Input
                  value={correctionForm.errorStage}
                  onChange={(event) => setCorrectionForm((current) => ({ ...current, errorStage: event.target.value }))}
                  placeholder="例如 MANUAL_CORRECTION"
                />
              </label>
              <label className="official-warehouse-field official-warehouse-field-wide">
                <span>说明</span>
                <Input.TextArea
                  rows={3}
                  value={correctionForm.errorMessage}
                  onChange={(event) => setCorrectionForm((current) => ({ ...current, errorMessage: event.target.value }))}
                  placeholder="记录人工核对或 Noon 后台原因"
                />
              </label>
            </>
          ) : null}
        </div>
      </Modal>

      <Drawer
        title={selectedAsn ? `${officialWarehousePublicAsnNo(selectedAsn)} 详情` : 'ASN详情'}
        width={860}
        open={Boolean(selectedAsn)}
        onClose={closeDetail}
      >
        {selectedAsn ? (
          <div className="official-warehouse-detail-section">
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label="状态">{statusTag(selectedAsn.status)}</Descriptions.Item>
              <Descriptions.Item label="Noon ASN">{officialWarehousePublicAsnNo(selectedAsn)}</Descriptions.Item>
              <Descriptions.Item label="站点">{selectedAsn.siteCode}</Descriptions.Item>
              <Descriptions.Item label="商品种类">{asnProductCountText(selectedAsn)}</Descriptions.Item>
              <Descriptions.Item label="总件数">{selectedAsn.totalQuantity || 0}</Descriptions.Item>
              <Descriptions.Item label="约仓状态">
                {selectedAsn.appointment
                  ? appointmentStatusTag(selectedAsn.appointment.status)
                  : noonAsnStatusTag(selectedAsn.noonAsnStatus)}
              </Descriptions.Item>
              <Descriptions.Item label="约仓时间">
                {appointmentDeliveryTimeText(selectedAsn.appointment) || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="失败信息" span={2}>
                {selectedAsn.errorMessage || selectedAsn.appointment?.errorMessage ? (
                  <Text type="danger">
                    {businessErrorText(
                      selectedAsn.errorMessage || selectedAsn.appointment?.errorMessage,
                      selectedAsn.failureType || selectedAsn.appointment?.failureType
                    )}
                  </Text>
                ) : '-'}
              </Descriptions.Item>
            </Descriptions>
            {selectedAsn.shippingBatchLinks?.length ? (
              <div className="official-warehouse-link-summary">
                <Text strong>物流批次号关联</Text>
                <div className="official-warehouse-link-summary-list">
                  {shippingLinkSummaryItems(selectedAsn).map((item) => (
                    <div className="official-warehouse-link-summary-item" key={item.key}>
                      <Text strong>{item.batchNo}</Text>
                      <Text>{Number(item.quantity || 0).toLocaleString()} 件</Text>
                      <Text type="secondary">
                        {item.purchaseOrders.length ? `${item.purchaseOrders.length} 个采购单` : '采购单未记录'}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <Table
              rowKey={(row) => `${row.asnId || ''}-${row.noonAsnNr || ''}-${row.localAsnNo || ''}`}
              size="small"
              columns={inboundDetailColumns}
              dataSource={selectedInboundRows}
              loading={selectedInboundLoading}
              pagination={false}
              scroll={{ x: 760 }}
              locale={{ emptyText: <Empty description="暂无入仓详情" /> }}
              title={() => '入仓详情'}
            />
            <Table
              rowKey="id"
              size="small"
              columns={lineColumns}
              dataSource={selectedAsn.lines || []}
              pagination={false}
              scroll={{ x: 860 }}
              title={() => '商品明细'}
            />
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: 'green' | 'blue' | 'red' }) {
  const className = ['official-warehouse-metric', tone ? `official-warehouse-metric-${tone}` : ''].filter(Boolean).join(' ')
  return (
    <div className={className}>
      <span className="official-warehouse-metric-label">{label}:</span>
      <span className="official-warehouse-metric-value">{value}</span>
    </div>
  )
}

function defaultAppointmentForm(): AppointmentFormState {
  return {
    warehouseToPartnerCode: '',
    warehouseToCode: undefined,
    apDates: [dayjs().add(1, 'day'), dayjs().add(30, 'day')],
    apTimeRange: [],
    availableToday: false,
    selectedSlotKey: undefined
  }
}

function defaultCorrectionForm(): CorrectionFormState {
  return {
    status: 'PENDING',
    appointmentDate: null,
    appointmentSlotId: undefined,
    appointmentTime: '',
    failureType: '',
    errorStage: 'MANUAL_CORRECTION',
    errorMessage: ''
  }
}

function hourToNoonToken(hour: number) {
  if (hour === 0) return '12am'
  if (hour < 12) return `${hour}am`
  if (hour === 12) return '12pm'
  return `${hour - 12}pm`
}

function parseNoonTimeRange(value?: string) {
  if (!value?.trim()) {
    return []
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function availabilitySlotKey(slot: OfficialWarehouseAppointmentAvailability) {
  return `${slot.date || ''}|${slot.slotId || ''}|${slot.time || ''}`
}

function splitSlotTime(value?: string): [string, string] {
  if (!value?.trim()) {
    return ['-', '-']
  }
  const parts = value.split('-').map((item) => item.trim()).filter(Boolean)
  return [parts[0] || value, parts[1] || '-']
}

function compactAppointmentFeedbackMessage(value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= 240) {
    return normalized
  }
  return `${normalized.slice(0, 240)}...`
}
