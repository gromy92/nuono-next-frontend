import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const featureDir = dirname(fileURLToPath(import.meta.url))

const apiSource = readFileSync(join(featureDir, 'api.ts'), 'utf8')
const typesSource = readFileSync(join(featureDir, 'types.ts'), 'utf8')
const hookSource = readFileSync(join(featureDir, 'useInTransitEstimatedArrival.ts'), 'utf8')
const modalSource = readFileSync(join(featureDir, 'InTransitEstimatedArrivalModal.tsx'), 'utf8')

assert.match(
  typesSource,
  /export type SaveInTransitActualArrivalRequest = \{\s*actualArrivalAt: string\s*note\?: string\s*\}/s,
  'frontend request types must include actual arrival maintenance payload'
)

assert.match(
  apiSource,
  /saveInTransitActualArrival/,
  'frontend API must expose actual arrival maintenance'
)

assert.match(
  apiSource,
  /\/api\/in-transit-goods\/batches\/\$\{batchId\}\/actual-arrival/,
  'actual arrival maintenance must call the dedicated actual-arrival endpoint'
)

assert.match(
  hookSource,
  /maintenanceType\?: 'estimated' \| 'actual'/,
  'manual arrival form values must include estimated vs actual maintenance type'
)

assert.match(
  hookSource,
  /maintenanceType:\s*'estimated'/,
  'manual arrival modal should default to maintaining estimated arrival'
)

assert.match(
  hookSource,
  /values\.maintenanceType === 'actual'/,
  'manual arrival submission must branch when the operator selects actual arrival'
)

assert.match(
  hookSource,
  /saveInTransitActualArrival\(targetBatch\.batchId,\s*\{\s*actualArrivalAt:/s,
  'actual arrival submission must persist actualArrivalAt through the actual-arrival API'
)

assert.match(
  hookSource,
  /estimatedArrivalAt:\s*values\.arrivalAt\.startOf\('day'\)\.format\('YYYY-MM-DDT00:00:00'\)/,
  'estimated arrival submission must persist date-level ETA without an operator-maintained hour'
)

assert.match(
  modalSource,
  /name="maintenanceType"/,
  'manual arrival modal must render a maintenance type selector'
)

assert.match(
  modalSource,
  /预计到达时间/,
  'manual arrival modal must offer estimated arrival time'
)

assert.match(
  modalSource,
  /实际到达时间/,
  'manual arrival modal must offer actual arrival time'
)

assert.match(
  modalSource,
  /isActual \? \(\s*<DatePicker showTime format="YYYY-MM-DD HH:mm" style=\{\{ width: '100%' \}\} \/>\s*\) : \(\s*<DatePicker format="YYYY-MM-DD" style=\{\{ width: '100%' \}\} \/>\s*\)/s,
  'estimated arrival picker must be date-only while actual arrival keeps date-time precision'
)
