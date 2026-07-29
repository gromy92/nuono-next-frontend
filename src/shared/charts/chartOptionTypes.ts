export type LinePoint = {
  date: string
  fullDate?: string
  value: number
}

export type SalesPricePoint = {
  date: string
  fullDate?: string
  avgOfferPrice?: number | null
  minOfferPrice?: number | null
  maxOfferPrice?: number | null
  orderLineCount: number
  currencyCode?: string | null
}

export type DistributionPoint = {
  key?: string
  label: string
  value: number
}
