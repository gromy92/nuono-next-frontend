import { PURCHASE_LISTING_PATH, withCurrentWorkspaceDevQuery } from '../app-shell/WorkspaceRouting'
import type { ManualSelectionAnalysisProjectView } from './types'

export function buildManualSelectionGroupListingTarget(project: ManualSelectionAnalysisProjectView) {
  const params = new URLSearchParams({
    listingSource: 'manual-selection',
    selectionGroupId: project.groupId || project.projectId
  })
  return withCurrentWorkspaceDevQuery(`${PURCHASE_LISTING_PATH}?${params.toString()}`)
}
