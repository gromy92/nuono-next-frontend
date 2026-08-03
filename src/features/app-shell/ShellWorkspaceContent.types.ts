import type { AuthSession } from '../auth/session'
import type { AppMenuKey } from '../route-catalog/RouteCatalog'

export type ShellWorkspaceRenderContext = {
  shellSession: AuthSession
}

export type ShellWorkspaceContentProps = ShellWorkspaceRenderContext & {
  activeMenuKey: AppMenuKey
  allowedMenuKeySet: ReadonlySet<AppMenuKey>
  noMenuPermission: boolean
  openedWorkspaceTabKeys: AppMenuKey[]
  routeNotFound: boolean
}
