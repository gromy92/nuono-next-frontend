import { Empty, Progress, Space, Tag, Typography } from 'antd'
import type {
  Ali1688CandidateLevel,
  Ali1688CollectionStatus,
  Ali1688CollectionView,
  ProductSelectionSourceCollection
} from '../../source-collection/types'
import { buildSourceCollectionAli1688View } from '../../source-collection/ali1688'

const { Paragraph, Text } = Typography

type StatusMeta = {
  label: string
  color: string
}

const ALI_1688_STATUS_META: Record<Ali1688CollectionStatus, StatusMeta> = {
  not_started: { label: '未接入', color: 'default' },
  queued: { label: '已排队', color: 'blue' },
  running: { label: '查询中', color: 'processing' },
  success: { label: '查询成功', color: 'success' },
  partial_success: { label: '部分成功', color: 'warning' },
  failed: { label: '查询失败', color: 'error' }
}

const ALI_1688_CANDIDATE_LEVEL_META: Record<Ali1688CandidateLevel, StatusMeta> = {
  recommended: { label: '推荐', color: 'success' },
  review: { label: '待确认', color: 'warning' },
  reject: { label: '淘汰', color: 'default' }
}

export function buildManualSelectionAli1688View(record: ProductSelectionSourceCollection): Ali1688CollectionView {
  return buildSourceCollectionAli1688View(record)
}

export function ManualSelectionAli1688InlineStatus({ record }: { record: ProductSelectionSourceCollection }) {
  const view = buildManualSelectionAli1688View(record)
  const meta = ALI_1688_STATUS_META[view.status]
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Space wrap size={[6, 4]}>
        <Tag color={meta.color}>{meta.label}</Tag>
        {view.searchMode ? <Tag color="blue">{view.searchMode}</Tag> : null}
        {view.progressPercent != null ? <Tag>{view.progressPercent}%</Tag> : null}
      </Space>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <MiniMetric label="候选" value={String(view.candidateCount ?? 0)} />
        <MiniMetric label="推荐" value={String(view.recommendedCount ?? 0)} />
      </div>
      {view.message ? (
        <Text type={view.status === 'failed' ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
          {view.message}
        </Text>
      ) : null}
    </Space>
  )
}

export function ManualSelectionAli1688DetailPanel({ record }: { record: ProductSelectionSourceCollection }) {
  const view = buildManualSelectionAli1688View(record)
  const meta = ALI_1688_STATUS_META[view.status]
  const candidates = view.candidates || []

  return (
    <div className="manual-selection-ali1688" data-testid="manual-selection-ali1688-panel">
      <div className="manual-selection-ali1688-summary">
        <div className="manual-selection-ali1688-main">
          <Space wrap size={[6, 6]}>
            <Tag color={meta.color}>{meta.label}</Tag>
            {view.searchMode ? <Tag color="blue">{view.searchMode}</Tag> : null}
          </Space>
          <Text className="manual-selection-ali1688-message">
            {view.message || '1688 查询展示等待接入。'}
          </Text>
        </div>
        <div className="manual-selection-ali1688-progress">
          <div className="manual-selection-ali1688-progress-head">
            <span>查询进度</span>
            <strong>{view.progressPercent ?? 0}%</strong>
          </div>
          <Progress percent={view.progressPercent ?? 0} showInfo={false} size="small" />
        </div>
      </div>

      <div className="manual-selection-ali1688-metrics">
        <Metric label="候选数量" value={`${view.candidateCount ?? candidates.length} 个`} />
        <Metric label="推荐候选" value={`${view.recommendedCount ?? candidates.filter((item) => item.level === 'recommended').length} 个`} />
        <Metric label="开始时间" value={view.startedAt || '-'} />
        <Metric label="完成时间" value={view.finishedAt || '-'} />
      </div>

      <div className="manual-selection-ali1688-candidates">
        {candidates.length ? (
          candidates.slice(0, 5).map((candidate) => {
            const levelMeta = ALI_1688_CANDIDATE_LEVEL_META[candidate.level]
            return (
              <div key={candidate.id} className="manual-selection-ali1688-candidate">
                <div className="manual-selection-ali1688-candidate-rank">#{candidate.rankNo}</div>
                <div className="manual-selection-ali1688-candidate-body">
                  <div className="manual-selection-ali1688-candidate-head">
                    <Paragraph ellipsis={{ rows: 2 }} className="manual-selection-ali1688-candidate-title">
                      {candidate.title}
                    </Paragraph>
                    <Tag color={levelMeta.color}>{levelMeta.label}</Tag>
                  </div>
                  <div className="manual-selection-ali1688-candidate-meta">
                    <span>{candidate.supplierName}</span>
                    <span>{candidate.priceText || '价格待解析'}</span>
                    <span>{candidate.moqText || '起订量待解析'}</span>
                    <span>{candidate.locationText || '地区待解析'}</span>
                  </div>
                  {candidate.reasons?.length ? (
                    <div className="manual-selection-ali1688-chip-list">
                      {candidate.reasons.slice(0, 3).map((reason) => (
                        <span key={reason} className="manual-selection-ali1688-chip">{reason}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无 1688 候选明细" />
        )}
      </div>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderRadius: 6, background: '#f8fafc', padding: '4px 6px' }}>
      <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>{label}</Text>
      <Text strong style={{ fontSize: 13 }}>{value}</Text>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="manual-selection-ali1688-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
