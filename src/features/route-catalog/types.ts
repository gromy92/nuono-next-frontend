import type { WorkspaceMountAdapter } from './workspaceMount'

export type WorkspaceSectionKey =
  | 'home'
  | 'product'
  | 'purchase'
  | 'logistics'
  | 'warehouse'
  | 'campaign'
  | 'operations'
  | 'operation-config'
  | 'task'
  | 'data'
  | 'system-reports'
  | 'user'
  | 'ai-model'
  | 'system'

export type WorkspaceSectionIconKey = WorkspaceSectionKey

export type WorkspaceContentKind =
  | 'product-management'
  | 'product-groups'
  | 'product-specs'
  | 'product-image-profile'
  | 'product-image-match'
  | 'product-manual-selection'
  | 'purchase-ali1688-collection'
  | 'purchase-ali1688-historical-orders'
  | 'purchase-ali1688-sku-purchase-history'
  | 'product-listing'
  | 'purchase-order'
  | 'purchase-profit'
  | 'purchase-logistics-quote'
  | 'purchase-product-logistics-costs'
  | 'purchase-in-transit-goods'
  | 'warehouse-shipping-order'
  | 'warehouse-logistics-bill'
  | 'warehouse-dispatch'
  | 'official-warehouse'
  | 'operations-competitor-analysis'
  | 'operations-skin-management'
  | 'noon-ads'
  | 'product-keywords'
  | 'sales-analytics'
  | 'order-finance'
  | 'noon-call-store-data'
  | 'system-report-noon-data-completeness'
  | 'system-report-noon-data-gaps'
  | 'operations-config-versions'
  | 'operations-business-calendar'
  | 'operations-lifecycle-rules'
  | 'user-account'
  | 'user-role'
  | 'system-menu'
  | 'system-role'

type WorkspaceMenuDefinitionCommon<MenuKey extends string> = {
  readonly key: MenuKey
  readonly label: string
  readonly path: string
  readonly sectionKey: WorkspaceSectionKey
  readonly pathLabel: string
  readonly tabLabel: string
  readonly closable: boolean
  readonly sidebarOrder?: number
  readonly routeAliases?: readonly string[]
  readonly tabKey?: MenuKey
  readonly visibleInSidebar?: boolean
  readonly visibleInWorkspaceTabs?: boolean
}

export type WorkspaceMountStrategy =
  | {
      readonly contentKind: WorkspaceContentKind
      readonly workspaceMount?: never
    }
  | {
      readonly workspaceMount: WorkspaceMountAdapter
      readonly contentKind?: never
    }

export type WorkspaceMenuDefinitionBase<MenuKey extends string = string> =
  WorkspaceMenuDefinitionCommon<MenuKey> & WorkspaceMountStrategy

export type WorkspaceSidebarEntryBase<MenuKey extends string> =
  | { readonly type: 'workspace'; readonly key: MenuKey }
  | { readonly type: 'placeholder'; readonly key: string; readonly label: string; readonly disabled: true }

export type WorkspaceSectionDefinitionBase<MenuKey extends string> = {
  readonly key: WorkspaceSectionKey
  readonly label: string
  readonly iconKey: WorkspaceSectionIconKey
  readonly disabled?: boolean
  readonly entries?: readonly WorkspaceSidebarEntryBase<MenuKey>[]
}

export type WorkspaceSectionMetadata = Omit<WorkspaceSectionDefinitionBase<string>, 'entries'>

export type WorkspaceGrantedMenuRuleBase<MenuKey extends string = string> = {
  readonly keys: readonly MenuKey[]
  readonly urlPaths?: readonly string[]
  readonly urlPathPrefixes?: readonly string[]
  readonly menuNames?: readonly string[]
}
