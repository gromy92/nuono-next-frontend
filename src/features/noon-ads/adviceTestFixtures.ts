export function campaign(
  campaignCode: string,
  campaignName: string,
  spendAmount: number,
  ordersCount: number,
  adRevenue: number,
  roas: number,
  zeroOrderSpendShare: number,
  primarySku?: string
) {
  return {
    campaignCode,
    campaignName,
    primaryPartnerSku: primarySku,
    primarySku,
    campaignStatus: 'live',
    qcStatus: 'live',
    views: 100,
    clicks: 10,
    ordersCount,
    assistedOrders: 0,
    atcCount: 3,
    spendAmount,
    adRevenue,
    ctrPercentage: 0.1,
    roas,
    cpc: spendAmount / 10,
    cps: ordersCount ? spendAmount / ordersCount : 0,
    cvrPercentage: ordersCount / 10,
    zeroOrderSpendAmount: spendAmount * zeroOrderSpendShare,
    zeroOrderSpendShare
  }
}

export function query(
  campaignCode: string,
  campaignName: string,
  sku: string,
  queryText: string,
  spendAmount: number,
  ordersCount: number,
  adRevenue: number,
  roas: number,
  queryKind = 'search_term'
) {
  return {
    campaignCode,
    campaignName,
    partnerSku: sku,
    sku,
    queryText,
    queryKind,
    views: 20,
    clicks: 3,
    ordersCount,
    assistedOrders: 0,
    atcCount: 1,
    spendAmount,
    adRevenue,
    ctrPercentage: 0.15,
    roas,
    cpc: spendAmount / 3,
    cps: ordersCount ? spendAmount / ordersCount : 0,
    cvrPercentage: ordersCount / 3
  }
}

export function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}. Expected ${String(expected)}, got ${String(actual)}`)
  }
}
