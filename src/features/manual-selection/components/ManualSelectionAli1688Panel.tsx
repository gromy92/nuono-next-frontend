import { Alert, Button, Empty, Progress, Space, Tag, Tooltip, Typography, message } from 'antd'
import { useState } from 'react'
import type {
  Ali1688CandidateLevel,
  Ali1688CollectionStatus,
  Ali1688CollectionView,
  Ali1688PluginAssignmentView,
  ProductSelectionSourceCollection
} from '../../source-collection/types'
import {
  buildSourceCollectionAli1688View,
  canCreateAli1688PluginAssignment,
  resolveAli1688FieldRestriction,
  resolveAli1688GatewayBanner,
  resolveAli1688PluginStatusLabel,
  type Ali1688FieldRestriction
} from '../../source-collection/ali1688'
import { createAli1688PluginAssignment } from '../../source-collection/api'

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

const INLINE_ALI1688_STYLE = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minWidth: 0,
  width: '100%'
} as const

const INLINE_ALI1688_METRICS_STYLE = {
  display: 'grid',
  gap: 8,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))'
} as const

const INLINE_ALI1688_MESSAGE_STYLE = {
  display: 'block',
  fontSize: 12,
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
} as const

export function buildManualSelectionAli1688View(record: ProductSelectionSourceCollection): Ali1688CollectionView {
  return buildSourceCollectionAli1688View(record)
}

export function ManualSelectionAli1688InlineStatus({ record }: { record: ProductSelectionSourceCollection }) {
  const view = buildManualSelectionAli1688View(record)
  const meta = ALI_1688_STATUS_META[view.status]
  const gatewayBanner = resolveAli1688GatewayBanner(view)
  const inlineMessage = gatewayBanner?.message || view.message || ''
  const inlineMessageType = gatewayBanner ? 'warning' : view.status === 'failed' ? 'danger' : 'secondary'
  return (
    <div style={INLINE_ALI1688_STYLE}>
      <Space wrap size={[6, 4]}>
        <Tag color={meta.color}>{meta.label}</Tag>
        {view.searchMode ? <Tag color="blue">{view.searchMode}</Tag> : null}
        {view.progressPercent != null ? <Tag>{view.progressPercent}%</Tag> : null}
      </Space>
      <div style={INLINE_ALI1688_METRICS_STYLE}>
        <MiniMetric label="候选" value={String(view.candidateCount ?? 0)} />
        <MiniMetric label="推荐" value={String(view.recommendedCount ?? 0)} />
      </div>
      {inlineMessage ? (
        <Tooltip title={inlineMessage}>
          <Text type={inlineMessageType} style={INLINE_ALI1688_MESSAGE_STYLE}>
            {inlineMessage}
          </Text>
        </Tooltip>
      ) : null}
    </div>
  )
}

export function ManualSelectionAli1688DetailPanel({ record }: { record: ProductSelectionSourceCollection }) {
  const view = buildManualSelectionAli1688View(record)
  const meta = ALI_1688_STATUS_META[view.status]
  const candidates = view.candidates || []
  const detailBlocked = view.detailCompletionStatus === 'blocked_by_captcha'
  const gatewayBanner = resolveAli1688GatewayBanner(view)
  const fieldRestriction = resolveAli1688FieldRestriction(view)
  const taskId = view.taskId || view.id
  const [pluginAssignment, setPluginAssignment] = useState<Ali1688PluginAssignmentView | undefined>(view.pluginAssignment)
  const [creatingPluginAssignment, setCreatingPluginAssignment] = useState(false)
  const canCreatePluginAssignment = canCreateAli1688PluginAssignment(view, taskId)

  const handleCreatePluginAssignment = async () => {
    if (!taskId) {
      message.warning('缺少1688任务ID，无法创建插件任务。')
      return
    }
    setCreatingPluginAssignment(true)
    try {
      const assignment = await createAli1688PluginAssignment(taskId)
      setPluginAssignment(assignment)
      message.success('已创建插件采集任务。')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '创建插件采集任务失败')
    } finally {
      setCreatingPluginAssignment(false)
    }
  }

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

      {gatewayBanner ? (
        <Alert
          showIcon
          type="warning"
          message={gatewayBanner.message}
          description={gatewayBanner.description}
        />
      ) : null}

      {detailBlocked ? (
        <Alert
          showIcon
          type="warning"
          message="部分详情字段因 1688 详情页受限待补充"
          description={view.detailCompletionMessage || '候选商品已保留，价格、起订和发货地等待详情页恢复后补充。'}
        />
      ) : null}

      {pluginAssignment || canCreatePluginAssignment ? (
        <div className="manual-selection-ali1688-plugin">
          <div className="manual-selection-ali1688-plugin-head">
            <strong>{resolveAli1688PluginStatusLabel(pluginAssignment?.status)}</strong>
            {canCreatePluginAssignment ? (
              <Button
                size="small"
                type="primary"
                loading={creatingPluginAssignment}
                onClick={() => void handleCreatePluginAssignment()}
              >
                用浏览器插件采集
              </Button>
            ) : null}
          </div>
          <div className="manual-selection-ali1688-plugin-grid">
            {pluginAssignment?.assignmentCode ? (
              <div>
                <span>插件任务码</span>
                <strong>{pluginAssignment.assignmentCode}</strong>
              </div>
            ) : null}
            {pluginAssignment?.assignmentId ? (
              <div>
                <span>任务ID</span>
                <strong>任务ID {pluginAssignment.assignmentId}</strong>
              </div>
            ) : null}
            {pluginAssignment?.expiresAt ? (
              <div>
                <span>过期时间</span>
                <strong>{pluginAssignment.expiresAt}</strong>
              </div>
            ) : null}
          </div>
          <Text type="secondary">
            请先登录插件。任务码只用于定位任务，插件仍需使用 Nuono 系统账号登录后提交候选。
          </Text>
          {pluginAssignment?.message ? <Text type="secondary">{pluginAssignment.message}</Text> : null}
        </div>
      ) : null}

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
            const missingDetailText = resolveMissingDetailText(fieldRestriction, '价格待解析')
            const missingMoqText = resolveMissingDetailText(fieldRestriction, '起订量待解析')
            const missingLocationText = resolveMissingDetailText(fieldRestriction, '地区待解析')
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
                    <span>{candidate.priceText || missingDetailText}</span>
                    <span>{candidate.moqText || missingMoqText}</span>
                    <span>{candidate.locationText || missingLocationText}</span>
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

function resolveMissingDetailText(restriction: Ali1688FieldRestriction | undefined, fallback: string) {
  if (restriction === 'detail_blocked') {
    return '详情页受限 / 待补充'
  }
  if (restriction === 'gateway_blocked' || restriction === 'plugin_assisted') {
    return '待补充'
  }
  return fallback
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ alignItems: 'baseline', display: 'flex', gap: 4, minWidth: 0 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
      <Text strong style={{ fontSize: 14 }}>{value}</Text>
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
