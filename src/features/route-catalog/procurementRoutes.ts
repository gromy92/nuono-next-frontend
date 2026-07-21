import type { WorkspaceGrantedMenuRuleBase, WorkspaceMenuDefinitionBase } from './types'
import { freezeCatalogMetadata } from './freezeCatalogMetadata'

export const PROCUREMENT_ROUTE_DEFINITIONS = freezeCatalogMetadata({
  'purchase-ali1688-collection': {
    key: 'purchase-ali1688-collection',
    label: '1688查询展示',
    path: '/purchase/1688-collection',
    sectionKey: 'purchase',
    pathLabel: '采购 / 1688查询展示',
    tabLabel: '1688查询展示',
    contentKind: 'purchase-ali1688-collection',
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
    contentKind: 'purchase-ali1688-historical-orders',
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
    contentKind: 'purchase-ali1688-sku-purchase-history',
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
    contentKind: 'product-listing',
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
    contentKind: 'purchase-order',
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
    contentKind: 'purchase-profit',
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
    contentKind: 'purchase-logistics-quote',
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
    contentKind: 'purchase-product-logistics-costs',
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
    contentKind: 'purchase-in-transit-goods',
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
    keys: ['purchase-in-transit-goods', 'purchase-product-logistics-costs'],
    urlPaths: ['/purchase/in-transit-goods', '/purchase/product-logistics-costs'],
    urlPathPrefixes: ['/api/in-transit-goods', '/api/product-logistics-costs'],
    menuNames: ['在途商品', '在途物流', '在途物流信息', '商品物流价格', '商品物流成本']
  }
] as const satisfies readonly WorkspaceGrantedMenuRuleBase[])
