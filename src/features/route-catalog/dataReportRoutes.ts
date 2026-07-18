import type { WorkspaceGrantedMenuRuleBase, WorkspaceMenuDefinitionBase } from './types'
import { freezeCatalogMetadata } from './freezeCatalogMetadata'

export const DATA_REPORT_ROUTE_DEFINITIONS = freezeCatalogMetadata({
  'data-sales-analysis': {
    key: 'data-sales-analysis',
    label: '销量分析',
    path: '/data/sales-analysis',
    sectionKey: 'data',
    pathLabel: '数据 / 销量分析',
    tabLabel: '销量分析',
    contentKind: 'sales-analytics',
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
    contentKind: 'order-finance',
    closable: true,
    sidebarOrder: 1
  },
  'noon-call-store-data': {
    key: 'noon-call-store-data',
    label: '店铺数据',
    path: '/system-reports/store-data',
    sectionKey: 'system-reports',
    pathLabel: '系统报表 / 店铺数据',
    tabLabel: '店铺数据',
    contentKind: 'noon-call-store-data',
    closable: true,
    sidebarOrder: 0,
    visibleInWorkspaceTabs: false,
    routeAliases: ['/noon-call/store-data']
  },
  'system-report-noon-data-completeness': {
    key: 'system-report-noon-data-completeness',
    label: '数据完整度',
    path: '/system-reports/noon-data-completeness',
    sectionKey: 'system-reports',
    pathLabel: '系统报表 / 数据完整度',
    tabLabel: '数据完整度',
    contentKind: 'system-report-noon-data-completeness',
    closable: true,
    sidebarOrder: 1
  },
  'system-report-noon-data-gaps': {
    key: 'system-report-noon-data-gaps',
    label: '数据缺口巡检',
    path: '/system-reports/noon-data-gaps',
    sectionKey: 'system-reports',
    pathLabel: '系统报表 / 数据缺口巡检',
    tabLabel: '数据缺口巡检',
    contentKind: 'system-report-noon-data-gaps',
    closable: true,
    sidebarOrder: 2,
    visibleInWorkspaceTabs: false
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
  },
  {
    keys: ['noon-call-store-data', 'system-report-noon-data-completeness', 'system-report-noon-data-gaps'],
    urlPaths: [
      '/system-reports/store-data',
      '/noon-call/store-data',
      '/api/noon-call/store-data',
      '/system-reports/noon-data-completeness',
      '/system-reports/noon-data-gaps',
      '/api/system-reports/noon-data-completeness'
    ],
    urlPathPrefixes: [
      '/api/noon-call/store-data/',
      '/api/system-reports/noon-data-completeness/'
    ],
    menuNames: ['系统报表', 'Noon调用', 'Noon店铺数据', '店铺数据', '数据完整度', '数据缺口巡检']
  }
] as const satisfies readonly WorkspaceGrantedMenuRuleBase[])
