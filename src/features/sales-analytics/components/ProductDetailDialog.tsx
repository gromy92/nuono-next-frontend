import { ShoppingOutlined } from '@ant-design/icons'
import { DatePicker, Modal, Segmented, Space, Tabs, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { ProductBaselineIdentity } from '../../product-baseline'
import type { SalesForecastQuery } from '../../sales-forecast/types'
import type { SalesProductDetail, SalesProductRow } from '../types'
import {
  detailRangePresetOptions,
  type DateRangeValue,
  type DetailRangePreset
} from '../model/pageTypes'
import {
  formatDateRange,
  formatMoney,
  formatNumber,
  formatPercent,
  formatStockCoverDays,
  formatTrendDataRange,
  healthTags,
  lastCategoryLabel
} from '../presentation/formatters'
import { SummaryStrip } from '../presentation/forecastPresentation'
import { HistoryCoverageStatus, ProductForecastPanel } from './ProductForecastPanel'
import { TrendLineChart } from './TrendLineChart'

const { RangePicker } = DatePicker
const { Text } = Typography

export function ProductDetailDialog({
  open,
  loading,
  row,
  detail,
  granularity,
  detailRangePreset,
  detailDateRange,
  forecastQuery,
  onClose,
  onDetailRangePresetChange,
  onDetailDateRangeChange,
  onHistoryBackfill,
  historyBackfillLoading
}: {
  open: boolean
  loading: boolean
  row: SalesProductRow | null
  detail: SalesProductDetail | null
  granularity: string
  detailRangePreset: DetailRangePreset
  detailDateRange: DateRangeValue
  forecastQuery: SalesForecastQuery | null
  onClose: () => void
  onDetailRangePresetChange: (preset: DetailRangePreset) => void
  onDetailDateRangeChange: (range: DateRangeValue) => void
  onHistoryBackfill: () => void
  historyBackfillLoading: boolean
}) {
  const summary = detail?.summary
  const currentStock = row?.currentStock ?? detail?.currentStock
  const stockCoverDays = row?.stockCoverDays ?? detail?.stockCoverDays
  const imageUrl = row?.imageUrl || detail?.imageUrl
  const productTitle = row?.productTitle || detail?.productTitle || row?.partnerSku || '-'
  const partnerSku = row?.partnerSku || detail?.partnerSku || '-'
  const sku = row?.sku || detail?.sku || '-'
  const brandLabel = row?.brand || '品牌 —'
  const categoryLabel = lastCategoryLabel(row?.productFulltype)
  const trendDataRange = formatTrendDataRange(detail?.facts || [], detail?.priceTrend || []) || formatDateRange(detailDateRange)
  const [activeDetailTab, setActiveDetailTab] = useState<'sales' | 'forecast'>('sales')

  useEffect(() => {
    if (open) {
      setActiveDetailTab('sales')
    }
  }, [open, partnerSku])

  return (
    <Modal title={<Space size={6}><ShoppingOutlined />商品详情</Space>} open={open} width={1180} footer={null} onCancel={onClose}>
      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        <div style={{ paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
          <ProductBaselineIdentity
            title={productTitle}
            imageUrl={imageUrl}
            imageCount={imageUrl ? 1 : 0}
            imageAlt={productTitle}
            imageWidth={104}
            titleMaxWidth="100%"
            codes={[
              { label: 'PSKU', value: partnerSku, copyText: partnerSku },
              { label: 'SKU', value: sku, copyText: sku }
            ]}
            tags={
              <>
                <Tag style={{ marginInlineEnd: 0 }}>{brandLabel}</Tag>
                <Tag title={row?.productFulltype || undefined} style={{ marginInlineEnd: 0 }}>{categoryLabel}</Tag>
              </>
            }
            extra={
              <Space wrap size={[4, 4]} align="center">
                {healthTags(row || undefined)}
                <Tag style={{ marginInlineEnd: 0 }}>可售 {formatNumber(currentStock)}</Tag>
                <Tag style={{ marginInlineEnd: 0 }}>覆盖 {formatStockCoverDays(stockCoverDays)}</Tag>
              </Space>
            }
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Space wrap size={[8, 6]}>
            <Text strong>时间范围</Text>
            <Segmented<DetailRangePreset>
              data-testid="sales-detail-range-preset"
              size="small"
              value={detailRangePreset}
              options={detailRangePresetOptions}
              onChange={onDetailRangePresetChange}
            />
            {detailRangePreset === 'custom' ? (
              <span data-testid="sales-detail-custom-range">
                <RangePicker
                  allowClear={false}
                  value={detailDateRange}
                  onChange={(value) => {
                    if (value?.[0] && value?.[1]) onDetailDateRangeChange([value[0], value[1]])
                  }}
                />
              </span>
            ) : (
              <Text type="secondary">
                {formatDateRange(detailDateRange)}
              </Text>
            )}
          </Space>
          {loading ? <Text type="secondary">加载中</Text> : null}
        </div>

        {activeDetailTab === 'sales' ? (
          <HistoryCoverageStatus
            coverage={detail?.historyCoverage}
            loading={historyBackfillLoading}
            onBackfill={onHistoryBackfill}
          />
        ) : null}

        <Tabs
          activeKey={activeDetailTab}
          onChange={(key) => setActiveDetailTab(key === 'forecast' ? 'forecast' : 'sales')}
          items={[
            {
              key: 'sales',
              label: '销量分析',
              children: (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <SummaryStrip
                    items={[
                      { title: '当前范围净销量', value: `${formatNumber(summary?.netUnits)} 件` },
                      { title: '访客 / 转化', value: `${formatNumber(summary?.yourVisitors)} / ${formatPercent(summary?.conversionVisitorsPercentage)}` },
                      { title: '收入', value: `${formatMoney(summary?.revenueShipped)} SAR` }
                    ]}
                  />
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderBottom: '1px solid #eef2f7', flexWrap: 'wrap' }}>
                      <Space direction="vertical" size={0}>
                        <Text strong>销量趋势</Text>
                        <Text type="secondary">
                          {granularity === 'week' ? '当前粒度为周，商品级日明细接入后可切换到日。' : '使用当前可用真实销量事实。'}
                        </Text>
                      </Space>
                      <Text data-testid="sales-trend-data-range" type="secondary">{trendDataRange}</Text>
                    </div>
                    <div style={{ padding: '8px 12px 12px' }}>
                      <TrendLineChart
                        facts={detail?.facts || []}
                        loading={loading}
                        priceTrend={detail?.priceTrend || []}
                        priceTrendState={detail?.priceTrendState}
                      />
                    </div>
                  </div>
                </Space>
              )
            },
            {
              key: 'forecast',
              label: '销量预测',
              children: (
                <ProductForecastPanel
                  open={open}
                  query={forecastQuery}
                  row={row}
                  currentStock={currentStock}
                  stockCoverDays={stockCoverDays}
                  detailDateRange={detailDateRange}
                  actualFacts={detail?.facts || []}
                />
              )
            }
          ]}
        />
      </Space>
    </Modal>
  )
}
