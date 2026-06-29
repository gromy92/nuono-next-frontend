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
