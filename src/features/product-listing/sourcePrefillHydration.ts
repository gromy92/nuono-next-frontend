import {
  loadManualSelectionGroup,
  loadManualSelectionGroupProfitEstimate
} from '../manual-selection/api'
import type {
  ManualSelectionGroupProfitEstimateSnapshot,
  ManualSelectionGroupView
} from '../manual-selection/types'
import { fetchProductListingDraft } from './api'
import {
  buildManualSelectionGroupListingPrefillFromGroup,
  buildProductListingDraftRecoveryPrefill,
  type ProductListingSourcePrefill
} from './sourcePrefill'
import type { ProductListingDraftView } from './types'
import type { ProductCompetitorContentMaterial } from '../product-management/types/competitorContent'

type SourcePrefillHydrationLoaders = {
  loadManualSelectionGroup?: (groupId: string) => Promise<ManualSelectionGroupView>
  loadManualSelectionGroupProfitEstimate?: (groupId: string) => Promise<ManualSelectionGroupProfitEstimateSnapshot>
  fetchProductListingDraft?: (draftId: number) => Promise<ProductListingDraftView>
}

export async function hydrateProductListingSourcePrefill(
  prefill: ProductListingSourcePrefill,
  storeCode?: string,
  loaders: SourcePrefillHydrationLoaders = {}
) {
  if (!prefill.pendingServerHydration) {
    return prefill
  }
  if (prefill.source === 'manual-selection' && prefill.sourceGroupId) {
    const group = await (loaders.loadManualSelectionGroup || loadManualSelectionGroup)(prefill.sourceGroupId)
    const profitEstimate = await loadProfitEstimate(prefill.sourceGroupId, loaders)
    return buildManualSelectionGroupListingPrefillFromGroup(group, storeCode, profitEstimate)
  }
  if (prefill.source === 'listing-draft' && prefill.sourceDraftId) {
    const draftId = Number(prefill.sourceDraftId)
    if (!Number.isFinite(draftId) || draftId <= 0) {
      return prefill
    }
    const draftView = await (loaders.fetchProductListingDraft || fetchProductListingDraft)(draftId)
    const recoveredPrefill = buildProductListingDraftRecoveryPrefill(draftView)
    if (!isManualSelectionGroupDraft(draftView)) {
      return recoveredPrefill
    }
    try {
      const groupId = String(draftView.draft?.sourceRefId || '')
      const group = await (loaders.loadManualSelectionGroup || loadManualSelectionGroup)(groupId)
      const groupPrefill = buildManualSelectionGroupListingPrefillFromGroup(group, storeCode)
      if (!groupPrefill.competitorMaterials?.length) {
        return recoveredPrefill
      }
      const competitorMaterials = mergeRecoveredCompetitorCategories(
        recoveredPrefill.competitorMaterials || [],
        groupPrefill.competitorMaterials
      )
      return {
        ...recoveredPrefill,
        competitorMaterials,
        draft: {
          ...recoveredPrefill.draft,
          competitorMaterials
        }
      }
    } catch {
      return recoveredPrefill
    }
  }
  return prefill
}

function mergeRecoveredCompetitorCategories(
  recovered: ProductCompetitorContentMaterial[],
  refreshed: ProductCompetitorContentMaterial[]
) {
  if (!recovered.length) {
    return refreshed
  }
  const refreshedByKey = new Map<string, ProductCompetitorContentMaterial>()
  refreshed.forEach((material) => materialKeys(material).forEach((key) => refreshedByKey.set(key, material)))
  const merged = recovered.map((material) => {
    const refreshedMaterial = materialKeys(material)
      .map((key) => refreshedByKey.get(key))
      .find(Boolean)
    if (!refreshedMaterial) {
      return material
    }
    return {
      ...material,
      categoryName: refreshedMaterial.categoryName || material.categoryName,
      categoryPath: refreshedMaterial.categoryPath || material.categoryPath,
      categoryUrl: refreshedMaterial.categoryUrl || material.categoryUrl,
      categoryLinks: refreshedMaterial.categoryLinks?.length
        ? refreshedMaterial.categoryLinks
        : material.categoryLinks
    }
  })
  const existingKeys = new Set(merged.flatMap(materialKeys))
  refreshed.forEach((material) => {
    if (!materialKeys(material).some((key) => existingKeys.has(key))) {
      merged.push(material)
    }
  })
  return merged
}

function materialKeys(material: ProductCompetitorContentMaterial) {
  return [material.id, material.externalSku, material.url]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean)
}

async function loadProfitEstimate(
  groupId: string,
  loaders: SourcePrefillHydrationLoaders
) {
  try {
    return await (loaders.loadManualSelectionGroupProfitEstimate || loadManualSelectionGroupProfitEstimate)(groupId)
  } catch {
    return null
  }
}

function isManualSelectionGroupDraft(draftView: ProductListingDraftView) {
  return draftView.draft?.sourceType === 'manual_selection_group' && Boolean(draftView.draft.sourceRefId)
}
