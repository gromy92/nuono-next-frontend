import type { WorkspaceGrantedMenuRuleBase, WorkspaceMenuDefinitionBase } from './types'
import { freezeCatalogMetadata } from './freezeCatalogMetadata'

export const PRODUCT_ROUTE_DEFINITIONS = freezeCatalogMetadata({
  'product-manage': {
    key: 'product-manage',
    label: '商品管理',
    path: '/product/manage',
    sectionKey: 'product',
    pathLabel: '商品 / 商品管理',
    tabLabel: '商品管理',
    contentKind: 'product-management',
    closable: true,
    sidebarOrder: 0,
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
    closable: true,
    sidebarOrder: 1
  },
  'product-specs': {
    key: 'product-specs',
    label: '商品规格',
    path: '/product/specs',
    sectionKey: 'product',
    pathLabel: '商品 / 商品规格',
    tabLabel: '商品规格',
    contentKind: 'product-specs',
    closable: true,
    sidebarOrder: 2
  },
  'product-image-profile': {
    key: 'product-image-profile',
    label: '商品图',
    path: '/product/images',
    sectionKey: 'product',
    pathLabel: '商品 / 商品图',
    tabLabel: '商品图',
    contentKind: 'product-image-profile',
    closable: true,
    sidebarOrder: 3
  },
  'product-image-match': {
    key: 'product-image-match',
    label: '图片匹配',
    path: '/product/image-match',
    sectionKey: 'product',
    pathLabel: '商品 / 图片匹配',
    tabLabel: '图片匹配',
    contentKind: 'product-image-match',
    closable: true,
    sidebarOrder: 4
  },
  'product-manual-selection': {
    key: 'product-manual-selection',
    label: '人工选品',
    path: '/product/manual-selection',
    sectionKey: 'product',
    pathLabel: '商品 / 人工选品',
    tabLabel: '人工选品',
    contentKind: 'product-manual-selection',
    closable: true,
    sidebarOrder: 5
  }
} as const satisfies Record<string, WorkspaceMenuDefinitionBase>)

export const PRODUCT_GRANT_RULES = freezeCatalogMetadata([
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
  { keys: ['product-groups'], urlPaths: ['/product/groups'], menuNames: ['商品分组'] },
  {
    keys: ['product-manual-selection'],
    urlPaths: ['/product/manual-selection', '/api/spu'],
    menuNames: ['人工选品', '商品采集']
  }
] as const satisfies readonly WorkspaceGrantedMenuRuleBase[])
