import { PURCHASE_LISTING_PATH, withCurrentWorkspaceDevQuery } from '../app-shell/WorkspaceRouting'
import {
  openProductListingTargetInNewTab,
  reserveProductListingTargetInNewTab,
  type ProductListingTabOpener
} from '../product-listing/listingTabNavigation'
import type { ManualSelectionAnalysisProjectView } from './types'

export type ManualSelectionListingTabOpener = ProductListingTabOpener

export function buildManualSelectionGroupListingTarget(project: ManualSelectionAnalysisProjectView, storeCode?: string) {
  const sourceStoreCode =
    project.records.map((record) => record.storeCode?.trim()).find(Boolean) || storeCode?.trim()
  const params = new URLSearchParams({
    listingSource: 'manual-selection',
    selectionGroupId: project.groupId || project.projectId
  })
  if (sourceStoreCode) {
    params.set('storeCode', sourceStoreCode)
  }
  return withCurrentWorkspaceDevQuery(`${PURCHASE_LISTING_PATH}?${params.toString()}`)
}

export function openManualSelectionGroupListingInNewTab(
  project: ManualSelectionAnalysisProjectView,
  storeCode?: string,
  opener?: ManualSelectionListingTabOpener
) {
  return openProductListingTargetInNewTab(buildManualSelectionGroupListingTarget(project, storeCode), opener)
}

export function reserveManualSelectionGroupListingTab(
  project: ManualSelectionAnalysisProjectView,
  storeCode?: string,
  opener?: ManualSelectionListingTabOpener
) {
  return reserveProductListingTargetInNewTab(
    buildManualSelectionGroupListingTarget(project, storeCode),
    opener
  )
}
