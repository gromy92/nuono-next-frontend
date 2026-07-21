import type { AppMenuKey } from './WorkspaceRouting'
import { workspaceMenuContentKind } from './WorkspaceMenuRegistry'
import { renderLegacyAdministrationWorkspace } from './LegacyAdministrationWorkspaceContent'
import { renderLegacyCommerceWorkspace } from './LegacyCommerceWorkspaceContent'
import { renderLegacyOperationsWorkspace } from './LegacyOperationsWorkspaceContent'
import type { ShellWorkspaceRenderContext } from './ShellWorkspaceContent.types'

export function renderLegacyWorkspaceContent(
  menuKey: AppMenuKey,
  context: ShellWorkspaceRenderContext
) {
  const activeContentKind = workspaceMenuContentKind(menuKey)
  if (!activeContentKind) {
    throw new Error(`Workspace ${menuKey} does not declare a legacy content kind`)
  }

  const commerce = renderLegacyCommerceWorkspace(activeContentKind, context)
  if (commerce.handled) {
    return commerce.content
  }

  const operations = renderLegacyOperationsWorkspace(activeContentKind, context)
  if (operations.handled) {
    return operations.content
  }

  const administration = renderLegacyAdministrationWorkspace(activeContentKind, context)
  if (administration.handled) {
    return administration.content
  }

  throw new Error(`No legacy workspace renderer for ${activeContentKind}`)
}
