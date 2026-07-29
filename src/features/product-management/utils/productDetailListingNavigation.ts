import { PURCHASE_LISTING_PATH } from '../../route-catalog/routePaths'
import { withWorkspaceStoreDevQuery } from '../../route-catalog/workspaceDevQuery'
import type { ProductMasterSnapshotPayload } from '../../product-domain/productMasterSnapshot'
import { textInputValue } from './common'

function positiveInteger(value: unknown) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

export function buildProductDetailListingTarget(snapshot?: ProductMasterSnapshotPayload) {
  const draftId = positiveInteger(snapshot?.identity.listingDraftId)
  if (!draftId) {
    return undefined
  }

  const storeCode = textInputValue(snapshot?.storeContext.storeCode) || undefined
  const params = new URLSearchParams({
    listingSource: 'listing-draft',
    listingDraftId: String(draftId)
  })
  if (storeCode) {
    params.set('storeCode', storeCode)
  }
  return withWorkspaceStoreDevQuery(
    `${PURCHASE_LISTING_PATH}?${params.toString()}`,
    storeCode
  )
}
