import { Alert, Button, Empty, Space } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useRef, useState } from 'react'
import { normalizeError } from '../../shared/api'
import { fetchCompetitorDashboard } from './api'
import { RankChangePanel } from './CompetitorDashboardPriorityPanels'
import { RankChangeDetailModal, rankChangeCopyText } from './CompetitorRankChangeDetailModal'
import {
  DASHBOARD_TIME_CHART_KEYS,
  DEFAULT_COMPETITOR_RANK_CHANGE_DIRECTION,
  DEFAULT_DASHBOARD_DAYS,
  DEFAULT_RANK_CHANGE_DIRECTION,
  createChartDays,
  uniqueChartKeys,
  type DashboardDays,
  type DashboardTimeChartKey,
  type RankChangeDirection
} from './dashboardShared'
import type {
  CompetitorDashboard,
  CompetitorDashboardDrill,
  CompetitorDashboardRankChangeItem,
  CompetitorDashboardSummaryItem
} from './types'

type CompetitorDashboardTabProps = {
  storeCode: string
  siteCode: string
  onDrill: (drill: CompetitorDashboardDrill) => void
}

export function CompetitorDashboardTab({
  storeCode,
  siteCode,
  onDrill
}: CompetitorDashboardTabProps) {
  const [dashboardsByKey, setDashboardsByKey] = useState<Record<string, CompetitorDashboard>>({})
  const [chartDays, setChartDays] = useState<Record<DashboardTimeChartKey, DashboardDays>>(() => createChartDays(DEFAULT_DASHBOARD_DAYS))
  const [selfRankDirection, setSelfRankDirection] = useState<RankChangeDirection>(DEFAULT_RANK_CHANGE_DIRECTION)
  const [competitorRankDirection, setCompetitorRankDirection] = useState<RankChangeDirection>(DEFAULT_COMPETITOR_RANK_CHANGE_DIRECTION)
  const [loadingChartKeys, setLoadingChartKeys] = useState<DashboardTimeChartKey[]>([])
  const [errorText, setErrorText] = useState('')
  const [selectedRankChange, setSelectedRankChange] = useState<CompetitorDashboardRankChangeItem>()
  const [rankChangeCopied, setRankChangeCopied] = useState(false)
  const chartLoadSeqRef = useRef(0)
  const chartLoadTokenByKeyRef = useRef<Partial<Record<DashboardTimeChartKey, number>>>({})

  useEffect(() => {
    setChartDays(createChartDays(DEFAULT_DASHBOARD_DAYS))
    setSelfRankDirection(DEFAULT_RANK_CHANGE_DIRECTION)
    setCompetitorRankDirection(DEFAULT_COMPETITOR_RANK_CHANGE_DIRECTION)
    setDashboardsByKey({})
    setLoadingChartKeys([])
    setErrorText('')
    setSelectedRankChange(undefined)
    setRankChangeCopied(false)
  }, [siteCode, storeCode])

  useEffect(() => {
    if (!storeCode || !siteCode) {
      setDashboardsByKey({})
      setLoadingChartKeys([])
      setErrorText('')
      return undefined
    }
    const requestedChartKeys = DASHBOARD_TIME_CHART_KEYS.filter(
      (key) => !dashboardsByKey[chartCacheKey(key, chartDays[key], selfRankDirection, competitorRankDirection)]
    )
    if (!requestedChartKeys.length) {
      return undefined
    }
    const controller = new AbortController()
    const requestSpecs = uniqueDashboardRequests(requestedChartKeys.map((key) => ({
      cacheKey: chartCacheKey(key, chartDays[key], selfRankDirection, competitorRankDirection),
      days: chartDays[key],
      rankDirection: key === 'selfRank'
        ? selfRankDirection
        : key === 'competitorRank'
          ? competitorRankDirection
          : undefined
    })))
    const chartLoadToken = chartLoadSeqRef.current + 1
    chartLoadSeqRef.current = chartLoadToken
    requestedChartKeys.forEach((key) => {
      chartLoadTokenByKeyRef.current[key] = chartLoadToken
    })
    setLoadingChartKeys((current) => uniqueChartKeys([...current, ...requestedChartKeys]))
    setErrorText('')
    Promise.all(
      requestSpecs.map((requestSpec) =>
        fetchCompetitorDashboard(
          {
            storeCode,
            siteCode,
            days: requestSpec.days,
            ...(requestSpec.rankDirection ? { rankDirection: requestSpec.rankDirection } : {})
          },
          controller.signal
        ).then(
          (nextDashboard) => [requestSpec.cacheKey, nextDashboard] as const
        )
      )
    )
      .then((dashboardEntries) => {
        setDashboardsByKey((current) => ({
          ...current,
          ...(Object.fromEntries(dashboardEntries) as Record<string, CompetitorDashboard>)
        }))
      })
      .catch((error) => {
        if (!isAbortError(error)) {
          setErrorText(normalizeError(error, '读取竞品看板失败'))
        }
      })
      .finally(() => {
        setLoadingChartKeys((current) =>
          current.filter((key) => !requestedChartKeys.includes(key) || chartLoadTokenByKeyRef.current[key] !== chartLoadToken)
        )
      })
    return () => controller.abort()
  }, [chartDays, competitorRankDirection, dashboardsByKey, selfRankDirection, siteCode, storeCode])

  const overviewDashboard = dashboardsByKey[chartCacheKey('overview', chartDays.overview, selfRankDirection, competitorRankDirection)]
  const selfRankDashboard = dashboardsByKey[chartCacheKey('selfRank', chartDays.selfRank, selfRankDirection, competitorRankDirection)]
  const competitorRankDashboard = dashboardsByKey[chartCacheKey('competitorRank', chartDays.competitorRank, selfRankDirection, competitorRankDirection)]
  const detailDashboard = dashboardsByKey[chartCacheKey('detailChange', chartDays.detailChange, selfRankDirection, competitorRankDirection)]
  const loadingChartKeySet = useMemo(() => new Set(loadingChartKeys), [loadingChartKeys])
  const isChartLoading = (key: DashboardTimeChartKey) => loadingChartKeySet.has(key)
  const selfRankLoading = isChartLoading('selfRank')
  const competitorRankLoading = isChartLoading('competitorRank')
  const refreshLoading = loadingChartKeys.length > 0

  const metrics = useMemo(
    () => buildDashboardMetrics(
      overviewDashboard,
      selfRankDashboard,
      competitorRankDashboard,
      detailDashboard,
      selfRankDirection,
      competitorRankDirection
    ),
    [
      competitorRankDashboard,
      competitorRankDirection,
      detailDashboard,
      overviewDashboard,
      selfRankDashboard,
      selfRankDirection
    ]
  )
  const setOneChartDays = (key: DashboardTimeChartKey, nextDays: DashboardDays) => {
    setChartDays((current) => ({ ...current, [key]: nextDays }))
  }
  const handleRefresh = () => {
    setDashboardsByKey({})
  }
  const openRankChangeDetail = (item: CompetitorDashboardRankChangeItem) => {
    setSelectedRankChange(item)
    setRankChangeCopied(false)
  }
  const closeRankChangeDetail = () => {
    setSelectedRankChange(undefined)
    setRankChangeCopied(false)
  }
  const copySelectedRankChange = async () => {
    if (!selectedRankChange) return
    try {
      await copyText(rankChangeCopyText(selectedRankChange))
      setRankChangeCopied(true)
    } catch {
      setRankChangeCopied(false)
    }
  }
  const openSelectedRankProduct = () => {
    if (selectedRankChange?.watchProductId) {
      onDrill({ watchProductId: selectedRankChange.watchProductId })
    }
    closeRankChangeDetail()
  }

  if (!storeCode || !siteCode) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请先选择店铺和站点" />
  }

  return (
    <div
      className="competitor-analysis-dashboard-tab"
      data-testid="competitor-dashboard-tab"
    >
      <div className="competitor-analysis-dashboard-toolbar">
        <Space>
          <Button size="small" icon={<ReloadOutlined />} loading={refreshLoading} onClick={handleRefresh}>
            重试
          </Button>
        </Space>
      </div>

      <div className="competitor-analysis-dashboard-metrics">
        {metrics.map((metric) => (
          <button
            type="button"
            key={metric.key}
            className={`competitor-analysis-dashboard-metric competitor-analysis-dashboard-metric-${metric.tone}`}
            onClick={() => metric.drill && onDrill(metric.drill)}
          >
            <span className="competitor-analysis-dashboard-metric-label">{metric.label}</span>
            <strong>{metric.value}</strong>
            <span className="competitor-analysis-dashboard-metric-help">{metric.help}</span>
          </button>
        ))}
      </div>

      {errorText ? (
        <Alert
          showIcon
          type="error"
          message={errorText}
          action={
            <Button size="small" onClick={handleRefresh}>
              重试
            </Button>
          }
        />
      ) : null}

      <div className="competitor-analysis-dashboard-priority-grid">
        <RankChangePanel
          title="我的关键词排名变化"
          explanation="按同一商品、同一关键词、同一 Noon 编码，对比所选时间范围内第一条和最后一条排名，只看首尾净变化；按变化幅度取前 100。增长表示排名数字变小或进榜，下降表示排名数字变大或跌出榜单。"
          loading={selfRankLoading}
          days={chartDays.selfRank}
          onDaysChange={(nextDays) => setOneChartDays('selfRank', nextDays)}
          direction={selfRankDirection}
          onDirectionChange={setSelfRankDirection}
          items={selfRankDashboard?.selfRankChanges || []}
          emptyText="最近没有自己的关键词排名变化"
          testId="competitor-dashboard-self-rank-change-chart"
          fullWidth
          onItemClick={openRankChangeDetail}
        />
        <RankChangePanel
          title="竞品排名变化"
          explanation="按同一监控商品、同一关键词、同一竞品 Noon 编码，对比所选时间范围内第一条和最后一条排名，只看首尾净变化；按变化幅度取前 100。增长表示竞品排名数字变小或进榜，下降表示排名数字变大或跌出榜单。"
          loading={competitorRankLoading}
          days={chartDays.competitorRank}
          onDaysChange={(nextDays) => setOneChartDays('competitorRank', nextDays)}
          direction={competitorRankDirection}
          onDirectionChange={setCompetitorRankDirection}
          items={competitorRankDashboard?.competitorRankChanges || []}
          emptyText="最近没有竞品排名变化"
          testId="competitor-dashboard-competitor-rank-change-chart"
          fullWidth
          onItemClick={openRankChangeDetail}
        />
      </div>

      <RankChangeDetailModal
        item={selectedRankChange}
        copied={rankChangeCopied}
        onCopy={() => void copySelectedRankChange()}
        onOpenProduct={openSelectedRankProduct}
        onClose={closeRankChangeDetail}
      />
    </div>
  )
}

type DashboardRequestSpec = {
  cacheKey: string
  days: DashboardDays
  rankDirection?: RankChangeDirection
}

function chartCacheKey(
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

function uniqueDashboardRequests(requests: DashboardRequestSpec[]) {
  return Array.from(new Map(requests.map((request) => [request.cacheKey, request])).values())
}

function buildDashboardMetrics(
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
      label: '竞品详情变化',
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

function findIssueValue(dashboard: CompetitorDashboard | undefined, issueType: CompetitorDashboardSummaryItem['issueType']) {
  return dashboard?.issueSummary.find((item) => item.issueType === issueType)?.value || 0
}

async function copyText(text: string) {
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

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}
