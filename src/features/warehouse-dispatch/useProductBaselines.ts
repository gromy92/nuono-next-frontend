import { useEffect, useState } from 'react'
import { fetchProductListDataset } from '../product-domain/productListApi'
import { buildProductBaselineMap, toProductBaselineDataset } from './readyDomain'
import type { ProductBaselineDataset, ProductBaselineScope, ProductBaselineSummary } from './workbenchModels'

export function useProductBaselines(scopes: ProductBaselineScope[]) {
  const [itemsByScope, setItemsByScope] = useState<Record<string, ProductBaselineSummary>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let cancelled = false
    if (!scopes.length) {
      setItemsByScope({})
      setLoading(false)
      setError(undefined)
      return
    }
    setLoading(true)
    setError(undefined)
    Promise.allSettled(scopes.map(async (scope): Promise<ProductBaselineDataset> => {
      const payload = await fetchProductListDataset(scope)
      return toProductBaselineDataset(scope, payload)
    }))
      .then((results) => {
        if (cancelled) return
        const datasets = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : [])
        setItemsByScope(buildProductBaselineMap(datasets))
        const failedCount = results.filter((result) => result.status === 'rejected').length
        setError(failedCount === 0
          ? undefined
          : datasets.some((dataset) => dataset.items.length > 0)
            ? '部分商品信息未补全，库存数量不受影响'
            : '商品补充信息暂不可用，库存数量不受影响')
      })
      .catch((reason) => {
        if (cancelled) return
        setItemsByScope({})
        setError(reason instanceof Error ? reason.message : '商品补充信息暂不可用，库存数量不受影响')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [scopes])

  return { itemsByScope, loading, error }
}
