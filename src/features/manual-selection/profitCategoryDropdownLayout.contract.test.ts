import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const featureDir = path.resolve('src/features/manual-selection')
const modalSource = fs.readFileSync(
  path.join(featureDir, 'components/ManualSelectionProfitEstimateModal.tsx'),
  'utf8'
)
const logisticsFieldsSource = fs.readFileSync(
  path.join(featureDir, 'components/ManualSelectionProfitLogisticsFields.tsx'),
  'utf8'
)
const logisticsFieldsCss = fs.readFileSync(
  path.join(featureDir, 'components/ManualSelectionProfitLogisticsFields.css'),
  'utf8'
)
const pageCss = [
  'ManualSelectionPage.css',
  ...Array.from({ length: 7 }, (_, index) => `ManualSelectionPage.styles/${String(index + 1).padStart(2, '0')}.css`)
].map((fileName) => fs.readFileSync(path.join(featureDir, fileName), 'utf8')).join('\n')

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

assert(
  modalSource.includes('<Col span={9}>')
    && modalSource.includes('<Col span={11}>')
    && modalSource.includes('<Col span={4}>'),
  'profit form first row should give the link and category enough width without a shared provider field'
)

assert(
  logisticsFieldsSource.includes('options={providers.map(({ value, forwarderName }) => ({')
    && logisticsFieldsSource.includes('label: forwarderName')
    && logisticsFieldsSource.includes('optionFilterProp="label"'),
  'each transport-mode provider select should show only unique provider names'
)

assert(
  modalSource.includes('mode="AIR"')
    && modalSource.includes('mode="SEA"')
    && logisticsFieldsSource.includes('`${modeLabel}货代`')
    && logisticsFieldsSource.includes('`${modeLabel}报价类别`')
    && modalSource.includes('scenarioMatchesLogisticsQuotes'),
  'profit form should select independent providers and quotes for air and sea scenarios'
)

assert(
  logisticsFieldsSource.includes('popupClassName="manual-selection-profit-logistics-quote-dropdown"')
    && logisticsFieldsSource.includes('popupMatchSelectWidth={560}')
    && logisticsFieldsSource.includes('optionLabelProp="displayLabel"')
    && logisticsFieldsCss.includes('.manual-selection-profit-logistics-quote-dropdown .ant-select-item-option-content')
    && logisticsFieldsCss.includes('width: min(560px, calc(100vw - 80px))')
    && logisticsFieldsCss.includes('grid-template-columns: minmax(0, 1fr) auto')
    && logisticsFieldsCss.includes('text-overflow: clip'),
  'freight quote dropdown should be wide and show the full category and rate without ellipsis'
)

assert(
  !modalSource.includes('系统类目 {selectedCategory ? systemCategoryDisplayLabel(selectedCategory)'),
  'profit summary should not repeat the selected system category'
)
