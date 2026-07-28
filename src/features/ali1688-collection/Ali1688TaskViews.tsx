import { ReloadOutlined } from '@ant-design/icons'
import { Button, Empty, Progress, Tag, Typography } from 'antd'
import type { Ali1688CollectionStatus } from '../source-collection/types'
import { resolvePendingSlotStage } from './ali1688CandidateModel'
import { CandidateCard, CandidateStageLine } from './Ali1688CandidateCards'
import {
  getSourceCollectionId,
  getTaskId,
  resolvePendingSlotCount,
  STATUS_META,
  type Ali1688Task
} from './ali1688CollectionModel'

const { Paragraph, Text } = Typography

export function TaskCard(props: {
  task: Ali1688Task
  active: boolean
  onClick: () => void
}) {
  const { record, view, progress, candidateCount, recommendedCount } = props.task
  const statusMeta = STATUS_META[view.status]
  const pendingSlotCount = resolvePendingSlotCount(view, candidateCount)
  return (
    <button
      type="button"
      className={`ali1688-task-card${props.active ? ' is-active' : ''}`}
      onClick={props.onClick}
      aria-label={`查看${record.sourceTitleCn || record.sourceTitle || record.collectionNo}`}
    >
      <div className="ali1688-task-card-head">
        <span className="ali1688-task-source">{record.sourcePlatform}</span>
        <Tag color={statusMeta.color}>{statusMeta.label}</Tag>
      </div>
      <Paragraph ellipsis={{ rows: 2 }} className="ali1688-task-title">
        {record.sourceTitleCn || record.sourceTitle || '未命名源头商品'}
      </Paragraph>
      <div className="ali1688-task-meta">
        <span>{record.collectedBy || '系统'}</span>
        <span>{record.collectedAt || '-'}</span>
      </div>
      <div className="ali1688-task-progress">
        <div>
          <span>进度</span>
          <strong>{progress}%</strong>
        </div>
        <Progress percent={progress} size="small" showInfo={false} />
      </div>
      <div className="ali1688-task-mini-metrics">
        <span>{pendingSlotCount ? `待选 ${pendingSlotCount}` : `候选 ${candidateCount}`}</span>
        <span>{pendingSlotCount ? '推荐 -' : `推荐 ${recommendedCount}`}</span>
      </div>
    </button>
  )
}

export function TaskDetail(props: {
  task: Ali1688Task
  actionKey?: string
  onRecollect: (task: Ali1688Task) => void
  onRetry: (task: Ali1688Task) => void
}) {
  const { task } = props
  const { record, view } = task
  const candidates = view.candidates || []
  const primaryImage = record.sourceImageUrl || record.imageUrls?.[0]
  const pendingSlotCount = resolvePendingSlotCount(view, candidates.length)
  const taskId = getTaskId(task)
  const sourceCollectionId = getSourceCollectionId(task)
  const canRetry = view.status === 'failed' && Boolean(taskId)
  const canRecollect = view.status !== 'queued' && view.status !== 'running' && Boolean(sourceCollectionId)

  return (
    <section className="ali1688-candidate-section">
      <div className="ali1688-section-head">
        <div>
          <h3>待选商品</h3>
          <span>
            {pendingSlotCount
              ? `查询过程中预留 ${pendingSlotCount} 个待选位`
              : `共 ${view.candidateCount ?? candidates.length} 个，推荐 ${view.recommendedCount ?? 0} 个`}
          </span>
        </div>
        <div className="ali1688-task-actions">
          {canRetry ? (
            <Button
              size="small"
              icon={<ReloadOutlined />}
              loading={props.actionKey === `retry:${taskId}`}
              onClick={() => props.onRetry(task)}
            >
              重试
            </Button>
          ) : null}
          {canRecollect ? (
            <Button
              size="small"
              icon={<ReloadOutlined />}
              loading={props.actionKey === `recollect:${sourceCollectionId}`}
              onClick={() => props.onRecollect(task)}
            >
              重跑
            </Button>
          ) : null}
        </div>
      </div>

      {candidates.length ? (
        <div className="ali1688-candidate-grid">
          {candidates.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} fallbackImage={primaryImage} />
          ))}
        </div>
      ) : pendingSlotCount ? (
        <PendingCandidateSlots count={pendingSlotCount} status={view.status} />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={view.status === 'not_started' ? '暂无真实1688候选结果' : '候选商品查询中'}
        />
      )}
    </section>
  )
}

function PendingCandidateSlots(props: { count: number; status: Ali1688CollectionStatus }) {
  return (
    <div className="ali1688-pending-grid" data-testid="ali1688-pending-slots">
      {Array.from({ length: props.count }, (_, index) => (
        <div key={`pending-slot-${index + 1}`} className="ali1688-pending-slot">
          <div className="ali1688-pending-slot-head">
            <span>#{index + 1}</span>
            <Tag>待选位</Tag>
          </div>
          <strong>待选位 {index + 1}</strong>
          <CandidateStageLine stage={resolvePendingSlotStage()} />
          <Text type="secondary">真实待选回写后同步当前阶段</Text>
        </div>
      ))}
    </div>
  )
}
