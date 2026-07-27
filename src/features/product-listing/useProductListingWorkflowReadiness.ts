import { useState } from 'react'
import {
  isProductListingWorkflowLoadedForScope,
  type ProductListingWorkflowLoadedScope
} from './productListingWorkflowIdentity'

const DEFAULT_LOADING_MESSAGE =
  '正在读取后端上架流程，保存与检查暂时锁定。'

export function useProductListingWorkflowReadiness(
  activeDraftId?: number,
  activeStoreCode?: string
) {
  const [loadedScope, setLoadedScope] =
    useState<ProductListingWorkflowLoadedScope>()
  const [loadError, setLoadError] = useState('')
  const locked =
    Boolean(activeDraftId) &&
    !isProductListingWorkflowLoadedForScope(
      loadedScope,
      activeDraftId,
      activeStoreCode
    )

  function markLoaded(draftId: number, storeCode: string) {
    setLoadedScope({ draftId, storeCode })
    setLoadError('')
  }

  function invalidateIfScopeChanged(
    currentDraftId: number | undefined,
    currentStoreCode: string,
    nextDraftId: number | undefined,
    nextStoreCode: string
  ) {
    if (
      currentDraftId !== nextDraftId ||
      normalizedStoreCode(currentStoreCode) !==
        normalizedStoreCode(nextStoreCode)
    ) {
      setLoadedScope(undefined)
      setLoadError('')
    }
  }

  return {
    blockedMessage: loadError || DEFAULT_LOADING_MESSAGE,
    invalidateIfScopeChanged,
    locked,
    markLoadError: setLoadError,
    markLoaded
  }
}

function normalizedStoreCode(value: string) {
  return value.trim().toUpperCase()
}
