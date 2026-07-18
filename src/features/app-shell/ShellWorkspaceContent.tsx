import { useMemo } from 'react'
import { Alert, Card } from 'antd'
import { workspaceMenuMount } from '../route-catalog/RouteCatalog'
import { renderLegacyWorkspaceContent } from './LegacyWorkspaceContent'
import {
  shouldShowWorkspaceMenuInTabs,
  workspaceTabKeyForMenuKey
} from './WorkspaceMenuRegistry'
import type { AppMenuKey } from './WorkspaceRouting'
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

function workspaceContentMountKeyForMenuKey(menuKey: AppMenuKey) {
  const tabKey = workspaceTabKeyForMenuKey(menuKey)
  return shouldShowWorkspaceMenuInTabs(tabKey) ? tabKey : menuKey
}

type ShellWorkspaceContentPaneProps = {
  menuKey: AppMenuKey
  context: ShellWorkspaceRenderContext
}

function ShellWorkspaceContentPane({ menuKey, context }: ShellWorkspaceContentPaneProps) {
  const WorkspaceMount = workspaceMenuMount(menuKey)
  if (WorkspaceMount) {
    return <WorkspaceMount />
  }
  return renderLegacyWorkspaceContent(menuKey, context)
}

export function ShellWorkspaceContent({
  activeMenuKey,
  noMenuPermission,
  openedWorkspaceTabKeys,
  productWorkspaceTabKey,
  inTransitWorkspaceTabKey,
  ...baseContext
}: ShellWorkspaceContentProps) {
  const mountedWorkspaceMenuKeys = useMemo(
    () => workspaceContentMountKeys(activeMenuKey, openedWorkspaceTabKeys),
    [activeMenuKey, openedWorkspaceTabKeys]
  )
  const activeWorkspaceMountKey = workspaceContentMountKeyForMenuKey(activeMenuKey)

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
      {mountedWorkspaceMenuKeys.map((menuKey) => {
        const isActivePane = menuKey === activeWorkspaceMountKey
        const context: ShellWorkspaceRenderContext = {
          ...baseContext,
          isProductDetailTab: menuKey === 'product-manage' && productWorkspaceTabKey === 'product-detail',
          isInTransitBoxDetailTab:
            menuKey === 'purchase-in-transit-goods' && inTransitWorkspaceTabKey === 'in-transit-box-detail'
        }
        return (
          <div
            key={menuKey}
            className={`nuono-shell-workspace-pane${isActivePane ? '' : ' nuono-shell-workspace-pane-hidden'}`}
            data-workspace-menu-key={menuKey}
            aria-hidden={!isActivePane}
          >
            <ShellWorkspaceContentPane menuKey={menuKey} context={context} />
          </div>
        )
      })}
    </>
  )
}
