const PRODUCT_LISTING_RETURN_NOTICE_STORAGE_KEY = 'nuono-product-listing-return-notice'

export const PRODUCT_LISTING_REAL_RUN_SUBMITTED_NOTICE = '上架任务已提交，上架中，稍后在列表中查看状态。'

export function saveProductListingReturnNotice(messageText: string) {
  if (typeof window === 'undefined') {
    return
  }
  const normalizedMessage = messageText.trim()
  if (!normalizedMessage) {
    return
  }
  try {
    window.sessionStorage.setItem(PRODUCT_LISTING_RETURN_NOTICE_STORAGE_KEY, normalizedMessage)
  } catch {
    // Ignore storage failures; the navigation itself should still proceed.
  }
}

export function consumeProductListingReturnNotice() {
  if (typeof window === 'undefined') {
    return undefined
  }
  try {
    const messageText = window.sessionStorage.getItem(PRODUCT_LISTING_RETURN_NOTICE_STORAGE_KEY)?.trim()
    window.sessionStorage.removeItem(PRODUCT_LISTING_RETURN_NOTICE_STORAGE_KEY)
    return messageText || undefined
  } catch {
    return undefined
  }
}
