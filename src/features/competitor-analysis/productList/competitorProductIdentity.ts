import type { CompetitorWatchProduct } from '../types'

export function sameProductLine(
  left: CompetitorWatchProduct,
  right: CompetitorWatchProduct
) {
  if (left.id && right.id && left.id === right.id) {
    return true
  }
  const leftIdentity = productIdentityKey(left)
  const rightIdentity = productIdentityKey(right)
  if (leftIdentity && rightIdentity) {
    return leftIdentity === rightIdentity
  }
  return Boolean(
    left.productSiteOfferId &&
      right.productSiteOfferId &&
      left.productSiteOfferId === right.productSiteOfferId
  )
}

export function productIdentityKey(
  product?: Pick<
    CompetitorWatchProduct,
    'storeCode' | 'siteCode' | 'partnerSku'
  > | null
) {
  const storeCode = product?.storeCode?.trim().toUpperCase()
  const siteCode = product?.siteCode?.trim().toUpperCase()
  const partnerSku = product?.partnerSku?.trim().toUpperCase()
  return storeCode && siteCode && partnerSku
    ? `${storeCode}::${siteCode}::${partnerSku}`
    : ''
}

export function productRowKey(product: CompetitorWatchProduct) {
  return (
    product.id ||
    productIdentityKey(product) ||
    product.productSiteOfferId ||
    product.partnerSku ||
    ''
  )
}

export function productActionKey(prefix: string, product: CompetitorWatchProduct) {
  return `${prefix}-${productRowKey(product) || 'product'}`
}
