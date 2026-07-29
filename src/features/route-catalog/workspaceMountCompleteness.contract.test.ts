import { strict as assert } from 'node:assert'
import { existsSync } from 'node:fs'
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
