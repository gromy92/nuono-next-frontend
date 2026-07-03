import { Alert, Button, Empty } from 'antd'
import { useEffect, useState } from 'react'
import { normalizeError } from '../../shared/api'
import { fetchCompetitorDashboard } from './api'
import { CompetitorAttributeChangePanel } from './CompetitorDashboardPriorityPanels'
import { DEFAULT_DASHBOARD_DAYS, type DashboardDays } from './dashboardShared'
import type { CompetitorDashboard, CompetitorDashboardDrill } from './types'

type CompetitorPriceChangeTabProps = {
  storeCode: string
  siteCode: string
  onDrill: (drill: CompetitorDashboardDrill) => void
}

export function CompetitorPriceChangeTab({
  storeCode,
  siteCode,
  onDrill
}: CompetitorPriceChangeTabProps) {
  const [days, setDays] = useState<DashboardDays>(DEFAULT_DASHBOARD_DAYS)
  const [dashboard, setDashboard] = useState<CompetitorDashboard>()
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    setDays(DEFAULT_DASHBOARD_DAYS)
    setDashboard(undefined)
    setErrorText('')
  }, [siteCode, storeCode])

  useEffect(() => {
    if (!storeCode || !siteCode) {
      setDashboard(undefined)
      setErrorText('')
      return undefined
    }
    const controller = new AbortController()
    setLoading(true)
    setErrorText('')
    fetchCompetitorDashboard({ storeCode, siteCode, days }, controller.signal)
      .then(setDashboard)
      .catch((error) => {
        if (!isAbortError(error)) {
          setDashboard(undefined)
          setErrorText(normalizeError(error, '读取竞品详情变化失败'))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })
    return () => controller.abort()
  }, [days, requestVersion, siteCode, storeCode])

  if (!storeCode || !siteCode) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请先选择店铺和站点" />
  }

  return (
    <div className="competitor-analysis-price-change-tab">
      {errorText ? (
        <Alert
          showIcon
          type="error"
          message={errorText}
          action={
            <Button size="small" onClick={() => setRequestVersion((current) => current + 1)}>
              重试
            </Button>
          }
        />
      ) : null}
      <CompetitorAttributeChangePanel
        loading={loading}
        items={dashboard?.competitorAttributeChanges || []}
        snapshotCount={dashboard?.competitorAttributeSnapshotCount || 0}
        changeDate={dashboard?.competitorAttributeChangeDate}
        days={days}
        onDaysChange={setDays}
        siteCode={siteCode}
        onItemClick={(item) => item.watchProductId && onDrill({ watchProductId: item.watchProductId })}
      />
    </div>
  )
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}
