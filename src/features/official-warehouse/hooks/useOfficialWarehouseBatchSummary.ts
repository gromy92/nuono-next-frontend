import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  loadOfficialWarehouseBatchProductSummary,
  officialWarehouseError,
  type OfficialWarehouseBatchProductSummary
} from '../api'

export function useOfficialWarehouseBatchSummary({
  enabled,
  storeCode,
  siteCode,
  shippingBatchIds
}: {
  enabled: boolean
  storeCode: string
  siteCode: string
  shippingBatchIds: string[]
}) {
  const [summary, setSummary] = useState<OfficialWarehouseBatchProductSummary>()
  const [loadedKey, setLoadedKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const requestIdRef = useRef(0)
  const queryKey = useMemo(
    () => `${storeCode.trim()}::${siteCode.trim().toUpperCase()}::${shippingBatchIds.join(',')}`,
    [storeCode, siteCode, shippingBatchIds]
  )

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current
    if (!enabled || !storeCode || !siteCode || !shippingBatchIds.length) {
      setSummary(undefined)
      setLoadedKey('')
      setLoading(false)
      setError(undefined)
      return
    }
    setLoadedKey(queryKey)
    setSummary(undefined)
    setError(undefined)
    setLoading(true)
    try {
      const next = await loadOfficialWarehouseBatchProductSummary({
        storeCode,
        siteCode,
        shippingBatchIds
      })
      if (requestId === requestIdRef.current) setSummary(next)
    } catch (nextError) {
      if (requestId === requestIdRef.current) {
        setError(officialWarehouseError(nextError, '读取物流批次商品汇总失败'))
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [enabled, queryKey, shippingBatchIds, siteCode, storeCode])

  useEffect(() => {
    void reload()
    return () => {
      requestIdRef.current += 1
    }
  }, [reload])

  const matchesSelection = loadedKey === queryKey
  return {
    batchSummary: matchesSelection ? summary : undefined,
    batchSummaryLoading: enabled && shippingBatchIds.length > 0 && (!matchesSelection || loading),
    batchSummaryError: matchesSelection ? error : undefined,
    reloadBatchSummary: reload
  }
}
