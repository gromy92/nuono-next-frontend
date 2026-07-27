import { message } from 'antd'
import { useEffect, useRef, useState } from 'react'
import {
  consumeProductListingReturnNotice,
  type ProductListingReturnNotice
} from '../../product-listing/productListingReturnNotice'

type ProductListingReturnNavigationParams = {
  enabled: boolean
  activeOwnerId?: number
  loadProductListDataset: (
    storeCode: string,
    ownerUserId?: number,
    options?: { force?: boolean }
  ) => Promise<void>
  openProductWorkbenchInCurrentPage: (
    sample: {
      skuParent: string
      currentZCode?: string
      partnerSku?: string
      pskuCode?: string
      storeCode?: string
    },
    modeOverride?: 'mock' | 'real'
  ) => Promise<boolean>
  selectStore: (storeCode: string) => void
}

export function useProductListingReturnNavigation(
  params: ProductListingReturnNavigationParams
) {
  const callbacksRef = useRef(params)
  callbacksRef.current = params
  const [notice] = useState<ProductListingReturnNotice | undefined>(
    consumeProductListingReturnNotice
  )
  const startedRef = useRef(false)

  useEffect(() => {
    if (
      !notice ||
      !params.enabled ||
      !params.activeOwnerId ||
      startedRef.current
    ) {
      return
    }
    startedRef.current = true
    void handleReturnNotice(notice, params.activeOwnerId, callbacksRef)
  }, [notice, params.activeOwnerId, params.enabled])
}

async function handleReturnNotice(
  notice: ProductListingReturnNotice,
  ownerUserId: number,
  callbacksRef: {
    current: ProductListingReturnNavigationParams
  }
) {
  const callbacks = callbacksRef.current
  callbacks.selectStore(notice.storeCode)
  await callbacks.loadProductListDataset(
    notice.storeCode,
    ownerUserId,
    { force: true }
  )
  if (notice.mode === 'detail') {
    const skuParent =
      notice.skuParent || notice.pskuCode || notice.partnerSku
    if (skuParent) {
      const opened = await callbacksRef.current.openProductWorkbenchInCurrentPage(
        {
          skuParent,
          currentZCode: notice.skuParent,
          partnerSku: notice.partnerSku,
          pskuCode: notice.pskuCode,
          storeCode: notice.storeCode
        },
        'real'
      )
      if (!opened) {
        message.warning('商品列表已刷新，但自动打开商品详情失败。')
        return
      }
    }
  }
  message.success(notice.message)
}
