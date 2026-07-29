import type { FormInstance } from 'antd'
import type { ProductSelectionSourceCollection, SourceCollectionStatus } from '../source-collection/types'
import type {
  ManualSelectionAnalysisProjectInfo,
  ManualSelectionCompetitor
} from '../selection-analysis/types'
export type {
  ManualSelectionAli1688ProcurementInfo,
  ManualSelectionAnalysisItemView,
  ManualSelectionAnalysisProjectInfo,
  ManualSelectionAnalysisProjectView,
  ManualSelectionCompetitor,
  ManualSelectionCompetitorCategoryLink,
  ManualSelectionGroupMaterialView,
  ManualSelectionGroupProcurementView,
  ManualSelectionGroupProfitEstimateSnapshot,
  ManualSelectionGroupView
} from '../selection-analysis/types'

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
