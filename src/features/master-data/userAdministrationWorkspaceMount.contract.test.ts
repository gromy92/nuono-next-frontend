import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'

const mount = readFileSync(
  'src/features/master-data/UserAdministrationWorkspaceMount.tsx',
  'utf8'
)
const routes = readFileSync('src/features/route-catalog/administrationRoutes.ts', 'utf8')
const shell = [
  'src/features/app-shell/AppShellRuntime.tsx',
  'src/features/app-shell/ShellFrame.tsx',
  'src/features/app-shell/useShellWorkspaceNavigation.tsx'
].map((path) => readFileSync(path, 'utf8')).join('\n')

assert.match(mount, /useState<RoleManagementWorkspaceTabKey>/)
assert.match(mount, /useStoreSyncContext/)
assert.match(mount, /useWorkspaceOwnedTabs/)
assert.match(mount, /resolveSessionAllowedMenuKeys/)
assert.match(mount, /<RoleManagementWorkspace/)
assert.match(
  routes,
  /const USER_ADMINISTRATION_WORKSPACE_MOUNT[\s\S]*'user-store-noon':[\s\S]*workspaceMount: USER_ADMINISTRATION_WORKSPACE_MOUNT[\s\S]*'user-role':[\s\S]*workspaceMount: USER_ADMINISTRATION_WORKSPACE_MOUNT/,
  'role and store definitions must share one state-owning mount'
)
assert.doesNotMatch(
  shell,
  /RoleManagementWorkspace|userRoleActiveTabKey|roleManagementRefreshSignal|canShowStoreManagement/,
  'Shell must know nothing about user-administration implementation details'
)
assert(mount.split(/\r?\n/u).length <= 301, 'user-administration mount must remain below 300 lines')
