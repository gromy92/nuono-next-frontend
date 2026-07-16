import {
  createSourceCollection,
  loadSourceCollections,
  recollectSourceCollection
} from '../source-collection/api'
import { apiFetch, readApiErrorMessage } from '../../shared/api'
import type { ProductSelectionSourceCollection } from '../source-collection/types'
import type { ManualSelectionSystemCategoryOption } from './profitCategoryMatching'
import {
  shouldDeleteSourceCollection,
  type ManualSelectionMaterialDeleteMode
} from './manualSelectionDeleteOptions'
import type {
  ManualSelectionAiAnalysisResult,
  ManualSelectionAli1688ProcurementInfo,
  ManualSelectionAnalysisItemView,
  ManualSelectionCompetitor,
  ManualSelectionGroupProfitEstimateSnapshot,
  ManualSelectionGroupView
} from './types'

export {
  createSourceCollection as createManualSelectionCollection,
  loadSourceCollections as loadManualSelectionCollections,
  recollectSourceCollection as recollectManualSelectionCollection
}

export function analyzeManualSelectionCollection(
  record: ProductSelectionSourceCollection,
  competitors: ManualSelectionCompetitor[]
): Promise<ManualSelectionAiAnalysisResult> {
  const payload = {
    competitors: competitors.map((competitor) => ({
      url: competitor.url,
      note: competitor.note,
      fetchStatus: competitor.fetchStatus,
      fetchedTitle: competitor.fetchedTitle,
      fetchedTitleAr: competitor.fetchedTitleAr,
      fetchedDescriptionEn: competitor.fetchedDescriptionEn,
      fetchedDescriptionAr: competitor.fetchedDescriptionAr,
      fetchedSellingPointsEn: competitor.fetchedSellingPointsEn,
      fetchedSellingPointsAr: competitor.fetchedSellingPointsAr,
      fetchedSourceHost: competitor.fetchedSourceHost,
      fetchedAt: competitor.fetchedAt,
      fetchMessage: competitor.fetchMessage
    })),
    ali1688Candidates: (record.ali1688Collection?.candidates || []).slice(0, 5).map((candidate) => ({
      title: candidate.title,
      supplierName: candidate.supplierName,
      candidateUrl: candidate.candidateUrl,
      priceText: candidate.priceText,
      moqText: candidate.moqText,
      level: candidate.level,
      totalScore: candidate.totalScore,
      reasons: candidate.reasons || [],
      warnings: candidate.warnings || []
    }))
  }
  return parseManualSelectionResponse<ManualSelectionAiAnalysisResult>(
    apiFetch(`/api/product-selection/source-collections/${encodeURIComponent(record.id)}/analysis/ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  )
}

export function loadManualSelectionAnalysisItems(
  storeName: string,
  storeCode?: string
): Promise<ManualSelectionAnalysisItemView[]> {
  const params = new URLSearchParams({ storeName })
  if (storeCode) {
    params.set('storeCode', storeCode)
  }
  return parseManualSelectionResponse<ManualSelectionAnalysisItemView[]>(
    apiFetch(`/api/product-selection/analysis-items?${params.toString()}`)
  )
}

export function loadManualSelectionGroups(
  storeName: string,
  storeCode?: string
): Promise<ManualSelectionGroupView[]> {
  const params = new URLSearchParams({ storeName })
  if (storeCode) {
    params.set('storeCode', storeCode)
  }
  return parseManualSelectionResponse<ManualSelectionGroupView[]>(
    apiFetch(`/api/product-selection/groups?${params.toString()}`)
  )
}

export function loadManualSelectionGroup(groupId: string): Promise<ManualSelectionGroupView> {
  return parseManualSelectionResponse<ManualSelectionGroupView>(
    apiFetch(`/api/product-selection/groups/${encodeURIComponent(groupId)}`)
  )
}

export function addManualSelectionAnalysisItems(
  sourceCollectionIds: string[],
  options: { projectName?: string; projectId?: string } = {}
): Promise<ManualSelectionAnalysisItemView[]> {
  return parseManualSelectionResponse<ManualSelectionAnalysisItemView[]>(
    apiFetch('/api/product-selection/analysis-items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sourceCollectionIds,
        projectId: options.projectId,
        projectName: options.projectName
      })
    })
  )
}

export function createManualSelectionGroup(
  sourceCollectionIds: string[],
  options: { groupName?: string } = {}
): Promise<ManualSelectionGroupView> {
  return parseManualSelectionResponse<ManualSelectionGroupView>(
    apiFetch('/api/product-selection/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sourceCollectionIds,
        groupName: options.groupName
      })
    })
  )
}

export function addManualSelectionGroupMaterials(
  groupId: string,
  sourceCollectionIds: string[]
): Promise<ManualSelectionGroupView> {
  return parseManualSelectionResponse<ManualSelectionGroupView>(
    apiFetch(`/api/product-selection/groups/${encodeURIComponent(groupId)}/materials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sourceCollectionIds
      })
    })
  )
}

export async function deleteManualSelectionCollection(
  sourceCollectionId: string,
  storeCode?: string
): Promise<void> {
  const params = requiredDeleteStoreParams(storeCode)
  await parseManualSelectionEmptyResponse(
    apiFetch(`/api/product-selection/source-collections/${encodeURIComponent(sourceCollectionId)}?${params.toString()}`, {
      method: 'DELETE'
    })
  )
}

export async function deleteManualSelectionGroupMaterial(
  groupId: string,
  sourceCollectionId: string,
  mode: ManualSelectionMaterialDeleteMode,
  storeCode?: string
): Promise<void> {
  const params = requiredDeleteStoreParams(storeCode)
  params.set('deleteSourceCollection', String(shouldDeleteSourceCollection(mode)))
  await parseManualSelectionEmptyResponse(
    apiFetch(`/api/product-selection/groups/${encodeURIComponent(groupId)}/materials/${encodeURIComponent(sourceCollectionId)}?${params.toString()}`, {
      method: 'DELETE'
    })
  )
}

export function saveManualSelectionGroupName(
  groupId: string,
  groupName: string
): Promise<ManualSelectionGroupView> {
  return parseManualSelectionResponse<ManualSelectionGroupView>(
    apiFetch(`/api/product-selection/groups/${encodeURIComponent(groupId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        groupName
      })
    })
  )
}

export function saveManualSelectionGroupProcurement(
  groupId: string,
  values: ManualSelectionAli1688ProcurementInfo
): Promise<ManualSelectionGroupView> {
  return parseManualSelectionResponse<ManualSelectionGroupView>(
    apiFetch(`/api/product-selection/groups/${encodeURIComponent(groupId)}/procurement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ali1688PurchaseUrl: values.purchaseUrl || '',
        purchasePrice: values.purchasePrice
      })
    })
  )
}

export function loadManualSelectionGroupProfitEstimate(
  groupId: string
): Promise<ManualSelectionGroupProfitEstimateSnapshot> {
  return parseManualSelectionResponse<ManualSelectionGroupProfitEstimateSnapshot>(
    apiFetch(`/api/product-selection/groups/${encodeURIComponent(groupId)}/profit-estimate`)
  )
}

export function saveManualSelectionGroupProfitEstimate(
  groupId: string,
  values: {
    currencyCode?: string
    profitAmount?: number
    profitMargin?: number
    snapshot?: Record<string, unknown>
  }
): Promise<ManualSelectionGroupProfitEstimateSnapshot> {
  return parseManualSelectionResponse<ManualSelectionGroupProfitEstimateSnapshot>(
    apiFetch(`/api/product-selection/groups/${encodeURIComponent(groupId)}/profit-estimate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(values)
    })
  )
}

export function saveManualSelectionGroupCompetitors(
  groupId: string,
  competitors: ManualSelectionCompetitor[]
): Promise<ManualSelectionGroupView> {
  return parseManualSelectionResponse<ManualSelectionGroupView>(
    apiFetch(`/api/product-selection/groups/${encodeURIComponent(groupId)}/competitors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        competitors: competitors.map((competitor) => ({
          url: competitor.url,
          note: competitor.note,
          fetchStatus: competitor.fetchStatus,
          fetchedTitle: competitor.fetchedTitle,
          fetchedTitleAr: competitor.fetchedTitleAr,
          fetchedSourceImageUrl: competitor.fetchedSourceImageUrl,
          fetchedImageUrls: competitor.fetchedImageUrls || [],
          fetchedDescriptionEn: competitor.fetchedDescriptionEn,
          fetchedDescriptionAr: competitor.fetchedDescriptionAr,
          fetchedSellingPointsEn: competitor.fetchedSellingPointsEn || [],
          fetchedSellingPointsAr: competitor.fetchedSellingPointsAr || [],
          fetchedSourceHost: competitor.fetchedSourceHost,
          fetchedPriceSummary: competitor.fetchedPriceSummary,
          fetchedCategoryName: competitor.fetchedCategoryName,
          fetchedCategoryPath: competitor.fetchedCategoryPath,
          fetchedCategoryUrl: competitor.fetchedCategoryUrl,
          fetchedCategoryLinks: competitor.fetchedCategoryLinks || [],
          fetchedCompleteness: competitor.fetchedCompleteness,
          fetchedCollectionSource: competitor.fetchedCollectionSource,
          fetchedAt: competitor.fetchedAt,
          fetchMessage: competitor.fetchMessage
        }))
      })
    })
  )
}

export function recollectManualSelectionGroupCompetitor(
  groupId: string,
  competitorId: string
): Promise<ManualSelectionGroupView> {
  return parseManualSelectionResponse<ManualSelectionGroupView>(
    apiFetch(`/api/product-selection/groups/${encodeURIComponent(groupId)}/competitors/${encodeURIComponent(competitorId)}/recollect`, {
      method: 'POST'
    })
  )
}

export function deleteManualSelectionGroupCompetitor(
  groupId: string,
  competitorId: string
): Promise<ManualSelectionGroupView> {
  return parseManualSelectionResponse<ManualSelectionGroupView>(
    apiFetch(`/api/product-selection/groups/${encodeURIComponent(groupId)}/competitors/${encodeURIComponent(competitorId)}`, {
      method: 'DELETE'
    })
  )
}

export function loadManualSelectionSystemCategories(
  storeCode: string | undefined,
  options: { query?: string; limit?: number; includeGlobalFulltypes?: boolean } = {}
): Promise<ManualSelectionSystemCategoryOption[]> {
  return parseManualSelectionResponse<{ fulltypes?: ManualSelectionSystemCategoryOption[] }>(
    apiFetch('/api/product-master/classification-options', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storeCode,
        fulltypeQuery: options.query || '',
        limit: options.limit || 80,
        includeGlobalFulltypes: options.includeGlobalFulltypes === true
      })
    })
  ).then((payload) => payload.fulltypes || [])
}

export function saveManualSelectionAnalysisItemProcurement(
  sourceCollectionId: string,
  values: ManualSelectionAli1688ProcurementInfo
): Promise<ManualSelectionAnalysisItemView> {
  return parseManualSelectionResponse<ManualSelectionAnalysisItemView>(
    apiFetch(`/api/product-selection/analysis-items/${encodeURIComponent(sourceCollectionId)}/procurement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ali1688PurchaseUrl: values.purchaseUrl || '',
        purchasePrice: values.purchasePrice
      })
    })
  )
}

async function parseManualSelectionResponse<TResponse>(
  responsePromise: Promise<Response>
): Promise<TResponse> {
  const response = await responsePromise
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, `Request failed: ${response.status}`))
  }
  const payload = await response.json().catch(() => null)
  return payload as TResponse
}

async function parseManualSelectionEmptyResponse(responsePromise: Promise<Response>): Promise<void> {
  const response = await responsePromise
  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, `Request failed: ${response.status}`))
  }
}

function requiredDeleteStoreParams(storeCode?: string) {
  const normalizedStoreCode = storeCode?.trim()
  if (!normalizedStoreCode) {
    throw new Error('缺少当前店铺编码，不能删除。')
  }
  return new URLSearchParams({ storeCode: normalizedStoreCode })
}
