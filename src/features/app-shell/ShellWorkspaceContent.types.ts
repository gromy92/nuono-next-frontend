import type { AuthSession } from '../auth/session'
import type { AppMenuKey } from './WorkspaceRouting'

export type ShellWorkspaceRenderContext = {
  shellSession: AuthSession
}

export type ShellWorkspaceContentProps = ShellWorkspaceRenderContext & {
  activeMenuKey: AppMenuKey
  noMenuPermission: boolean
  openedWorkspaceTabKeys: AppMenuKey[]
}
