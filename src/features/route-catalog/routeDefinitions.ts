import { ADMINISTRATION_ROUTE_DEFINITIONS } from './administrationRoutes'
import { DATA_REPORT_ROUTE_DEFINITIONS } from './dataReportRoutes'
import { FULFILLMENT_ROUTE_DEFINITIONS } from './fulfillmentRoutes'
import { freezeCatalogMetadata } from './freezeCatalogMetadata'
import {
  OPERATION_CONFIG_ROUTE_DEFINITIONS,
  OPERATIONS_ROUTE_DEFINITIONS
} from './operationsRoutes'
import { PROCUREMENT_ROUTE_DEFINITIONS } from './procurementRoutes'
import { PRODUCT_ROUTE_DEFINITIONS } from './productRoutes'
import {
  mergeUniqueRouteDefinitionFragments,
  type RouteDefinitionFragment
} from './routeFragmentIntegrity'
import type {
  WorkspaceGrantedMenuRuleBase,
  WorkspaceMenuDefinitionBase,
  WorkspaceSectionDefinitionBase,
  WorkspaceSidebarEntryBase
} from './types'

const routeDefinitionFragments = [
  { owner: 'product', definitions: PRODUCT_ROUTE_DEFINITIONS },
  { owner: 'procurement', definitions: PROCUREMENT_ROUTE_DEFINITIONS },
  { owner: 'fulfillment', definitions: FULFILLMENT_ROUTE_DEFINITIONS },
  { owner: 'operations', definitions: OPERATIONS_ROUTE_DEFINITIONS },
  { owner: 'data-report', definitions: DATA_REPORT_ROUTE_DEFINITIONS },
  { owner: 'operation-config', definitions: OPERATION_CONFIG_ROUTE_DEFINITIONS },
  { owner: 'administration', definitions: ADMINISTRATION_ROUTE_DEFINITIONS }
] as const satisfies readonly RouteDefinitionFragment[]

const routeDefinitionInputs = freezeCatalogMetadata(
  mergeUniqueRouteDefinitionFragments(routeDefinitionFragments)
)

export type AppMenuKey = keyof typeof routeDefinitionInputs
export type WorkspaceMenuDefinition = WorkspaceMenuDefinitionBase<AppMenuKey>
export type WorkspaceSidebarEntry = WorkspaceSidebarEntryBase<AppMenuKey>
export type WorkspaceSectionDefinition = WorkspaceSectionDefinitionBase<AppMenuKey>
export type WorkspaceGrantedMenuRule = WorkspaceGrantedMenuRuleBase<AppMenuKey>

type InvalidDefinitionKey = {
  [Key in AppMenuKey]: (typeof routeDefinitionInputs)[Key] extends { readonly key: Key }
    ? never
    : Key
}[AppMenuKey]

type DeclaredTabKey<Definition> = Definition extends { readonly tabKey: infer TabKey }
  ? TabKey
  : never
type InvalidTabKey = Exclude<
  DeclaredTabKey<(typeof routeDefinitionInputs)[AppMenuKey]>,
  AppMenuKey
>
type AssertNever<Value extends never> = Value
type DefinitionKeyIntegrity = AssertNever<InvalidDefinitionKey>
type TabKeyIntegrity = AssertNever<InvalidTabKey>

export const WORKSPACE_MENU_DEFINITIONS: Readonly<
  Record<AppMenuKey, WorkspaceMenuDefinition>
> = routeDefinitionInputs

export type RouteDefinitionCompileTimeIntegrity = DefinitionKeyIntegrity | TabKeyIntegrity
