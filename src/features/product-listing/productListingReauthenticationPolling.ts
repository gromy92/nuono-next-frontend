import { PRODUCT_LISTING_REAUTHENTICATION_POLL_INTERVAL_MS } from './productListingReauthentication'

export function productListingReauthenticationScopeKey(params: {
  draftId?: number
  storeCode?: string
  realRunTaskId?: number
}) {
  return [
    params.draftId ?? '',
    (params.storeCode || '').trim().toUpperCase(),
    params.realRunTaskId ?? ''
  ].join('|')
}

export function waitForProductListingReauthenticationPoll(
  signal: AbortSignal
) {
  return new Promise<boolean>((resolve) => {
    if (signal.aborted) {
      resolve(false)
      return
    }
    const timeoutId = setTimeout(() => {
      signal.removeEventListener('abort', handleAbort)
      resolve(true)
    }, PRODUCT_LISTING_REAUTHENTICATION_POLL_INTERVAL_MS)
    const handleAbort = () => {
      clearTimeout(timeoutId)
      signal.removeEventListener('abort', handleAbort)
      resolve(false)
    }
    signal.addEventListener('abort', handleAbort, { once: true })
  })
}

export function isProductListingReauthenticationAbort(error: unknown) {
  return error instanceof Error && error.name === 'AbortError'
}
