export type AiOperationsDashboardDatePreset = 'today' | 'last7Days' | 'last30Days'

export type AiOperationsDashboardQuery = {
  storeCode?: string
  siteCode?: string
  datePreset: AiOperationsDashboardDatePreset
}

export type AiOperationsDashboardScope = {
  ownerUserId?: number | null
  operatorUserId?: number | null
  storeCode?: string | null
  siteCode?: string | null
  datePreset: AiOperationsDashboardDatePreset
  dateFrom?: string | null
  dateTo?: string | null
}

export type AiOperationsDashboardSummary = {
  title: string
  state: string
  description?: string | null
}

export type AiOperationsDashboardMetricCard = {
  key: string
  title: string
  state: string
  qualityState?: string | null
  value?: number | string | null
  unit?: string | null
  description?: string | null
}

export type AiOperationsDashboardEvidenceItem = {
  id: string
  label: string
  source?: string | null
  state?: string | null
  description?: string | null
}

export type AiOperationsDashboardSignal = {
  key: string
  title: string
  state: string
  severity?: string | null
  description?: string | null
  source?: string | null
  drillThroughPath?: string | null
  evidence?: AiOperationsDashboardEvidenceItem[]
}

export type AiOperationsDashboardAiSummary = {
  title: string
  state: string
  qualityState?: string | null
  content?: string | null
  generatedAt?: string | null
}

export type AiOperationsDashboardSuggestionItem = {
  id: string
  title: string
  status: string
  description?: string | null
  evidence?: AiOperationsDashboardEvidenceItem[]
}

export type AiOperationsDashboardItemCollection<T> = {
  state: string
  title: string
  items: T[]
}

export type AiOperationsDashboardOverview = {
  scope: AiOperationsDashboardScope
  summary: AiOperationsDashboardSummary
  metricCards: AiOperationsDashboardMetricCard[]
  signals: AiOperationsDashboardSignal[]
  aiSummary: AiOperationsDashboardAiSummary
  suggestions: AiOperationsDashboardItemCollection<AiOperationsDashboardSuggestionItem>
  evidence: AiOperationsDashboardItemCollection<AiOperationsDashboardEvidenceItem>
  qualityStates: string[]
}
