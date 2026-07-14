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
  /const actualArrivalText = row\.actualArrivalAt \? formatNodeDateTime\(row\.actualArrivalAt\) : undefined/,
  'time nodes must derive actual arrival from the dedicated actualArrivalAt field'
)

assert.match(
  columnsSource,
  /const hasEffectiveArrival = Boolean\(row\.effectiveArrivalAt \|\| row\.actualArrivalAt \|\| row\.estimatedArrivalAt \|\| row\.etaDate\)/,
  'time nodes must treat actual arrival and ETA as a unified effective arrival'
)

assert.match(
  columnsSource,
  /到达时间 \{arrivalText\}/,
  'time nodes must label the clickable control as arrival time, not just estimated arrival'
)

assert.match(
  columnsSource,
  /danger=\{!hasEffectiveArrival\}/,
  'rows without any effective arrival must render the editable arrival control in a red danger state'
)

assert.match(
  cssSource,
  /\.in-transit-eta-edit--missing/,
  'missing ETA must have an explicit red styling hook'
)
