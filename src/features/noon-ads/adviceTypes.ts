export type NoonAdvertisingAdviceGroupKey =
  | 'stopLoss'
  | 'scaleCandidates'
  | 'lowEfficiency'
  | 'structureRisk'

export type NoonAdvertisingAdviceTone = 'danger' | 'success' | 'warning' | 'processing'

export type NoonAdvertisingAdviceTrendStatus =
  | 'continuedRisk'
  | 'improving'
  | 'stillStrong'
  | 'cooling'
  | 'reducedSpend'
  | 'sampleInsufficient'

export type NoonAdvertisingAdviceTrend = {
  status: NoonAdvertisingAdviceTrendStatus
  label: string
  detail: string
}

export type NoonAdvertisingAdviceItem = {
  key: string
  title: string
  subtitle: string
  spendAmount: number
  ordersCount: number
  adRevenue: number
  roas: number
  evidence: string
  trend?: NoonAdvertisingAdviceTrend
}

export type NoonAdvertisingAdviceGroup = {
  key: NoonAdvertisingAdviceGroupKey
  title: string
  subtitle: string
  tone: NoonAdvertisingAdviceTone
  items: NoonAdvertisingAdviceItem[]
}
