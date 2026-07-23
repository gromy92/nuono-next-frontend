import { useEffect, useState } from 'react'
import { fetchProductListDataset } from '../product-management/api'
import { buildProductBaselineMap } from './readyDomain'
import type { ProductBaselineSummary } from './workbenchModels'

export function useProductBaselines(ownerUserId: number | undefined, storeCodes: string[]) {
  const [itemsByPsku, setItemsByPsku] = useState<Record<string, ProductBaselineSummary>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let cancelled = false
    if (!ownerUserId || !storeCodes.length) {
      setItemsByPsku({})
      setLoading(false)
      setError(undefined)
      return
    }
    setLoading(true)
    setError(undefined)
    Promise.allSettled(storeCodes.map((storeCode) => fetchProductListDataset({ ownerUserId, storeCode })))
      .then((results) => {
        if (cancelled) return
        const items = results.flatMap((result) => result.status === 'fulfilled' ? result.value.items || [] : [])
        setItemsByPsku(buildProductBaselineMap(items))
        const failedCount = results.filter((result) => result.status === 'rejected').length
        setError(items.length > 0 || failedCount === 0 ? undefined : '商品基线读取失败')
      })
      .catch((reason) => {
        if (cancelled) return
        setItemsByPsku({})
        setError(reason instanceof Error ? reason.message : '商品基线读取失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [ownerUserId, storeCodes])

  return { itemsByPsku, loading, error }
}
