import { CalendarOutlined } from '@ant-design/icons'
import { Button, Space, Tag, Typography } from 'antd'
import type { SalesActivityWindow, SalesAnalyticsSummary } from '../types'
import { syncStatusLabel } from './formatters'

const { Text } = Typography

export function ActivityMarkerSummary({
  title,
  activityWindows,
  loading,
  manageHref
}: {
  title: string
  activityWindows: SalesActivityWindow[]
  loading: boolean
  manageHref?: string
}) {
  return (
    <div
      data-testid="sales-activity-marker-summary"
      style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '10px 12px' }}
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Space wrap>
          <CalendarOutlined />
          <Text strong>{title}</Text>
          {loading ? <Text type="secondary">加载中</Text> : null}
          {!loading && activityWindows.length ? (
            activityWindows.map((window) => (
              <Tag key={window.id} color="blue">
                {window.name} {Number(window.factor).toFixed(2)}x
              </Tag>
            ))
          ) : null}
          {!loading && !activityWindows.length ? <Text type="secondary">当前范围暂无节日/活动标记</Text> : null}
        </Space>
        {manageHref ? (
          <Button size="small" icon={<CalendarOutlined />} href={manageHref}>
            管理节日配置
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export const healthFilterOptions = [
  { label: '销量就绪', value: 'sales_fact_ready' },
  { label: '商品主档未匹配', value: 'product_dimension_missing' },
  { label: '品牌缺失', value: 'brand_missing' },
  { label: '后台类目缺失', value: 'backend_fulltype_missing' }
]

export function DataStatus({
  summary,
  latestSalesDate,
  productCount,
  selectedCount
}: {
  summary: SalesAnalyticsSummary
  latestSalesDate?: string
  productCount: number
  selectedCount: number
}) {
  const statusState = summary.syncStatus?.state
  const available = summary.businessMetricsAvailable !== false
  return (
    <div
      data-testid="sales-data-status"
      style={{ borderLeft: '3px solid #168553', background: '#f8fafc', padding: '10px 12px', borderRadius: 6 }}
    >
      <Space wrap>
        <Text strong>数据状态：</Text>
        <Text>{productCount} 个商品 · 真实销量最新日 {latestSalesDate || '—'}</Text>
        <Tag color={available ? 'green' : 'gold'}>{statusState ? syncStatusLabel(statusState) : 'ready'}</Tag>
        <Text type="secondary">已选 {selectedCount} 个</Text>
      </Space>
    </div>
  )
}
