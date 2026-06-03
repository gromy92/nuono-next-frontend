import { apiFetch, parseApiResponse } from '../../shared/api'
import type { ProductLifecycleAnalysisOverview, ProductLifecycleAnalysisQuery } from './types'

export function fetchProductLifecycleAnalysisOverview(query: ProductLifecycleAnalysisQuery) {
  const params = new URLSearchParams({
    storeCode: query.storeCode,
    siteCode: query.siteCode
  })
  return apiFetch(`/api/product-analysis/lifecycle/overview?${params.toString()}`).then((response) =>
    parseApiResponse<ProductLifecycleAnalysisOverview>(response, '商品生命周期分析数据加载失败')
  )
}
