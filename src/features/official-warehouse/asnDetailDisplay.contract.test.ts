import { strict as assert } from 'node:assert'
import { isNoonBackofficeAsnWithoutSyncedLines } from './asnDetailDisplay'

assert.equal(
  isNoonBackofficeAsnWithoutSyncedLines({ sourceType: 'NOON_SYNC', lines: [] }),
  true,
  'Noon backoffice ASN without local lines should show the backoffice detail notice'
)

assert.equal(
  isNoonBackofficeAsnWithoutSyncedLines({ sourceType: 'NOON_SYNC', lines: [{ id: 'line-1' }] }),
  false,
  'a Noon-synced ASN with local lines should still show its product detail table'
)

assert.equal(
  isNoonBackofficeAsnWithoutSyncedLines({ sourceType: 'MANUAL', lines: [] }),
  false,
  'an ASN created by Nuono must not be labelled as created in the Noon backoffice'
)
