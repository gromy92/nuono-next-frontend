import type { WorkspaceGrantedMenuRuleBase, WorkspaceMenuDefinitionBase } from './types'
import { freezeCatalogMetadata } from './freezeCatalogMetadata'
import { createLazyWorkspaceMount } from './workspaceMount'

export const PROCUREMENT_ROUTE_DEFINITIONS = freezeCatalogMetadata({
  'purchase-ali1688-collection': {
    key: 'purchase-ali1688-collection',
    label: '1688查询展示',
    path: '/purchase/1688-collection',
    sectionKey: 'purchase',
    pathLabel: '采购 / 1688查询展示',
    tabLabel: '1688查询展示',
    workspaceMount: createLazyWorkspaceMount(
      () =>
        import('../ali1688-collection/Ali1688CollectionPage').then((module) => ({
          default: module.Ali1688CollectionPage
        })),
      ({ session }) => ({
        storeName:
          session.currentStore?.projectName ||
          session.currentStore?.projectCode ||
          'xingyao',
        storeCode: session.currentStore?.storeCode,
        operatorName: session.realName || session.accountNo
      })
    ),
    closable: true,
    sidebarOrder: 4
  },
  'purchase-ali1688-historical-orders': {
    key: 'purchase-ali1688-historical-orders',
    label: '1688 历史订单',
    path: '/purchase/ali1688-orders',
    sectionKey: 'purchase',
    pathLabel: '采购 / 1688 历史订单',
    tabLabel: '1688 历史订单',
    workspaceMount: createLazyWorkspaceMount(
      () =>
        import('../ali1688-historical-orders/Ali1688HistoricalOrdersPage').then((module) => ({
          default: module.Ali1688HistoricalOrdersPage
        })),
      ({ session }) => ({
        storeName: session.currentStore?.projectName || session.currentStore?.projectCode,
        storeCode: session.currentStore?.projectCode || session.currentStore?.storeCode,
        siteCode: session.currentStore?.site,
        ownerUserId: session.defaultOwnerUserId ?? session.userId,
        operatorRoleName: session.roleName,
        availableStores: session.userStores
      })
    ),
    closable: true,
    sidebarOrder: 2
  },
  'purchase-ali1688-sku-purchase-history': {
    key: 'purchase-ali1688-sku-purchase-history',
    label: 'SKU 采购历史',
    path: '/purchase/ali1688-sku-purchase-history',
    sectionKey: 'purchase',
    pathLabel: '采购 / SKU 采购历史',
    tabLabel: 'SKU 采购历史',
    workspaceMount: createLazyWorkspaceMount(
      () =>
        import('../ali1688-sku-purchase-history/Ali1688SkuPurchaseHistoryPage').then((module) => ({
          default: module.Ali1688SkuPurchaseHistoryPage
        })),
      ({ session }) => ({
        storeCode: session.currentStore?.projectCode || session.currentStore?.storeCode,
        siteCode: session.currentStore?.site,
        availableStores: session.userStores
      })
    ),
    closable: true,
    sidebarOrder: 3
  },
  'purchase-listing': {
    key: 'purchase-listing',
    label: '商品上架',
    path: '/purchase/listing',
    sectionKey: 'purchase',
    pathLabel: '采购 / 商品上架',
    tabLabel: '商品上架',
    workspaceMount: createLazyWorkspaceMount(
      () =>
        import('../product-listing/ProductListingPage').then((module) => ({
          default: module.ProductListingPage
        })),
      ({ session }) => ({
        storeCode: session.currentStore?.storeCode
      })
    ),
    closable: true,
    sidebarOrder: 0
  },
  'purchase-order': {
    key: 'purchase-order',
    label: '补货采购',
    path: '/purchase/order',
    sectionKey: 'purchase',
    pathLabel: '采购 / 补货采购',
    tabLabel: '补货采购',
    workspaceMount: createLazyWorkspaceMount(() =>
      import('../procurement-workspace/ProcurementWorkspaceMount').then((module) => ({
        default: module.ProcurementWorkspaceMount
      }))
    ),
    closable: true,
    sidebarOrder: 5
  },
  'purchase-profit': {
    key: 'purchase-profit',
    label: '利润计算',
    path: '/purchase/profit',
    sectionKey: 'purchase',
    pathLabel: '采购 / 利润计算',
    tabLabel: '利润计算',
    workspaceMount: createLazyWorkspaceMount(() =>
      import('../profit-calculator/ProfitCalculatorWorkspaceMount').then((module) => ({
        default: module.ProfitCalculatorWorkspaceMount
      }))
    ),
    closable: true,
    sidebarOrder: 1
  },
  'purchase-logistics-quote': {
    key: 'purchase-logistics-quote',
    label: '货代管理',
    path: '/purchase/logistics-quote',
    sectionKey: 'logistics',
    pathLabel: '物流 / 货代管理',
    tabLabel: '货代管理',
    workspaceMount: createLazyWorkspaceMount(() =>
      import('../logistics-quote/LogisticsQuoteBoard').then((module) => ({
        default: module.LogisticsQuoteBoard
      }))
    ),
    closable: true,
    sidebarOrder: 0
  },
  'purchase-product-logistics-costs': {
    key: 'purchase-product-logistics-costs',
    label: '商品物流价格',
    path: '/purchase/product-logistics-costs',
    sectionKey: 'logistics',
    pathLabel: '物流 / 商品物流价格',
    tabLabel: '商品物流价格',
    workspaceMount: createLazyWorkspaceMount(() =>
      import('../product-logistics-costs/ProductLogisticsCostsPage').then((module) => ({
        default: module.ProductLogisticsCostsPage
      }))
    ),
    closable: true,
    sidebarOrder: 1
  },
  'purchase-in-transit-goods': {
    key: 'purchase-in-transit-goods',
    label: '在途商品',
    path: '/purchase/in-transit-goods',
    sectionKey: 'purchase',
    pathLabel: '采购 / 在途商品',
    tabLabel: '在途商品',
    workspaceMount: createLazyWorkspaceMount(() =>
      import('../in-transit-goods/InTransitGoodsWorkspaceMount').then((module) => ({
        default: module.InTransitGoodsWorkspaceMount
      }))
    ),
    closable: true,
    sidebarOrder: 6
  }
} as const satisfies Record<string, WorkspaceMenuDefinitionBase>)

export const PROCUREMENT_GRANT_RULES = freezeCatalogMetadata([
  { keys: ['purchase-order', 'purchase-ali1688-collection'], urlPaths: ['/api/purchase/order'] },
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
    keys: ['purchase-in-transit-goods'],
    urlPaths: ['/purchase/in-transit-goods'],
    urlPathPrefixes: ['/api/in-transit-goods'],
    menuNames: ['在途商品', '在途物流', '在途物流信息']
  },
  {
    keys: ['purchase-product-logistics-costs'],
    urlPaths: ['/purchase/product-logistics-costs'],
    urlPathPrefixes: ['/api/product-logistics-costs'],
    menuNames: ['商品物流价格', '商品物流成本']
  }
] as const satisfies readonly WorkspaceGrantedMenuRuleBase[])
