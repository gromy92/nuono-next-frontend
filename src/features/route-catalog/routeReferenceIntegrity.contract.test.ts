import { strict as assert } from 'node:assert'
import { routeReferenceIntegrityIssues } from './routeReferenceIntegrity'

assert.deepEqual(
  routeReferenceIntegrityIssues(
    {
      first: { key: 'wrong-key', tabKey: 'missing-tab', contentKind: 'first' },
      second: { key: 'second', contentKind: 'second' }
    },
    [{ keys: ['second', 'missing-grant'] }]
  ),
  [
    'route key mismatch: first != wrong-key',
    'unknown tab key for first: missing-tab',
    'unknown grant target: missing-grant'
  ]
)

const validMount = () => null
assert.deepEqual(
  routeReferenceIntegrityIssues(
    {
      legacy: { key: 'legacy', contentKind: 'legacy' },
      mounted: { key: 'mounted', workspaceMount: validMount },
      missing: { key: 'missing' },
      both: { key: 'both', contentKind: 'both', workspaceMount: validMount },
      invalid: { key: 'invalid', workspaceMount: 'not-a-function' }
    },
    []
  ),
  [
    'missing workspace mount strategy for missing',
    'conflicting workspace mount strategies for both',
    'invalid workspace mount for invalid'
  ]
)
