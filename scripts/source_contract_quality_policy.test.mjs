import { strict as assert } from 'node:assert'
import test from 'node:test'
import { sourceContractQualityReport } from './source_contract_quality_policy.mjs'

const ceilings = {
  directReaders: 2,
  sourceFixtures: 1,
  implementationCoupled: 3
}

test('accepts a reduction that remains within every ceiling', () => {
  const report = sourceContractQualityReport({
    directReaders: ['a.test.ts'],
    sourceFixtures: ['fixture.test.ts'],
    baseDirectReaders: ['a.test.ts', 'removed.test.ts'],
    baseSourceFixtures: ['fixture.test.ts'],
    ceilings
  })
  assert.equal(report.ok, true)
  assert.deepEqual(report.counts, {
    directReaders: 1,
    sourceFixtures: 1,
    implementationCoupled: 2
  })
})

test('rejects a direct-reader count above its ceiling', () => {
  const report = sourceContractQualityReport({
    directReaders: ['a.test.ts', 'b.test.ts', 'c.test.ts'],
    sourceFixtures: [],
    ceilings
  })
  assert.equal(report.ok, false)
  assert.match(report.errors.join('\n'), /direct source-reading contracts exceed ceiling: 3 > 2/)
})

test('rejects a new direct reader even when the total count stays low', () => {
  const report = sourceContractQualityReport({
    directReaders: ['new.test.ts'],
    sourceFixtures: [],
    baseDirectReaders: ['removed.test.ts'],
    ceilings
  })
  assert.equal(report.ok, false)
  assert.match(report.errors.join('\n'), /new direct source-reading contracts: new\.test\.ts/)
})

test('rejects a new source fixture even when it replaces an old fixture', () => {
  const report = sourceContractQualityReport({
    directReaders: [],
    sourceFixtures: ['new-fixture.test.ts'],
    baseSourceFixtures: ['old-fixture.test.ts'],
    ceilings
  })
  assert.equal(report.ok, false)
  assert.match(report.errors.join('\n'), /new source-fixture contracts: new-fixture\.test\.ts/)
})

test('counts overlapping direct readers and fixtures once in the coupled total', () => {
  const report = sourceContractQualityReport({
    directReaders: ['shared.test.ts', 'reader.test.ts'],
    sourceFixtures: ['shared.test.ts'],
    ceilings
  })
  assert.equal(report.ok, true)
  assert.equal(report.counts.implementationCoupled, 2)
})
