import { message } from 'antd'
import { useCallback, useMemo, useRef, useState } from 'react'
import { loadProductOptions } from '../api'
import { buildProductAutoCompleteOptions } from '../model/purchaseOrderStoreModel'
import type { ProductOption } from '../types'

export function usePurchaseOrderProductSearch() {
  const [productSearchOptions, setProductSearchOptions] = useState<ProductOption[]>([])
  const [productSearchLoading, setProductSearchLoading] = useState(false)
  const requestIdRef = useRef(0)
  const productAutoCompleteOptions = useMemo(
    () => buildProductAutoCompleteOptions(productSearchOptions),
    [productSearchOptions]
  )

  function clearProductSearchOptions() {
    requestIdRef.current += 1
    setProductSearchOptions([])
    setProductSearchLoading(false)
  }

  const handleProductSearch = useCallback(async (
    targetStoreCode: string | undefined,
    keywordValue: string
  ) => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    const nextKeyword = keywordValue.trim()
    if (!targetStoreCode || !nextKeyword) {
      setProductSearchOptions([])
      setProductSearchLoading(false)
      return
    }

    setProductSearchLoading(true)
    try {
      const options = await loadProductOptions({
        storeCode: targetStoreCode,
        keyword: nextKeyword
      })
      if (requestIdRef.current === requestId) {
        setProductSearchOptions(options)
      }
    } catch (error) {
      if (requestIdRef.current === requestId) {
        setProductSearchOptions([])
        message.error(error instanceof Error ? error.message : '读取商品档案失败')
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setProductSearchLoading(false)
      }
    }
  }, [])

  return {
    productAutoCompleteOptions,
    productSearchLoading,
    clearProductSearchOptions,
    handleProductSearch
  }
}
