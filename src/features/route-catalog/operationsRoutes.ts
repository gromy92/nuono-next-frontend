import type { WorkspaceGrantedMenuRuleBase, WorkspaceMenuDefinitionBase } from './types'
import { freezeCatalogMetadata } from './freezeCatalogMetadata'
import { createLazyWorkspaceMount } from './workspaceMount'

export const OPERATIONS_ROUTE_DEFINITIONS = freezeCatalogMetadata({
  'operations-competitor-analysis': {
    key: 'operations-competitor-analysis',
    label: '竞品分析',
    path: '/operations/competitor-analysis',
    sectionKey: 'operations',
    pathLabel: '运营 / 竞品分析',
    tabLabel: '竞品分析',
    workspaceMount: createLazyWorkspaceMount(() =>
      import('../competitor-analysis/CompetitorAnalysisPage').then((module) => ({
        default: module.CompetitorAnalysisPage
      }))
    ),
    closable: true,
    sidebarOrder: 0
  },
  'operations-skin-management': {
    key: 'operations-skin-management',
    label: '皮肤管理',
    path: '/operations/skin-management',
    sectionKey: 'operations',
    pathLabel: '运营 / 皮肤管理',
    tabLabel: '皮肤管理',
    workspaceMount: createLazyWorkspaceMount(() =>
      import('../operations-skin-management/OperationsSkinManagementPage').then((module) => ({
        default: module.OperationsSkinManagementPage
      }))
    ),
    closable: true,
    sidebarOrder: 1
  },
  'operations-noon-ads': {
    key: 'operations-noon-ads',
    label: '广告投放经营台',
    path: '/operations/noon-ads',
    sectionKey: 'operations',
    pathLabel: '运营 / 广告投放经营台',
    tabLabel: '广告投放',
    workspaceMount: createLazyWorkspaceMount(() =>
      import('../noon-ads/NoonAdvertisingPage').then((module) => ({
        default: module.NoonAdvertisingPage
      }))
    ),
    closable: true,
    sidebarOrder: 2
  },
  'operations-product-keywords': {
    key: 'operations-product-keywords',
    label: '关键词数据',
    path: '/operations/product-keywords',
    sectionKey: 'operations',
    pathLabel: '运营 / 关键词数据',
    tabLabel: '关键词数据',
    workspaceMount: createLazyWorkspaceMount(() =>
      import('../product-keywords/ProductKeywordDataPage').then((module) => ({
        default: module.ProductKeywordDataPage
      }))
    ),
    closable: true,
    sidebarOrder: 3
  }
} as const satisfies Record<string, WorkspaceMenuDefinitionBase>)

export const OPERATION_CONFIG_ROUTE_DEFINITIONS = freezeCatalogMetadata({
  'operations-config-versions': {
    key: 'operations-config-versions',
    label: '运营配置版本',
    path: '/operations/config/versions',
    sectionKey: 'operation-config',
    pathLabel: '运营配置 / 运营配置版本',
    tabLabel: '运营配置版本',
    workspaceMount: createLazyWorkspaceMount(() =>
      import('../operations-config/OperationConfigSuiteVersionPage').then((module) => ({
        default: module.OperationConfigSuiteVersionPage
      }))
    ),
    closable: true,
    sidebarOrder: 0,
    visibleInWorkspaceTabs: true
  },
  'data-activity-config': {
    key: 'data-activity-config',
    label: '业务日历',
    path: '/operations/config/business-calendar',
    sectionKey: 'operation-config',
    pathLabel: '运营配置 / 业务日历',
    tabLabel: '业务日历',
    workspaceMount: createLazyWorkspaceMount(() =>
      import('../operations-config/OperationConfigSuiteVersionPage').then((module) => ({
        default: module.BusinessCalendarVersionLibraryPage
      }))
    ),
    closable: true,
    sidebarOrder: 1,
    routeAliases: ['/operation-config/holiday', '/data/activity-config']
  }
} as const satisfies Record<string, WorkspaceMenuDefinitionBase>)

export const OPERATIONS_GRANT_RULES = freezeCatalogMetadata([
  {
    keys: ['operations-competitor-analysis'],
    urlPaths: ['/operations/competitor-analysis', '/api/competitor-analysis'],
    urlPathPrefixes: ['/api/competitor-analysis/'],
    menuNames: ['竞品分析', '运营竞品分析']
  },
  {
    keys: ['operations-skin-management'],
    urlPaths: ['/operations/skin-management', '/api/operations/skin-management'],
    urlPathPrefixes: ['/api/operations/skin-management/'],
    menuNames: ['皮肤管理', '商品图片皮肤管理']
  },
  {
    keys: ['operations-noon-ads'],
    urlPaths: [
      '/operations/noon-ads',
      '/api/noon-ads/dashboard',
      '/api/noon-ads/reports/import'
    ],
    urlPathPrefixes: ['/api/noon-ads/'],
    menuNames: ['广告投放经营台', 'Noon Ads', '广告投放']
  },
  {
    keys: ['operations-product-keywords'],
    urlPaths: ['/operations/product-keywords', '/api/product-keywords'],
    urlPathPrefixes: ['/api/product-keywords/'],
    menuNames: ['关键词数据', '关键词管理']
  }
] as const satisfies readonly WorkspaceGrantedMenuRuleBase[])

export const OPERATION_CONFIG_GRANT_RULES = freezeCatalogMetadata([
  {
    keys: ['operations-config-versions', 'data-activity-config'],
    urlPaths: [
      '/operations/config/versions',
      '/operations/config/business-calendar',
      '/operation-config/holiday',
      '/data/activity-config',
      '/api/operations-config/scope'
    ],
    urlPathPrefixes: ['/api/operations-config/'],
    menuNames: [
      '运营配置',
      '运营配置版本',
      '业务日历',
      '业务日历与活动因子',
      '节日配置',
      '节日/活动配置',
      '活动配置'
    ]
  }
] as const satisfies readonly WorkspaceGrantedMenuRuleBase[])
