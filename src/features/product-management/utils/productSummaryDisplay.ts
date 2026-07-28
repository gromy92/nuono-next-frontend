import type { ProductListSummaryPayload, ProductSummarySurface, StoreInitializationPayload } from '../types'
import { productSummaryPrimarySite } from '../../product-baseline'
import { getProductCurrentZCode, isSameStableProductIdentity } from './productIdentity'

export function productSummaryPriceLine(summary: ProductSummarySurface) {
  return summary.referencePrice ? `${summary.currency || ''} ${summary.referencePrice}`.trim() : '-'
}

export function productSummaryIdentityLine(summary: ProductSummarySurface) {
  return `${summary.partnerSku || '-'} · ${getProductCurrentZCode(summary) || '-'} · ${productSummaryPrimarySite(summary)}`
}

export function productListSummaryAppliesToItem(
  item: StoreInitializationPayload['productItems'][number] | StoreInitializationPayload['sampleProducts'][number],
  summary: ProductListSummaryPayload
) {
  return isSameStableProductIdentity(
    {
      ...item,
      storeCode: 'storeCode' in item ? item.storeCode : undefined,
      referenceStoreCode: 'referenceStoreCode' in item ? item.referenceStoreCode : undefined
    },
    summary
  )
}
