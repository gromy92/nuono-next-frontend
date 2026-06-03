import { apiFetch, parseApiResponse } from '../../shared/api'
import type {
  ProductLifecycleAnalysisOverview,
  ProductLifecycleAnalysisQuery,
  ProductLifecycleAnalysisRecalculation
} from './types'

export function fetchProductLifecycleAnalysisOverview(query: ProductLifecycleAnalysisQuery) {
  const params = new URLSearchParams({
    storeCode: query.storeCode,
    siteCode: query.siteCode
  })
  return apiFetch(`/api/product-analysis/lifecycle/overview?${params.toString()}`).then((response) =>
    parseApiResponse<ProductLifecycleAnalysisOverview>(response, '商品生命周期分析数据加载失败')
  )
}

export function recalculateProductLifecycleAnalysis(query: ProductLifecycleAnalysisQuery) {
  const params = new URLSearchParams({
    storeCode: query.storeCode,
    siteCode: query.siteCode
  })
  return apiFetch(`/api/product-analysis/lifecycle/recalculate?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }).then((response) =>
    parseApiResponse<ProductLifecycleAnalysisRecalculation>(response, '商品生命周期同步失败')
  )
}
