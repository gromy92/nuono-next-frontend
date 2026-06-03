import { apiFetch, readApiErrorMessage } from '../../shared/api'
import type {
  OrderFinanceOrderGroup,
  OrderFinanceQuery,
  OrderFinanceSkuSummaryRow,
  OrderFinanceSkuSummaryView,
  OrderFinanceSyncInput,
  OrderFinanceSyncResult
} from './types'

export class OrderFinanceApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'OrderFinanceApiError'
    this.status = status
  }
}

export function fetchOrderFinanceSkuSummary(query: OrderFinanceQuery) {
  return getJson<OrderFinanceSkuSummaryView>(`/api/order-finance/sku-summary?${queryParams(query).toString()}`)
}

export function fetchOrderFinanceSkuOrders(query: OrderFinanceQuery, row: OrderFinanceSkuSummaryRow) {
  const params = queryParams(query, { includePartnerSkuList: false })
  if (row.missingPartnerSku) {
    params.set('missingPartnerSku', 'true')
  } else if (row.partnerSku?.trim()) {
    params.set('partnerSku', row.partnerSku.trim())
  }
  if (row.sku?.trim()) {
    params.set('sku', row.sku.trim())
  }
  return getJson<OrderFinanceOrderGroup[]>(`/api/order-finance/sku-orders?${params.toString()}`)
}

export async function syncOrderFinanceTransactions(input: OrderFinanceSyncInput) {
  const response = await apiFetch('/api/order-finance/noon/transactions/sync', {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(input)
  })
  if (!response.ok) {
    throw new OrderFinanceApiError(response.status, await readApiErrorMessage(response, `同步失败：${response.status}`))
  }
  return (await response.json()) as OrderFinanceSyncResult
}

function queryParams(query: OrderFinanceQuery, options?: { includePartnerSkuList?: boolean }) {
  const params = new URLSearchParams({
    storeCode: query.storeCode,
    siteCode: query.siteCode,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo
  })
  if (query.currency?.trim()) {
    params.set('currency', query.currency.trim())
  }
  if (query.search?.trim()) {
    params.set('search', query.search.trim())
  }
  if (options?.includePartnerSkuList !== false) {
    const partnerSkuList = Array.from(new Set((query.partnerSkuList || []).map((item) => item.trim()).filter(Boolean)))
    if (partnerSkuList.length) {
      params.set('partnerSkuList', partnerSkuList.join(','))
    }
  }
  return params
}

async function getJson<TResponse>(url: string): Promise<TResponse> {
  const response = await apiFetch(url)
  if (!response.ok) {
    throw new OrderFinanceApiError(response.status, await readApiErrorMessage(response, `请求失败：${response.status}`))
  }
  return (await response.json()) as TResponse
}
