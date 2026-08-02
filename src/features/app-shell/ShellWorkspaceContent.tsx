import { useMemo } from 'react'
import { HomeOutlined } from '@ant-design/icons'
import { Alert, Button, Card } from 'antd'
import { workspaceMenuMount } from '../route-catalog/RouteCatalog'
import {
  shouldShowWorkspaceMenuInTabs,
  workspaceTabKeyForMenuKey,
  type AppMenuKey
} from '../route-catalog/RouteCatalog'
import { resolveWorkspacePathForMenuKey } from '../route-catalog/routePaths'
import { withCurrentWorkspaceDevQuery } from '../route-catalog/workspaceDevQuery'
import { SystemStatePanel } from '../../shared/system-state/SystemStatePanel'
import type {
  ShellWorkspaceContentProps,
  ShellWorkspaceRenderContext
} from './ShellWorkspaceContent.types'
import { ShellDefaultPage } from './ShellDefaultPage'

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
  openedWorkspaceTabKeys: AppMenuKey[],
  allowedMenuKeySet?: ReadonlySet<AppMenuKey>
) {
  const activeWorkspaceMountKey = workspaceContentMountKeyForMenuKey(activeMenuKey)
  const groups: Array<{
    key: AppMenuKey
    menuKeys: AppMenuKey[]
    mount: ReturnType<typeof workspaceMenuMount>
  }> = []

  const mountKeys = allowedMenuKeySet && !allowedMenuKeySet.has(activeWorkspaceMountKey)
    ? []
    : workspaceContentMountKeys(activeMenuKey, openedWorkspaceTabKeys).filter(
      (menuKey) => !allowedMenuKeySet || allowedMenuKeySet.has(menuKey)
    )

  mountKeys.forEach((menuKey) => {
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
  allowedMenuKeySet,
  noMenuPermission,
  openedWorkspaceTabKeys,
  routeNotFound,
  ...baseContext
}: ShellWorkspaceContentProps) {
  const mountGroups = useMemo(() => {
    return workspaceContentMountGroups(activeMenuKey, openedWorkspaceTabKeys, allowedMenuKeySet)
  }, [activeMenuKey, allowedMenuKeySet, openedWorkspaceTabKeys])
  const activeWorkspaceMountKey = workspaceContentMountKeyForMenuKey(activeMenuKey)

  if (noMenuPermission) {
    return <ShellDefaultPage />
  }

  if (routeNotFound) {
    return (
      <div className="nuono-shell-default-page">
        <SystemStatePanel
          variant="not-found"
          title="这个页面不存在"
          description="地址可能已经失效，或对应功能已经迁移。你可以返回当前账号的默认工作台继续操作。"
          actions={
            <Button
              type="primary"
              icon={<HomeOutlined />}
              onClick={() => {
                const nextPath = withCurrentWorkspaceDevQuery(
                  resolveWorkspacePathForMenuKey(activeMenuKey)
                )
                window.history.replaceState({}, '', nextPath)
                window.dispatchEvent(new PopStateEvent('popstate'))
              }}
            >
              返回默认工作台
            </Button>
          }
        />
      </div>
    )
  }

  if (!allowedMenuKeySet.has(activeWorkspaceMountKey)) {
    return (
      <Card variant="borderless" style={{ boxShadow: 'none', background: '#ffffff' }}>
        <Alert
          type="warning"
          showIcon
          message="当前页面无访问权限"
          description="正在返回当前账号有权访问的工作区。"
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
