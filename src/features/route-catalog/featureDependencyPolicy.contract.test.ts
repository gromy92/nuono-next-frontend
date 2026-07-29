import { strict as assert } from 'node:assert'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'

const result = spawnSync(process.execPath, ['scripts/check_feature_dependencies.mjs'], {
  cwd: process.cwd(),
  encoding: 'utf8'
})

assert.equal(
  result.status,
  0,
  [result.stdout, result.stderr].filter(Boolean).join('\n')
)
assert.match(result.stdout, /\d+ route loader adapter edges/)
assert.equal(
  existsSync('src/features/app-shell/FormToolbarLayout.tsx'),
  false,
  'shared form layout must not return to the app-shell composition Module'
)

const fixtureRoot = mkdtempSync(join(tmpdir(), 'feature-dependency-policy-'))
mkdirSync(join(fixtureRoot, 'app-shell'))
mkdirSync(join(fixtureRoot, 'business'))
mkdirSync(join(fixtureRoot, 'route-catalog'))
writeFileSync(join(fixtureRoot, 'app-shell', 'Shell.ts'), 'export const shell = true\n')
writeFileSync(
  join(fixtureRoot, 'business', 'Page.ts'),
  "export const loadShell = () => import('../app-shell/Shell')\n"
)
writeFileSync(
  join(fixtureRoot, 'route-catalog', 'routes.ts'),
  "export const loadBusiness = () => import('../business/Page')\n"
)

const dynamicImportResult = spawnSync(
  process.execPath,
  ['scripts/check_feature_dependencies.mjs'],
  {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, FEATURE_DEPENDENCY_ROOT: fixtureRoot }
  }
)
assert.equal(dynamicImportResult.status, 1)
assert.match(
  dynamicImportResult.stderr,
  /business feature depends on app-shell: .*business\/Page\.ts -> .*app-shell\/Shell\.ts/
)
assert.match(dynamicImportResult.stdout, /1 route loader adapter edges/)
