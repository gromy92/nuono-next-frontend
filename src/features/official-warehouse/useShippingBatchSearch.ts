import { message } from 'antd'
import { useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import {
  loadOfficialWarehouseShippingBatches,
  officialWarehouseError,
  type OfficialWarehouseShippingBatchCandidate
} from './api'
import { loadPreparedOfficialWarehouseShippingBatches } from './productMatchPreparation'

type ShippingBatchSearchOptions = {
  storeCode: string
  siteCode: string
  selectedShippingBatchIds: string[]
  setShippingBatches: Dispatch<SetStateAction<OfficialWarehouseShippingBatchCandidate[]>>
  setSelectedShippingBatchIds: Dispatch<SetStateAction<string[]>>
}

export function useShippingBatchSearch(options: ShippingBatchSearchOptions) {
  const {
    storeCode,
    siteCode,
    selectedShippingBatchIds,
    setShippingBatches,
    setSelectedShippingBatchIds
  } = options
  const [shippingBatchKeyword, setShippingBatchKeyword] = useState('')
  const [shippingBatchLoading, setShippingBatchLoading] = useState(false)
  const [shippingBatchLoadError, setShippingBatchLoadError] = useState<string>()
  const searchTimerRef = useRef<number | undefined>(undefined)
  const requestRef = useRef(0)

  function resetShippingBatchSearch() {
    setShippingBatchKeyword('')
    setShippingBatchLoadError(undefined)
    requestRef.current += 1
    if (searchTimerRef.current != null) {
      window.clearTimeout(searchTimerRef.current)
      searchTimerRef.current = undefined
    }
  }

  async function loadShippingBatches(keywordValue = shippingBatchKeyword, prepare = false) {
    if (!storeCode || !siteCode) {
      message.warning('请选择店铺和站点')
      return
    }
    const requestId = requestRef.current + 1
    requestRef.current = requestId
    setShippingBatchLoading(true)
    setShippingBatchLoadError(undefined)
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
      setShippingBatches((current) => {
        const retained = prepare ? [] : current.filter((row) => selectedShippingBatchIds.includes(row.id))
        return Array.from(new Map([...retained, ...prepared.rows].map((row) => [row.id, row])).values())
      })
      if (prepare) {
        setSelectedShippingBatchIds((current) => current.filter((id) => prepared.rows.some((row) => row.id === id)))
      }
      if (prepared.preparationError) {
        setShippingBatchLoadError(`物流商品准备失败：${prepared.preparationError}。已使用现有数据完成查询。`)
      }
    } catch (error) {
      if (requestId !== requestRef.current) return
      const errorText = officialWarehouseError(error, '读取物流批次失败')
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
    loadShippingBatches,
    handleShippingBatchSearch,
    resetShippingBatchSearch
  }
}
