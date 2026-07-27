import { message } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { normalizeError } from '../../shared/api'
import {
  readProductListingSourcePrefill,
  type ProductListingSourcePrefill
} from './sourcePrefill'
import { hydrateProductListingSourcePrefill } from './sourcePrefillHydration'

const SOURCE_HYDRATION_LOADING_MESSAGE =
  '正在读取上架来源资料，编辑与上架暂时锁定。'

export function useProductListingSourcePrefill(params: {
  storeCode?: string
  onPrefill: (prefill: ProductListingSourcePrefill) => void
}) {
  const onPrefillRef = useRef(params.onPrefill)
  onPrefillRef.current = params.onPrefill
  const [prefill, setPrefill] =
    useState<ProductListingSourcePrefill | undefined>(
      readProductListingSourcePrefill
    )
  const [hydrating, setHydrating] = useState(
    () => Boolean(prefill?.pendingServerHydration)
  )
  const [applied, setApplied] = useState(() => !Boolean(prefill))
  const [error, setError] = useState('')

  useEffect(() => {
    const current = prefill ?? readProductListingSourcePrefill()
    if (!current) {
      return
    }
    let cancelled = false
    const applyPrefill = (next: ProductListingSourcePrefill) => {
      if (cancelled) {
        return
      }
      setPrefill(next)
      setError('')
      onPrefillRef.current(next)
      setApplied(true)
    }
    if (current.pendingServerHydration) {
      setHydrating(true)
      void hydrateProductListingSourcePrefill(current, params.storeCode)
        .then(applyPrefill)
        .catch(cause => {
          if (!cancelled) {
            const errorMessage = normalizeError(
              cause,
              '读取上架来源资料失败，请重新从入口进入上架'
            )
            setError(errorMessage)
            message.warning(errorMessage)
          }
        })
        .finally(() => {
          if (!cancelled) {
            setHydrating(false)
          }
        })
    } else {
      applyPrefill(current)
    }
    return () => {
      cancelled = true
    }
    // The URL/store selects one source hydration session for this page mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.storeCode])

  const blocked = !applied || hydrating || Boolean(error)
  return {
    blocked,
    blockedMessage:
      error || (blocked ? SOURCE_HYDRATION_LOADING_MESSAGE : ''),
    error,
    prefill
  }
}
