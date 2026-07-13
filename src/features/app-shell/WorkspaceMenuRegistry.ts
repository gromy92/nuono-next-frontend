export type AppMenuKey =
  | 'product-manage'
  | 'product-groups'
  | 'product-specs'
  | 'product-image-profile'
  | 'product-image-match'
  | 'product-manual-selection'
  | 'purchase-ali1688-collection'
  | 'purchase-ali1688-historical-orders'
  | 'purchase-ali1688-sku-purchase-history'
  | 'purchase-listing'
  | 'purchase-order'
  | 'purchase-pre-order-profit'
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
  | 'operations-noon-ads'
  | 'operations-product-keywords'
  | 'data-sales-analysis'
  | 'data-order-analysis'
  | 'noon-call-store-data'
  | 'system-report-noon-data-completeness'
  | 'system-report-noon-data-gaps'
  | 'operations-config-versions'
  | 'data-activity-config'
  | 'operations-lifecycle-rules'
  | 'system-file-management'
  | 'user-account'
  | 'user-store-noon'
  | 'user-role'
  | 'system-menu'
  | 'system-role'

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

export type WorkspaceSectionIconKey =
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
  | 'purchase-pre-order-profit'
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
  | 'system-file-management'
  | 'user-account'
  | 'user-role'
  | 'system-menu'
  | 'system-role'

export type WorkspaceMenuDefinition = {
  key: AppMenuKey
  label: string
  path: string
  sectionKey: WorkspaceSectionKey
  pathLabel: string
  tabLabel: string
  contentKind: WorkspaceContentKind
  closable: boolean
  routeAliases?: string[]
  tabKey?: AppMenuKey
  visibleInSidebar?: boolean
  visibleInWorkspaceTabs?: boolean
}

export type WorkspaceSidebarEntry =
  | {
      type: 'workspace'
      key: AppMenuKey
    }
  | {
      type: 'placeholder'
      key: string
      label: string
      disabled: true
    }

export type WorkspaceSectionDefinition = {
  key: WorkspaceSectionKey
  label: string
  iconKey: WorkspaceSectionIconKey
  disabled?: boolean
  entries?: WorkspaceSidebarEntry[]
}

export const WORKSPACE_MENU_DEFINITIONS: Record<AppMenuKey, WorkspaceMenuDefinition> = {
  'product-manage': {
    key: 'product-manage',
    label: '商品管理',
    path: '/product/manage',
    sectionKey: 'product',
    pathLabel: '商品 / 商品管理',
    tabLabel: '商品管理',
    contentKind: 'product-management',
    closable: true,
    routeAliases: ['/product-manage']
  },
  'product-groups': {
    key: 'product-groups',
    label: '商品分组',
    path: '/product/groups',
    sectionKey: 'product',
    pathLabel: '商品 / 商品分组',
    tabLabel: '商品分组',
    contentKind: 'product-groups',
    closable: true
  },
  'product-specs': {
    key: 'product-specs',
    label: '商品规格',
    path: '/product/specs',
    sectionKey: 'product',
    pathLabel: '商品 / 商品规格',
    tabLabel: '商品规格',
    contentKind: 'product-specs',
    closable: true
  },
  'product-image-profile': {
    key: 'product-image-profile',
    label: '商品图',
    path: '/product/images',
    sectionKey: 'product',
    pathLabel: '商品 / 商品图',
    tabLabel: '商品图',
    contentKind: 'product-image-profile',
    closable: true
  },
  'product-image-match': {
    key: 'product-image-match',
    label: '图片匹配',
    path: '/product/image-match',
    sectionKey: 'product',
    pathLabel: '商品 / 图片匹配',
    tabLabel: '图片匹配',
    contentKind: 'product-image-match',
    closable: true
  },
  'product-manual-selection': {
    key: 'product-manual-selection',
    label: '人工选品',
    path: '/product/manual-selection',
    sectionKey: 'product',
    pathLabel: '商品 / 人工选品',
    tabLabel: '人工选品',
    contentKind: 'product-manual-selection',
    closable: true
  },
  'purchase-ali1688-collection': {
    key: 'purchase-ali1688-collection',
    label: '1688查询展示',
    path: '/purchase/1688-collection',
    sectionKey: 'purchase',
    pathLabel: '采购 / 1688查询展示',
    tabLabel: '1688查询展示',
    contentKind: 'purchase-ali1688-collection',
    closable: true
  },
  'purchase-ali1688-historical-orders': {
    key: 'purchase-ali1688-historical-orders',
    label: '1688 历史订单',
    path: '/purchase/ali1688-orders',
    sectionKey: 'purchase',
    pathLabel: '采购 / 1688 历史订单',
    tabLabel: '1688 历史订单',
    contentKind: 'purchase-ali1688-historical-orders',
    closable: true
  },
  'purchase-ali1688-sku-purchase-history': {
    key: 'purchase-ali1688-sku-purchase-history',
    label: 'SKU 采购历史',
    path: '/purchase/ali1688-sku-purchase-history',
    sectionKey: 'purchase',
    pathLabel: '采购 / SKU 采购历史',
    tabLabel: 'SKU 采购历史',
    contentKind: 'purchase-ali1688-sku-purchase-history',
    closable: true
  },
  'purchase-listing': {
    key: 'purchase-listing',
    label: '商品上架',
    path: '/purchase/listing',
    sectionKey: 'purchase',
    pathLabel: '采购 / 商品上架',
    tabLabel: '商品上架',
    contentKind: 'product-listing',
    closable: true,
    visibleInSidebar: false,
    visibleInWorkspaceTabs: false
  },
  'purchase-order': {
    key: 'purchase-order',
    label: '补货采购',
    path: '/purchase/order',
    sectionKey: 'purchase',
    pathLabel: '采购 / 补货采购',
    tabLabel: '补货采购',
    contentKind: 'purchase-order',
    closable: true
  },
  'purchase-pre-order-profit': {
    key: 'purchase-pre-order-profit',
    label: '选品池',
    path: '/purchase/pre-order-profit',
    sectionKey: 'purchase',
    pathLabel: '采购 / 选品池',
    tabLabel: '选品池',
    contentKind: 'purchase-pre-order-profit',
    closable: true,
    visibleInSidebar: false,
    visibleInWorkspaceTabs: false
  },
  'purchase-profit': {
    key: 'purchase-profit',
    label: '利润计算',
    path: '/purchase/profit',
    sectionKey: 'purchase',
    pathLabel: '采购 / 利润计算',
    tabLabel: '利润计算',
    contentKind: 'purchase-profit',
    closable: true
  },
  'purchase-logistics-quote': {
    key: 'purchase-logistics-quote',
    label: '货代管理',
    path: '/purchase/logistics-quote',
    sectionKey: 'logistics',
    pathLabel: '物流 / 货代管理',
    tabLabel: '货代管理',
    contentKind: 'purchase-logistics-quote',
    closable: true
  },
  'purchase-product-logistics-costs': {
    key: 'purchase-product-logistics-costs',
    label: '商品物流价格',
    path: '/purchase/product-logistics-costs',
    sectionKey: 'logistics',
    pathLabel: '物流 / 商品物流价格',
    tabLabel: '商品物流价格',
    contentKind: 'purchase-product-logistics-costs',
    closable: true
  },
  'purchase-in-transit-goods': {
    key: 'purchase-in-transit-goods',
    label: '在途商品',
    path: '/purchase/in-transit-goods',
    sectionKey: 'purchase',
    pathLabel: '采购 / 在途商品',
    tabLabel: '在途商品',
    contentKind: 'purchase-in-transit-goods',
    closable: true
  },
  'warehouse-shipping-order': {
    key: 'warehouse-shipping-order',
    label: '发货单',
    path: '/warehouse/shipping-orders',
    sectionKey: 'warehouse',
    pathLabel: '仓储 / 发货单',
    tabLabel: '发货单',
    contentKind: 'warehouse-shipping-order',
    closable: true
  },
  'warehouse-logistics-bill': {
    key: 'warehouse-logistics-bill',
    label: '物流账单',
    path: '/warehouse/logistics-bills',
    sectionKey: 'warehouse',
    pathLabel: '仓储 / 物流账单',
    tabLabel: '物流账单',
    contentKind: 'warehouse-logistics-bill',
    closable: true
  },
  'warehouse-dispatch': {
    key: 'warehouse-dispatch',
    label: '仓库发运',
    path: '/warehouse/dispatch',
    sectionKey: 'warehouse',
    pathLabel: '仓储 / 仓库发运',
    tabLabel: '仓库发运',
    contentKind: 'warehouse-dispatch',
    closable: true
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
    routeAliases: ['/warehouse/fbn', '/storage/warehouse', '/warehouse/official-warehouse-stock']
  },
  'operations-competitor-analysis': {
    key: 'operations-competitor-analysis',
    label: '竞品分析',
    path: '/operations/competitor-analysis',
    sectionKey: 'operations',
    pathLabel: '运营 / 竞品分析',
    tabLabel: '竞品分析',
    contentKind: 'operations-competitor-analysis',
    closable: true
  },
  'operations-skin-management': {
    key: 'operations-skin-management',
    label: '皮肤管理',
    path: '/operations/skin-management',
    sectionKey: 'operations',
    pathLabel: '运营 / 皮肤管理',
    tabLabel: '皮肤管理',
    contentKind: 'operations-skin-management',
    closable: true
  },
  'operations-noon-ads': {
    key: 'operations-noon-ads',
    label: '广告投放经营台',
    path: '/operations/noon-ads',
    sectionKey: 'operations',
    pathLabel: '运营 / 广告投放经营台',
    tabLabel: '广告投放',
    contentKind: 'noon-ads',
    closable: true
  },
  'operations-product-keywords': {
    key: 'operations-product-keywords',
    label: '关键词数据',
    path: '/operations/product-keywords',
    sectionKey: 'operations',
    pathLabel: '运营 / 关键词数据',
    tabLabel: '关键词数据',
    contentKind: 'product-keywords',
    closable: true
  },
  'data-sales-analysis': {
    key: 'data-sales-analysis',
    label: '销量分析',
    path: '/data/sales-analysis',
    sectionKey: 'data',
    pathLabel: '数据 / 销量分析',
    tabLabel: '销量分析',
    contentKind: 'sales-analytics',
    closable: true
  },
  'data-order-analysis': {
    key: 'data-order-analysis',
    label: '订单分析',
    path: '/data/order-analysis',
    sectionKey: 'data',
    pathLabel: '数据 / 订单分析',
    tabLabel: '订单分析',
    contentKind: 'order-finance',
    closable: true
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
    closable: true
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
    visibleInWorkspaceTabs: false
  },
  'operations-config-versions': {
    key: 'operations-config-versions',
    label: '运营配置版本',
    path: '/operations/config/versions',
    sectionKey: 'operation-config',
    pathLabel: '运营配置 / 运营配置版本',
    tabLabel: '运营配置版本',
    contentKind: 'operations-config-versions',
    closable: true,
    visibleInWorkspaceTabs: true
  },
  'data-activity-config': {
    key: 'data-activity-config',
    label: '业务日历',
    path: '/operations/config/business-calendar',
    sectionKey: 'operation-config',
    pathLabel: '运营配置 / 业务日历',
    tabLabel: '业务日历',
    contentKind: 'operations-business-calendar',
    closable: true,
    routeAliases: ['/operation-config/holiday', '/data/activity-config']
  },
  'operations-lifecycle-rules': {
    key: 'operations-lifecycle-rules',
    label: '生命周期配置',
    path: '/operations/config/lifecycle-rules',
    sectionKey: 'operation-config',
    pathLabel: '运营配置 / 生命周期配置',
    tabLabel: '生命周期配置',
    contentKind: 'operations-lifecycle-rules',
    closable: true
  },
  'system-file-management': {
    key: 'system-file-management',
    label: '文件管理',
    path: '/system/file-management',
    sectionKey: 'system',
    pathLabel: '系统管理 / 文件管理',
    tabLabel: '文件管理',
    contentKind: 'system-file-management',
    closable: true,
    routeAliases: ['/system/ai-file-parse']
  },
  'user-account': {
    key: 'user-account',
    label: '账号管理',
    path: '/user/manage',
    sectionKey: 'user',
    pathLabel: '用户 / 账号管理',
    tabLabel: '账号管理',
    contentKind: 'user-account',
    closable: true
  },
  'user-store-noon': {
    key: 'user-store-noon',
    label: '店铺管理',
    path: '/user/store-binding',
    sectionKey: 'user',
    pathLabel: '用户 / 店铺管理',
    tabLabel: '角色分配',
    contentKind: 'user-role',
    closable: true,
    tabKey: 'user-role',
    visibleInSidebar: false,
    visibleInWorkspaceTabs: false
  },
  'user-role': {
    key: 'user-role',
    label: '角色分配',
    path: '/user/role',
    sectionKey: 'user',
    pathLabel: '用户 / 角色分配',
    tabLabel: '角色分配',
    contentKind: 'user-role',
    closable: true
  },
  'system-menu': {
    key: 'system-menu',
    label: '菜单维护',
    path: '/system/menu',
    sectionKey: 'system',
    pathLabel: '系统管理 / 菜单维护',
    tabLabel: '菜单维护',
    contentKind: 'system-menu',
    closable: true
  },
  'system-role': {
    key: 'system-role',
    label: '角色管理',
    path: '/system/role',
    sectionKey: 'system',
    pathLabel: '系统管理 / 角色管理',
    tabLabel: '角色管理',
    contentKind: 'system-role',
    closable: true
  }
}

export const WORKSPACE_SECTION_DEFINITIONS: WorkspaceSectionDefinition[] = [
  {
    key: 'home',
    label: '首页',
    iconKey: 'home',
    disabled: true
  },
  {
    key: 'product',
    label: '商品',
    iconKey: 'product',
    entries: [
      { type: 'workspace', key: 'product-manage' },
      { type: 'workspace', key: 'product-groups' },
      { type: 'workspace', key: 'product-specs' },
      { type: 'workspace', key: 'product-image-profile' },
      { type: 'workspace', key: 'product-image-match' },
      { type: 'workspace', key: 'product-manual-selection' }
    ]
  },
  {
    key: 'purchase',
    label: '采购',
    iconKey: 'purchase',
    entries: [
      { type: 'workspace', key: 'purchase-profit' },
      { type: 'workspace', key: 'purchase-ali1688-historical-orders' },
      { type: 'workspace', key: 'purchase-ali1688-sku-purchase-history' },
      { type: 'workspace', key: 'purchase-ali1688-collection' },
      { type: 'workspace', key: 'purchase-order' },
      { type: 'workspace', key: 'purchase-in-transit-goods' }
    ]
  },
  {
    key: 'logistics',
    label: '物流',
    iconKey: 'logistics',
    entries: [
      { type: 'workspace', key: 'purchase-logistics-quote' },
      { type: 'workspace', key: 'purchase-product-logistics-costs' }
    ]
  },
  {
    key: 'warehouse',
    label: '仓储',
    iconKey: 'warehouse',
    entries: [
      { type: 'workspace', key: 'warehouse-shipping-order' },
      { type: 'workspace', key: 'warehouse-logistics-bill' },
      { type: 'workspace', key: 'warehouse-dispatch' },
      { type: 'workspace', key: 'official-warehouse' }
    ]
  },
  {
    key: 'operations',
    label: '运营',
    iconKey: 'operations',
    entries: [
      { type: 'workspace', key: 'operations-competitor-analysis' },
      { type: 'workspace', key: 'operations-skin-management' },
      { type: 'workspace', key: 'operations-noon-ads' },
      { type: 'workspace', key: 'operations-product-keywords' }
    ]
  },
  {
    key: 'operation-config',
    label: '运营配置',
    iconKey: 'operation-config',
    entries: [
      { type: 'workspace', key: 'operations-config-versions' },
      { type: 'workspace', key: 'data-activity-config' },
      { type: 'workspace', key: 'operations-lifecycle-rules' }
    ]
  },
  {
    key: 'data',
    label: '数据',
    iconKey: 'data',
    entries: [
      { type: 'workspace', key: 'data-sales-analysis' },
      { type: 'workspace', key: 'data-order-analysis' }
    ]
  },
  {
    key: 'system-reports',
    label: '系统报表',
    iconKey: 'system-reports',
    entries: [
      { type: 'workspace', key: 'noon-call-store-data' },
      { type: 'workspace', key: 'system-report-noon-data-completeness' },
      { type: 'workspace', key: 'system-report-noon-data-gaps' }
    ]
  },
  {
    key: 'user',
    label: '用户',
    iconKey: 'user',
    entries: [
      { type: 'workspace', key: 'user-account' },
      { type: 'workspace', key: 'user-role' }
    ]
  },
  {
    key: 'system',
    label: '系统管理',
    iconKey: 'system',
    entries: [
      { type: 'workspace', key: 'system-menu' },
      { type: 'workspace', key: 'system-file-management' },
      { type: 'workspace', key: 'system-role' }
    ]
  }
]

export const WORKSPACE_GRANTED_MENU_RULES: Array<{
  keys: AppMenuKey[]
  urlPaths?: string[]
  urlPathPrefixes?: string[]
  menuNames?: string[]
}> = [
  {
    keys: ['user-account', 'user-store-noon'],
    urlPaths: ['/api/user/manage'],
    menuNames: ['用户管理']
  },
  {
    keys: ['user-role', 'user-store-noon'],
    urlPaths: ['/api/user/role'],
    menuNames: ['角色分配']
  },
  {
    keys: ['system-role'],
    urlPaths: ['/system/role'],
    menuNames: ['角色维护', '角色管理']
  },
  {
    keys: ['system-menu'],
    urlPaths: ['/system/menu'],
    menuNames: ['菜单维护']
  },
  {
    keys: ['product-manage', 'product-groups', 'product-specs'],
    urlPaths: ['/api/sku/manage'],
    menuNames: ['商品管理']
  },
  {
    keys: ['product-specs'],
    urlPaths: ['/product/specs', '/api/product-specs'],
    urlPathPrefixes: ['/api/product-specs/'],
    menuNames: ['商品规格']
  },
  {
    keys: ['product-image-profile'],
    urlPaths: ['/product/images', '/api/product-images'],
    urlPathPrefixes: ['/api/product-images/'],
    menuNames: ['商品图', '商品图片']
  },
  {
    keys: ['product-image-match'],
    urlPaths: ['/product/image-match', '/api/image-match/compare'],
    urlPathPrefixes: ['/api/image-match/'],
    menuNames: ['图片匹配', '商品图片匹配']
  },
  {
    keys: ['product-groups'],
    urlPaths: ['/product/groups'],
    menuNames: ['商品分组']
  },
  {
    keys: ['product-manual-selection'],
    urlPaths: ['/product/manual-selection', '/api/spu'],
    menuNames: ['人工选品', '商品采集']
  },
  {
    keys: ['purchase-order', 'purchase-ali1688-collection'],
    urlPaths: ['/api/purchase/order']
  },
  {
    keys: ['purchase-ali1688-collection'],
    urlPaths: ['/purchase/1688-collection'],
    menuNames: ['1688查询展示', '1688查询']
  },
  {
    keys: ['purchase-ali1688-historical-orders', 'purchase-ali1688-sku-purchase-history'],
    urlPaths: ['/purchase/ali1688-orders', '/purchase/ali1688-sku-purchase-history'],
    urlPathPrefixes: ['/api/procurement/ali1688-orders'],
    menuNames: ['1688 历史订单', 'SKU 采购历史']
  },
  {
    keys: ['purchase-listing'],
    urlPaths: ['/purchase/listing', '/api/product-listing'],
    urlPathPrefixes: ['/api/product-listing/'],
    menuNames: ['商品上架']
  },
  {
    keys: ['purchase-profit'],
    urlPaths: ['/purchase/profit', '/api/sku/cost'],
    menuNames: ['利润计算', '利润计算与上架']
  },
  {
    keys: ['purchase-logistics-quote'],
    urlPaths: ['/purchase/logistics-quote'],
    menuNames: ['货代管理', '物流报价', '货代方案']
  },
  {
    keys: ['purchase-in-transit-goods', 'purchase-product-logistics-costs'],
    urlPaths: ['/purchase/in-transit-goods', '/purchase/product-logistics-costs'],
    urlPathPrefixes: ['/api/in-transit-goods', '/api/product-logistics-costs'],
    menuNames: ['在途商品', '在途物流', '在途物流信息', '商品物流价格', '商品物流成本']
  },
  {
    keys: ['warehouse-shipping-order', 'warehouse-logistics-bill', 'warehouse-dispatch', 'official-warehouse', 'product-specs'],
    urlPaths: [
      '/warehouse/shipping-orders',
      '/warehouse/logistics-bills',
      '/warehouse/dispatch',
      '/warehouse/official-warehouse',
      '/warehouse/official-warehouse-stock',
      '/storage/warehouse'
    ],
    urlPathPrefixes: ['/api/warehouse/dispatch', '/api/warehouse/official-warehouse'],
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
  },
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
    urlPaths: ['/operations/noon-ads', '/api/noon-ads/dashboard', '/api/noon-ads/reports/import'],
    urlPathPrefixes: ['/api/noon-ads/'],
    menuNames: ['广告投放经营台', 'Noon Ads', '广告投放']
  },
  {
    keys: ['operations-product-keywords'],
    urlPaths: ['/operations/product-keywords', '/api/product-keywords'],
    urlPathPrefixes: ['/api/product-keywords/'],
    menuNames: ['关键词数据', '关键词管理']
  },
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
    urlPathPrefixes: ['/api/sales-data/analytics/', '/api/sales-data/activity-windows/', '/api/order-finance/', '/api/sales-forecast/'],
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
    urlPathPrefixes: ['/api/noon-call/store-data/', '/api/system-reports/noon-data-completeness/'],
    menuNames: ['系统报表', 'Noon调用', 'Noon店铺数据', '店铺数据', '数据完整度', '数据缺口巡检']
  },
  {
    keys: ['operations-config-versions', 'data-activity-config', 'operations-lifecycle-rules'],
    urlPaths: [
      '/operations/config/versions',
      '/operations/config/business-calendar',
      '/operations/config/lifecycle-rules',
      '/operation-config/holiday',
      '/data/activity-config',
      '/api/operations-config/scope'
    ],
    urlPathPrefixes: ['/api/operations-config/'],
    menuNames: ['运营配置', '运营配置版本', '业务日历', '生命周期配置', '业务日历与活动因子', '生命周期规则配置', '节日配置', '节日/活动配置', '活动配置']
  },
  {
    keys: ['system-file-management'],
    urlPaths: ['/system/file-management', '/system/ai-file-parse'],
    urlPathPrefixes: ['/system/ai-file-parse/'],
    menuNames: ['文件管理', '官方费用表', 'Noon费用表', '官方文件管理', '官方费用文件管理', 'AI文件解析', 'AI 文件解析']
  }
]

export const ALL_WORKSPACE_MENU_KEYS = Object.keys(WORKSPACE_MENU_DEFINITIONS) as AppMenuKey[]

export const BOSS_OPERATOR_MENU_KEYS: AppMenuKey[] = [
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
]

export const MANAGEMENT_MENU_KEYS: AppMenuKey[] = [
  'system-file-management',
  'user-account',
  'user-store-noon',
  'user-role',
  'system-menu',
  'system-role'
]

export function isWorkspaceMenuKey(key: string): key is AppMenuKey {
  return Object.prototype.hasOwnProperty.call(WORKSPACE_MENU_DEFINITIONS, key)
}

export function workspaceMenuDefinition(menuKey: AppMenuKey) {
  return WORKSPACE_MENU_DEFINITIONS[menuKey]
}

export function workspaceTabKeyForMenuKey(menuKey: AppMenuKey): AppMenuKey {
  return WORKSPACE_MENU_DEFINITIONS[menuKey].tabKey ?? menuKey
}

export function workspaceMenuPath(menuKey: AppMenuKey) {
  return WORKSPACE_MENU_DEFINITIONS[menuKey].path
}

export function workspaceMenuPathLabel(menuKey: AppMenuKey) {
  return WORKSPACE_MENU_DEFINITIONS[menuKey].pathLabel
}

export function workspaceMenuTabLabel(menuKey: AppMenuKey) {
  return WORKSPACE_MENU_DEFINITIONS[menuKey].tabLabel
}

export function workspaceMenuContentKind(menuKey: AppMenuKey) {
  return WORKSPACE_MENU_DEFINITIONS[menuKey].contentKind
}

export function isProductWorkspaceMenu(menuKey: AppMenuKey) {
  const contentKind = workspaceMenuContentKind(menuKey)
  return contentKind === 'product-management' || contentKind === 'product-groups'
}

export function workspaceMenuSectionKey(menuKey: AppMenuKey) {
  return WORKSPACE_MENU_DEFINITIONS[menuKey].sectionKey
}

export function shouldShowWorkspaceMenuInTabs(menuKey: AppMenuKey) {
  return WORKSPACE_MENU_DEFINITIONS[menuKey].visibleInWorkspaceTabs !== false
}

export function shouldShowWorkspaceMenuInSidebar(menuKey: AppMenuKey) {
  return WORKSPACE_MENU_DEFINITIONS[menuKey].visibleInSidebar !== false
}
