export const OFFICIAL_WAREHOUSE_RECONCILIATION_FAILURE_TYPES = [
  'STALE_EXECUTION_RECONCILIATION_REQUIRED',
  'NOON_WRITE_RECONCILIATION_REQUIRED'
] as const

export const OFFICIAL_WAREHOUSE_RECONCILIATION_STATUS_OPTIONS = [
  { label: 'Noon 未约成功，恢复自动约仓', value: 'PENDING' },
  { label: 'Noon 已约仓成功', value: 'SCHEDULED' },
  { label: 'Noon 未约成功，停止自动重试', value: 'FAILED' },
  { label: 'Noon 已取消', value: 'CANCELED' }
]

type AppointmentLifecycleState = {
  status?: string
  failureType?: string
}

export type AppointmentStatusDisplayMeta = {
  label: string
  color: string
}

export type AppointmentRunOnceResult = AppointmentLifecycleState & {
  errorMessage?: string
  nextAttemptAt?: string
}

export type AppointmentRunOnceFeedback = {
  type: 'success' | 'warning' | 'error'
  message: string
}

export function officialWarehouseAppointmentRequiresReconciliation(
  appointment?: AppointmentLifecycleState | null
) {
  return OFFICIAL_WAREHOUSE_RECONCILIATION_FAILURE_TYPES.includes(
    appointment?.failureType as (typeof OFFICIAL_WAREHOUSE_RECONCILIATION_FAILURE_TYPES)[number]
  )
}

export function officialWarehouseAppointmentCanRun(
  appointment?: AppointmentLifecycleState | null
) {
  return Boolean(
    appointment &&
    ['PENDING', 'FAILED'].includes(appointment.status || '') &&
    !officialWarehouseAppointmentRequiresReconciliation(appointment)
  )
}

export function officialWarehouseAppointmentCanCancel(
  appointment?: AppointmentLifecycleState | null
) {
  return officialWarehouseAppointmentCanRun(appointment)
}

export function appointmentStatusDisplayMeta(
  status?: string,
  failureType?: string
): AppointmentStatusDisplayMeta {
  if (officialWarehouseAppointmentRequiresReconciliation({ status, failureType })) {
    return { label: '待 Noon 对账', color: 'orange' }
  }
  if (status === 'PENDING' || status === 'RUNNING') {
    return { label: '约仓中', color: status === 'RUNNING' ? 'processing' : 'blue' }
  }
  if (status === 'SCHEDULED') return { label: '约仓成功', color: 'green' }
  if (status === 'FAILED') return { label: '约仓失败', color: 'red' }
  if (status === 'CANCELED') return { label: '已取消', color: 'default' }
  return { label: status || '未约仓', color: 'default' }
}

export function buildAppointmentRunOnceFeedback(
  result: AppointmentRunOnceResult
): AppointmentRunOnceFeedback {
  if (result.status === 'SCHEDULED') {
    return { type: 'success', message: '约仓成功' }
  }
  if (officialWarehouseAppointmentRequiresReconciliation(result)) {
    return {
      type: 'warning',
      message: 'Noon 写入结果未知，已暂停并禁止自动重试。请先在 Noon 后台核对，再订正本地状态。'
    }
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
