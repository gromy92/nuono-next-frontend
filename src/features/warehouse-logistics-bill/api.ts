import { apiRequestJson } from '../../shared/api'
import type { LogisticsBill } from './types'

export function loadLogisticsBills(keyword?: string) {
  const params = new URLSearchParams()
  if (keyword?.trim()) params.set('keyword', keyword.trim())
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return apiRequestJson<LogisticsBill[]>(
    `/api/procurement/purchase-orders/logistics-bills${suffix}`,
    undefined,
    '读取物流账单失败'
  )
}

export function loadLogisticsBill(expectedBillId: string) {
  return apiRequestJson<LogisticsBill>(
    `/api/procurement/purchase-orders/logistics-bills/${encodeURIComponent(expectedBillId)}`,
    undefined,
    '读取物流账单失败'
  )
}
