const PRODUCT_LISTING_SOURCE_PREFILL_STORAGE_KEY =
  'nuono:product-listing:source-prefill'

export function saveProductListingSourcePrefillToSession(prefill: unknown) {
  try {
    window.sessionStorage.setItem(
      PRODUCT_LISTING_SOURCE_PREFILL_STORAGE_KEY,
      JSON.stringify(prefill)
    )
  } catch {
    // URL and server hydration remain authoritative when storage is unavailable.
  }
}

export function readProductListingSourcePrefillFromSession() {
  try {
    return window.sessionStorage.getItem(
      PRODUCT_LISTING_SOURCE_PREFILL_STORAGE_KEY
    )
  } catch {
    return null
  }
}
