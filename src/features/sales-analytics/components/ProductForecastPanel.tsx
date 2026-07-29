import { ReloadOutlined } from '@ant-design/icons'
import { Alert, App, Button, Space, Spin, Tag, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { EChartPanel } from '../../../shared/charts'
import { fetchSalesForecastDetail, fetchSalesForecastOverview, recalculateSalesForecast } from '../../sales-forecast/api'
import type {
  SalesForecastDetail,
  SalesForecastOverview,
  SalesForecastQuery,
  SalesForecastRow
} from '../../sales-forecast/types'
import type { DailySalesFact, SalesHistoryCoverage, SalesProductRow } from '../types'
import type { DateRangeValue } from '../model/pageTypes'
import {
  actualUnitsForRange,
  compactRangeText,
  forecastRiskColor,
  forecastUnitsForRange,
  formatDateRange,
  formatForecastFactor,
  formatForecastUnits,
  formatNumber,
  formatStockCoverDays,
  normalizeProductKey
} from '../presentation/formatters'
import {
  SummaryTile,
  buildActualAndForecastChartOption
} from '../presentation/forecastPresentation'

const { Text } = Typography

export function ProductForecastPanel({
  open,
  query,
  row,
  currentStock,
  stockCoverDays,
  detailDateRange,
  actualFacts
}: {
  open: boolean
  query: SalesForecastQuery | null
  row: SalesProductRow | null
  currentStock?: number | null
  stockCoverDays?: number | null
  detailDateRange: DateRangeValue
  actualFacts: DailySalesFact[]
}) {
  const { message } = App.useApp()
  const [overview, setOverview] = useState<SalesForecastOverview | null>(null)
  const [forecastRow, setForecastRow] = useState<SalesForecastRow | null>(null)
  const [forecastDetail, setForecastDetail] = useState<SalesForecastDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const partnerSku = row?.partnerSku || ''
  const loadForecast = useCallback(async () => {
    if (!open || !query || !partnerSku) return
    setLoading(true)
    setErrorMessage('')
    try {
      const nextOverview = await fetchSalesForecastOverview(query)
      const requestedProductKey = normalizeProductKey(partnerSku)
      const matchedRow = (nextOverview.rows || []).find((item) => normalizeProductKey(item.partnerSku) === requestedProductKey) || null
      setOverview(nextOverview)
      setForecastRow(matchedRow)
      setForecastDetail(matchedRow ? await fetchSalesForecastDetail(query, matchedRow.partnerSku) : null)
    } catch (error) {
      setOverview(null)
      setForecastRow(null)
      setForecastDetail(null)
      setErrorMessage(error instanceof Error ? error.message : '销量预测加载失败')
    } finally {
      setLoading(false)
    }
  }, [open, partnerSku, query])

  useEffect(() => {
    if (!open) return
    void loadForecast()
  }, [loadForecast, open])

  const recalculate = async () => {
    if (!query || !partnerSku) return
    setRecalculating(true)
    setErrorMessage('')
    try {
      await recalculateSalesForecast(query)
      await loadForecast()
      message.success('预测已重新计算')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '销量预测重算失败')
    } finally {
      setRecalculating(false)
    }
  }

  const factorBreakdown = forecastDetail?.factorBreakdown || forecastRow?.detail?.factorBreakdown
  const dailyForecasts = factorBreakdown?.dailyForecasts || []
  const rangeForecastUnits = useMemo(
    () => forecastUnitsForRange(dailyForecasts, detailDateRange),
    [dailyForecasts, detailDateRange]
  )
  const rangeActualUnits = useMemo(
    () => actualUnitsForRange(actualFacts, detailDateRange),
    [actualFacts, detailDateRange]
  )
  const chartOption = useMemo(
    () => buildActualAndForecastChartOption(actualFacts, dailyForecasts, detailDateRange),
    [actualFacts, dailyForecasts, detailDateRange]
  )
  const confidenceLabel = forecastRow?.confidenceLabel || '—'
  const emptyTitle = overview?.emptyState?.title || (overview?.state === 'ready' ? '该商品暂无预测结果' : '暂无销量预测结果')
  const emptyDescription =
    overview?.emptyState?.description ||
    (overview?.state === 'ready'
      ? '当前预测结果集中没有匹配到该 PSKU。'
      : '当前店铺还没有预测运行结果。')

  return (
    <Spin spinning={loading || recalculating}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Space wrap>
            <Text strong>销量预测</Text>
            {overview?.sourceDataDate ? <Tag>数据日 {overview.sourceDataDate}</Tag> : null}
            {overview?.calculationVersion ? <Tag>{overview.calculationVersion}</Tag> : null}
            <Tag>{formatDateRange(detailDateRange)}</Tag>
          </Space>
          <Space>
            <Button size="small" icon={<ReloadOutlined />} onClick={() => void loadForecast()} disabled={!query || !partnerSku}>
              刷新预测
            </Button>
            <Button size="small" type="primary" onClick={() => void recalculate()} loading={recalculating} disabled={!query || !partnerSku}>
              重新计算预测
            </Button>
          </Space>
        </div>

        {errorMessage ? <Alert type="error" showIcon message="销量预测加载失败" description={errorMessage} /> : null}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          <SummaryTile testId="sales-analytics-forecast-range-units" title="筛选范围预测" value={formatForecastUnits(rangeForecastUnits)} />
          <SummaryTile testId="sales-analytics-forecast-range-actual-units" title="筛选范围实际" value={formatForecastUnits(rangeActualUnits)} />
          <SummaryTile title="30天预测" value={formatForecastUnits(forecastRow?.forecastUnits30)} />
          <SummaryTile title="60天预测" value={formatForecastUnits(forecastRow?.forecastUnits60)} />
          <SummaryTile title="90天预测" value={formatForecastUnits(forecastRow?.forecastUnits90)} />
          <SummaryTile title="当前库存" value={typeof currentStock === 'number' ? `${formatNumber(currentStock)} 件` : '—'} />
          <SummaryTile title="库存覆盖天数" value={formatStockCoverDays(stockCoverDays)} />
          <SummaryTile title="置信度" value={confidenceLabel} />
        </div>

        {!forecastRow && !loading ? (
          <Alert
            type={overview?.state === 'ready' ? 'warning' : 'info'}
            showIcon
            message={emptyTitle}
            description={emptyDescription}
          />
        ) : null}

        {forecastRow ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Space size={4} wrap>
              {(forecastRow.riskLabels || []).length
                ? (forecastRow.riskLabels || []).map((risk) => (
                    <Tag key={risk.code} color={forecastRiskColor(risk.severity)}>
                      {risk.label}
                    </Tag>
                  ))
                : <Tag>无风险标签</Tag>}
            </Space>

            <EChartPanel
              option={chartOption}
              state={chartOption ? 'ready' : 'empty'}
              emptyText="当前筛选范围暂无实际销量或逐日预测数据"
              height={240}
              testId="sales-analytics-forecast-daily-chart"
              ariaLabel="实际销量与未来120天逐日预测销量"
              title="实际销量与未来120天逐日预测"
            />

            <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 12 }}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Text strong>预测依据</Text>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                  <Text type="secondary">历史 7/30/60/90：{forecastRow.historyUnits7} / {forecastRow.historyUnits30} / {forecastRow.historyUnits60} / {forecastRow.historyUnits90}</Text>
                  <Text type="secondary">基础日均：{formatForecastFactor(factorBreakdown?.baseDailySales)}</Text>
                  <Text type="secondary">趋势因子：{formatForecastFactor(factorBreakdown?.trendFactor)}</Text>
                  <Text type="secondary">30/60/90因子：{formatForecastFactor(factorBreakdown?.futureFactor30 ?? factorBreakdown?.futureFactor)} / {formatForecastFactor(factorBreakdown?.futureFactor60)} / {formatForecastFactor(factorBreakdown?.futureFactor90)}</Text>
                </div>
                <Text>{forecastRow.shortReason || '-'}</Text>
                {forecastRow.confidenceExplanation ? <Text type="secondary">{forecastRow.confidenceExplanation}</Text> : null}
              </Space>
            </div>
          </Space>
        ) : null}
      </Space>
    </Spin>
  )
}

export function HistoryCoverageStatus({
  coverage,
  loading,
  onBackfill
}: {
  coverage?: SalesHistoryCoverage | null
  loading: boolean
  onBackfill: () => void
}) {
  if (!coverage || coverage.backfill.state === 'covered') {
    return null
  }
  const backfill = coverage.backfill
  const salesRange = compactRangeText('销量', coverage.salesFactDateFrom, coverage.salesFactDateTo)
  const priceRange = compactRangeText('价格', coverage.priceDateFrom, coverage.priceDateTo)
  return (
    <Alert
      data-testid="sales-history-coverage-status"
      type={backfill.actionAvailable ? 'warning' : 'info'}
      showIcon
      message={
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Space wrap size={[8, 4]}>
            <Text strong>{backfill.label}</Text>
            <Text type="secondary">{backfill.message}</Text>
            {salesRange ? <Tag style={{ marginInlineEnd: 0 }}>{salesRange}</Tag> : null}
            {priceRange ? <Tag style={{ marginInlineEnd: 0 }}>{priceRange}</Tag> : null}
          </Space>
          {backfill.actionAvailable ? (
            <Button size="small" icon={<ReloadOutlined />} loading={loading} onClick={onBackfill}>
              触发历史补全
            </Button>
          ) : null}
        </div>
      }
    />
  )
}
