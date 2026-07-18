import type { WorkspaceGrantedMenuRuleBase, WorkspaceMenuDefinitionBase } from './types'
import { freezeCatalogMetadata } from './freezeCatalogMetadata'

export const FULFILLMENT_ROUTE_DEFINITIONS = freezeCatalogMetadata({
  'warehouse-shipping-order': {
    key: 'warehouse-shipping-order',
    label: '发货单',
    path: '/warehouse/shipping-orders',
    sectionKey: 'warehouse',
    pathLabel: '仓储 / 发货单',
    tabLabel: '发货单',
    contentKind: 'warehouse-shipping-order',
    closable: true,
    visibleInSidebar: false
  },
  'warehouse-logistics-bill': {
    key: 'warehouse-logistics-bill',
    label: '物流账单',
    path: '/warehouse/logistics-bills',
    sectionKey: 'warehouse',
    pathLabel: '仓储 / 物流账单',
    tabLabel: '物流账单',
    contentKind: 'warehouse-logistics-bill',
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
    contentKind: 'warehouse-dispatch',
    closable: true,
    sidebarOrder: 1
  },
  'official-warehouse': {
    key: 'official-warehouse',
    label: 'Noon官方仓',
    path: '/warehouse/official-warehouse',
    sectionKey: 'warehouse',
    pathLabel: '仓储 / Noon官方仓',
    tabLabel: 'Noon官方仓',
    contentKind: 'official-warehouse',
    closable: true,
    sidebarOrder: 2,
    routeAliases: ['/warehouse/fbn', '/storage/warehouse', '/warehouse/official-warehouse-stock']
  }
} as const satisfies Record<string, WorkspaceMenuDefinitionBase>)

export const FULFILLMENT_GRANT_RULES = freezeCatalogMetadata([
  {
    keys: [
      'warehouse-shipping-order',
      'warehouse-logistics-bill',
      'warehouse-dispatch',
      'official-warehouse',
      'product-specs'
    ],
    urlPaths: [
      '/warehouse/shipping-orders',
      '/warehouse/logistics-bills',
      '/warehouse/dispatch',
      '/warehouse/official-warehouse',
      '/warehouse/official-warehouse-stock',
      '/storage/warehouse'
    ],
    urlPathPrefixes: [
      '/api/warehouse/dispatch',
      '/api/warehouse/official-warehouse',
      '/api/procurement/purchase-orders/shipping-orders',
      '/api/procurement/purchase-orders/logistics-bills'
    ],
    menuNames: [
      '发货单',
      '仓库发货单',
      '物流账单',
      '仓库发运',
      '仓储发运',
      '采购收货',
      '发运计划',
      'Noon官方仓',
      'FBN抢仓',
      '约仓看板',
      '官方仓库存'
    ]
  }
] as const satisfies readonly WorkspaceGrantedMenuRuleBase[])
