import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'

const featureDir = path.resolve('src/features/manual-selection')
const apiSource = fs.readFileSync(
  path.resolve('src/features/selection-analysis/api.ts'),
  'utf8'
)
const modalSource = fs.readFileSync(
  path.join(featureDir, 'components/ManualSelectionProfitEstimateModal.tsx'),
  'utf8'
)

assert(
  apiSource.includes('/profit-estimate')
    && apiSource.includes('loadManualSelectionGroupProfitEstimate')
    && apiSource.includes('saveManualSelectionGroupProfitEstimate'),
  'selection analysis API should own group-level profit estimate persistence'
)

assert(
  modalSource.includes('onSave')
    && modalSource.includes('保存')
    && modalSource.includes('保存成功'),
  'profit estimate modal should expose a save action'
)

assert(
  modalSource.includes('schemaVersion: 3')
    && modalSource.includes('selectedLogistics')
    && modalSource.includes('airProviderKey')
    && modalSource.includes('seaProviderKey')
    && modalSource.includes('visibleScenarioCodes'),
  'saved estimates should persist independent air/sea providers and quote facts'
)

assert(
  modalSource.includes('resolvePersistedLogisticsSelections')
    && modalSource.includes('buildProfitRequest(values, airQuote, seaQuote)'),
  'legacy estimates should migrate strictly and saving should recalculate from the current two quotes'
)

assert(
  modalSource.includes('airFreightUnitPrice: airQuote.unitPrice')
    && modalSource.includes('oceanFreightUnitPrice: seaQuote.unitPrice')
    && !modalSource.includes('airQuote?.unitPrice || PROFIT_FORM_DEFAULTS.airFreightUnitPrice')
    && !modalSource.includes('seaQuote?.unitPrice || PROFIT_FORM_DEFAULTS.oceanFreightUnitPrice'),
  'profit requests must never substitute default freight prices for missing provider quotes'
)
