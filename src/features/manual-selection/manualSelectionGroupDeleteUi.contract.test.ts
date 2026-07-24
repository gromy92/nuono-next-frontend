import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const panelSource = readFileSync(
  new URL('./components/ManualSelectionAnalysisPanel.tsx', import.meta.url),
  'utf8'
)

assert(
  panelSource.includes('manual-selection-analysis-group-delete-button') &&
    panelSource.includes('删除整组选品分析') &&
    panelSource.includes('该选品分析包含 {groupDeleteTarget.records.length} 条采集数据'),
  'selection analysis should expose one whole-group delete flow'
)

assert(
  !panelSource.includes('manual-selection-analysis-material-delete-button') &&
    !panelSource.includes('删除采集材料：'),
  'selection analysis must not expose per-material deletion'
)
