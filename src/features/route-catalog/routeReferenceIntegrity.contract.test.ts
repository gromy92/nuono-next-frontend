import { strict as assert } from 'node:assert'
import { routeReferenceIntegrityIssues } from './routeReferenceIntegrity'

const validMount = () => null
assert.deepEqual(
  routeReferenceIntegrityIssues(
    {
      first: {
        key: 'wrong-key',
        tabKey: 'missing-tab',
        sectionKey: 'one',
        workspaceMount: validMount
      },
      second: { key: 'second', sectionKey: 'two', workspaceMount: validMount }
    },
    [{ keys: ['first', 'second', 'missing-grant'] }]
  ),
  [
    'route key mismatch: first != wrong-key',
    'unknown tab key for first: missing-tab',
    'cross-section grant rule first, second, missing-grant: one, two',
    'unknown grant target: missing-grant'
  ]
)

assert.deepEqual(
  routeReferenceIntegrityIssues(
    {
      mounted: { key: 'mounted', workspaceMount: validMount },
      missing: { key: 'missing' },
      invalid: { key: 'invalid', workspaceMount: 'not-a-function' }
    },
    []
  ),
  [
    'missing workspace mount for missing',
    'invalid workspace mount for invalid'
  ]
)

assert.deepEqual(
  routeReferenceIntegrityIssues(
    {
      parent: { key: 'parent', workspaceMount: validMount },
      nested: {
        key: 'nested',
        tabKey: 'parent',
        workspaceMount: validMount
      }
    },
    []
  ),
  []
)
