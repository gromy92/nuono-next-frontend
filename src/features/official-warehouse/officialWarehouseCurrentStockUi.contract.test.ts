import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const panelSource = readFileSync(join(currentDir, 'OfficialWarehouseStatisticsPanel.tsx'), 'utf8')
const styleSource = readFileSync(join(currentDir, 'OfficialWarehouseStatisticsPanel.css'), 'utf8')

const currentStockDetailSource = panelSource.slice(
  panelSource.indexOf('function CurrentStockDetail'),
  panelSource.indexOf('function appointmentStatusLabel')
)

assert.match(
  currentStockDetailSource,
  /official-warehouse-current-stock-warehouse-chips/,
  'current stock warehouse details should render as compact chips'
)
assert.doesNotMatch(
  currentStockDetailSource,
  /official-warehouse-current-stock-warehouse-table/,
  'current stock warehouse details should not render as a tall table inside the row'
)
assert.match(
  styleSource,
  /\.official-warehouse-current-stock-warehouse-chips \{[\s\S]*?max-height: 52px;/,
  'current stock warehouse chips should cap their height to avoid stretching product rows'
)
