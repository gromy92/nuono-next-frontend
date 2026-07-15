import { PURCHASE_LISTING_PATH, withCurrentWorkspaceDevQuery } from '../app-shell/WorkspaceRouting'
import { openProductListingTargetInNewTab, type ProductListingTabOpener } from '../product-listing/listingTabNavigation'
import type { ManualSelectionAnalysisProjectView } from './types'

export type ManualSelectionListingTabOpener = ProductListingTabOpener

export function buildManualSelectionGroupListingTarget(project: ManualSelectionAnalysisProjectView) {
  const params = new URLSearchParams({
    listingSource: 'manual-selection',
    selectionGroupId: project.groupId || project.projectId
  })
  return withCurrentWorkspaceDevQuery(`${PURCHASE_LISTING_PATH}?${params.toString()}`)
}

export function openManualSelectionGroupListingInNewTab(
  project: ManualSelectionAnalysisProjectView,
  opener?: ManualSelectionListingTabOpener
) {
  return openProductListingTargetInNewTab(buildManualSelectionGroupListingTarget(project), opener)
}
