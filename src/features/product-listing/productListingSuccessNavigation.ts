import { PRODUCT_WORKSPACE_PATH } from '../route-catalog/routePaths'
import { withWorkspaceStoreDevQuery } from '../route-catalog/workspaceDevQuery'
import {
  PRODUCT_LISTING_PUBLISHED_NOTICE,
  saveProductListingReturnNotice,
  type ProductListingReturnMode,
  type ProductListingReturnNotice
} from './productListingReturnNotice'
import type { ProductListingWorkflowView } from './types'

export function buildProductListingReturnNotice(
  workflow: ProductListingWorkflowView,
  mode: ProductListingReturnMode
): ProductListingReturnNotice | undefined {
  const draft = workflow.draft
  const task = workflow.realRunTask
  if (
    workflow.phase !== 'PUBLISHED' ||
    workflow.writeCertainty !== 'VERIFIED' ||
    !draft?.draftId ||
    !draft.storeCode
  ) {
    return undefined
  }
  const partnerSku = text(task?.partnerSku) || text(draft.draft?.psku)
  const skuParent = text(task?.skuParent)
  const pskuCode = text(task?.pskuCode)
  return {
    version: 1,
    mode,
    message: PRODUCT_LISTING_PUBLISHED_NOTICE,
    draftId: draft.draftId,
    storeCode: draft.storeCode,
    ...(partnerSku ? { partnerSku } : {}),
    ...(skuParent ? { skuParent } : {}),
    ...(pskuCode ? { pskuCode } : {})
  }
}

export function canOpenPublishedProductDetail(
  workflow: ProductListingWorkflowView
) {
  const notice = buildProductListingReturnNotice(workflow, 'detail')
  return Boolean(
    notice &&
      (notice.partnerSku || notice.skuParent || notice.pskuCode)
  )
}

export function returnFromPublishedProductListing(
  workflow: ProductListingWorkflowView,
  mode: ProductListingReturnMode
) {
  const notice = buildProductListingReturnNotice(workflow, mode)
  if (!notice) {
    return false
  }
  if (!saveProductListingReturnNotice(notice)) {
    return false
  }
  window.location.assign(
    withWorkspaceStoreDevQuery(PRODUCT_WORKSPACE_PATH, notice.storeCode)
  )
  return true
}

function text(value?: string) {
  return (value || '').trim()
}
