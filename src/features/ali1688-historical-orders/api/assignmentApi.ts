import { apiFetch, parseApiResponse } from '../../../shared/api'

import type {
  Ali1688HistoricalOrderAssignmentAdjustRequest,
  Ali1688HistoricalOrderAssignmentBatchRequest,
  Ali1688HistoricalOrderAssignmentRecord,
  Ali1688HistoricalOrderAssignmentRequest,
  Ali1688HistoricalOrderAssignmentResult
} from '../types'

export function assignAli1688HistoricalOrderLines(
  request: Ali1688HistoricalOrderAssignmentRequest
): Promise<Ali1688HistoricalOrderAssignmentResult> {
  return apiFetch('/api/procurement/ali1688-orders/assignments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  }).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderAssignmentResult>(response, '分配 1688 历史订单货品失败')
  )
}

export function assignAli1688HistoricalOrderLineBatches(
  request: Ali1688HistoricalOrderAssignmentBatchRequest
): Promise<Ali1688HistoricalOrderAssignmentResult> {
  return apiFetch('/api/procurement/ali1688-orders/assignments/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  }).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderAssignmentResult>(response, '批量分配 1688 历史订单货品失败')
  )
}

export function loadAli1688HistoricalOrderItemAssignments(
  itemId: string
): Promise<Ali1688HistoricalOrderAssignmentRecord[]> {
  return apiFetch(`/api/procurement/ali1688-orders/items/${encodeURIComponent(itemId)}/assignments`).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderAssignmentRecord[]>(response, '读取 1688 分配记录失败')
  )
}

export function adjustAli1688HistoricalOrderAssignment(
  assignmentId: number,
  request: Ali1688HistoricalOrderAssignmentAdjustRequest
): Promise<Ali1688HistoricalOrderAssignmentResult> {
  return apiFetch(`/api/procurement/ali1688-orders/assignments/${encodeURIComponent(String(assignmentId))}/adjust`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  }).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderAssignmentResult>(response, '调整 1688 分配记录失败')
  )
}

export function revokeAli1688HistoricalOrderAssignment(
  assignmentId: number
): Promise<Ali1688HistoricalOrderAssignmentResult> {
  return apiFetch(`/api/procurement/ali1688-orders/assignments/${encodeURIComponent(String(assignmentId))}/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: '{}'
  }).then((response) =>
    parseApiResponse<Ali1688HistoricalOrderAssignmentResult>(response, '撤回 1688 分配记录失败')
  )
}
