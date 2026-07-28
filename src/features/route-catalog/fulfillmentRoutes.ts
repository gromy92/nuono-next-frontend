import type { WorkspaceGrantedMenuRuleBase, WorkspaceMenuDefinitionBase } from './types'
import { freezeCatalogMetadata } from './freezeCatalogMetadata'
import { createLazyWorkspaceMount } from './workspaceMount'

export const FULFILLMENT_ROUTE_DEFINITIONS = freezeCatalogMetadata({
  'warehouse-logistics-bill': {
    key: 'warehouse-logistics-bill',
    label: '物流账单',
    path: '/warehouse/logistics-bills',
    sectionKey: 'warehouse',
    pathLabel: '仓储 / 物流账单',
    tabLabel: '物流账单',
    workspaceMount: createLazyWorkspaceMount(() =>
      import('../warehouse-logistics-bill/WarehouseLogisticsBillPage').then((module) => ({
        default: module.WarehouseLogisticsBillPage
      }))
    ),
    closable: true,
    sidebarOrder: 0
  },
  'warehouse-dispatch': {
    key: 'warehouse-dispatch',
    label: '仓库发运',
    path: '/warehouse/dispatch',
    sectionKey: 'warehouse',
    pathLabel: '仓储 / 仓库发运',
    tabLabel: '仓库发运',
    workspaceMount: createLazyWorkspaceMount(() =>
      import('../warehouse-dispatch/WarehouseDispatchWorkbenchPage').then((module) => ({
        default: module.WarehouseDispatchWorkbenchPage
      }))
    ),
    closable: true,
    sidebarOrder: 1,
    routeAliases: ['/warehouse/shipping-orders']
  },
  'official-warehouse': {
    key: 'official-warehouse',
    label: 'Noon官方仓',
    path: '/warehouse/official-warehouse',
    sectionKey: 'warehouse',
    pathLabel: '仓储 / Noon官方仓',
    tabLabel: 'Noon官方仓',
    workspaceMount: createLazyWorkspaceMount(() =>
      import('../official-warehouse/OfficialWarehouseWorkbenchPage').then((module) => ({
        default: module.OfficialWarehouseWorkbenchPage
      }))
    ),
    closable: true,
    sidebarOrder: 2,
    routeAliases: ['/warehouse/fbn', '/storage/warehouse', '/warehouse/official-warehouse-stock']
  }
} as const satisfies Record<string, WorkspaceMenuDefinitionBase>)

export const FULFILLMENT_GRANT_RULES = freezeCatalogMetadata([
  {
    keys: ['warehouse-logistics-bill'],
    urlPaths: ['/warehouse/logistics-bills'],
    urlPathPrefixes: ['/api/procurement/purchase-orders/logistics-bills'],
    menuNames: ['物流账单']
  },
  {
    keys: ['warehouse-dispatch'],
    urlPaths: ['/warehouse/shipping-orders', '/warehouse/dispatch'],
    urlPathPrefixes: [
      '/api/warehouse/dispatch',
      '/api/procurement/purchase-orders/shipping-orders'
    ],
    menuNames: [
      '发货单',
      '仓库发货单',
      '仓库发运',
      '仓储发运',
      '采购收货',
      '发运计划'
    ]
  },
  {
    keys: ['official-warehouse'],
    urlPaths: [
      '/warehouse/official-warehouse',
      '/warehouse/official-warehouse-stock',
      '/storage/warehouse'
    ],
    urlPathPrefixes: ['/api/warehouse/official-warehouse'],
    menuNames: [
      'Noon官方仓',
      'FBN抢仓',
      '约仓看板',
      '官方仓库存'
    ]
  }
] as const satisfies readonly WorkspaceGrantedMenuRuleBase[])
