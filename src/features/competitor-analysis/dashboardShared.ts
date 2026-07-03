export type DashboardDays = 1 | 7 | 14 | 30

export type RankChangeDirection = 'UP' | 'DOWN'

export type DashboardTimeChartKey =
  | 'overview'
  | 'selfRank'
  | 'competitorRank'
  | 'issueTrend'
  | 'rankIssue'
  | 'detailChange'

export const DASHBOARD_DAYS_OPTIONS = [
  { label: '昨天', value: 1 },
  { label: '7天', value: 7 },
  { label: '14天', value: 14 },
  { label: '30天', value: 30 }
] satisfies Array<{ label: string; value: DashboardDays }>

export const DEFAULT_DASHBOARD_DAYS: DashboardDays = 7
export const DEFAULT_RANK_CHANGE_DIRECTION: RankChangeDirection = 'DOWN'
export const DEFAULT_COMPETITOR_RANK_CHANGE_DIRECTION: RankChangeDirection = 'UP'

export const RANK_CHANGE_DIRECTION_OPTIONS = [
  { label: '下降', value: 'DOWN' },
  { label: '增长', value: 'UP' }
] satisfies Array<{ label: string; value: RankChangeDirection }>

export const DASHBOARD_TIME_CHART_KEYS: DashboardTimeChartKey[] = [
  'overview',
  'selfRank',
  'competitorRank',
  'detailChange'
]

export function createChartDays(days: DashboardDays): Record<DashboardTimeChartKey, DashboardDays> {
  return {
    overview: days,
    selfRank: days,
    competitorRank: days,
    issueTrend: days,
    rankIssue: days,
    detailChange: days
  }
}

export function uniqueDashboardDays(days: DashboardDays[]) {
  return Array.from(new Set(days)).sort((left, right) => left - right)
}

export function uniqueChartKeys(keys: DashboardTimeChartKey[]) {
  return Array.from(new Set(keys))
}

export function dashboardDaysSummary(days: DashboardDays) {
  return days === 1 ? '昨天到现在' : `最近 ${days} 天`
}
