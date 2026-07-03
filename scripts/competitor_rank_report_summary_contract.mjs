import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import ts from 'typescript'

const rootDir = path.resolve(new URL('..', import.meta.url).pathname)
const helperPath = path.join(rootDir, 'src/features/competitor-analysis/rankReportSummary.ts')
const pagePath = path.join(rootDir, 'src/features/competitor-analysis/CompetitorAnalysisPage.tsx')

if (!fs.existsSync(helperPath)) {
  throw new Error('Expected competitor rank report summary helper to exist')
}

const source = fs.readFileSync(helperPath, 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020
  }
})

const module = { exports: {} }
vm.runInNewContext(outputText, { exports: module.exports, module, console }, { filename: 'rankReportSummary.cjs' })

const { buildRankReportSummary } = module.exports

if (typeof buildRankReportSummary !== 'function') {
  throw new Error('Expected buildRankReportSummary to be exported')
}

const points = [
  { date: '2026-06-21', organicStatus: 'ranked', organicRankNo: 1, adStatus: 'missing', scanDepth: 100 },
  { date: '2026-06-22', organicStatus: 'ranked', organicRankNo: 2, adStatus: 'missing', scanDepth: 100 },
  { date: '2026-06-23', organicStatus: 'ranked', organicRankNo: 2, adStatus: 'missing', scanDepth: 100 },
  { date: '2026-06-24', organicStatus: 'not_in_scan_depth', adStatus: 'missing', scanDepth: 100 },
  { date: '2026-06-25', organicStatus: 'not_in_scan_depth', adStatus: 'missing', scanDepth: 100 },
  { date: '2026-06-26', organicStatus: 'not_in_scan_depth', adStatus: 'missing', scanDepth: 100 },
  { date: '2026-06-27', organicStatus: 'not_in_scan_depth', adStatus: 'missing', scanDepth: 100 }
]

const summary = buildRankReportSummary({
  points,
  productSeries: [
    {
      name: '本品',
      organicData: [1, 2, 2, null, null, null, null],
      adData: [null, null, null, null, null, null, null]
    },
    {
      name: 'Z5C6A5FD6BDC6656F05ABZ',
      organicData: [8, 9, 9, null, null, null, null],
      adData: [null, null, null, null, null, null, null]
    }
  ]
})

assert.equal(summary.latestOrganicRank, undefined, 'latest natural rank must use the latest date, not the latest ranked point')
assert.equal(summary.latestOrganicText, '最近无排名数据', 'placeholder-only latest days must not be shown as a real rank state')
assert.equal(summary.organicChangeText, '最近无排名数据', 'trend should not claim rank movement when latest product data is only a placeholder')
assert.equal(summary.bestCompetitorText, '暂无竞品排名', 'best competitor must also use the latest date')
assert.equal(summary.adDaysText, '0/7 天')
assert.equal(summary.scanDepth, 100)

const pageSource = fs.readFileSync(pagePath, 'utf8')
assert.match(pageSource, /return '无排名数据'/, 'report title tags should show no data for placeholder rank points')
assert.match(pageSource, /本品最近无排名数据/, 'empty report panel should not describe placeholder points as ranked range misses')

console.log('competitor rank report summary contract passed')
