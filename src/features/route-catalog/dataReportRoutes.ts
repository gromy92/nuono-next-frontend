import type { WorkspaceGrantedMenuRuleBase, WorkspaceMenuDefinitionBase } from './types'
import { freezeCatalogMetadata } from './freezeCatalogMetadata'
import { createLazyWorkspaceMount } from './workspaceMount'

export const DATA_REPORT_ROUTE_DEFINITIONS = freezeCatalogMetadata({
  'data-sales-analysis': {
    key: 'data-sales-analysis',
    label: '销量分析',
    path: '/data/sales-analysis',
    sectionKey: 'data',
    pathLabel: '数据 / 销量分析',
    tabLabel: '销量分析',
    workspaceMount: createLazyWorkspaceMount(() =>
      import('../sales-analytics/SalesAnalyticsPage').then((module) => ({
        default: module.SalesAnalyticsPage
      }))
    ),
    closable: true,
    sidebarOrder: 0
  },
  'data-order-analysis': {
    key: 'data-order-analysis',
    label: '订单分析',
    path: '/data/order-analysis',
    sectionKey: 'data',
    pathLabel: '数据 / 订单分析',
    tabLabel: '订单分析',
    workspaceMount: createLazyWorkspaceMount(() =>
      import('../order-finance/OrderFinancePage').then((module) => ({
        default: module.OrderFinancePage
      }))
    ),
    closable: true,
    sidebarOrder: 1
  }
} as const satisfies Record<string, WorkspaceMenuDefinitionBase>)

export const DATA_REPORT_GRANT_RULES = freezeCatalogMetadata([
  {
    keys: ['data-sales-analysis', 'data-order-analysis'],
    urlPaths: [
      '/data/sales-analysis',
      '/data/order-analysis',
      '/api/sales-data/analytics',
      '/api/sales-data/activity-windows',
      '/api/order-finance',
      '/api/sales-forecast/overview'
    ],
    urlPathPrefixes: [
      '/api/sales-data/analytics/',
      '/api/sales-data/activity-windows/',
      '/api/order-finance/',
      '/api/sales-forecast/'
    ],
    menuNames: ['销量分析', '订单分析', '销售分析', '销量数据']
  }
] as const satisfies readonly WorkspaceGrantedMenuRuleBase[])
