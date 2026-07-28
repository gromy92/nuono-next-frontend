import type { ReactNode } from 'react'
import { DatabaseOutlined, WarningOutlined } from '@ant-design/icons'
import { Card, Progress, Space, Tag, Typography } from 'antd'
import { percent } from './reportBlocks'
import type { EmptyStoreBucket } from './reportBlocks'
import type { StoreDataReportMetric } from './types'

const { Text } = Typography

export function ReportSection({
  title,
  description,
  testId,
  extra,
  children
}: {
  title?: string
  description?: string
  testId: string
  extra?: ReactNode
  children: ReactNode
}) {
  return (
    <Card variant="borderless" style={{ borderRadius: 6 }} data-testid={testId}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {title || description || extra ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {title || description ? (
              <Space direction="vertical" size={2}>
                {title ? <Text strong style={{ fontSize: 16 }}>{title}</Text> : null}
                {description ? <Text type="secondary">{description}</Text> : null}
              </Space>
            ) : null}
            {extra}
          </div>
        ) : null}
        {children}
      </Space>
    </Card>
  )
}

export function MetricGrid({ metrics }: { metrics: StoreDataReportMetric[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
      {metrics.map((metric) => <MetricCard key={metric.key} metric={metric} />)}
    </div>
  )
}

export function ResponsiveChartGrid({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
      {children}
    </div>
  )
}

type ReportKpiTone = 'ready' | 'warning' | 'danger'

type ReportKpiItem = {
  title: string
  value: number | string
  unit?: string
  tone?: ReportKpiTone
}

export function ReportKpiGrid({ items }: { items: ReportKpiItem[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
      {items.map((item) => (
        <Card key={item.title} size="small" variant="borderless" style={{ background: '#f8fafc', borderRadius: 6 }}>
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <Space size={6} style={{ justifyContent: 'space-between', width: '100%' }}>
              <Text type="secondary">{item.title}</Text>
              <Tag color={kpiToneColor(item.tone)}>{kpiToneLabel(item.tone)}</Tag>
            </Space>
            <Text strong style={{ fontSize: 22, lineHeight: '28px' }}>
              {formatKpiValue(item.value)}
              {item.unit ? <Text type="secondary"> {item.unit}</Text> : null}
            </Text>
          </Space>
        </Card>
      ))}
    </div>
  )
}

export function EmptyStoreBuckets({ buckets, totalStoreSites }: { buckets: EmptyStoreBucket[]; totalStoreSites: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10 }}>
      {buckets.map((bucket) => (
        <Card key={bucket.key} size="small" variant="borderless" style={{ background: '#f8fafc', borderRadius: 6 }}>
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            <Space size={8} style={{ justifyContent: 'space-between', width: '100%' }}>
              <Text strong>{bucket.title}</Text>
              <Tag color={bucket.rows.length > 0 ? 'gold' : 'green'}>{bucket.rows.length}</Tag>
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>{bucket.description}</Text>
            <Progress
              percent={totalStoreSites > 0 ? percent(bucket.rows.length, totalStoreSites) : 0}
              size="small"
              status={bucket.rows.length > 0 ? 'normal' : 'success'}
            />
          </Space>
        </Card>
      ))}
    </div>
  )
}

function MetricCard({ metric }: { metric: StoreDataReportMetric }) {
  const warning = metric.state === 'warning'
  return (
    <Card size="small" variant="borderless" style={{ background: '#f8fafc', borderRadius: 6 }}>
      <Space direction="vertical" size={4}>
        <Space size={6}>
          {warning ? <WarningOutlined style={{ color: '#d97706' }} /> : <DatabaseOutlined style={{ color: '#2563eb' }} />}
          <Text type="secondary">{metric.title}</Text>
        </Space>
        <Text strong style={{ fontSize: 22, lineHeight: '28px' }}>
          {metric.value.toLocaleString()}
          {metric.unit ? <Text type="secondary"> {metric.unit}</Text> : null}
        </Text>
      </Space>
    </Card>
  )
}

function formatKpiValue(value: number | string) {
  return typeof value === 'number' ? value.toLocaleString() : value
}

function kpiToneColor(tone: ReportKpiTone = 'ready') {
  if (tone === 'danger') return 'red'
  if (tone === 'warning') return 'gold'
  return 'blue'
}

function kpiToneLabel(tone: ReportKpiTone = 'ready') {
  if (tone === 'danger') return '异常'
  if (tone === 'warning') return '关注'
  return '正常'
}
