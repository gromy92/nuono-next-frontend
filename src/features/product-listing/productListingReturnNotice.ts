const PRODUCT_LISTING_RETURN_NOTICE_STORAGE_KEY =
  'nuono-product-listing-return-notice'

export type ProductListingReturnMode = 'list' | 'detail'

export type ProductListingReturnNotice = {
  version: 1
  mode: ProductListingReturnMode
  message: string
  draftId: number
  storeCode: string
  partnerSku?: string
  skuParent?: string
  pskuCode?: string
}

export const PRODUCT_LISTING_PUBLISHED_NOTICE =
  '商品已成功上架，商品列表已刷新。'

export function saveProductListingReturnNotice(
  notice: ProductListingReturnNotice
) {
  if (typeof window === 'undefined') {
    return false
  }
  const normalized = normalizeNotice(notice)
  if (!normalized) {
    return false
  }
  try {
    window.sessionStorage.setItem(
      PRODUCT_LISTING_RETURN_NOTICE_STORAGE_KEY,
      JSON.stringify(normalized)
    )
    return true
  } catch {
    return false
  }
}

export function consumeProductListingReturnNotice() {
  if (typeof window === 'undefined') {
    return undefined
  }
  try {
    const rawValue = window.sessionStorage.getItem(
      PRODUCT_LISTING_RETURN_NOTICE_STORAGE_KEY
    )
    window.sessionStorage.removeItem(PRODUCT_LISTING_RETURN_NOTICE_STORAGE_KEY)
    return rawValue
      ? normalizeNotice(JSON.parse(rawValue) as ProductListingReturnNotice)
      : undefined
  } catch {
    return undefined
  }
}

function normalizeNotice(value: ProductListingReturnNotice) {
  const draftId = Number(value?.draftId)
  const storeCode = text(value?.storeCode)
  const message = text(value?.message)
  if (
    value?.version !== 1 ||
    (value.mode !== 'list' && value.mode !== 'detail') ||
    !Number.isInteger(draftId) ||
    draftId <= 0 ||
    !storeCode ||
    !message
  ) {
    return undefined
  }
  const partnerSku = optionalText(value.partnerSku)
  const skuParent = optionalText(value.skuParent)
  const pskuCode = optionalText(value.pskuCode)
  return {
    version: 1 as const,
    mode: value.mode,
    message,
    draftId,
    storeCode,
    ...(partnerSku ? { partnerSku } : {}),
    ...(skuParent ? { skuParent } : {}),
    ...(pskuCode ? { pskuCode } : {})
  }
}

function optionalText(value?: string) {
  return text(value) || undefined
}

function text(value?: string) {
  return (value || '').trim()
}
