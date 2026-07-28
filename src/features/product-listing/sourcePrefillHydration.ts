import {
  loadManualSelectionGroup,
  loadManualSelectionGroupProfitEstimate
} from '../manual-selection/api'
import type {
  ManualSelectionGroupProfitEstimateSnapshot,
  ManualSelectionGroupView
} from '../manual-selection/types'
import {
  fetchActiveProductListingDraft,
  fetchProductListingDraft
} from './api'
import {
  buildManualSelectionGroupListingPrefillFromGroup,
  buildProductListingDraftRecoveryPrefill,
  type ProductListingSourcePrefill
} from './sourcePrefill'
import type { ProductListingDraftView } from './types'
import type { ProductCompetitorContentMaterial } from '../product-domain/productCompetitorContent'

type SourcePrefillHydrationLoaders = {
  loadManualSelectionGroup?: (groupId: string) => Promise<ManualSelectionGroupView>
  loadManualSelectionGroupProfitEstimate?: (groupId: string) => Promise<ManualSelectionGroupProfitEstimateSnapshot>
  fetchActiveProductListingDraft?: (
    storeCode: string,
    sourceType: string,
    sourceRefId: number
  ) => Promise<ProductListingDraftView | undefined>
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
    const sourceStoreCode = prefill.draft.storeCode?.trim() || storeCode
    const group = await (loaders.loadManualSelectionGroup || loadManualSelectionGroup)(prefill.sourceGroupId)
    const profitEstimate = await loadProfitEstimate(prefill.sourceGroupId, loaders)
    const groupPrefill = buildManualSelectionGroupListingPrefillFromGroup(
      group,
      sourceStoreCode,
      profitEstimate
    )
    const activeDraft = await loadActiveManualSelectionDraft(groupPrefill, sourceStoreCode, loaders)
    if (!activeDraft) {
      return groupPrefill
    }
    const draftView = await (loaders.fetchProductListingDraft || fetchProductListingDraft)(
      activeDraft.draftId
    )
    return mergeManualSelectionDraftPrefill(draftView, groupPrefill)
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
      return mergeManualSelectionDraftPrefill(draftView, groupPrefill)
    } catch {
      return recoveredPrefill
    }
  }
  return prefill
}

async function loadActiveManualSelectionDraft(
  groupPrefill: ProductListingSourcePrefill,
  fallbackStoreCode: string | undefined,
  loaders: SourcePrefillHydrationLoaders
) {
  const sourceType = groupPrefill.draft.sourceType
  const sourceRefId = positiveNumber(groupPrefill.draft.sourceRefId)
  const authoritativeStoreCode = groupPrefill.draft.storeCode || fallbackStoreCode
  if (!authoritativeStoreCode || !sourceType || sourceRefId === undefined) {
    return undefined
  }
  return (loaders.fetchActiveProductListingDraft || fetchActiveProductListingDraft)(
    authoritativeStoreCode,
    sourceType,
    sourceRefId
  )
}

function mergeManualSelectionDraftPrefill(
  draftView: ProductListingDraftView,
  groupPrefill: ProductListingSourcePrefill
) {
  const recoveredPrefill = buildProductListingDraftRecoveryPrefill(draftView)
  const competitorMaterials = mergeRecoveredCompetitorCategories(
    recoveredPrefill.competitorMaterials || [],
    groupPrefill.competitorMaterials || []
  )
  const purchasePrice = positiveNumber(recoveredPrefill.draft.purchasePrice)
    ?? positiveNumber(groupPrefill.draft.purchasePrice)
  return {
    ...recoveredPrefill,
    competitorMaterials,
    draft: {
      ...recoveredPrefill.draft,
      ...(purchasePrice === undefined ? {} : { purchasePrice }),
      competitorMaterials
    }
  }
}

function positiveNumber(value: unknown) {
  const amount = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(amount) && amount > 0 ? amount : undefined
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
