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
  | 'purchase-order'
  | 'purchase-profit'
  | 'purchase-in-transit-goods'
  | 'user-administration'

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
