import type { LogisticsQuoteOperationPriceItemsResponse } from './types'

export function requireReadyOperationPriceItems(
  data: LogisticsQuoteOperationPriceItemsResponse
) {
  if (!data.ready || data.mode === 'mock-demo') {
    throw new Error(data.message || '正式报价接口尚未就绪')
  }
  return data
}
