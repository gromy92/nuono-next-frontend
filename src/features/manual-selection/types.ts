import type { FormInstance } from 'antd'
import type { ProductSelectionSourceCollection, SourceCollectionStatus } from '../source-collection/types'

export type ManualSelectionPageProps = {
  storeName: string
  storeCode?: string
  operatorName?: string
}

export type ManualSelectionSearchValues = {
  channel?: string
  productTitleEn?: string
  productTitleCn?: string
  collectStatus?: SourceCollectionStatus
}

export type ManualSelectionPagination = {
  current: number
  pageSize: number
  total: number
}

export type ManualSelectionLoadOptions = {
  page?: number
  pageSize?: number
  filters?: ManualSelectionSearchValues
  silent?: boolean
  mergeCollectingOnly?: boolean
}

export type NewCollectionValues = {
  titleCn?: string
  siteLink?: string
}

export type CreateFromUrlExtra = {
  titleCn?: string
}

export type ManualSelectionToolbarProps = {
  form: FormInstance<ManualSelectionSearchValues>
  loading: boolean
  onOpenNewCollection: () => void
  onRefresh: () => void
  onSearch: () => void
}

export type ManualSelectionTableProps = {
  dataSource: ProductSelectionSourceCollection[]
  loading: boolean
  pagination: ManualSelectionPagination
  recollecting: boolean
  onOpenDetail: (record: ProductSelectionSourceCollection) => void
  onPageChange: (page: number, pageSize: number) => void
  onRecollect: (record: ProductSelectionSourceCollection) => void
}
