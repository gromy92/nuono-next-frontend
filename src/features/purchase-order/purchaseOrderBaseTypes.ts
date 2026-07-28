export type PurchaseSiteCode = string

export type PurchaseTransportMode = 'AIR' | 'SEA' | 'UNSPECIFIED' | string

export type PurchaseOrderFulfillmentType = 'WAREHOUSE_RECEIPT' | 'FACTORY_DIRECT' | string

export type PurchaseCollectionStatus =
  | 'not_started'
  | 'collecting'
  | 'succeeded'
  | 'failed'
  | 'reused'
  | 'cancelled'

export type PurchaseOrderStatus =
  | 'draft'
  | 'pending_collection'
  | 'collecting'
  | 'partial_done'
  | 'done'
  | 'exception'
  | 'submitted'
  | 'deleted'

export type SiteAllocation = {
  site: PurchaseSiteCode
  siteName: string
  siteId: number
  pskuCode?: string
  transportMode?: PurchaseTransportMode
  transportModeLabel?: string
  quantity: number
  enabled: boolean
}
