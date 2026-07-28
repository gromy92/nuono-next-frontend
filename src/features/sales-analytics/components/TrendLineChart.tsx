import { Typography } from 'antd'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { EChartPanel, buildNetUnitsLineOption, buildSalesPriceTrendOption } from '../../../shared/charts'
import type { DailySalesFact, SalesPriceTrendBucket, SalesPriceTrendState } from '../types'
import { numericOrNull } from '../presentation/formatters'

const { Text } = Typography

export function TrendLineChart({
  facts,
  loading,
  priceTrend,
  priceTrendState
}: {
  facts: DailySalesFact[]
  loading: boolean
  priceTrend: SalesPriceTrendBucket[]
  priceTrendState?: SalesPriceTrendState | null
}) {
  const chartOption = useMemo(
    () => {
      if (!facts.length) return null
      const salesPoints = facts.map((fact) => ({
        date: dayjs(fact.factDate).format('MM-DD'),
        fullDate: fact.factDate,
        value: Number(fact.netUnits || 0)
      }))
      if (priceTrendState?.state === 'ready' && priceTrend.length) {
        return buildSalesPriceTrendOption(
          salesPoints,
          priceTrend.map((bucket) => ({
            date: dayjs(bucket.bucketStart).format('MM-DD'),
            fullDate: bucket.bucketStart,
            avgOfferPrice: numericOrNull(bucket.avgOfferPrice),
            minOfferPrice: numericOrNull(bucket.minOfferPrice),
            maxOfferPrice: numericOrNull(bucket.maxOfferPrice),
            orderLineCount: Number(bucket.orderLineCount || 0),
            currencyCode: bucket.currencyCode || undefined
          }))
        )
      }
      return buildNetUnitsLineOption(salesPoints)
    },
    [facts, priceTrend, priceTrendState?.state]
  )
  const showPriceState = priceTrendState && priceTrendState.state !== 'ready'

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {showPriceState ? (
        <Text data-testid="sales-price-trend-state" type="secondary">
          {priceTrendState.message || priceTrendState.label}
        </Text>
      ) : null}
      <EChartPanel
        option={chartOption}
        state={loading ? 'loading' : facts.length ? 'ready' : 'empty'}
        emptyText="暂无趋势数据"
        height={300}
        testId="sales-trend-echart"
        ariaLabel="商品日销量折线图"
      />
    </div>
  )
}
