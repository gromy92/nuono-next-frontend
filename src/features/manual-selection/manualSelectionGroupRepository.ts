import {
  loadManualSelectionAnalysisItems,
  loadManualSelectionGroups
} from './api'
import { groupsFromLegacyAnalysisItems } from './manualSelectionGroupWorkspace'
import type {
  ManualSelectionAnalysisItemView,
  ManualSelectionGroupView
} from './types'

type ManualSelectionGroupRepositoryAdapters = {
  loadGroups?: (storeName: string, storeCode?: string) => Promise<ManualSelectionGroupView[]>
  loadLegacyAnalysisItems?: (storeName: string, storeCode?: string) => Promise<ManualSelectionAnalysisItemView[]>
}

export async function loadManualSelectionGroupWorkspace(
  storeName: string,
  storeCode?: string,
  adapters: ManualSelectionGroupRepositoryAdapters = {}
) {
  const loadGroups = adapters.loadGroups || loadManualSelectionGroups
  const loadLegacyAnalysisItems = adapters.loadLegacyAnalysisItems || loadManualSelectionAnalysisItems
  try {
    return await loadGroups(storeName, storeCode)
  } catch (error) {
    if (!isGroupEndpointMissingError(errorMessage(error))) {
      throw error
    }
    return groupsFromLegacyAnalysisItems(await loadLegacyAnalysisItems(storeName, storeCode))
  }
}

export function isGroupEndpointMissingError(messageText?: string) {
  const normalized = (messageText || '').trim()
  return !normalized || /^(no message available|request failed: 404)$/i.test(normalized) || /404|not found/i.test(normalized)
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error || '')
}
