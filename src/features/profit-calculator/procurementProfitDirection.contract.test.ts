import { strict as assert } from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'

const workspace = readFileSync(
  'src/features/profit-calculator/useProfitCalculatorWorkspace.tsx',
  'utf8'
)
const procurementWorkspace = readFileSync(
  'src/features/procurement/ProcurementWorkspace.tsx',
  'utf8'
)
const dependencyPolicy = readFileSync('scripts/check_feature_dependencies.mjs', 'utf8')

assert.equal(
  existsSync('src/features/profit-calculator/procurementPrefill.ts'),
  false,
  'unused procurement prefill Implementation must stay deleted'
)
assert.doesNotMatch(
  workspace,
  /\.\.\/procurement\//,
  'profit calculator must not depend on procurement Implementation or DTOs'
)
assert.match(workspace, /type OpenProfitCalculatorPrefilled = \(\) => void/)
assert.match(procurementWorkspace, /onOpenProfitCalculatorPrefilled: \(\) => void/)
assert.doesNotMatch(dependencyPolicy, /procurement\|profit-calculator/)
