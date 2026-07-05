import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

const featureDir = path.resolve('src/features/manual-selection')
const apiSource = fs.readFileSync(path.join(featureDir, 'api.ts'), 'utf8')
const modalSource = fs.readFileSync(
  path.join(featureDir, 'components/ManualSelectionProfitEstimateModal.tsx'),
  'utf8'
)

assert(
  apiSource.includes('/profit-estimate')
    && apiSource.includes('loadManualSelectionGroupProfitEstimate')
    && apiSource.includes('saveManualSelectionGroupProfitEstimate'),
  'manual selection API should expose group-level profit estimate persistence'
)

assert(
  modalSource.includes('onSave')
    && modalSource.includes('保存')
    && modalSource.includes('保存成功'),
  'profit estimate modal should expose a save action'
)
