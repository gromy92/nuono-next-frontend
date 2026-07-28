import type { ProductSelectionSourceCollection } from '../source-collection/types'

export type ManualSelectionAli1688ProcurementInfo = {
  purchaseUrl?: string
  purchasePrice?: number
}

export type ManualSelectionAnalysisItemView = {
  id?: string
  projectId?: string
  projectName?: string
  projectMaterialCount?: number
  sourceCollectionId: string
  ali1688PurchaseUrl?: string
  purchasePrice?: number
  sourceCollection: ProductSelectionSourceCollection
}

export type ManualSelectionGroupProcurementView = {
  ali1688PurchaseUrl?: string
  purchasePriceRmb?: number
  purchasePrice?: number
  status?: string
}

export type ManualSelectionGroupMaterialView = {
  materialId?: string
  groupId?: string
  sourceCollectionId: string
  status?: string
  sourceCollection: ProductSelectionSourceCollection
}

export type ManualSelectionCompetitorCategoryLink = {
  name?: string
  path?: string
  url?: string
}

export type ManualSelectionCompetitor = {
  id: string
  url?: string
  note?: string
  fetchStatus?: 'pending' | 'fetching' | 'success' | 'failed'
  fetchedTitle?: string
  fetchedTitleAr?: string
  fetchedSourceImageUrl?: string
  fetchedImageUrls?: string[]
  fetchedDescriptionEn?: string
  fetchedDescriptionAr?: string
  fetchedSellingPointsEn?: string[]
  fetchedSellingPointsAr?: string[]
  fetchedSourceHost?: string
  fetchedPriceSummary?: string
  fetchedCategoryName?: string
  fetchedCategoryPath?: string
  fetchedCategoryUrl?: string
  fetchedCategoryLinks?: ManualSelectionCompetitorCategoryLink[]
  fetchedCompleteness?: string
  fetchedCollectionSource?: string
  fetchedAt?: string
  fetchMessage?: string
}

export type ManualSelectionGroupView = {
  groupId: string
  groupNo?: string
  groupName: string
  siteCode?: string
  status?: string
  materialCount?: number
  materials: ManualSelectionGroupMaterialView[]
  procurement?: ManualSelectionGroupProcurementView
  competitors?: ManualSelectionCompetitor[]
}

export type ManualSelectionGroupProfitEstimateSnapshot = {
  snapshotId?: string
  groupId?: string
  currencyCode?: string
  profitAmount?: number
  profitMargin?: number
  status?: string
  createdAt?: string
  snapshot?: Record<string, unknown>
}

export type ManualSelectionAnalysisProjectInfo = {
  projectId: string
  projectName: string
  projectMaterialCount: number
}

export type ManualSelectionAnalysisProjectView = ManualSelectionAnalysisProjectInfo & {
  groupId?: string
  groupNo?: string
  procurement?: ManualSelectionGroupProcurementView
  competitors?: ManualSelectionCompetitor[]
  items: ManualSelectionAnalysisItemView[]
  records: ProductSelectionSourceCollection[]
}
