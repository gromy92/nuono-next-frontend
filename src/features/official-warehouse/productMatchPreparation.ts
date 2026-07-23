import { message } from 'antd'
import { apiFetch, parseApiResponse } from '../../shared/api'
import { loadOfficialWarehouseShippingBatches } from './api'

type StoreSite = {
  storeCode: string
  siteCode: string
}

type PreparationResult = {
  batchCount: number
  matchedCount: number
  pendingCount: number
}

export async function loadPreparedOfficialWarehouseShippingBatches(filters: StoreSite) {
  const response = await apiFetch('/api/warehouse/official-warehouse/product-matches/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(filters)
  })
  const result = await parseApiResponse<PreparationResult>(response, '准备物流商品匹配失败')
  const rows = await loadOfficialWarehouseShippingBatches(filters)
  if (result.pendingCount > 0) {
    message.warning(`物流原始数据已落地，仍有 ${result.pendingCount} 条商品待匹配`)
  }
  return rows
}
