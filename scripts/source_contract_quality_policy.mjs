export const SOURCE_CONTRACT_QUALITY_CEILINGS = Object.freeze({
  directReaders: 87,
  sourceFixtures: 18,
  implementationCoupled: 104
})

export function sourceContractQualityReport({
  directReaders,
  sourceFixtures,
  baseDirectReaders,
  baseSourceFixtures,
  ceilings = SOURCE_CONTRACT_QUALITY_CEILINGS
}) {
  const direct = new Set(directReaders)
  const fixtures = new Set(sourceFixtures)
  const coupled = new Set([...direct, ...fixtures])
  const errors = []

  addCeilingError(errors, 'direct source-reading contracts', direct.size, ceilings.directReaders)
  addCeilingError(errors, 'source-fixture contracts', fixtures.size, ceilings.sourceFixtures)
  addCeilingError(
    errors,
    'implementation-coupled contracts',
    coupled.size,
    ceilings.implementationCoupled
  )

  if (baseDirectReaders) {
    const addedReaders = difference(direct, new Set(baseDirectReaders))
    if (addedReaders.length) {
      errors.push(`new direct source-reading contracts: ${addedReaders.join(', ')}`)
    }
  }
  if (baseSourceFixtures) {
    const addedFixtures = difference(fixtures, new Set(baseSourceFixtures))
    if (addedFixtures.length) {
      errors.push(`new source-fixture contracts: ${addedFixtures.join(', ')}`)
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    counts: {
      directReaders: direct.size,
      sourceFixtures: fixtures.size,
      implementationCoupled: coupled.size
    }
  }
}

function difference(current, baseline) {
  return [...current].filter((value) => !baseline.has(value)).sort()
}

function addCeilingError(errors, label, actual, ceiling) {
  if (actual > ceiling) {
    errors.push(`${label} exceed ceiling: ${actual} > ${ceiling}`)
  }
}
