import type { OfficialWarehouseInboundOrder, OfficialWarehouseSummary } from './types'

export type OfficialWarehouseAsnSummaryRow = {
  status?: string
  totalQuantity?: number
  appointment?: {
    status?: string
  } | null
}

export type OfficialWarehouseAsnSummary = {
  asnTotal: number
  asnCreated: number
  asnProcessing: number
  asnFailed: number
  appointmentPending: number
  appointmentSuccess: number
  appointmentFailed: number
  totalQuantity: number
}

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

export type AppointmentRunOnceResult = {
  status?: string
  failureType?: string
  errorMessage?: string
  nextAttemptAt?: string
}

export type AppointmentRunOnceFeedback = {
  type: 'success' | 'warning' | 'error'
  message: string
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
}

export type AppointmentStatusDisplayMeta = {
  label: string
  color: string
}

export type NoonAsnStatusDisplayMeta = {
  label: string
  color: string
}

export function appointmentStatusDisplayMeta(status?: string): AppointmentStatusDisplayMeta {
  const normalized = status || ''
  if (normalized === 'PENDING' || normalized === 'RUNNING') {
    return { label: '约仓中', color: normalized === 'RUNNING' ? 'processing' : 'blue' }
  }
  if (normalized === 'SCHEDULED') {
    return { label: '约仓成功', color: 'green' }
  }
  if (normalized === 'FAILED') {
    return { label: '约仓失败', color: 'red' }
  }
  if (normalized === 'CANCELED') {
    return { label: '已取消', color: 'default' }
  }
  return { label: normalized || '未约仓', color: 'default' }
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

export function buildAppointmentRunOnceFeedback(result: AppointmentRunOnceResult): AppointmentRunOnceFeedback {
  if (result.status === 'SCHEDULED') {
    return { type: 'success', message: '约仓成功' }
  }
  const detail = [result.failureType, result.errorMessage].filter(Boolean).join(': ').trim()
  if (result.status === 'PENDING' || result.status === 'RUNNING') {
    const retryText = result.nextAttemptAt ? `，下次自动重试：${result.nextAttemptAt}` : ''
    const detailText = detail ? `。原因：${detail}` : ''
    return { type: 'warning', message: `本次执行未约成功，已保持自动约仓中${retryText}${detailText}` }
  }
  if (result.status === 'FAILED') {
    return { type: 'error', message: detail ? `自动约仓执行失败：${detail}` : '自动约仓执行失败' }
  }
  return { type: 'warning', message: '自动约仓已执行，请查看最新状态。' }
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
      return summary
    },
    {
      total: 0,
      pending: 0,
      scheduled: 0,
      failed: 0,
      canceled: 0,
      noCapacity: 0
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

export function buildOfficialWarehouseAsnSummary(rows: OfficialWarehouseAsnSummaryRow[]): OfficialWarehouseAsnSummary {
  return rows.reduce<OfficialWarehouseAsnSummary>(
    (summary, row) => {
      summary.asnTotal += 1
      if (row.status === 'LINES_CREATED') {
        summary.asnCreated += 1
      } else if (row.status === 'FAILED') {
        summary.asnFailed += 1
      } else {
        summary.asnProcessing += 1
      }
      const appointmentStatus = row.appointment?.status
      if (appointmentStatus === 'PENDING' || appointmentStatus === 'RUNNING') {
        summary.appointmentPending += 1
      }
      if (appointmentStatus === 'SCHEDULED') {
        summary.appointmentSuccess += 1
      }
      if (appointmentStatus === 'FAILED') {
        summary.appointmentFailed += 1
      }
      summary.totalQuantity += Number(row.totalQuantity || 0)
      return summary
    },
    {
      asnTotal: 0,
      asnCreated: 0,
      asnProcessing: 0,
      asnFailed: 0,
      appointmentPending: 0,
      appointmentSuccess: 0,
      appointmentFailed: 0,
      totalQuantity: 0
    }
  )
}

export function buildOfficialWarehouseSummary(rows: OfficialWarehouseInboundOrder[]): OfficialWarehouseSummary {
  return rows.reduce<OfficialWarehouseSummary>(
    (summary, row) => {
      summary.totalInboundOrders += 1
      if (row.asnStatus === 'DRAFT' || row.asnStatus === 'WAREHOUSE_CONFIRMED' || row.asnStatus === 'SUBMITTING') {
        summary.pendingAsn += 1
      }
      if (row.asnStatus === 'FAILED') {
        summary.failedAsn += 1
      }
      if (row.appointmentStatus === 'PENDING' || row.appointmentStatus === 'RUNNING') {
        summary.pendingAppointment += 1
      }
      if (row.appointmentStatus === 'SUCCESS') {
        summary.successAppointment += 1
      }
      if (row.appointmentStatus === 'FAILED') {
        summary.failedAppointment += 1
      }
      if (row.discrepancyStatus === 'NEEDS_CORRECTION') {
        summary.receiptCorrectionsNeeded += 1
      }
      return summary
    },
    {
      totalInboundOrders: 0,
      pendingAsn: 0,
      failedAsn: 0,
      pendingAppointment: 0,
      successAppointment: 0,
      failedAppointment: 0,
      receiptCorrectionsNeeded: 0
    }
  )
}

function normalizeNoonStatus(status?: string) {
  return (status || '').trim().replace(/-/g, '_').toUpperCase()
}
