import type {
  LogisticsProviderOption,
  LogisticsQuoteOption
} from './profitEstimateLogisticsOptions'

export type LogisticsTransportMode = 'AIR' | 'SEA'

export type LogisticsModeSelection = {
  providerValue?: string
  quoteValue?: string
  stale: boolean
}

export type PersistedLogisticsFormValues = {
  logisticsProviderKey?: string
  airProviderKey?: string
  airQuoteKey?: string
  seaProviderKey?: string
  seaQuoteKey?: string
}

export type PersistedLogisticsSelections = {
  air: LogisticsModeSelection
  sea: LogisticsModeSelection
  staleModes: LogisticsTransportMode[]
}

function quotesForMode(provider: LogisticsProviderOption, mode: LogisticsTransportMode) {
  return mode === 'AIR' ? provider.airQuotes : provider.seaQuotes
}

export function logisticsProvidersForMode(
  providers: LogisticsProviderOption[],
  mode: LogisticsTransportMode
) {
  return providers.filter((provider) => quotesForMode(provider, mode).length > 0)
}

export function logisticsSelectionEvidence(
  provider: LogisticsProviderOption,
  quote: LogisticsQuoteOption
) {
  return {
    provider: {
      value: provider.value,
      forwarderId: provider.forwarderId,
      forwarderName: provider.forwarderName
    },
    quote
  }
}

export function resolveLogisticsModeSelection(
  providers: LogisticsProviderOption[],
  quotes: LogisticsQuoteOption[],
  mode: LogisticsTransportMode,
  currentProviderValue?: string,
  currentQuoteValue?: string
): LogisticsModeSelection {
  if (!currentProviderValue && !currentQuoteValue) {
    return { stale: false }
  }

  const exactProvider = providers.find((provider) => provider.value === currentProviderValue)
  const legacyProviderQuote = quotes.find((quote) => quote.value === currentProviderValue)
  const explicitQuote = quotes.find((quote) => quote.value === currentQuoteValue)
  const providerValue = exactProvider?.value
    || (
      legacyProviderQuote?.transportMode === mode
        ? legacyProviderQuote.providerValue
        : undefined
    )
    || (
      !currentProviderValue && explicitQuote?.transportMode === mode
        ? explicitQuote.providerValue
        : undefined
    )
  const provider = providers.find((item) => item.value === providerValue)
  const modeQuotes = provider ? quotesForMode(provider, mode) : []
  if (!provider || !modeQuotes.length) {
    return { stale: true }
  }

  const selectedQuote = modeQuotes.find((quote) => quote.value === currentQuoteValue)
    || modeQuotes.find((quote) => (
      quote.value === legacyProviderQuote?.value
      && legacyProviderQuote.transportMode === mode
    ))
  const quoteWasSpecified = Boolean(currentQuoteValue)
    || legacyProviderQuote?.transportMode === mode

  return {
    providerValue: provider.value,
    quoteValue: selectedQuote?.value,
    stale: Boolean(quoteWasSpecified && !selectedQuote)
  }
}

export function resolvePersistedLogisticsSelections(
  providers: LogisticsProviderOption[],
  quotes: LogisticsQuoteOption[],
  schemaVersion: number,
  values: PersistedLogisticsFormValues
): PersistedLogisticsSelections {
  const legacyProvider = schemaVersion >= 2
    ? providers.find((provider) => provider.value === values.logisticsProviderKey)
    : undefined
  const legacyQuote = schemaVersion < 2
    ? quotes.find((quote) => quote.value === values.logisticsProviderKey)
    : undefined
  const airProviderValue = values.airProviderKey
    || legacyProvider?.value
    || (legacyQuote?.transportMode === 'AIR' ? legacyQuote.value : undefined)
  const seaProviderValue = values.seaProviderKey
    || legacyProvider?.value
    || (legacyQuote?.transportMode === 'SEA' ? legacyQuote.value : undefined)
  const air = resolveLogisticsModeSelection(
    providers,
    quotes,
    'AIR',
    airProviderValue,
    values.airQuoteKey
  )
  const sea = resolveLogisticsModeSelection(
    providers,
    quotes,
    'SEA',
    seaProviderValue,
    values.seaQuoteKey
  )
  const missingLegacyQuote = schemaVersion < 2
    && Boolean(values.logisticsProviderKey)
    && !legacyQuote
  return {
    air,
    sea,
    staleModes: missingLegacyQuote
      ? ['AIR', 'SEA']
      : [
          ...(air.stale ? ['AIR' as const] : []),
          ...(sea.stale ? ['SEA' as const] : [])
        ]
  }
}
