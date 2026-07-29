import { useMemo } from 'react'
import { Alert, Card } from 'antd'
import { workspaceMenuMount } from '../route-catalog/RouteCatalog'
import {
  shouldShowWorkspaceMenuInTabs,
  workspaceTabKeyForMenuKey,
  type AppMenuKey
} from '../route-catalog/RouteCatalog'
import type {
  ShellWorkspaceContentProps,
  ShellWorkspaceRenderContext
} from './ShellWorkspaceContent.types'

export function workspaceContentMountKeys(
  activeMenuKey: AppMenuKey,
  openedWorkspaceTabKeys: AppMenuKey[]
) {
  const activeMountKey = workspaceContentMountKeyForMenuKey(activeMenuKey)
  const keys: AppMenuKey[] = []
  for (const key of [...openedWorkspaceTabKeys, activeMountKey]) {
    if (!keys.includes(key)) {
      keys.push(key)
    }
  }
  return keys
}

export function workspaceContentMountGroups(
  activeMenuKey: AppMenuKey,
  openedWorkspaceTabKeys: AppMenuKey[]
) {
  const activeWorkspaceMountKey = workspaceContentMountKeyForMenuKey(activeMenuKey)
  const groups: Array<{
    key: AppMenuKey
    menuKeys: AppMenuKey[]
    mount: ReturnType<typeof workspaceMenuMount>
  }> = []

  workspaceContentMountKeys(activeMenuKey, openedWorkspaceTabKeys).forEach((menuKey) => {
    const mount = workspaceMenuMount(menuKey)
    const existing = groups.find((group) => group.mount === mount)
    if (existing) {
      existing.menuKeys.push(menuKey)
    } else {
      groups.push({ key: menuKey, menuKeys: [menuKey], mount })
    }
  })

  return groups.map((group) => {
    const active = group.menuKeys.includes(activeWorkspaceMountKey)
    return {
      ...group,
      active,
      menuKey: active ? activeMenuKey : group.key
    }
  })
}

function workspaceContentMountKeyForMenuKey(menuKey: AppMenuKey) {
  const tabKey = workspaceTabKeyForMenuKey(menuKey)
  return shouldShowWorkspaceMenuInTabs(tabKey) ? tabKey : menuKey
}

type ShellWorkspaceContentPaneProps = {
  active: boolean
  menuKey: AppMenuKey
  context: ShellWorkspaceRenderContext
}

function ShellWorkspaceContentPane({ active, menuKey, context }: ShellWorkspaceContentPaneProps) {
  const WorkspaceMount = workspaceMenuMount(menuKey)
  if (!WorkspaceMount) {
    throw new Error(`Workspace ${menuKey} does not declare a mount`)
  }
  return <WorkspaceMount active={active} menuKey={menuKey} session={context.shellSession} />
}

export function ShellWorkspaceContent({
  activeMenuKey,
  noMenuPermission,
  openedWorkspaceTabKeys,
  ...baseContext
}: ShellWorkspaceContentProps) {
  const mountGroups = useMemo(() => {
    return workspaceContentMountGroups(activeMenuKey, openedWorkspaceTabKeys)
  }, [activeMenuKey, openedWorkspaceTabKeys])

  if (noMenuPermission) {
    return (
      <Card variant="borderless" style={{ boxShadow: 'none', background: '#ffffff' }}>
        <Alert
          type="warning"
          showIcon
          message="当前账号未配置菜单权限"
          description="请先在角色管理或菜单维护中给该账号所属角色配置菜单权限；未配置的菜单不会展示在左侧导航。"
        />
      </Card>
    )
  }

  return (
    <>
      {mountGroups.map((group) => {
        return (
          <div
            key={group.key}
            className={`nuono-shell-workspace-pane${group.active ? '' : ' nuono-shell-workspace-pane-hidden'}`}
            data-workspace-menu-key={group.menuKey}
            aria-hidden={!group.active}
          >
            <ShellWorkspaceContentPane
              active={group.active}
              menuKey={group.menuKey}
              context={baseContext}
            />
          </div>
        )
      })}
    </>
  )
}
