import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const featureDir = dirname(fileURLToPath(import.meta.url))

const columnsSource = readFileSync(join(featureDir, 'useInTransitBatchColumns.tsx'), 'utf8')
const cssSource = readFileSync(join(featureDir, 'InTransitGoodsPage.css'), 'utf8')

assert.doesNotMatch(
  columnsSource,
  /FieldTimeOutlined/,
  'in-transit actions must not keep a dedicated ETA icon button'
)

assert.doesNotMatch(
  columnsSource,
  />\s*ETA\s*</,
  'in-transit actions must not render a trailing ETA button'
)

assert.match(
  columnsSource,
  /renderTimeNodes\(row,\s*nodeStatusLabel,\s*onOpenEstimatedArrival\)/,
  'time nodes column must pass the ETA maintenance handler into the renderer'
)

assert.match(
  columnsSource,
  /onClick=\{\(\) => onOpenEstimatedArrival\(row\)\}/,
  '预计到达 inside the time nodes column must be clickable to edit ETA'
)

assert.match(
  columnsSource,
  /const hasEstimatedArrival = Boolean\(row\.estimatedArrivalAt \|\| row\.etaDate\)/,
  'time nodes must detect rows without any ETA value'
)

assert.match(
  columnsSource,
  /danger=\{!hasEstimatedArrival\}/,
  'rows without ETA must render the editable ETA control in a red danger state'
)

assert.match(
  cssSource,
  /\.in-transit-eta-edit--missing/,
  'missing ETA must have an explicit red styling hook'
)
