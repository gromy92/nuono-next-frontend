import type { WorkspaceGrantedMenuRuleBase, WorkspaceMenuDefinitionBase } from './types'
import { freezeCatalogMetadata } from './freezeCatalogMetadata'
import { createLazyWorkspaceMount } from './workspaceMount'

export const ADMINISTRATION_ROUTE_DEFINITIONS = freezeCatalogMetadata({
  'system-file-management': {
    key: 'system-file-management',
    label: '文件管理',
    path: '/system/file-management',
    sectionKey: 'system',
    pathLabel: '系统管理 / 文件管理',
    tabLabel: '文件管理',
    workspaceMount: createLazyWorkspaceMount(() =>
      import('../ai-file-parse/AiFileParseBoard').then((module) => ({ default: module.AiFileParseBoard }))
    ),
    closable: true,
    sidebarOrder: 1,
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
    closable: true,
    sidebarOrder: 0
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
    closable: true,
    sidebarOrder: 1
  },
  'system-menu': {
    key: 'system-menu',
    label: '菜单维护',
    path: '/system/menu',
    sectionKey: 'system',
    pathLabel: '系统管理 / 菜单维护',
    tabLabel: '菜单维护',
    contentKind: 'system-menu',
    closable: true,
    sidebarOrder: 0
  },
  'system-role': {
    key: 'system-role',
    label: '角色管理',
    path: '/system/role',
    sectionKey: 'system',
    pathLabel: '系统管理 / 角色管理',
    tabLabel: '角色管理',
    contentKind: 'system-role',
    closable: true,
    sidebarOrder: 2
  }
} as const satisfies Record<string, WorkspaceMenuDefinitionBase>)

export const ADMINISTRATION_IDENTITY_GRANT_RULES = freezeCatalogMetadata([
  { keys: ['user-account', 'user-store-noon'], urlPaths: ['/api/user/manage'], menuNames: ['用户管理'] },
  { keys: ['user-role', 'user-store-noon'], urlPaths: ['/api/user/role'], menuNames: ['角色分配'] },
  { keys: ['system-role'], urlPaths: ['/system/role'], menuNames: ['角色维护', '角色管理'] },
  { keys: ['system-menu'], urlPaths: ['/system/menu'], menuNames: ['菜单维护'] }
] as const satisfies readonly WorkspaceGrantedMenuRuleBase[])

export const FILE_MANAGEMENT_GRANT_RULES = freezeCatalogMetadata([
  {
    keys: ['system-file-management'],
    urlPaths: ['/system/file-management', '/system/ai-file-parse'],
    urlPathPrefixes: ['/system/ai-file-parse/'],
    menuNames: ['文件管理', '官方费用表', 'Noon费用表', '官方文件管理', '官方费用文件管理', 'AI文件解析', 'AI 文件解析']
  }
] as const satisfies readonly WorkspaceGrantedMenuRuleBase[])
