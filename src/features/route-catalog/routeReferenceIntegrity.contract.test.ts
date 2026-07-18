import { strict as assert } from 'node:assert'
import { routeReferenceIntegrityIssues } from './routeReferenceIntegrity'

assert.deepEqual(
  routeReferenceIntegrityIssues(
    {
      first: { key: 'wrong-key', tabKey: 'missing-tab' },
      second: { key: 'second' }
    },
    [{ keys: ['second', 'missing-grant'] }]
  ),
  [
    'route key mismatch: first != wrong-key',
    'unknown tab key for first: missing-tab',
    'unknown grant target: missing-grant'
  ]
)
