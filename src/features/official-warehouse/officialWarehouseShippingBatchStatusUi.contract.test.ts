import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const currentDir = dirname(fileURLToPath(import.meta.url))
const pageSource = readFileSync(join(currentDir, 'OfficialWarehousePage.tsx'), 'utf8')
const apiSource = readFileSync(join(currentDir, 'api.ts'), 'utf8')

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
assert.match(
  pageSource,
  /显示可约仓批次、已建ASN批次和已约仓批次；已使用批次排在下方并标注。/,
  'create ASN modal should explain used batches remain visible but are sorted below available batches'
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
  /所选物流批次已约过仓，仍可继续使用/,
  'selecting an appointed shipping batch should show a non-blocking business warning'
)
assert.match(
  pageSource,
  /确认继续使用已约仓物流批次/,
  'creating from an appointed shipping batch should require explicit confirmation'
)
assert.match(
  pageSource,
  /继续创建 ASN/,
  'the confirmation should make the repeated create action explicit'
)
assert.match(
  submitCreateAsnSource,
  /selectedAlreadyAppointedBatches\.length/,
  'create submission should detect selected appointed batches before writing'
)
assert.match(
  submitCreateAsnSource,
  /setReusableBatchCreateConfirm/,
  'appointed batches should open the explicit confirmation state'
)
assert.doesNotMatch(
  submitCreateAsnSource,
  /createOfficialWarehouseAsn/,
  'the initial submit handler must not call the Noon create API directly'
)
