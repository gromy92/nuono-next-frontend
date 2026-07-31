import {
  appointmentStatusDisplayMeta,
  officialWarehouseAppointmentRequiresReconciliation
} from './officialWarehouseAppointmentLifecycle'

export * from './officialWarehouseSummaryDomain'
export {
  appointmentStatusDisplayMeta,
  buildAppointmentRunOnceFeedback,
  officialWarehouseAppointmentCanCancel,
  officialWarehouseAppointmentCanRun,
  officialWarehouseAppointmentRequiresReconciliation
} from './officialWarehouseAppointmentLifecycle'
export type {
  AppointmentRunOnceFeedback,
  AppointmentRunOnceResult,
  AppointmentStatusDisplayMeta
} from './officialWarehouseAppointmentLifecycle'

export type OfficialWarehousePublicAsnRow = {
  localAsnNo?: string
  asnNo?: string
  noonAsnNr?: string
}

export type ManualAppointmentResult = {
  status?: string
  failureType?: string
  errorMessage?: string
}

export type AppointmentHistorySummaryRow = {
  status?: string
  failureType?: string
}

export type AppointmentHistorySummary = {
  total: number
  pending: number
  scheduled: number
  failed: number
  canceled: number
  noCapacity: number
  reconciliationRequired: number
}

export type NoonAsnStatusDisplayMeta = {
  label: string
  color: string
}

export type OfficialWarehouseAppointmentFilterStatus =
  | 'NOT_APPOINTED'
  | 'APPOINTING'
  | 'RECONCILIATION_REQUIRED'
  | 'SCHEDULED'
  | 'FAILED'
  | 'CANCELED'

export type OfficialWarehouseInboundFilterStatus = 'NOT_RECEIVED' | 'RECEIVING' | 'COMPLETED'

export type OfficialWarehouseAsnFilterRow = {
  status?: string
  noonAsnStatus?: string
  appointment?: {
    status?: string
    failureType?: string
  } | null
}

export const DEFAULT_OFFICIAL_WAREHOUSE_APPOINTMENT_FILTER_STATUSES: OfficialWarehouseAppointmentFilterStatus[] = [
  'RECONCILIATION_REQUIRED',
  'APPOINTING',
  'SCHEDULED'
]

export function officialWarehouseAppointmentFilterStatus(
  row: OfficialWarehouseAsnFilterRow
): OfficialWarehouseAppointmentFilterStatus {
  if (officialWarehouseAppointmentRequiresReconciliation(row.appointment)) {
    return 'RECONCILIATION_REQUIRED'
  }
  const appointmentStatus = normalizeNoonStatus(row.appointment?.status)
  if (appointmentStatus === 'PENDING' || appointmentStatus === 'RUNNING') return 'APPOINTING'
  if (appointmentStatus === 'SCHEDULED') return 'SCHEDULED'
  if (appointmentStatus === 'FAILED') return 'FAILED'
  if (appointmentStatus === 'CANCELED' || appointmentStatus === 'CANCELLED') return 'CANCELED'

  const noonStatus = normalizeNoonStatus(row.noonAsnStatus)
  if (noonStatus === 'PENDING' || noonStatus === 'RUNNING') return 'APPOINTING'
  if (['SCHEDULED', 'HANDED_OVER', 'RECEIVING', 'GRN_COMPLETED', 'PUTAWAY_COMPLETED'].includes(noonStatus)) {
    return 'SCHEDULED'
  }
  if (noonStatus === 'FAILED') return 'FAILED'
  if (['CANCELED', 'CANCELLED', 'EXPIRED'].includes(noonStatus)) return 'CANCELED'
  return 'NOT_APPOINTED'
}

export function officialWarehouseInboundFilterStatus(
  row: OfficialWarehouseAsnFilterRow
): OfficialWarehouseInboundFilterStatus {
  const noonStatus = normalizeNoonStatus(row.noonAsnStatus)
  if (noonStatus === 'RECEIVING') return 'RECEIVING'
  if (noonStatus === 'GRN_COMPLETED' || noonStatus === 'PUTAWAY_COMPLETED') return 'COMPLETED'
  return 'NOT_RECEIVED'
}

export function matchesOfficialWarehouseAsnFilters(
  row: OfficialWarehouseAsnFilterRow,
  appointmentStatuses: ReadonlyArray<OfficialWarehouseAppointmentFilterStatus>,
  inboundStatuses: ReadonlyArray<OfficialWarehouseInboundFilterStatus>
) {
  const appointmentMatches = appointmentStatuses.length === 0 ||
    appointmentStatuses.includes(officialWarehouseAppointmentFilterStatus(row))
  const inboundMatches = inboundStatuses.length === 0 ||
    inboundStatuses.includes(officialWarehouseInboundFilterStatus(row))
  return appointmentMatches && inboundMatches
}

export function noonAsnStatusDisplayMeta(status?: string, appointmentStatus?: string): NoonAsnStatusDisplayMeta {
  const normalized = normalizeNoonStatus(status)
  if (appointmentStatus === 'PENDING' || appointmentStatus === 'RUNNING') {
    return appointmentStatusDisplayMeta(appointmentStatus)
  }
  if (normalized === 'SCHEDULED') {
    return { label: '约仓成功', color: 'green' }
  }
  if (normalized === 'GRN_COMPLETED') {
    return { label: '已入仓', color: 'green' }
  }
  if (normalized === 'RECEIVING') {
    return { label: '入仓中', color: 'processing' }
  }
  if (normalized === 'HANDED_OVER') {
    return { label: '已交仓', color: 'cyan' }
  }
  if (normalized === 'SEALED') {
    return { label: '待约仓', color: 'blue' }
  }
  if (normalized === 'CREATED') {
    return { label: 'ASN已生成', color: 'blue' }
  }
  if (normalized === 'EXPIRED') {
    return { label: '已过期', color: 'red' }
  }
  if (normalized === 'CANCELED' || normalized === 'CANCELLED') {
    return { label: '已取消', color: 'default' }
  }
  if (appointmentStatus) {
    return appointmentStatusDisplayMeta(appointmentStatus)
  }
  return { label: normalized || '未约仓', color: 'default' }
}

export function officialWarehousePublicAsnNo(row?: OfficialWarehousePublicAsnRow | null): string {
  const noonAsn = (row?.noonAsnNr || row?.asnNo || '').trim()
  return noonAsn || '-'
}

export function buildAppointmentHistorySummary(rows: AppointmentHistorySummaryRow[]): AppointmentHistorySummary {
  return rows.reduce<AppointmentHistorySummary>(
    (summary, row) => {
      summary.total += 1
      if (row.status === 'PENDING' || row.status === 'RUNNING') {
        summary.pending += 1
      }
      if (row.status === 'SCHEDULED') {
        summary.scheduled += 1
      }
      if (row.status === 'FAILED') {
        summary.failed += 1
      }
      if (row.status === 'CANCELED') {
        summary.canceled += 1
      }
      if (row.failureType === 'NO_CAPACITY') {
        summary.noCapacity += 1
      }
      if (officialWarehouseAppointmentRequiresReconciliation(row)) {
        summary.reconciliationRequired += 1
      }
      return summary
    },
    {
      total: 0,
      pending: 0,
      scheduled: 0,
      failed: 0,
      canceled: 0,
      noCapacity: 0,
      reconciliationRequired: 0
    }
  )
}

export function buildManualAppointmentResultMessage(result: ManualAppointmentResult): string {
  if (result.status === 'SCHEDULED') {
    return '手动约仓成功'
  }
  if (result.failureType === 'NO_CAPACITY') {
    return '当前时间范围暂无可约仓位，可调整时间范围后再手动约仓，或另行提交自动约仓。'
  }
  if (result.failureType === 'ASN_NOT_SEALED') {
    return 'Noon 已设置仓库，但 ASN 尚未 sealed，稍后再点立即约仓。'
  }
  if (result.status === 'FAILED') {
    return result.errorMessage || '手动约仓失败，请查看 Noon 调用日志后重试。'
  }
  return '手动约仓已执行，请查看约仓状态。'
}

export function officialWarehouseBusinessErrorText(message?: string, failureType?: string) {
  const raw = [failureType, message].filter(Boolean).join(': ').trim()
  if (!raw) {
    return '-'
  }
  if (failureType === 'NOON_WRITE_RECONCILIATION_REQUIRED') {
    return 'Noon 写入响应未知，已暂停并禁止自动重试。请先在 Noon 后台核对，再订正本地状态。'
  }
  if (failureType === 'STALE_EXECUTION_RECONCILIATION_REQUIRED') {
    return '上次约仓执行已中断，Noon 结果未知。请先在 Noon 后台核对，再订正本地状态。'
  }
  if (/NOON_ASN_EXPIRED|\\bexpired\\b/i.test(raw)) {
    return 'Noon后台显示该 ASN 已过期，不能继续约仓。'
  }
  if (/NOON_ASN_CANCEL(?:ED|LED)|\\bcancell?ed\\b/i.test(raw)) {
    return 'Noon后台显示该 ASN 已取消，不能继续约仓。'
  }
  if (/NOON_ASN_GRN_COMPLETED|GRN_COMPLETED/i.test(raw)) {
    return 'Noon后台显示该 ASN 已入仓。'
  }
  if (/too many requests|HTTP 429/i.test(raw)) {
    return 'Noon 请求过于频繁，请稍后再试。'
  }
  if (/psku_codes|pbarcode|not valid or does not mapped/i.test(raw)) {
    return '商品没有绑定 Noon 官方仓条码，需先同步或核对商品资料。'
  }
  if (/warehouse .* not found/i.test(raw)) {
    return '仓库信息无效，请重新查询仓位后再约仓。'
  }
  if (/only a sealed ASN|尚未 sealed|ASN_NOT_SEALED/i.test(raw)) {
    return 'ASN 尚未封单，当前不能约仓。'
  }
  if (/NO_CAPACITY/i.test(raw)) {
    return '当前时间范围没有可用仓位。'
  }
  if (/Already exists/i.test(raw)) {
    return 'Noon 已存在约仓记录或正在处理上一次约仓，请在 Noon 后台核对后再执行。'
  }
  const cleaned = raw
    .replace(/NOON_CALL:\\s*/i, '')
    .replace(/HTTP\\s+\\d+\\s*/i, '')
    .replace(/\\b[A-Z][A-Z0-9_]{2,}:\\s*/g, '')
    .split('traceback')[0]
    .split('Traceback')[0]
    .trim()
  return cleaned.length > 120 ? `${cleaned.slice(0, 120)}...` : cleaned
}

function normalizeNoonStatus(status?: string) {
  return (status || '').trim().replace(/-/g, '_').toUpperCase()
}
