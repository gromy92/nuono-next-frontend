import type { ProductPublishTaskPayload } from '../types'

const ACTIVE_PUBLISH_TASK_STATUSES = new Set([
  'queued',
  'running',
  'submitted',
  'verifying',
  'pending_effective',
  'write_unknown',
  'write_retry_scheduled',
  'verify_timeout'
])

export function isProductPublishTaskActive(task?: ProductPublishTaskPayload) {
  return Boolean(task?.taskId && task.status && ACTIVE_PUBLISH_TASK_STATUSES.has(String(task.status)))
}

export function isProductPublishTaskNeedsAttention(task?: ProductPublishTaskPayload) {
  return Boolean(
    task?.taskId &&
      (task.status === 'failed' || task.status === 'pending_manual_check')
  )
}

export function productPublishTaskStatusLabel(task?: ProductPublishTaskPayload) {
  if (!task?.status) return ''

  if (task.taskType === 'product-rebuild') {
    if (task.status === 'failed') return '重建失败'
    if (task.status === 'pending_manual_check') return '重建待核对'
    if (task.status === 'cancelled') return '已取消'
    if (task.status === 'synced' || isProductPublishTaskActive(task)) return '重建中'
    return String(task.status)
  }
  if (task.taskType === 'product-delete') {
    if (task.status === 'synced') return '删除成功'
    if (task.status === 'failed') return '删除失败'
    if (task.status === 'pending_manual_check') return '删除待核对'
    if (isProductPublishTaskActive(task)) return '删除中'
    if (task.status === 'cancelled') return '已取消'
    return String(task.status)
  }
  if (task.status === 'synced') return '发布成功'
  if (task.status === 'failed') return '发布失败'
  if (task.status === 'pending_manual_check') return '待人工核对'
  if (isProductPublishTaskActive(task)) return '发布中'
  if (task.status === 'cancelled') return '已取消'
  return String(task.status)
}
