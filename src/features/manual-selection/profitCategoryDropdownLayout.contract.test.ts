import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const featureDir = path.resolve('src/features/manual-selection')
const modalSource = fs.readFileSync(
  path.join(featureDir, 'components/ManualSelectionProfitEstimateModal.tsx'),
  'utf8'
)
const pageCss = fs.readFileSync(path.join(featureDir, 'ManualSelectionPage.css'), 'utf8')

assert(
  modalSource.includes('manual-selection-profit-category-option-name')
    && modalSource.includes('manual-selection-profit-category-option-path'),
  'category dropdown options should render category name and full path as separate readable lines'
)

assert(
  pageCss.includes('.manual-selection-profit-category-dropdown .ant-select-item-option-content')
    && pageCss.includes('white-space: normal'),
  'category dropdown content should wrap instead of truncating long system category paths'
)

const optionClassStart = pageCss.indexOf('.manual-selection-profit-category-option {')
const optionClassEnd = pageCss.indexOf('}', optionClassStart)
const optionClassBody = pageCss.slice(optionClassStart, optionClassEnd)

assert(!optionClassBody.includes('text-overflow: ellipsis'), 'category option should not ellipsize the full path')
assert(!optionClassBody.includes('white-space: nowrap'), 'category option should not force a single line')
