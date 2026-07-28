import { strict as assert } from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { WORKSPACE_MENU_DEFINITIONS } from './RouteCatalog'

for (const definition of Object.values(WORKSPACE_MENU_DEFINITIONS)) {
  assert.equal(
    typeof definition.workspaceMount,
    'function',
    `${definition.key} must expose a mount Adapter`
  )
  assert.equal('contentKind' in definition, false, `${definition.key} must not use Legacy dispatch`)
}

const removedLegacyFiles = [
  'LegacyWorkspaceContent.tsx',
  'LegacyAdministrationWorkspaceContent.tsx',
  'LegacyWorkspaceContent.contract.test.tsx',
  'ShellWorkspaceLazyComponents.tsx'
]
for (const fileName of removedLegacyFiles) {
  assert.equal(
    existsSync(join(process.cwd(), 'src/features/app-shell', fileName)),
    false,
    `${fileName} must stay deleted`
  )
}

const shellFrame = readFileSync(
  join(process.cwd(), 'src/features/app-shell/ShellFrame.tsx'),
  'utf8'
)
const shellRuntime = readFileSync(
  join(process.cwd(), 'src/features/app-shell/AppShellRuntime.tsx'),
  'utf8'
)
const shellContent = readFileSync(
  join(process.cwd(), 'src/features/app-shell/ShellWorkspaceContent.tsx'),
  'utf8'
)
assert.doesNotMatch(
  `${shellFrame}\n${shellRuntime}\n${shellContent}`,
  /RoleManagementWorkspace|userRoleActiveTabKey|roleManagementRefreshSignal|renderLegacyWorkspaceContent/,
  'the Shell must not own or dispatch user-administration details'
)
