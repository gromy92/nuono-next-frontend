import type { Dayjs } from 'dayjs'
import type {
  Ali1688HistoricalOrderItem,
  Ali1688HistoricalOrderRow
} from '../types'

export type OrderFilterState = {
  placedRange: [Dayjs | null, Dayjs | null] | null
  orderStatus?: string
  assignmentFilter?: string
  productLinkFilter?: string
  supplierKeyword: string
  keyword: string
}

export type ProductLineRow = {
  lineKey: string
  order: Ali1688HistoricalOrderRow
  item?: Ali1688HistoricalOrderItem
  lineNo: number
}

export type Ali1688HistoricalOrdersPageProps = {
  storeName?: string
  storeCode?: string
  siteCode?: string
  ownerUserId?: number
  operatorRoleName?: string
  availableStores?: AssignmentTargetStore[]
}

export type AssignmentTargetStore = {
  storeCode: string
  projectCode?: string
  projectName?: string
  site?: string
}

export type AssignmentTargetOption = {
  value: string
  label: string
  targetType: 'STORE_SITE' | 'CONSUMABLE' | 'DISCONTINUED'
  targetStoreCode?: string
  targetSiteCode?: string
}

export type ProductLinkActionControls = {
  canMutateProductLinks: boolean
  canDeleteOrders: boolean
  onOpenProductActionModal: (row: ProductLineRow) => void | Promise<void>
  onOpenDeleteOrderModal: (order: Ali1688HistoricalOrderRow) => void
}

export type ProductLinkStatusFilter = 'all' | 'unlinked' | 'linked'

export const CONSUMABLE_ASSIGNMENT_VALUE = '__CONSUMABLE__'
