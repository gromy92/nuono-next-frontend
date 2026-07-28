import { strict as assert } from 'node:assert'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
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
assert.equal(
  existsSync('src/features/app-shell/FormToolbarLayout.tsx'),
  false,
  'shared form layout must not return to the app-shell composition Module'
)
