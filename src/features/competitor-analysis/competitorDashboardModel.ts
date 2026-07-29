import type {
  CompetitorDashboard,
  CompetitorDashboardSummaryItem
} from './types'
import type {
  DashboardDays,
  DashboardTimeChartKey,
  RankChangeDirection
} from './dashboardShared'

type DashboardRequestSpec = {
  cacheKey: string
  days: DashboardDays
  rankDirection?: RankChangeDirection
}

export function chartCacheKey(
  key: DashboardTimeChartKey,
  days: DashboardDays,
  selfRankDirection: RankChangeDirection,
  competitorRankDirection: RankChangeDirection
) {
  return dashboardCacheKey(
    days,
    key === 'selfRank'
      ? selfRankDirection
      : key === 'competitorRank'
        ? competitorRankDirection
        : undefined
  )
}

function dashboardCacheKey(days: DashboardDays, rankDirection?: RankChangeDirection) {
  return `${days}:${rankDirection || 'ALL'}`
}

export function uniqueDashboardRequests(requests: DashboardRequestSpec[]) {
  return Array.from(new Map(requests.map((request) => [request.cacheKey, request])).values())
}

export function buildDashboardMetrics(
  overviewDashboard: CompetitorDashboard | undefined,
  selfRankDashboard: CompetitorDashboard | undefined,
  competitorRankDashboard: CompetitorDashboard | undefined,
  detailDashboard: CompetitorDashboard | undefined,
  selfRankDirection: RankChangeDirection,
  competitorRankDirection: RankChangeDirection
) {
  const pendingCandidate = findIssueValue(overviewDashboard, 'PENDING_CANDIDATE')
  const selfRankChanges = selfRankDashboard?.selfRankChanges.length || 0
  const competitorRankChanges = competitorRankDashboard?.competitorRankChanges.length || 0
  const competitorAttributeChanges = detailDashboard?.competitorAttributeChanges.length || 0
  return [
    {
      key: 'self-rank-change',
      label: '关键词排名变化',
      value: selfRankChanges,
      help: selfRankDirection === 'UP' ? '增长 Top' : '下降 Top',
      tone: selfRankChanges > 0 ? 'blue' : 'gray'
    },
    {
      key: 'competitor-rank-change',
      label: '竞品排名变化',
      value: competitorRankChanges,
      help: competitorRankDirection === 'UP' ? '增长 Top' : '下降 Top',
      tone: competitorRankChanges > 0 ? 'orange' : 'gray'
    },
    {
      key: 'competitor-attribute-change',
      label: '竞品列表变化',
      value: competitorAttributeChanges,
      help: detailDashboard?.competitorAttributeSnapshotCount
        ? `${detailDashboard.competitorAttributeSnapshotCount} 个快照`
        : '无抓取',
      tone: competitorAttributeChanges > 0 ? 'red' : 'gray'
    },
    {
      key: 'pending-candidate',
      label: '待确认候选',
      value: pendingCandidate,
      help: '待确认',
      tone: pendingCandidate > 0 ? 'red' : 'green',
      drill: { issueType: 'PENDING_CANDIDATE' as const }
    }
  ]
}

function findIssueValue(
  dashboard: CompetitorDashboard | undefined,
  issueType: CompetitorDashboardSummaryItem['issueType']
) {
  return dashboard?.issueSummary.find((item) => item.issueType === issueType)?.value || 0
}

export async function copyDashboardText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'readonly')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

export function isDashboardAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}
