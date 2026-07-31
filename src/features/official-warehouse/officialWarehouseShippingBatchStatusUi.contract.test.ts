import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  officialWarehouseApiContractSource,
  officialWarehousePageContractSource,
  officialWarehousePageStyleContractSource
} from './officialWarehouseContractSources'

const currentDir = dirname(fileURLToPath(import.meta.url))
const pageSource = officialWarehousePageContractSource
const apiSource = officialWarehouseApiContractSource
const preparationSource = readFileSync(join(currentDir, 'productMatchPreparation.ts'), 'utf8')
const searchHookSource = readFileSync(join(currentDir, 'useShippingBatchSearch.ts'), 'utf8')
const loadAlertSource = readFileSync(join(currentDir, 'ShippingBatchLoadAlert.tsx'), 'utf8')
const createHookSource = pageSource.slice(
  pageSource.indexOf('export function useOfficialWarehouseCreateAsn'),
  pageSource.indexOf('export function useOfficialWarehouseSpecEditor')
)

const optionTextSource = pageSource.slice(
  pageSource.indexOf('function shippingBatchOptionText'),
  pageSource.indexOf('function lineStatusTag')
)
const submitCreateAsnSource = pageSource.slice(
  pageSource.indexOf('async function submitCreateAsn'),
  pageSource.indexOf('async function createAsnFromSelectedRows')
)

assert.match(
  apiSource,
  /alreadyAppointed\?: boolean/,
  'shipping batch candidates should expose whether the batch has a scheduled appointment'
)
assert.match(
  apiSource,
  /scheduledAppointmentQuantity\?: number/,
  'shipping batch candidates should expose the successfully appointed quantity separately from ASN usage'
)
assert.match(
  apiSource,
  /batchUsedByAsn\?: boolean/,
  'shipping batch candidates should expose whether the batch was used by a valid ASN'
)
assert.match(
  apiSource,
  /batchUsageLabel\?: string/,
  'shipping batch candidates should expose a display label for batch usage'
)
assert.match(
  optionTextSource,
  /row\.batchUsedByAsn/,
  'shipping batch option text should distinguish batches that were only used by ASN'
)
assert.match(
  optionTextSource,
  /row\.scheduledAppointmentQuantity/,
  'shipping batch option text should display the scheduled appointment quantity separately'
)
assert.match(
  optionTextSource,
  /row\.alreadyAppointed/,
  'shipping batch option text should mark batches that were actually scheduled'
)
assert.match(
  optionTextSource,
  /已建ASN/,
  'shipping batch option text should not label every valid ASN usage as an appointment success'
)
assert.match(
  optionTextSource,
  /可再次约仓/,
  'appointed shipping batches should advertise that they remain reusable'
)
assert.doesNotMatch(
  pageSource,
  /显示可约仓批次、已建ASN批次和已约仓批次；已使用批次排在下方并标注。/,
  'create ASN modal should omit the obsolete batch usage explanation'
)
assert.match(
  pageSource,
  /所选物流批次已无剩余待约仓商品/,
  'create ASN candidate empty state should avoid treating every used batch as scheduled'
)
assert.doesNotMatch(
  pageSource,
  /仅显示真实在途或已到海外仓且仍有待约仓数量的物流批次号/,
  'create ASN modal should not claim appointed batches are hidden'
)
assert.match(
  pageSource,
  /shippingBatchKeyword/,
  'create ASN modal should retain the logistics batch remote-search keyword'
)
assert.match(
  pageSource,
  /showSearch[\s\S]*?placeholder="选择物流批次号"/,
  'the logistics batch multi-select should retain its built-in search'
)
assert.match(
  pageSource,
  /filterOption=\{false\}[\s\S]*?onSearch=\{handleShippingBatchSearch\}/,
  'typing a logistics batch number should use remote search instead of filtering stale options'
)
assert.match(
  searchHookSource,
  /loadOfficialWarehouseShippingBatches\(\{[\s\S]*?keyword: keywordValue/,
  'remote logistics batch search should send the keyword to the shipping-batches API'
)
assert.match(
  createHookSource,
  /void loadShippingBatches\('', false\)/,
  'opening the create ASN modal should read landed batches without blocking on product-match preparation'
)
assert.doesNotMatch(
  createHookSource,
  /void loadShippingBatches\('', true\)/,
  'opening the create ASN modal must not run product-match preparation automatically'
)
assert.match(
  searchHookSource,
  /readOfficialWarehouseShippingBatchCache[\s\S]*?writeOfficialWarehouseShippingBatchCache/,
  'shipping batch search should reuse and refresh a store/user/site-scoped successful result'
)
assert.match(
  pageSource,
  /刷新物流匹配/,
  'product-match preparation should remain available as an explicit refresh action'
)
assert.match(
  officialWarehousePageStyleContractSource,
  /\.official-warehouse-batch-summary-metrics \{/,
  'compact batch summary metrics should have a dedicated responsive style'
)
assert.match(
  preparationSource,
  /catch[\s\S]*?使用已落地数据继续查询[\s\S]*?loadOfficialWarehouseShippingBatches/,
  'a transient preparation failure should not prevent querying already landed shipping batches'
)
assert.match(
  `${pageSource}\n${loadAlertSource}`,
  /shippingBatchLoadError[\s\S]*?ShippingBatchLoadAlert[\s\S]*?重试/,
  'batch loading failures should remain visible and offer an explicit retry'
)
assert.match(
  pageSource,
  /所选物流批次已约过仓，仍可继续使用/,
  'selecting an appointed shipping batch should show a non-blocking business warning'
)
assert.match(
  pageSource,
  /title="创建前确认"/,
  'creating from an appointed shipping batch should require explicit confirmation'
)
assert.match(
  pageSource,
  /okText="确认继续"/,
  'the confirmation should make the repeated create action explicit'
)
assert.match(
  submitCreateAsnSource,
  /selectedAlreadyAppointedBatches\.map\(shippingBatchDisplayNo\)[\s\S]*?batchNos\.length/,
  'create submission should detect selected appointed batches before writing'
)
assert.match(
  submitCreateAsnSource,
  /setCreateAsnConfirmation/,
  'appointed batches should open the explicit confirmation state'
)
assert.doesNotMatch(
  submitCreateAsnSource,
  /createOfficialWarehouseAsn/,
  'the initial submit handler must not call the Noon create API directly'
)
