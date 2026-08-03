import type { WorkspaceGrantedMenuRuleBase, WorkspaceMenuDefinitionBase } from './types'
import { freezeCatalogMetadata } from './freezeCatalogMetadata'
import { createLazyWorkspaceMount } from './workspaceMount'

const USER_ADMINISTRATION_WORKSPACE_MOUNT = createLazyWorkspaceMount(() =>
  import('../master-data/UserAdministrationWorkspaceMount').then((module) => ({
    default: module.UserAdministrationWorkspaceMount
  }))
)

export const ADMINISTRATION_ROUTE_DEFINITIONS = freezeCatalogMetadata({
  'user-account': {
    key: 'user-account',
    label: '账号管理',
    path: '/user/manage',
    sectionKey: 'user',
    pathLabel: '用户 / 账号管理',
    tabLabel: '账号管理',
    workspaceMount: createLazyWorkspaceMount(
      () =>
        import('../master-data/MasterDataBoard').then((module) => ({
          default: module.MasterDataBoard
        })),
      ({ session }) => ({
        mode: 'user-account' as const,
        operatorUserId: session.userId,
        operatorRoleLevel: session.level,
        operatorStores: session.userStores ?? []
      })
    ),
    closable: true,
    sidebarOrder: 0
  },
  'user-store-noon': {
    key: 'user-store-noon',
    label: '店铺管理',
    path: '/user/store-binding',
    sectionKey: 'user',
    pathLabel: '用户 / 店铺管理',
    tabLabel: '店铺管理',
    workspaceMount: USER_ADMINISTRATION_WORKSPACE_MOUNT,
    closable: true,
    accessKey: 'user-role',
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
    workspaceMount: USER_ADMINISTRATION_WORKSPACE_MOUNT,
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
    workspaceMount: createLazyWorkspaceMount(
      () =>
        import('../master-data/MasterDataBoard').then((module) => ({
          default: module.MasterDataBoard
        })),
      ({ session }) => ({
        mode: 'system-menu' as const,
        operatorUserId: session.userId,
        operatorRoleLevel: session.level,
        operatorStores: session.userStores ?? []
      })
    ),
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
    workspaceMount: createLazyWorkspaceMount(
      () =>
        import('../master-data/MasterDataBoard').then((module) => ({
          default: module.MasterDataBoard
        })),
      ({ session }) => ({
        mode: 'system-role' as const,
        operatorUserId: session.userId,
        operatorRoleLevel: session.level,
        operatorStores: session.userStores ?? []
      })
    ),
    closable: true,
    sidebarOrder: 1
  }
} as const satisfies Record<string, WorkspaceMenuDefinitionBase>)

export const ADMINISTRATION_IDENTITY_GRANT_RULES = freezeCatalogMetadata([
  { keys: ['user-account'], urlPaths: ['/api/user/manage'], menuNames: ['用户管理'] },
  { keys: ['user-role'], urlPaths: ['/api/user/role'], menuNames: ['角色分配'] },
  { keys: ['system-role'], urlPaths: ['/system/role'], menuNames: ['角色维护', '角色管理'] },
  { keys: ['system-menu'], urlPaths: ['/system/menu'], menuNames: ['菜单维护'] }
] as const satisfies readonly WorkspaceGrantedMenuRuleBase[])
