import { strict as assert } from 'node:assert'
import type { OfficialWarehouseAppointment } from './api'
import { appointmentDeliveryTimeText } from './officialWarehouseAsnPresentation'

const missingProjection: OfficialWarehouseAppointment = {
  id: '611517',
  asnId: '501819',
  noonAsnNr: 'A05834975PN',
  status: 'SCHEDULED',
  warehouseToPartnerCode: 'RUH01S',
  apStartDate: '2026-08-02',
  apEndDate: '2026-08-02'
}

assert.equal(
  appointmentDeliveryTimeText(missingProjection),
  '约仓时间待同步',
  'a scheduled appointment must not present its requested range as the confirmed delivery time'
)

assert.equal(
  appointmentDeliveryTimeText({ ...missingProjection, status: 'PENDING' }),
  '2026-08-02 - 2026-08-02',
  'an active request may still display its requested date range'
)

assert.equal(
  appointmentDeliveryTimeText({
    ...missingProjection,
    appointmentDate: '2026-08-01',
    appointmentTime: '11am-2pm'
  }),
  '2026-08-01 11am-2pm',
  'the Noon-confirmed result must remain the preferred display'
)
