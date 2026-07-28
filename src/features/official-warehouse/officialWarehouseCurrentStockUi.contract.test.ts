import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const currentStockDetailSource = readFileSync(join(currentDir, 'OfficialWarehouseStockCells.tsx'), 'utf8')
const styleSource = [
  'OfficialWarehouseStatisticsPanel.css',
  'OfficialWarehouseStatisticsPanel.styles/01.css',
  'OfficialWarehouseStatisticsPanel.styles/02.css',
  'OfficialWarehouseStatisticsPanel.styles/03.css'
].map((fileName) => readFileSync(join(currentDir, fileName), 'utf8')).join('\n')

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
