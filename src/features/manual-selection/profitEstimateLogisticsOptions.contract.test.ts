import assert from 'node:assert/strict'
import type { LogisticsQuoteOperationPriceItemDto } from '../logistics-quote/types'
import {
  buildLogisticsProviderOptions,
  buildLogisticsQuoteOptions,
  scenarioMatchesLogisticsQuotes
} from './profitEstimateLogisticsOptions'
import {
  logisticsProvidersForMode,
  resolveLogisticsModeSelection,
  resolvePersistedLogisticsSelections
} from './profitEstimateLogisticsSelection'

function quote(input: {
  targetId: number
  forwarderId: number
  forwarderName: string
  transportMode: 'AIR' | 'SEA'
  cargoCategoryName: string
  effectiveValue: number
}): LogisticsQuoteOperationPriceItemDto {
  return {
    ...input,
    targetType: 'BASE_PRICE',
    numericField: 'standardValue',
    serviceName: `沙特${input.transportMode === 'AIR' ? '空运' : '海运'}服务`,
    priceStatus: 'NORMAL',
    currency: 'RMB',
    pricingModel: input.transportMode === 'AIR' ? 'PER_KG' : 'PER_CBM',
    billingUnit: input.transportMode === 'AIR' ? 'KG' : 'CBM'
  }
}

const quotes = buildLogisticsQuoteOptions([
  quote({
    targetId: 101,
    forwarderId: 900001,
    forwarderName: '众鸫供应链',
    transportMode: 'AIR',
    cargoCategoryName: '沙特空运（普货）',
    effectiveValue: 67
  }),
  quote({
    targetId: 102,
    forwarderId: 900001,
    forwarderName: '众鸫供应链',
    transportMode: 'SEA',
    cargoCategoryName: '沙特海运（A类）',
    effectiveValue: 1400
  }),
  quote({
    targetId: 103,
    forwarderId: 900001,
    forwarderName: '众鸫供应链',
    transportMode: 'SEA',
    cargoCategoryName: '沙特海运（B类）',
    effectiveValue: 1650
  }),
  quote({
    targetId: 201,
    forwarderId: 900002,
    forwarderName: '义特物流',
    transportMode: 'SEA',
    cargoCategoryName: '普货',
    effectiveValue: 1188.88
  })
], 'SA')

const providers = buildLogisticsProviderOptions(quotes)

assert.deepEqual(
  providers.map((provider) => provider.forwarderName),
  ['众鸫供应链', '义特物流'],
  'provider options should contain each freight forwarder exactly once'
)
assert.equal(providers[0].value, 'FORWARDER:900001')
assert.equal(providers[0].airQuotes.length, 1)
assert.equal(providers[0].seaQuotes.length, 2)

assert.deepEqual(
  logisticsProvidersForMode(providers, 'AIR').map((provider) => provider.forwarderName),
  ['众鸫供应链'],
  'air provider dropdown should contain only providers with air quotes'
)
assert.deepEqual(
  logisticsProvidersForMode(providers, 'SEA').map((provider) => provider.forwarderName),
  ['众鸫供应链', '义特物流'],
  'sea provider dropdown should contain only providers with sea quotes'
)

const airSelection = resolveLogisticsModeSelection(
  providers,
  quotes,
  'AIR',
  'FORWARDER:900001',
  'BASE_PRICE:101'
)
const seaSelection = resolveLogisticsModeSelection(
  providers,
  quotes,
  'SEA',
  'FORWARDER:900002',
  'BASE_PRICE:201'
)
assert.deepEqual(airSelection, {
  providerValue: 'FORWARDER:900001',
  quoteValue: 'BASE_PRICE:101',
  stale: false
})
assert.deepEqual(
  seaSelection,
  {
    providerValue: 'FORWARDER:900002',
    quoteValue: 'BASE_PRICE:201',
    stale: false
  },
  'air and sea selections may belong to different freight forwarders'
)

const v1Selection = resolvePersistedLogisticsSelections(providers, quotes, 1, {
  logisticsProviderKey: 'BASE_PRICE:101'
})
assert.equal(v1Selection.air.providerValue, 'FORWARDER:900001')
assert.equal(v1Selection.air.quoteValue, 'BASE_PRICE:101')
assert.equal(v1Selection.sea.providerValue, undefined, 'v1 evidence must restore only its own mode')
assert.deepEqual(
  resolvePersistedLogisticsSelections(providers, quotes, 1, {
    logisticsProviderKey: 'BASE_PRICE:999'
  }).staleModes,
  ['AIR', 'SEA'],
  'an unavailable v1 quote should require explicit replacement instead of selecting defaults'
)

const v2Selection = resolvePersistedLogisticsSelections(providers, quotes, 2, {
  logisticsProviderKey: 'FORWARDER:900001',
  airQuoteKey: 'BASE_PRICE:101',
  seaQuoteKey: 'BASE_PRICE:103'
})
assert.equal(v2Selection.air.providerValue, 'FORWARDER:900001')
assert.equal(v2Selection.sea.providerValue, 'FORWARDER:900001')
assert.equal(v2Selection.sea.quoteValue, 'BASE_PRICE:103')

const v3Selection = resolvePersistedLogisticsSelections(providers, quotes, 3, {
  airProviderKey: 'FORWARDER:900001',
  airQuoteKey: 'BASE_PRICE:101',
  seaProviderKey: 'FORWARDER:900002',
  seaQuoteKey: 'BASE_PRICE:201'
})
assert.equal(v3Selection.air.providerValue, 'FORWARDER:900001')
assert.equal(v3Selection.sea.providerValue, 'FORWARDER:900002')
assert.deepEqual(v3Selection.staleModes, [])

const staleSelection = resolveLogisticsModeSelection(
  providers,
  quotes,
  'AIR',
  'FORWARDER:900001',
  'BASE_PRICE:999'
)
assert.equal(staleSelection.providerValue, 'FORWARDER:900001')
assert.equal(staleSelection.quoteValue, undefined)
assert.equal(staleSelection.stale, true, 'an unavailable quote must not switch to the only current quote')

const crossProviderSelection = resolveLogisticsModeSelection(
  providers,
  quotes,
  'SEA',
  'FORWARDER:900001',
  'BASE_PRICE:201'
)
assert.equal(crossProviderSelection.providerValue, 'FORWARDER:900001')
assert.equal(crossProviderSelection.quoteValue, undefined)
assert.equal(crossProviderSelection.stale, true, 'a quote from another provider must be rejected')

const airQuote = providers[0].airQuotes[0]
const seaQuote = providers[0].seaQuotes[1]
assert.equal(scenarioMatchesLogisticsQuotes('FBN_AIR', airQuote, seaQuote), true)
assert.equal(scenarioMatchesLogisticsQuotes('FBP_AIR', airQuote, seaQuote), true)
assert.equal(scenarioMatchesLogisticsQuotes('FBN_OCEAN', airQuote, seaQuote), true)
assert.equal(scenarioMatchesLogisticsQuotes('FBN_OCEAN', airQuote, undefined), false)
assert.equal(scenarioMatchesLogisticsQuotes('FBN_AIR', undefined, seaQuote), false)
