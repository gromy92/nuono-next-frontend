import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const currentDir = dirname(fileURLToPath(import.meta.url))
const pageSource = readFileSync(join(currentDir, 'OfficialWarehousePage.tsx'), 'utf8')

const appointmentWarehouseOptionsSource = pageSource.slice(
  pageSource.indexOf('const appointmentWarehouseOptions = useMemo'),
  pageSource.indexOf('const shippingBatchOptions = useMemo')
)

const openAppointmentSource = pageSource.slice(
  pageSource.indexOf('function openAppointment'),
  pageSource.indexOf('async function loadWarehouseFromCandidates')
)
const loadWarehouseFromCandidatesSource = pageSource.slice(
  pageSource.indexOf('async function loadWarehouseFromCandidates'),
  pageSource.indexOf('async function submitAppointment')
)
const submitAppointmentSource = pageSource.slice(
  pageSource.indexOf('async function submitAppointment'),
  pageSource.indexOf('async function runAppointmentNow')
)
const warehouseLabelSource = pageSource.slice(
  pageSource.indexOf('function appointmentAwareWarehouseLabel'),
  pageSource.indexOf('function businessErrorText')
)

assert.match(
  appointmentWarehouseOptionsSource,
  /optionWarehouses/,
  'appointment warehouse options should render the full Noon warehouse candidate list'
)
assert.doesNotMatch(
  appointmentWarehouseOptionsSource,
  /warehouses\.filter\(matchesCurrentAsnWarehouse\)/,
  'appointment warehouse options should show all routed warehouse candidates instead of hiding non-current warehouses'
)
assert.doesNotMatch(
  appointmentWarehouseOptionsSource,
  /disabled:\s*hasCurrentAsnWarehouse\s*&&\s*!isCurrentAsnWarehouse/,
  'non-current warehouses must remain selectable because Noon Schedule Shipment allows choosing Ship To'
)
assert.doesNotMatch(
  appointmentWarehouseOptionsSource,
  /非当前路由仓/,
  'the UI should not claim non-current warehouses are blocked by routing'
)
assert.doesNotMatch(
  openAppointmentSource,
  /warehouseToPartnerCode:\s*row\.selectedWarehousePartnerCode\s*\|\|\s*appointment\?\.warehouseToPartnerCode/s,
  'appointment form should not treat the ASN creation route as stronger than the existing appointment target'
)
assert.doesNotMatch(
  openAppointmentSource,
  /warehouseToCode:\s*row\.selectedWarehouseCode\s*\|\|\s*appointment\?\.warehouseToCode/s,
  'appointment form should not treat the ASN creation route code as stronger than the existing appointment target'
)
assert.match(
  loadWarehouseFromCandidatesSource,
  /mode:\s*AppointmentSubmitMode/,
  'loading warehouse-from candidates should know whether the modal is auto or manual appointment mode'
)
assert.match(
  loadWarehouseFromCandidatesSource,
  /defaultWarehouseFrom[\s\S]*warehouses\.find/,
  'warehouse-from loading should resolve a first non-empty default candidate'
)
assert.match(
  loadWarehouseFromCandidatesSource,
  /mode\s*===\s*'auto'[\s\S]*warehouseFrom:\s*defaultWarehouseFrom/,
  'auto appointment should prefill the first available warehouse-from candidate instead of leaving submit blocked'
)
assert.match(
  pageSource,
  /const appointmentWarehouseFromMissingMessage/,
  'the appointment modal should have an inline missing-warehouse-from message'
)
assert.match(
  submitAppointmentSource,
  /setAppointmentSubmitFeedback\(\{\s*type:\s*'warning',\s*message:\s*appointmentWarehouseFromMissingMessage\s*\}\)/,
  'submitting without warehouse-from should show the blocking reason inside the modal'
)
assert.match(
  warehouseLabelSource,
  /row\.appointment\?\.warehouseToPartnerCode/,
  'ASN list warehouse label should prefer the appointment Ship To warehouse selected by the user'
)
assert.match(
  warehouseLabelSource,
  /ASN路由/,
  'ASN list warehouse label should retain the original ASN routing warehouse as secondary context'
)
