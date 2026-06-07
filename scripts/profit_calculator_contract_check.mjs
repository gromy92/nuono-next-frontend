import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname

function read(path) {
  const filePath = join(root, path)
  if (!existsSync(filePath)) {
    throw new Error(`Expected file to exist: ${path}`)
  }
  return readFileSync(filePath, 'utf8')
}

function assertIncludes(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`${label} should include: ${needle}`)
  }
}

function assertNotIncludes(source, needle, label) {
  if (source.includes(needle)) {
    throw new Error(`${label} should not include: ${needle}`)
  }
}

const page = read('src/features/profit-calculator/ProfitCalculatorPage.tsx')
const workspace = read('src/features/profit-calculator/useProfitCalculatorWorkspace.tsx')
const api = read('src/features/profit-calculator/api.ts')
const appShell = read('src/features/app-shell/AppShellRuntime.tsx')

for (const marker of ['系统出舱费', '按 Noon 官方尺寸计算', '系统佣金', '最近实际', '批量计算出舱费', '批量计算佣金']) {
  assertIncludes(page, marker, 'profit calculator list page')
}

for (const endpoint of [
  '/api/official-outbound-fee/latest-calculations',
  '/api/official-outbound-fee/batch-calculate-by-effective-spec',
  '/api/official-commission/latest-calculations',
  '/api/order-finance/actual-outbound-fees',
  '/api/order-finance/actual-commissions'
]) {
  assertIncludes(api, endpoint, 'profit calculator API flow')
}

assertIncludes(workspace, 'fetchLatestOfficialOutboundFeeCalculations', 'profit calculator workspace API flow')
assertIncludes(workspace, 'fetchActualCommissionSnapshots', 'profit calculator workspace API flow')
assertIncludes(appShell, 'useProfitCalculatorWorkspace(openProfitWorkspace, shellSession)', 'app shell profit session wiring')
assertNotIncludes(page, '利润计算失败', 'profit calculator should not be the legacy single-item form')

console.log('profit calculator contract check passed')
