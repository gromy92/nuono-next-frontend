import { message } from 'antd'
import { apiFetch, parseApiResponse } from '../../shared/api'
import { loadOfficialWarehouseShippingBatches } from './api'

type StoreSite = {
  storeCode: string
  siteCode: string
  keyword?: string
}

type PreparationResult = {
  batchCount: number
  matchedCount: number
  pendingCount: number
}

export async function loadPreparedOfficialWarehouseShippingBatches(filters: StoreSite) {
  let result: PreparationResult | undefined
  let preparationError: string | undefined
  try {
    const response = await apiFetch('/api/warehouse/official-warehouse/product-matches/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeCode: filters.storeCode,
        siteCode: filters.siteCode
      })
    })
    result = await parseApiResponse<PreparationResult>(response, '准备物流商品匹配失败')
  } catch (error) {
    preparationError = error instanceof Error ? error.message : '准备物流商品匹配失败'
    message.warning('物流商品准备失败，使用已落地数据继续查询')
  }
  const rows = await loadOfficialWarehouseShippingBatches(filters)
  if (result && result.pendingCount > 0) {
    message.warning(`物流原始数据已落地，仍有 ${result.pendingCount} 条商品待匹配`)
  }
  return { rows, preparationError }
}
