import {
  ADMINISTRATION_IDENTITY_GRANT_RULES,
  FILE_MANAGEMENT_GRANT_RULES
} from './administrationRoutes'
import { DATA_REPORT_GRANT_RULES } from './dataReportRoutes'
import { FULFILLMENT_GRANT_RULES } from './fulfillmentRoutes'
import {
  OPERATION_CONFIG_GRANT_RULES,
  OPERATIONS_GRANT_RULES
} from './operationsRoutes'
import { PROCUREMENT_GRANT_RULES } from './procurementRoutes'
import { PRODUCT_GRANT_RULES } from './productRoutes'
import { freezeCatalogMetadata } from './freezeCatalogMetadata'
import { WORKSPACE_MENU_DEFINITIONS } from './routeDefinitions'
import { routePathIntegrityIssues } from './routePathIntegrity'
import { routeReferenceIntegrityIssues } from './routeReferenceIntegrity'
import { WORKSPACE_SECTION_METADATA } from './sectionCatalog'
import type {
  AppMenuKey,
  WorkspaceGrantedMenuRule,
  WorkspaceSectionDefinition
} from './routeDefinitions'
import type { WorkspaceMountAdapter } from './workspaceMount'

export type {
  AppMenuKey,
  WorkspaceGrantedMenuRule,
  WorkspaceMenuDefinition,
  WorkspaceSectionDefinition,
  WorkspaceSidebarEntry
} from './routeDefinitions'
export type {
  WorkspaceContentKind,
  WorkspaceSectionIconKey,
  WorkspaceSectionKey
} from './types'

export { WORKSPACE_MENU_DEFINITIONS } from './routeDefinitions'

export const ALL_WORKSPACE_MENU_KEYS = freezeCatalogMetadata(
  Object.keys(WORKSPACE_MENU_DEFINITIONS) as AppMenuKey[]
)

const workspaceSectionDefinitions: WorkspaceSectionDefinition[] = WORKSPACE_SECTION_METADATA.map(
  (section) => {
    const entries = ALL_WORKSPACE_MENU_KEYS
      .map((key) => WORKSPACE_MENU_DEFINITIONS[key])
      .filter(
        (definition) =>
          definition.sectionKey === section.key && definition.visibleInSidebar !== false
      )
      .sort((left, right) => (left.sidebarOrder ?? 0) - (right.sidebarOrder ?? 0))
      .map((definition) => ({ type: 'workspace' as const, key: definition.key }))
    return entries.length ? { ...section, entries } : { ...section }
  }
)
export const WORKSPACE_SECTION_DEFINITIONS = freezeCatalogMetadata(
  workspaceSectionDefinitions
)

const workspaceGrantedMenuRuleInputs = freezeCatalogMetadata([
  ...ADMINISTRATION_IDENTITY_GRANT_RULES,
  ...PRODUCT_GRANT_RULES,
  ...PROCUREMENT_GRANT_RULES,
  ...FULFILLMENT_GRANT_RULES,
  ...OPERATIONS_GRANT_RULES,
  ...DATA_REPORT_GRANT_RULES,
  ...OPERATION_CONFIG_GRANT_RULES,
  ...FILE_MANAGEMENT_GRANT_RULES
] as const)
type DeclaredGrantTarget = (typeof workspaceGrantedMenuRuleInputs)[number]['keys'][number]
type InvalidGrantTarget = Exclude<DeclaredGrantTarget, AppMenuKey>
type AssertNever<Value extends never> = Value
type GrantTargetIntegrity = AssertNever<InvalidGrantTarget>

export const WORKSPACE_GRANTED_MENU_RULES: readonly WorkspaceGrantedMenuRule[] =
  workspaceGrantedMenuRuleInputs
export type RouteGrantCompileTimeIntegrity = GrantTargetIntegrity

export const BOSS_OPERATOR_MENU_KEYS = freezeCatalogMetadata<AppMenuKey[]>([
  'product-manage',
  'product-groups',
  'product-specs',
  'product-image-profile',
  'product-image-match',
  'product-manual-selection',
  'purchase-ali1688-historical-orders',
  'purchase-ali1688-sku-purchase-history',
  'purchase-ali1688-collection',
  'purchase-listing',
  'purchase-order',
  'purchase-in-transit-goods',
  'purchase-product-logistics-costs',
  'purchase-profit',
  'purchase-logistics-quote',
  'warehouse-shipping-order',
  'warehouse-logistics-bill',
  'warehouse-dispatch',
  'official-warehouse',
  'operations-competitor-analysis',
  'operations-skin-management',
  'operations-noon-ads',
  'operations-product-keywords',
  'data-sales-analysis',
  'data-order-analysis',
  'noon-call-store-data',
  'system-report-noon-data-completeness',
  'system-report-noon-data-gaps',
  'operations-config-versions',
  'data-activity-config',
  'operations-lifecycle-rules'
])

export const MANAGEMENT_MENU_KEYS = freezeCatalogMetadata<AppMenuKey[]>([
  'system-file-management',
  'user-account',
  'user-store-noon',
  'user-role',
  'system-menu',
  'system-role'
])

export function isWorkspaceMenuKey(key: string): key is AppMenuKey {
  return Object.prototype.hasOwnProperty.call(WORKSPACE_MENU_DEFINITIONS, key)
}

export function workspaceMenuDefinition(menuKey: AppMenuKey) {
  return WORKSPACE_MENU_DEFINITIONS[menuKey]
}

export function workspaceTabKeyForMenuKey(menuKey: AppMenuKey): AppMenuKey {
  return workspaceMenuDefinition(menuKey).tabKey ?? menuKey
}

export function workspaceMenuPath(menuKey: AppMenuKey) {
  return workspaceMenuDefinition(menuKey).path
}

export function workspaceMenuPathLabel(menuKey: AppMenuKey) {
  return workspaceMenuDefinition(menuKey).pathLabel
}

export function workspaceMenuTabLabel(menuKey: AppMenuKey) {
  return workspaceMenuDefinition(menuKey).tabLabel
}

export function workspaceMenuContentKind(menuKey: AppMenuKey) {
  return workspaceMenuDefinition(menuKey).contentKind
}

export function workspaceMenuMount(menuKey: AppMenuKey): WorkspaceMountAdapter | null {
  return workspaceMenuDefinition(menuKey).workspaceMount ?? null
}

export function isProductWorkspaceMenu(menuKey: AppMenuKey) {
  const contentKind = workspaceMenuContentKind(menuKey)
  return contentKind === 'product-management' || contentKind === 'product-groups'
}

export function workspaceMenuSectionKey(menuKey: AppMenuKey) {
  return workspaceMenuDefinition(menuKey).sectionKey
}

export function shouldShowWorkspaceMenuInTabs(menuKey: AppMenuKey) {
  return workspaceMenuDefinition(menuKey).visibleInWorkspaceTabs !== false
}

export function shouldShowWorkspaceMenuInSidebar(menuKey: AppMenuKey) {
  return workspaceMenuDefinition(menuKey).visibleInSidebar !== false
}

export function routeCatalogIntegrityIssues() {
  const issues = [
    ...routePathIntegrityIssues(Object.values(WORKSPACE_MENU_DEFINITIONS)),
    ...routeReferenceIntegrityIssues(WORKSPACE_MENU_DEFINITIONS, WORKSPACE_GRANTED_MENU_RULES)
  ]
  const knownSections = new Set(WORKSPACE_SECTION_METADATA.map((section) => section.key))
  const occupiedSidebarOrders = new Map<string, AppMenuKey>()

  for (const key of ALL_WORKSPACE_MENU_KEYS) {
    const definition = workspaceMenuDefinition(key)
    if (!knownSections.has(definition.sectionKey)) {
      issues.push(`unknown section for ${key}: ${definition.sectionKey}`)
    }
    if (definition.visibleInSidebar !== false && definition.sidebarOrder === undefined) {
      issues.push(`missing sidebar order for ${key}`)
    }
    if (definition.visibleInSidebar !== false && definition.sidebarOrder !== undefined) {
      const sidebarSlot = `${definition.sectionKey}:${definition.sidebarOrder}`
      const existingKey = occupiedSidebarOrders.get(sidebarSlot)
      if (existingKey) {
        issues.push(`duplicate sidebar order ${sidebarSlot}: ${existingKey}, ${key}`)
      } else {
        occupiedSidebarOrders.set(sidebarSlot, key)
      }
    }
  }

  return issues
}

export function assertRouteCatalogIntegrity() {
  const issues = routeCatalogIntegrityIssues()
  if (issues.length) {
    throw new Error(`Invalid Route Catalog:\n${issues.join('\n')}`)
  }
}

assertRouteCatalogIntegrity()
