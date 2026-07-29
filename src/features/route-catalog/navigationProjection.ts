import {
  shouldShowWorkspaceMenuInTabs,
  workspaceMenuPathLabel,
  workspaceMenuSectionKey,
  workspaceTabKeyForMenuKey
} from './RouteCatalog'
import type { AppMenuKey } from './routeDefinitions'

type ActiveOwnedPath = {
  parentMenuKey: AppMenuKey
  pathLabel?: string
}

export function initialWorkspaceTabKeys(
  activeMenuKey: AppMenuKey,
  allowedMenuKeys: ReadonlySet<AppMenuKey>
) {
  const tabKey = workspaceTabKeyForMenuKey(activeMenuKey)
  return shouldShowWorkspaceMenuInTabs(tabKey) && allowedMenuKeys.has(tabKey)
    ? [tabKey]
    : []
}

export function visibleWorkspaceTabKeys(
  openedMenuKeys: AppMenuKey[],
  allowedMenuKeys: ReadonlySet<AppMenuKey>
) {
  return openedMenuKeys.filter(
    (key) => shouldShowWorkspaceMenuInTabs(key) && allowedMenuKeys.has(key)
  )
}

export function activeWorkspacePathLabel(
  activeMenuKey: AppMenuKey,
  activeOwnedPath?: ActiveOwnedPath | null
) {
  return activeOwnedPath?.parentMenuKey === activeMenuKey && activeOwnedPath.pathLabel
    ? activeOwnedPath.pathLabel
    : workspaceMenuPathLabel(activeMenuKey)
}

export function activeWorkspaceSidebarOpenKeys(activeMenuKey: AppMenuKey) {
  const sectionKey = workspaceMenuSectionKey(activeMenuKey)
  return sectionKey ? [sectionKey] : []
}
