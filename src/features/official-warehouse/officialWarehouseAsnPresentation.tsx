import { Space, Tag, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import type {
  OfficialWarehouseAppointment,
  OfficialWarehouseAsn,
  OfficialWarehouseAsnInboundLine,
  OfficialWarehouseAsnInboundSummary
} from './api'
import {
  appointmentStatusDisplayMeta,
  noonAsnStatusDisplayMeta,
  officialWarehouseBusinessErrorText,
  type OfficialWarehouseAppointmentFilterStatus,
  type OfficialWarehouseInboundFilterStatus
} from './domain'
import { inboundStageLabel } from './statisticsDomain'

const { Text } = Typography

export const STATUS_META: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '本地草稿', color: 'default' },
  ASN_CREATED: { label: 'ASN已生成', color: 'blue' },
  ROUTED: { label: '已路由仓', color: 'cyan' },
  LINES_CREATED: { label: '行已创建', color: 'green' },
  FAILED: { label: '失败', color: 'red' }
}

export const APPOINTMENT_STATUS_OPTIONS = [
  { label: '待约仓', value: 'PENDING' },
  { label: '约仓中', value: 'RUNNING' },
  { label: '约仓成功', value: 'SCHEDULED' },
  { label: '约仓失败', value: 'FAILED' },
  { label: '已取消', value: 'CANCELED' }
]

export const ASN_APPOINTMENT_STATUS_FILTER_OPTIONS: Array<{
  label: string
  value: OfficialWarehouseAppointmentFilterStatus
}> = [
  { label: '未约仓', value: 'NOT_APPOINTED' },
  { label: '约仓中', value: 'APPOINTING' },
  { label: '约仓成功', value: 'SCHEDULED' },
  { label: '约仓失败', value: 'FAILED' },
  { label: '已取消/过期', value: 'CANCELED' }
]

export const ASN_INBOUND_STATUS_FILTER_OPTIONS: Array<{
  label: string
  value: OfficialWarehouseInboundFilterStatus
}> = [
  { label: '未入仓', value: 'NOT_RECEIVED' },
  { label: '入仓中', value: 'RECEIVING' },
  { label: '已入仓', value: 'COMPLETED' }
]

export type InboundDiscrepancyFilter = 'SHORT' | 'OVER'

export const INBOUND_DISCREPANCY_FILTER_OPTIONS: Array<{
  label: string
  value: InboundDiscrepancyFilter
}> = [
  { label: '少入仓', value: 'SHORT' },
  { label: '超入仓', value: 'OVER' }
]

export const APPOINTMENT_CORRECTION_STATUS_OPTIONS = APPOINTMENT_STATUS_OPTIONS.filter((item) => item.value !== 'RUNNING')

export function statusTag(status?: string) {
  const meta = STATUS_META[status || ''] || { label: status || '-', color: 'default' }
  return <Tag color={meta.color}>{meta.label}</Tag>
}

export function appointmentStatusTag(status?: string) {
  const meta = appointmentStatusDisplayMeta(status)
  return <Tag color={meta.color}>{meta.label}</Tag>
}

export function noonAsnStatusTag(status?: string, appointmentStatus?: string) {
  const meta = noonAsnStatusDisplayMeta(status, appointmentStatus)
  return <Tag color={meta.color}>{meta.label}</Tag>
}

export function lineStatusTag(status?: string) {
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

export function inboundStageTag(status?: string) {
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

export function inboundProgress(summary?: OfficialWarehouseAsnInboundSummary) {
  if (!summary?.reportConnected) {
    return null
  }
  return (
    <>
      <Text className="official-warehouse-inbound-progress">
        已入仓 {Number(summary.receivedQuantity || 0).toLocaleString()} / 预计 {Number(summary.expectedQuantity || 0).toLocaleString()}
      </Text>
      {summary.shortQuantity || summary.overQuantity || summary.qcFailedQuantity || summary.unidentifiedQuantity ? (
        <Space size={4} wrap>
          {summary.shortQuantity ? <Tag color="red">少收 {Number(summary.shortQuantity).toLocaleString()}</Tag> : null}
          {summary.overQuantity ? <Tag color="orange">超收 {Number(summary.overQuantity).toLocaleString()}</Tag> : null}
          {summary.qcFailedQuantity ? <Tag color="volcano">QC {Number(summary.qcFailedQuantity).toLocaleString()}</Tag> : null}
          {summary.unidentifiedQuantity ? <Tag color="purple">未识别 {Number(summary.unidentifiedQuantity).toLocaleString()}</Tag> : null}
        </Space>
      ) : (
        <Tag color="green">数量正常</Tag>
      )}
    </>
  )
}

export function inboundLineStatusTag(status?: string) {
  const normalized = (status || '').trim().toUpperCase()
  if (normalized === 'NORMAL') return <Tag color="green">已入齐</Tag>
  if (normalized === 'SHORT_RECEIVED') return <Tag color="red">少收</Tag>
  if (normalized === 'OVER_RECEIVED') return <Tag color="orange">超收</Tag>
  if (normalized === 'QC_FAILED') return <Tag color="volcano">QC异常</Tag>
  if (normalized === 'UNIDENTIFIED') return <Tag color="purple">未识别</Tag>
  if (normalized === 'UNMATCHED') return <Tag color="gold">商品未匹配</Tag>
  if (normalized === 'NO_RECEIPT') return <Tag>暂无回执</Tag>
  return <Tag>{status || '-'}</Tag>
}

export function inboundReceiptQuantity(value: number, row: OfficialWarehouseAsnInboundLine) {
  return row.receiptLineCount > 0 ? Number(value || 0).toLocaleString() : '-'
}

export function normalizeAsnStatus(status?: string) {
  return (status || '').trim().toUpperCase()
}

export function asnInboundStage(row: Pick<OfficialWarehouseAsn, 'status' | 'noonAsnStatus'>) {
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

export function asnHasInboundResult(row: Pick<OfficialWarehouseAsn, 'status' | 'noonAsnStatus'>) {
  return ['GRN_COMPLETED', 'RECEIVING'].includes(asnInboundStage(row))
}

export function asnIsExpired(row: Pick<OfficialWarehouseAsn, 'noonAsnStatus'>) {
  return normalizeAsnStatus(row.noonAsnStatus) === 'EXPIRED'
}

export function appointmentAwareWarehouseLabel(
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

export function businessErrorText(message?: string, failureType?: string) {
  return officialWarehouseBusinessErrorText(message, failureType)
}

export function appointmentDurationText(appointment?: OfficialWarehouseAppointment, now: Dayjs = dayjs()) {
  if (!appointment?.createdAt) {
    return '-'
  }
  const start = dayjs(appointment.createdAt)
  if (!start.isValid()) {
    return '-'
  }
  const isActive = appointment.status === 'PENDING' || appointment.status === 'RUNNING'
  const endText = appointment.apSuccessTime || (!isActive ? appointment.updatedAt : undefined)
  if (!isActive && !endText) {
    return '-'
  }
  const end = isActive ? now : dayjs(endText)
  if (!end.isValid()) {
    return '-'
  }
  const totalSeconds = Math.max(0, end.diff(start, 'second'))
  const duration = formatDuration(totalSeconds)
  return isActive ? `已等待 ${duration}` : `总用时 ${duration}`
}

export function appointmentDeliveryTimeText(appointment?: OfficialWarehouseAppointment) {
  if (!appointment) {
    return ''
  }
  if (appointment.appointmentDate) {
    return `${appointment.appointmentDate} ${appointment.appointmentTime || ''}`.trim()
  }
  if (appointment.status === 'SCHEDULED') {
    return '约仓时间待同步'
  }
  if (appointment.apStartDate && appointment.apEndDate) {
    return `${appointment.apStartDate} - ${appointment.apEndDate}`
  }
  return ''
}

export function asnProductCountText(asn: OfficialWarehouseAsn) {
  const productCount = Number(asn.productCount || 0)
  const lineCount = Number(asn.lines?.length || 0)
  const resolvedCount = productCount > 0 ? productCount : lineCount
  return resolvedCount > 0 ? `${resolvedCount.toLocaleString()} SKU` : '-'
}

export function formatDuration(totalSeconds: number) {
  if (totalSeconds < 60) return `${totalSeconds}秒`
  const totalMinutes = Math.floor(totalSeconds / 60)
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

export function isAutoAppointmentRunning(row: OfficialWarehouseAsn) {
  const status = row.appointment?.status
  return status === 'PENDING' || status === 'RUNNING'
}

export function shippingLinkSummaryItems(asn: OfficialWarehouseAsn) {
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
