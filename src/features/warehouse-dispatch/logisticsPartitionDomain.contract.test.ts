import { strict as assert } from 'node:assert'
import {
  matchesLogisticsPartition,
  summarizeLogisticsPartitions,
  summarizeLogisticsPartitionValues
} from './logisticsPartitionDomain'
import { mapShippingBatch } from './shippingApiMappers'

const air = summarizeLogisticsPartitions([
  { siteCode: 'SA', transportMode: 'AIR' },
  { siteCode: 'SA', transportMode: 'AIR' }
])
assert.deepEqual(air, {
  siteCodes: ['SA'],
  transportModes: ['AIR'],
  historicalMixed: false,
  incomplete: false
})
assert.equal(matchesLogisticsPartition(air, 'SA', 'AIR'), true)
assert.equal(matchesLogisticsPartition(air, 'AE', 'all'), false)
assert.equal(matchesLogisticsPartition(air, 'all', 'SEA'), false)

const historicalMixed = summarizeLogisticsPartitionValues(
  ['SA', 'AE'],
  ['AIR', 'SEA']
)
assert.equal(historicalMixed.historicalMixed, true)
assert.equal(matchesLogisticsPartition(historicalMixed, 'AE', 'SEA'), true)

const incomplete = summarizeLogisticsPartitions([
  { siteCode: 'SA', transportMode: 'UNSPECIFIED' }
])
assert.equal(incomplete.incomplete, true)

const mappedBatch = mapShippingBatch({
  id: '700001',
  siteCodes: ['AE'],
  transportModes: ['SEA']
})
assert.deepEqual(mappedBatch.siteCodes, ['AE'])
assert.deepEqual(mappedBatch.transportModes, ['SEA'])
