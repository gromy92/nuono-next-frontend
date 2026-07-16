import type { FormInstance } from 'antd'
import type { ProductSelectionSourceCollection, SourceCollectionStatus } from '../source-collection/types'

export type ManualSelectionPageProps = {
  storeName: string
  storeCode?: string
  siteCode?: string
  operatorName?: string
}

export type ManualSelectionSearchValues = {
  analysisLinkedStatus?: 'linked' | 'unlinked'
  channel?: string
  collectionSource?: 'browser' | 'plugin'
  projectName?: string
  productTitleEn?: string
  productTitleCn?: string
  collectStatus?: SourceCollectionStatus
}

export type NewCollectionValues = {
  titleCn?: string
  siteLink?: string
}

export type CreateFromUrlExtra = {
  titleCn?: string
}

export type ManualSelectionProfitEstimateSeed = {
  groupId?: string
  title?: string
  categoryHint?: string
  ali1688Url?: string
  salePrice?: number
  purchasePrice?: number
  competitors?: ManualSelectionCompetitor[]
}

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

export type ManualSelectionCompetitorCategoryLink = {
  name?: string
  path?: string
  url?: string
}

export type ManualSelectionCompetitorFormValues = {
  competitors: Array<Partial<ManualSelectionCompetitor>>
}

export type ManualSelectionAiAnalysisResult = {
  status: string
  sourceCollectionId?: string
  recommendationLevel?: 'recommend' | 'review' | 'reject' | 'unknown' | string
  recommendationScore?: number
  conclusion?: string
  summary?: string
  model?: string
  errorCode?: string
  errorMessage?: string
  durationMillis?: number
  profitRisks?: string[]
  competitorRisks?: string[]
  procurementRisks?: string[]
  logisticsRisks?: string[]
  missingInformation?: string[]
  nextActions?: string[]
  warnings?: string[]
}

export type ManualSelectionToolbarProps = {
  form: FormInstance<ManualSelectionSearchValues>
  loading: boolean
  onOpenNewCollection: () => void
  onBatchAddToAnalysis: () => void
  onRefresh: () => void
  onReset: () => void
  onSearch: () => void
  selectedCount: number
}

export type ManualSelectionTableProps = {
  analysisCollectionIds: string[]
  analysisProjectByCollectionId: Record<string, ManualSelectionAnalysisProjectInfo>
  dataSource: ProductSelectionSourceCollection[]
  loading: boolean
  recollecting: boolean
  selectedRowKeys: string[]
  onOpenDetail: (record: ProductSelectionSourceCollection) => void
  onAddToAnalysis: (record: ProductSelectionSourceCollection) => void
  onRecollect: (record: ProductSelectionSourceCollection) => void
  onSelectedRowKeysChange: (keys: string[]) => void
}
