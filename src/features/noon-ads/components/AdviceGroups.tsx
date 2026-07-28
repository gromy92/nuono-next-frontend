import {
  ExclamationCircleOutlined,
  PartitionOutlined,
  RiseOutlined,
  UnorderedListOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { Button, Modal, Space, Statistic, Tag, Typography } from 'antd'
import type {
  NoonAdvertisingAdviceGroup,
  NoonAdvertisingAdviceGroupKey,
  NoonAdvertisingAdviceTrendStatus
} from '../advice'
import type {
  NoonAdvertisingCampaignDiagnostic,
  NoonAdvertisingProductDiagnostic,
  NoonAdvertisingProductRow
} from '../types'
import {
  diagnosticLabelTagColor,
  formatDecimal,
  formatMoney,
  formatNumber,
  formatRate,
  planTypeCountText,
  primaryDiagnosticReason,
  productDiagnosisTagColor
} from '../presentation/formatters'

const { Text } = Typography

export function ProductDiagnosisPanel({
  product,
  diagnostic
}: {
  product: NoonAdvertisingProductRow
  diagnostic: NoonAdvertisingProductDiagnostic | null
}) {
  const diagnosisLabel = diagnostic?.diagnosisLabel || '样本不足'
  const actions = diagnostic?.recommendedActions?.length ? diagnostic.recommendedActions : ['样本不足，暂不判断广告结构。']

  return (
    <section className="noon-ads-product-diagnosis">
      <div className="noon-ads-product-diagnosis-header">
        <div>
          <Text strong>商品诊断结论</Text>
          <div className="noon-ads-muted">{primaryDiagnosticReason(diagnostic)}</div>
        </div>
        <Space size={6} wrap>
          <Tag color={productDiagnosisTagColor(diagnostic?.diagnosisType)}>{diagnosisLabel}</Tag>
          <Tag>优先级 {formatNumber(diagnostic?.priorityScore || 0)}</Tag>
        </Space>
      </div>
      <div className="noon-ads-product-diagnosis-evidence">
        <ProductFact label="花费" value={formatMoney(product.spendAmount)} />
        <ProductFact label="订单" value={formatNumber(product.ordersCount)} />
        <ProductFact label="ROAS" value={formatDecimal(product.roas)} />
        <ProductFact label="零订单占比" value={formatRate(product.zeroOrderSpendShare)} />
        <ProductFact label="计划类型" value={planTypeCountText(diagnostic)} />
      </div>
      <ul className="noon-ads-product-diagnosis-actions">
        {actions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>
      <div className="noon-ads-product-diagnosis-note">建议仅供只读分析，真实广告调整需人工确认。</div>
    </section>
  )
}

export function ProductFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="noon-ads-product-fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function DiagnosticInline({ diagnostic }: { diagnostic?: NoonAdvertisingCampaignDiagnostic }) {
  if (!diagnostic?.labels?.length) return <Text type="secondary">暂无明显问题</Text>
  return (
    <Space size={[4, 4]} wrap>
      {diagnostic.labels.map((label) => (
        <Tag key={label} color={diagnosticLabelTagColor(label)}>{label}</Tag>
      ))}
    </Space>
  )
}

export function CampaignActionInline({ diagnostic }: { diagnostic?: NoonAdvertisingCampaignDiagnostic }) {
  if (!diagnostic?.recommendedActions?.length) return <Text type="secondary">-</Text>
  return (
    <div className="noon-ads-campaign-action">
      {diagnostic.recommendedActions[0]}
    </div>
  )
}

export function planTypeTagColor(planType?: string) {
  if (planType === 'EXPLORATION') return 'blue'
  if (planType === 'CORE') return 'green'
  return 'default'
}

export function AdviceGroup({
  group,
  onOpenAll
}: {
  group: NoonAdvertisingAdviceGroup
  onOpenAll: (key: NoonAdvertisingAdviceGroupKey) => void
}) {
  const hiddenItemCount = Math.max(group.items.length - 3, 0)

  return (
    <section className={`noon-ads-advice-group noon-ads-advice-${group.tone}`}>
      <div className="noon-ads-advice-header">
        <span className="noon-ads-advice-icon">{adviceIcon(group)}</span>
        <div>
          <Text strong>{group.title}</Text>
          <div className="noon-ads-muted">{group.subtitle}</div>
        </div>
        <Tag color={adviceTagColor(group)}>{formatNumber(group.items.length)}</Tag>
      </div>
      <div className="noon-ads-advice-list">
        {group.items.length ? group.items.slice(0, 3).map((item) => (
          <div className="noon-ads-advice-item" key={item.key}>
            <div>
              <Text strong>{item.title}</Text>
              <div className="noon-ads-muted">{item.subtitle}</div>
            </div>
            <AdviceEvidence item={item} />
          </div>
        )) : (
          <div className="noon-ads-advice-empty">暂无建议项</div>
        )}
      </div>
      {hiddenItemCount > 0 ? (
        <Button
          className="noon-ads-advice-more"
          type="link"
          size="small"
          icon={<UnorderedListOutlined />}
          onClick={() => onOpenAll(group.key)}
        >
          查看全部 {formatNumber(group.items.length)} 条
        </Button>
      ) : null}
    </section>
  )
}

export function AdviceGroupModal({
  group,
  onClose
}: {
  group: NoonAdvertisingAdviceGroup | null
  onClose: () => void
}) {
  return (
    <Modal
      className="noon-ads-advice-modal"
      title={group ? `${group.title}（${formatNumber(group.items.length)} 条）` : undefined}
      open={Boolean(group)}
      footer={null}
      onCancel={onClose}
      width={760}
    >
      <div className="noon-ads-advice-modal-list">
        {group?.items.map((item, index) => (
          <div className="noon-ads-advice-modal-item" key={`${item.key}-${index}`}>
            <div className="noon-ads-advice-modal-rank">{formatNumber(index + 1)}</div>
            <div className="noon-ads-advice-modal-content">
              <Text strong>{item.title}</Text>
              <div className="noon-ads-muted">{item.subtitle}</div>
              <AdviceEvidence item={item} showTrendDetail />
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}

export function AdviceEvidence({
  item,
  showTrendDetail = false
}: {
  item: NoonAdvertisingAdviceGroup['items'][number]
  showTrendDetail?: boolean
}) {
  return (
    <div className="noon-ads-advice-evidence">
      {item.trend ? (
        <Tag className="noon-ads-advice-trend-tag" color={adviceTrendTagColor(item.trend.status)}>
          {item.trend.label}
        </Tag>
      ) : null}
      <span>{item.evidence}</span>
      {showTrendDetail && item.trend?.detail ? (
        <div className="noon-ads-advice-trend-detail">{item.trend.detail}</div>
      ) : null}
    </div>
  )
}

export function adviceIcon(group: NoonAdvertisingAdviceGroup) {
  if (group.key === 'stopLoss') return <ExclamationCircleOutlined />
  if (group.key === 'scaleCandidates') return <RiseOutlined />
  if (group.key === 'lowEfficiency') return <WarningOutlined />
  return <PartitionOutlined />
}

export function adviceTagColor(group: NoonAdvertisingAdviceGroup) {
  if (group.tone === 'danger') return 'red'
  if (group.tone === 'success') return 'green'
  if (group.tone === 'warning') return 'gold'
  return 'blue'
}

export function adviceTrendTagColor(status: NoonAdvertisingAdviceTrendStatus) {
  if (status === 'continuedRisk' || status === 'cooling') return 'orange'
  if (status === 'improving' || status === 'stillStrong') return 'green'
  if (status === 'reducedSpend') return 'blue'
  return 'default'
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="noon-ads-metric">
      <Statistic title={label} value={value} />
    </div>
  )
}
