import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const featureDir = dirname(fileURLToPath(import.meta.url))

const typesSource = readFileSync(join(featureDir, 'types.ts'), 'utf8')
const toolbarSource = readFileSync(join(featureDir, 'InTransitBatchToolbar.tsx'), 'utf8')
const apiSource = readFileSync(join(featureDir, 'api.ts'), 'utf8')

assert.match(
  typesSource,
  /todo\?: 'missingEstimatedArrival'/,
  'batch list filters must include the missing ETA todo filter value'
)

assert.match(
  typesSource,
  /actualArrivalAt\?: string \| null/,
  'batch rows must expose actual arrival separately from ETA'
)

assert.match(
  typesSource,
  /effectiveArrivalAt\?: string \| null/,
  'batch rows must expose the unified effective arrival time'
)

assert.match(
  typesSource,
  /effectiveArrivalSource\?: string \| null/,
  'batch rows must expose whether effective arrival came from actual or estimated data'
)

assert.match(
  toolbarSource,
  /placeholder="待办"/,
  'batch toolbar must render a todo filter'
)

assert.match(
  toolbarSource,
  /label: '缺失到达时间', value: 'missingEstimatedArrival'/,
  'todo filter must expose the missing arrival time option'
)

assert.match(
  toolbarSource,
  /value=\{filters\.todo\}/,
  'todo filter must bind to filters.todo'
)

assert.match(
  toolbarSource,
  /onFilterChange\(\{ todo: value \}\)/,
  'todo filter must update the server-backed batch filter'
)

assert.match(
  apiSource,
  /Object\.entries\(filters\)/,
  'batch API must continue serializing all defined filter fields, including todo'
)
