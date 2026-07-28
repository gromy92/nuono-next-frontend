import { strict as assert } from 'node:assert'
import { routeReferenceIntegrityIssues } from './routeReferenceIntegrity'

assert.deepEqual(
  routeReferenceIntegrityIssues(
    {
      first: {
        key: 'wrong-key',
        tabKey: 'missing-tab',
        sectionKey: 'one',
        contentKind: 'first'
      },
      second: { key: 'second', sectionKey: 'two', contentKind: 'second' }
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

assert.deepEqual(
  routeReferenceIntegrityIssues(
    {
      parent: { key: 'parent', contentKind: 'user-administration' },
      nested: {
        key: 'nested',
        tabKey: 'parent',
        contentKind: 'store-management'
      }
    },
    []
  ),
  [
    'tab content mismatch for nested: store-management != parent:user-administration'
  ]
)
