import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const currentDir = dirname(fileURLToPath(import.meta.url))
const pageSource = readFileSync(join(currentDir, 'OfficialWarehousePage.tsx'), 'utf8')
const apiSource = readFileSync(join(currentDir, 'api.ts'), 'utf8')

const appointmentWarehouseOptionsSource = pageSource.slice(
  pageSource.indexOf('const appointmentWarehouseOptions = useMemo'),
  pageSource.indexOf('const shippingBatchOptions = useMemo')
)
const openAppointmentSource = pageSource.slice(
  pageSource.indexOf('function openAppointment'),
  pageSource.indexOf('async function submitAppointment')
)
const submitAppointmentSource = pageSource.slice(
  pageSource.indexOf('async function submitAppointment'),
  pageSource.indexOf('async function runAppointmentNow')
)
const buildAppointmentPayloadSource = pageSource.slice(
  pageSource.indexOf('function buildAppointmentPayload'),
  pageSource.indexOf('async function loadManualAvailability')
)
const manualAvailabilityQueryKeySource = pageSource.slice(
  pageSource.indexOf('const manualAvailabilityQueryKey'),
  pageSource.indexOf('useEffect(() => {')
)
const appointmentModalSource = pageSource.slice(
  pageSource.indexOf('<Modal\n        title={appointmentTarget'),
  pageSource.indexOf('<Modal\n        title={correctionTarget')
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
assert.doesNotMatch(
  pageSource,
  /loadOfficialWarehouseAppointmentWarehouses/,
  'appointment modal should not query warehouse-from candidates from the frontend'
)
assert.doesNotMatch(
  apiSource,
  /appointment\/warehouses/,
  'frontend API should not expose the old warehouse-from candidate request'
)
assert.doesNotMatch(
  appointmentModalSource,
  />出发仓库</,
  'appointment modal should not render a warehouse-from field'
)
assert.doesNotMatch(
  buildAppointmentPayloadSource,
  /warehouseFrom/,
  'appointment payload should not send a departure warehouse'
)
assert.doesNotMatch(
  manualAvailabilityQueryKeySource,
  /warehouseFrom/,
  'manual capacity query should not wait for a frontend-selected warehouse-from'
)
assert.doesNotMatch(
  submitAppointmentSource,
  /warehouseFrom|appointmentWarehouseFromMissingMessage/,
  'submitting should not block on a frontend warehouse-from value'
)
assert.doesNotMatch(
  pageSource,
  /warehouseFrom|出发仓库/,
  'official warehouse pages should not display or reference a departure warehouse'
)
assert.doesNotMatch(
  apiSource,
  /warehouseFrom|warehouseFromCode/,
  'official warehouse API models should not expose departure warehouse fields'
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
