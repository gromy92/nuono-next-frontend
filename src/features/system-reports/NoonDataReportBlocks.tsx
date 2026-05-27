import { Empty, Space, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'
import type { NoonDataDistributionItem, NoonDataReportMetric } from './types'

const { Text, Title } = Typography

export function NoonDataReportHeader({
  title,
  subtitle,
  generatedAt,
  extra
}: {
  title: string
  subtitle: string
  generatedAt?: string | null
  extra?: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        alignItems: 'center',
        flexWrap: 'wrap'
      }}
    >
      <Space direction="vertical" size={2}>
        <Title level={4} style={{ margin: 0 }}>
          {title}
        </Title>
        <Text type="secondary">{subtitle}</Text>
      </Space>
      <Space wrap>
        {generatedAt ? <Text type="secondary">更新时间 {formatDateTime(generatedAt)}</Text> : null}
        {extra}
      </Space>
    </div>
  )
}

export function NoonDataMetricGrid({ metrics }: { metrics: NoonDataReportMetric[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(168px, 1fr))', gap: 10 }}>
      {metrics.map((metric) => (
        <div
          key={metric.key}
          style={{
            border: '1px solid #eef0f3',
            borderRadius: 6,
            padding: '12px 14px',
            background: '#ffffff',
            minHeight: 82
          }}
        >
          <Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
            {metric.title}
          </Text>
          <Space align="baseline" size={4}>
            <span style={{ fontSize: 24, lineHeight: '30px', fontWeight: 600 }}>{metric.value}</span>
            {metric.unit ? <Text type="secondary">{metric.unit}</Text> : null}
          </Space>
          {metric.state ? (
            <div style={{ marginTop: 4 }}>
              <StatusTag value={metric.state} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export function NoonDataReportSection({
  title,
  children,
  testId
}: {
  title: string
  children: ReactNode
  testId?: string
}) {
  return (
    <section
      data-testid={testId}
      style={{
        border: '1px solid #edf0f5',
        borderRadius: 8,
        background: '#ffffff',
        padding: 16,
        display: 'grid',
        gap: 12
      }}
    >
      <Title level={5} style={{ margin: 0 }}>
        {title}
      </Title>
      {children}
    </section>
  )
}

export function NoonDataDistributionStrip({
  title,
  items
}: {
  title: string
  items: NoonDataDistributionItem[]
}) {
  return (
    <Space direction="vertical" size={6} style={{ width: '100%' }}>
      <Text type="secondary">{title}</Text>
      <Space wrap size={[6, 6]}>
        {items.length ? (
          items.map((item) => (
            <Tag key={item.key} color="default" style={{ marginInlineEnd: 0 }}>
              {item.label || item.key}: {item.value}
            </Tag>
          ))
        ) : (
          <Text type="secondary">暂无分布数据</Text>
        )}
      </Space>
    </Space>
  )
}

export function NoonDataEmpty({ description, testId }: { description: string; testId: string }) {
  return (
    <div data-testid={testId} style={{ padding: '20px 0' }}>
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />
    </div>
  )
}

export function StatusTag({ value }: { value?: string | null }) {
  const normalizedValue = (value || '').trim()
  if (!normalizedValue) {
    return <Tag>未知</Tag>
  }
  return <Tag color={tagColor(normalizedValue)}>{statusLabel(normalizedValue)}</Tag>
}

export function CategoryTag({ value }: { value?: string | null }) {
  const normalizedValue = (value || '').trim()
  return <Tag color="blue">{categoryLabel(normalizedValue)}</Tag>
}

export function formatDate(value?: string | null) {
  return value ? value.slice(0, 10) : '-'
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return '-'
  }
  return value.replace('T', ' ').slice(0, 16)
}

export function categoryLabel(value?: string | null) {
  const labels: Record<string, string> = {
    PRODUCT_LIST: '商品列表',
    PRODUCT_DETAIL: '商品详情',
    SALES_ORDER: '销售订单',
    SALES_PRODUCT_VIEWS: '销量商品浏览',
    FINANCE_TRANSACTION: '财务交易',
    LIFECYCLE_STATE: '生命周期状态'
  }
  return labels[value || ''] || value || '未知类别'
}

export function statusLabel(value: string) {
  const labels: Record<string, string> = {
    empty: '空',
    ready: '就绪',
    working: '处理中',
    warning: '预警',
    danger: '异常',
    missing: '缺失',
    incomplete: '未完成',
    pending_confirmation: '待确认',
    complete: '已完成',
    confirmed_empty: '确认空',
    failed: '失败',
    paused: '已暂停',
    stale: '过期',
    not_integrated: '未接入',
    provider_retention_limit: '超出保留期',
    not_required: '无需补全',
    pending: '待处理',
    retrying: '重试中',
    blocked: '阻塞',
    manual_action_required: '需人工介入',
    resolved: '已处理',
    READY: '就绪',
    WORKING: '处理中',
    MISSING: '缺失',
    INCOMPLETE: '未完成',
    PENDING_CONFIRMATION: '待确认',
    COMPLETE: '已完成',
    CONFIRMED_EMPTY: '确认空',
    FAILED: '失败',
    PAUSED: '已暂停',
    STALE: '过期',
    NOT_INTEGRATED: '未接入',
    PROVIDER_RETENTION_LIMIT: '超出保留期',
    NOT_REQUIRED: '无需补全',
    PENDING: '待处理',
    RETRYING: '重试中',
    BLOCKED: '阻塞',
    MANUAL_ACTION_REQUIRED: '需人工介入',
    RESOLVED: '已处理'
  }
  return labels[value] || value
}

export function failureTypeLabel(value?: string | null) {
  const normalizedValue = (value || '').trim()
  const labels: Record<string, string> = {
    empty_report_pending_confirmation: '空报表待确认',
    provider_retention_limit: '超出保留期',
    provider_not_configured: '接口未配置',
    auth_required: '需要账号授权',
    missing_columns: '字段缺失',
    mapping_failed: '映射失败',
    report_not_ready: '报表未就绪',
    rate_limited: '限流',
    captcha_required: '需要验证码',
    risk_control: '风控拦截',
    timeout: '超时',
    unknown: '未知原因'
  }
  return labels[normalizedValue] || normalizedValue || '-'
}

export function windowTypeLabel(value?: string | null) {
  const normalizedValue = (value || '').trim()
  const labels: Record<string, string> = {
    PRODUCT_BASELINE: '商品基线',
    PRODUCT_DETAIL_BASELINE: '商品详情基线',
    LATEST_DAILY: '最近日数据',
    HISTORY_BACKFILL: '历史回填'
  }
  return labels[normalizedValue] || normalizedValue || '-'
}

function tagColor(value: string) {
  const normalizedValue = value.toLowerCase()
  if (normalizedValue.includes('ready') || normalizedValue.includes('resolved') || normalizedValue.includes('not_required')) {
    return 'green'
  }
  if (normalizedValue.includes('warning') || normalizedValue.includes('pending') || normalizedValue.includes('retry')) {
    return 'gold'
  }
  if (normalizedValue.includes('manual') || normalizedValue.includes('blocked') || normalizedValue.includes('danger') || normalizedValue.includes('failed')) {
    return 'red'
  }
  if (normalizedValue.includes('paused') || normalizedValue.includes('retention') || normalizedValue.includes('not_integrated')) {
    return 'default'
  }
  return 'default'
}
