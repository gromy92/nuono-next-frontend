import { message } from 'antd'
import { useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import {
  diagnoseOfficialWarehouseShippingBatch,
  loadOfficialWarehouseShippingBatches,
  officialWarehouseError,
  type OfficialWarehouseShippingBatchCandidate,
  type OfficialWarehouseShippingBatchDiagnostic
} from './api'
import {
  readOfficialWarehouseShippingBatchCache,
  SHIPPING_BATCH_CACHE_FRESH_MS,
  writeOfficialWarehouseShippingBatchCache
} from './officialWarehouseShippingBatchCache'
import { loadPreparedOfficialWarehouseShippingBatches } from './productMatchPreparation'
import { zeroQuantityShippingBatchDiagnostic } from './shippingBatchDiagnosticPresentation'

type ShippingBatchSearchOptions = {
  sessionUserId: string
  storeCode: string
  siteCode: string
  selectedShippingBatchIds: string[]
  setShippingBatches: Dispatch<SetStateAction<OfficialWarehouseShippingBatchCandidate[]>>
  setSelectedShippingBatchIds: Dispatch<SetStateAction<string[]>>
}

export function useShippingBatchSearch(options: ShippingBatchSearchOptions) {
  const {
    sessionUserId,
    storeCode,
    siteCode,
    selectedShippingBatchIds,
    setShippingBatches,
    setSelectedShippingBatchIds
  } = options
  const [shippingBatchKeyword, setShippingBatchKeyword] = useState('')
  const [shippingBatchLoading, setShippingBatchLoading] = useState(false)
  const [shippingBatchLoadError, setShippingBatchLoadError] = useState<string>()
  const [shippingBatchDiagnostic, setShippingBatchDiagnostic] = useState<OfficialWarehouseShippingBatchDiagnostic>()
  const searchTimerRef = useRef<number | undefined>(undefined)
  const requestRef = useRef(0)
  const activeScopeRef = useRef('')

  function resetShippingBatchSearch() {
    setShippingBatchKeyword('')
    setShippingBatchLoadError(undefined)
    setShippingBatchDiagnostic(undefined)
    requestRef.current += 1
    if (searchTimerRef.current != null) {
      window.clearTimeout(searchTimerRef.current)
      searchTimerRef.current = undefined
    }
  }

  async function loadShippingBatches(
    keywordValue = shippingBatchKeyword,
    prepare = false,
    forceRefresh = false
  ) {
    if (!storeCode || !siteCode) {
      message.warning('请选择店铺和站点')
      return
    }
    const normalizedKeyword = keywordValue.trim()
    const scopeKey = `${sessionUserId.trim()}::${storeCode.trim()}::${siteCode.trim().toUpperCase()}`
    const scopeChanged = activeScopeRef.current !== scopeKey
    activeScopeRef.current = scopeKey
    const cached = normalizedKeyword || prepare
      ? undefined
      : readOfficialWarehouseShippingBatchCache(sessionUserId, storeCode, siteCode)
    if (scopeChanged) {
      setSelectedShippingBatchIds([])
      setShippingBatches(cached?.rows ?? [])
    } else if (cached) {
      setShippingBatches((current) => {
        const retained = current.filter((row) => selectedShippingBatchIds.includes(row.id))
        return Array.from(new Map([...retained, ...cached.rows].map((row) => [row.id, row])).values())
      })
    }
    if (
      cached &&
      !forceRefresh &&
      Date.now() - cached.savedAt <= SHIPPING_BATCH_CACHE_FRESH_MS
    ) {
      requestRef.current += 1
      setShippingBatchLoading(false)
      setShippingBatchLoadError(undefined)
      return
    }
    const requestId = requestRef.current + 1
    requestRef.current = requestId
    setShippingBatchLoading(true)
    setShippingBatchLoadError(undefined)
    setShippingBatchDiagnostic(undefined)
    try {
      const prepared = prepare
        ? await loadPreparedOfficialWarehouseShippingBatches({
            storeCode,
            siteCode,
            keyword: keywordValue.trim() || undefined
          })
        : {
            rows: await loadOfficialWarehouseShippingBatches({
              storeCode,
              siteCode,
              keyword: keywordValue.trim() || undefined
            }),
            preparationError: undefined
      }
      if (requestId !== requestRef.current) return
      const diagnostic = normalizedKeyword && prepared.rows.length === 0
        ? await diagnoseOfficialWarehouseShippingBatch({
            storeCode,
            siteCode,
            keyword: normalizedKeyword
          })
        : zeroQuantityShippingBatchDiagnostic(prepared.rows)
      if (requestId !== requestRef.current) return
      if (!normalizedKeyword) {
        writeOfficialWarehouseShippingBatchCache(sessionUserId, storeCode, siteCode, prepared.rows)
      }
      setShippingBatches((current) => {
        const retained = prepare ? [] : current.filter((row) => selectedShippingBatchIds.includes(row.id))
        return Array.from(new Map([...retained, ...prepared.rows].map((row) => [row.id, row])).values())
      })
      setShippingBatchDiagnostic(diagnostic)
      if (prepare) {
        setSelectedShippingBatchIds((current) => current.filter((id) => prepared.rows.some((row) => row.id === id)))
      }
      if (prepared.preparationError) {
        setShippingBatchLoadError(`物流商品准备失败：${prepared.preparationError}。已使用现有数据完成查询。`)
      }
    } catch (error) {
      if (requestId !== requestRef.current) return
      const errorText = officialWarehouseError(error, '读取物流批次失败')
      setShippingBatchDiagnostic(undefined)
      setShippingBatchLoadError(errorText)
      message.error(errorText)
    } finally {
      if (requestId === requestRef.current) {
        setShippingBatchLoading(false)
      }
    }
  }

  function handleShippingBatchSearch(value: string) {
    setShippingBatchKeyword(value)
    if (searchTimerRef.current != null) {
      window.clearTimeout(searchTimerRef.current)
    }
    searchTimerRef.current = window.setTimeout(() => {
      searchTimerRef.current = undefined
      void loadShippingBatches(value, false)
    }, 350)
  }

  return {
    shippingBatchKeyword,
    shippingBatchLoading,
    shippingBatchLoadError,
    shippingBatchDiagnostic,
    loadShippingBatches,
    handleShippingBatchSearch,
    resetShippingBatchSearch
  }
}
