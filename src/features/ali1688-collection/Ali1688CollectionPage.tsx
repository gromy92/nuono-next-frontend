import {
  LeftOutlined,
  LinkOutlined,
  RightOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { Alert, Button, Empty, Input, Progress, Segmented, Select, Spin, Tag, Typography, message } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  Ali1688CandidateGateState,
  Ali1688CandidateLevel,
  Ali1688CandidatePreview,
  Ali1688CollectionStatus,
  Ali1688CollectionView,
  Ali1688PluginAssignmentView,
  ProductSelectionSourceCollection
} from '../source-collection/types'
import {
  buildSourceCollectionAli1688View,
  canCreateAli1688PluginAssignment,
  resolveAli1688FieldRestriction,
  resolveAli1688GatewayBanner,
  resolveAli1688PluginStatusLabel,
  type Ali1688FieldRestriction
} from '../source-collection/ali1688'
import {
  createAli1688PluginAssignment,
  loadAli1688Collections,
  recollectAli1688Collection,
  retryAli1688Collection
} from '../source-collection/api'
import { inquiryStatusMeta } from '../procurement-confirmation/statusMeta'
import type { ProcurementInquiryStatus } from '../procurement-confirmation/types'
import './Ali1688CollectionPage.css'

const { Paragraph, Text } = Typography

type Ali1688TaskFilter = 'all' | 'collecting' | 'review' | 'ready' | 'exception'
type Ali1688CandidateGateFilter = 'all' | 'ai' | 'mismatch' | 'spec' | 'pricePending' | 'priceFailed' | 'eligible'

type Ali1688Task = {
  record: ProductSelectionSourceCollection
  view: Ali1688CollectionView
  group: Exclude<Ali1688TaskFilter, 'all'>
  progress: number
  recommendedCount: number
  candidateCount: number
}

type StatusMeta = {
  label: string
  color: string
  tone: 'neutral' | 'blue' | 'green' | 'orange' | 'red'
}

type ProcurementStageMeta = {
  status: ProcurementInquiryStatus | 'PRICE_CONFIRMATION_REQUIRED' | Ali1688CandidateGateState
  label: string
  color: string
  description: string
}

type CandidateScoreBreakdown = {
  matchScore?: number
  specScore?: number
  priceScore?: number
  moqScore?: number
  supplierScore?: number
  deliveryScore?: number
}

type CandidateScoring = {
  label: '综合分' | '规则分' | '待评分'
  totalScore?: number
  breakdown: CandidateScoreBreakdown
}

type Ali1688CollectionPageProps = {
  storeName: string
  storeCode?: string
  operatorName?: string
  operatorUserId?: number
}

const STATUS_META: Record<Ali1688CollectionStatus, StatusMeta> = {
  not_started: { label: '未开始', color: 'default', tone: 'neutral' },
  queued: { label: '排队中', color: 'blue', tone: 'blue' },
  running: { label: '采集中', color: 'processing', tone: 'blue' },
  success: { label: '采集成功', color: 'success', tone: 'green' },
  partial_success: { label: '部分成功', color: 'warning', tone: 'orange' },
  failed: { label: '采集失败', color: 'error', tone: 'red' }
}

const CANDIDATE_LEVEL_META: Record<Ali1688CandidateLevel, StatusMeta> = {
  recommended: { label: '推荐', color: 'success', tone: 'green' },
  review: { label: '待确认', color: 'warning', tone: 'orange' },
  reject: { label: '淘汰', color: 'default', tone: 'neutral' }
}

const CANDIDATE_GATE_FILTER_LABELS: Record<Ali1688CandidateGateFilter, string> = {
  all: '全部',
  ai: '待AI',
  mismatch: '低匹配',
  spec: '规格确认',
  pricePending: '待取价',
  priceFailed: '价格异常',
  eligible: '可询盘'
}

const CANDIDATE_GATE_COLORS: Record<string, string> = {
  ai_pending: 'default',
  ai_failed: 'error',
  mismatch_rejected: 'error',
  spec_uncertain: 'warning',
  price_probe_pending: 'warning',
  price_probe_failed: 'error',
  price_confirmed: 'blue',
  inquiry_eligible: 'success'
}

const PROCUREMENT_STAGE_LABELS: Record<ProcurementInquiryStatus, string> = {
  BACKUP_POOL: '待入Top5',
  IN_POOL_WAITING_SEND: '待自动询盘',
  IN_POOL_WAITING_REPLY: '自动询盘中',
  FOLLOW_UP_1_SENT: '沟通中',
  FOLLOW_UP_2_SENT: '沟通中',
  FOLLOW_UP_3_SENT: '沟通中',
  REPLIED: '已回复',
  PARTIAL_REPLY: '回复不完整',
  NO_REPLY_HANDOFF: '无回复转人工',
  SEND_FAILED: '发送失败',
  REPLY_PARSE_FAILED: '解析失败',
  REMOVED_TERMINATED: '已终止',
  CLOSED: '已收口'
}

const PROCUREMENT_STAGE_DESCRIPTIONS: Record<ProcurementInquiryStatus, string> = {
  BACKUP_POOL: '等待进入待选池',
  IN_POOL_WAITING_SEND: '等待发送询盘',
  IN_POOL_WAITING_REPLY: '询盘已发送，等待回复',
  FOLLOW_UP_1_SENT: '已催发 1 次',
  FOLLOW_UP_2_SENT: '已催发 2 次',
  FOLLOW_UP_3_SENT: '已催发 3 次',
  REPLIED: '供应商已回复',
  PARTIAL_REPLY: '报价字段待补齐',
  NO_REPLY_HANDOFF: '24小时无回复',
  SEND_FAILED: '需人工查看发送链路',
  REPLY_PARSE_FAILED: '需人工确认回复内容',
  REMOVED_TERMINATED: '已移出待选池',
  CLOSED: '自动询盘已收口'
}

const SCORE_BREAKDOWN_ITEMS: Array<{
  key: keyof CandidateScoreBreakdown
  label: string
  max: number
}> = [
  { key: 'matchScore', label: '匹配', max: 35 },
  { key: 'specScore', label: '规格', max: 20 },
  { key: 'priceScore', label: '价格线索', max: 15 },
  { key: 'moqScore', label: 'MOQ', max: 10 },
  { key: 'supplierScore', label: '供应商', max: 12 },
  { key: 'deliveryScore', label: '物流', max: 8 }
]

const TASK_FILTER_LABELS: Record<Ali1688TaskFilter, string> = {
  all: '全部',
  collecting: '待接入',
  review: '待确认',
  ready: 'Top5',
  exception: '异常'
}

const PROCUREMENT_PENDING_SLOT_COUNT = 5

export function Ali1688CollectionPage(props: Ali1688CollectionPageProps) {
  const { storeName, storeCode, operatorUserId } = props
  const [records, setRecords] = useState<ProductSelectionSourceCollection[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string>()
  const [searchText, setSearchText] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [taskFilter, setTaskFilter] = useState<Ali1688TaskFilter>('all')
  const [actionKey, setActionKey] = useState<string>()
  const [pluginAssignments, setPluginAssignments] = useState<Record<string, Ali1688PluginAssignmentView>>({})

  const loadCollections = useCallback(async () => {
    setLoading(true)
    try {
      setRecords(await loadAli1688Collections(storeName, storeCode, operatorUserId))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取1688查询记录失败')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [operatorUserId, storeCode, storeName])

  useEffect(() => {
    void loadCollections()
  }, [loadCollections])

  const tasks = useMemo(
    () => records.map((record) => buildAli1688Task(record)).sort(sortAli1688Tasks),
    [records]
  )

  const sourceOptions = useMemo(() => {
    const platforms = Array.from(new Set(tasks.map((task) => task.record.sourcePlatform).filter(Boolean)))
    return [
      { label: '全部来源', value: 'all' },
      ...platforms.map((platform) => ({ label: platform, value: platform }))
    ]
  }, [tasks])

  const filteredTasks = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()
    return tasks.filter((task) => {
      if (taskFilter !== 'all' && task.group !== taskFilter) {
        return false
      }
      if (sourceFilter !== 'all' && task.record.sourcePlatform !== sourceFilter) {
        return false
      }
      if (!keyword) {
        return true
      }
      const haystack = [
        task.record.collectionNo,
        task.record.sourceTitle,
        task.record.sourceTitleCn,
        task.record.selectedText,
        task.view.message,
        ...(task.view.candidates || []).flatMap((candidate) => [
          candidate.title,
          candidate.supplierName,
          candidate.locationText
        ])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(keyword)
    })
  }, [searchText, sourceFilter, taskFilter, tasks])

  useEffect(() => {
    if (!filteredTasks.length) {
      setSelectedTaskId(undefined)
      return
    }
    if (!selectedTaskId || !filteredTasks.some((task) => task.record.id === selectedTaskId)) {
      setSelectedTaskId(filteredTasks[0].record.id)
    }
  }, [filteredTasks, selectedTaskId])

  useEffect(() => {
    if (!tasks.some((task) => task.view.status === 'running' || task.view.status === 'queued')) {
      return undefined
    }
    const timer = window.setInterval(() => {
      void loadCollections()
    }, 5000)
    return () => window.clearInterval(timer)
  }, [loadCollections, tasks])

  const selectedTask = filteredTasks.find((task) => task.record.id === selectedTaskId) || filteredTasks[0]

  const handleRecollectTask = useCallback(async (task: Ali1688Task) => {
    const sourceCollectionId = getSourceCollectionId(task)
    if (!sourceCollectionId) {
      message.warning('缺少源头采集ID，无法重跑。')
      return
    }
    setActionKey(`recollect:${sourceCollectionId}`)
    try {
      await recollectAli1688Collection(sourceCollectionId)
      message.success('已重新发起1688采集。')
      await loadCollections()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '重新发起1688采集失败')
    } finally {
      setActionKey(undefined)
    }
  }, [loadCollections])

  const handleRetryTask = useCallback(async (task: Ali1688Task) => {
    const taskId = getTaskId(task)
    if (!taskId) {
      message.warning('缺少1688任务ID，无法重试。')
      return
    }
    setActionKey(`retry:${taskId}`)
    try {
      await retryAli1688Collection(taskId)
      message.success('已提交1688任务重试。')
      await loadCollections()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '1688任务重试失败')
    } finally {
      setActionKey(undefined)
    }
  }, [loadCollections])

  const handleCreatePluginAssignment = useCallback(async (task: Ali1688Task) => {
    const taskId = getTaskId(task)
    if (!taskId) {
      message.warning('缺少1688任务ID，无法创建插件任务。')
      return
    }
    setActionKey(`plugin:${taskId}`)
    try {
      const assignment = await createAli1688PluginAssignment(taskId)
      setPluginAssignments((current) => ({
        ...current,
        [taskId]: assignment
      }))
      message.success('已创建插件采集任务。')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '创建插件采集任务失败')
    } finally {
      setActionKey(undefined)
    }
  }, [])

  const filterOptions = (Object.keys(TASK_FILTER_LABELS) as Ali1688TaskFilter[]).map((key) => ({
    label: `${TASK_FILTER_LABELS[key]} ${key === 'all' ? tasks.length : tasks.filter((task) => task.group === key).length}`,
    value: key
  }))

  return (
    <div className="ali1688-workbench" data-testid="ali1688-collection-page">
      <div className="ali1688-toolbar">
        <Segmented
          className="ali1688-task-filter"
          options={filterOptions}
          value={taskFilter}
          onChange={(value) => setTaskFilter(value as Ali1688TaskFilter)}
        />
        <Input
          allowClear
          className="ali1688-search"
          placeholder="搜索商品、候选、供应商"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
        <Select
          className="ali1688-source-select"
          options={sourceOptions}
          value={sourceFilter}
          onChange={setSourceFilter}
        />
        <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void loadCollections()}>
          刷新
        </Button>
      </div>

      <Spin spinning={loading && !tasks.length}>
        <div className="ali1688-workspace">
          <aside className="ali1688-task-queue" data-testid="ali1688-task-queue">
            {filteredTasks.length ? (
              filteredTasks.map((task) => (
                <TaskCard
                  key={task.record.id}
                  task={task}
                  active={task.record.id === selectedTask?.record.id}
                  onClick={() => setSelectedTaskId(task.record.id)}
                />
              ))
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无1688查询记录" />
            )}
          </aside>

          <main className="ali1688-detail" data-testid="ali1688-task-detail">
            {selectedTask ? (
              <TaskDetail
                task={selectedTask}
                actionKey={actionKey}
                pluginAssignment={pluginAssignments[getTaskId(selectedTask) || '']}
                onRecollect={handleRecollectTask}
                onRetry={handleRetryTask}
                onCreatePluginAssignment={handleCreatePluginAssignment}
              />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请选择查询记录" />
            )}
          </main>
        </div>
      </Spin>
    </div>
  )
}

function TaskCard(props: {
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

function TaskDetail(props: {
  task: Ali1688Task
  actionKey?: string
  pluginAssignment?: Ali1688PluginAssignmentView
  onRecollect: (task: Ali1688Task) => void
  onRetry: (task: Ali1688Task) => void
  onCreatePluginAssignment: (task: Ali1688Task) => void
}) {
  const { task } = props
  const { record, view } = task
  const candidates = view.candidates || []
  const [candidateGateFilter, setCandidateGateFilter] = useState<Ali1688CandidateGateFilter>('all')
  const primaryImage = record.sourceImageUrl || record.imageUrls?.[0]
  const pendingSlotCount = resolvePendingSlotCount(view, candidates.length)
  const taskId = getTaskId(task)
  const sourceCollectionId = getSourceCollectionId(task)
  const canRetry = view.status === 'failed' && Boolean(taskId)
  const canRecollect = view.status !== 'queued' && view.status !== 'running' && Boolean(sourceCollectionId)
  const pluginAssignment = props.pluginAssignment || view.pluginAssignment
  const canCreatePluginAssignment = canCreateAli1688PluginAssignment(view, taskId)
  const detailBlocked = view.detailCompletionStatus === 'blocked_by_captcha'
  const gatewayBanner = resolveAli1688GatewayBanner(view)
  const fieldRestriction = resolveAli1688FieldRestriction(view)
  const hasGate = candidates.some((candidate) => Boolean(candidate.gate?.state))
  const candidateGateFilterOptions = buildCandidateGateFilterOptions(candidates)
  const filteredCandidates = filterCandidatesByGate(candidates, candidateGateFilter)

  return (
    <>
      <section className="ali1688-candidate-section">
        <div className="ali1688-section-head">
          <div>
            <h3>待选商品</h3>
            <span>
              {pendingSlotCount
                ? `查询过程中预留 ${pendingSlotCount} 个待选位`
                : buildCandidatePoolSummary(view, candidates)}
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
            {canCreatePluginAssignment ? (
              <Button
                size="small"
                type="primary"
                loading={props.actionKey === `plugin:${taskId}`}
                onClick={() => props.onCreatePluginAssignment(task)}
              >
                用浏览器插件采集
              </Button>
            ) : null}
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
          <PluginAssignmentPanel assignment={pluginAssignment} />
        ) : null}

        {hasGate ? (
          <Segmented
            className="ali1688-candidate-gate-filter"
            data-testid="ali1688-candidate-gate-filter"
            options={candidateGateFilterOptions}
            value={candidateGateFilter}
            onChange={(value) => setCandidateGateFilter(value as Ali1688CandidateGateFilter)}
          />
        ) : null}

        {candidates.length ? (
          <div className="ali1688-candidate-grid">
            {filteredCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                fallbackImage={primaryImage}
                fieldRestriction={fieldRestriction}
              />
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
    </>
  )
}

function PendingCandidateSlots(props: { count: number; status: Ali1688CollectionStatus }) {
  return (
    <div className="ali1688-pending-grid" data-testid="ali1688-pending-slots">
      {Array.from({ length: props.count }, (_, index) => {
        const stage = resolvePendingSlotStage(props.status, index)
        return (
          <div key={`pending-slot-${index + 1}`} className="ali1688-pending-slot">
            <div className="ali1688-pending-slot-head">
              <span>#{index + 1}</span>
              <Tag>待选位</Tag>
            </div>
            <strong>待选位 {index + 1}</strong>
            <CandidateStageLine stage={stage} />
            <Text type="secondary">真实待选回写后同步当前阶段</Text>
          </div>
        )
      })}
    </div>
  )
}

function CandidateCard(props: {
  candidate: Ali1688CandidatePreview
  fallbackImage?: string
  fieldRestriction?: Ali1688FieldRestriction
}) {
  const { candidate } = props
  const levelMeta = CANDIDATE_LEVEL_META[candidate.level]
  const stage = resolveCandidateStage(candidate)
  const scoring = resolveCandidateScoring(candidate)
  const images = buildCandidateImages(candidate, props.fallbackImage)
  const missingDetailText = resolveMissingDetailText(props.fieldRestriction, '待解析')
  const missingLocationText = resolveMissingDetailText(props.fieldRestriction, '地区待解析')
  const priceDisplay = resolveCandidatePriceDisplay(candidate, missingDetailText)
  return (
    <article className={`ali1688-candidate-card is-${levelMeta.tone}`}>
      <CandidateImageCarousel title={candidate.title} rankNo={candidate.rankNo} images={images} />
      <div className="ali1688-candidate-body">
        <div className="ali1688-candidate-topline">
          <div className="ali1688-candidate-tags">
            <Tag color={levelMeta.color}>{levelMeta.label}</Tag>
            <Text type="secondary">{candidate.locationText || missingLocationText}</Text>
          </div>
          <ScoreBadge score={scoring.totalScore} label={scoring.label} />
        </div>
        <Paragraph ellipsis={{ rows: 2 }} className="ali1688-candidate-title">
          {candidate.title}
        </Paragraph>
        <div className="ali1688-candidate-supplier">{candidate.supplierName}</div>
        <CandidateStageLine stage={stage} />
        <div className="ali1688-candidate-price-line">
          <span>{priceDisplay.label} {priceDisplay.text}</span>
          {priceDisplay.badge ? <Tag className="ali1688-price-state-tag">{priceDisplay.badge}</Tag> : null}
          <span>起订 {candidate.moqText || missingDetailText}</span>
        </div>
        <ScoreBreakdownPanel scoring={scoring} />
        <div className="ali1688-candidate-actions">
          <Button size="small" icon={<LinkOutlined />} onClick={() => openUrl(candidate.candidateUrl)}>
            打开1688
          </Button>
        </div>
      </div>
    </article>
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

function PluginAssignmentPanel(props: { assignment?: Ali1688PluginAssignmentView }) {
  const { assignment } = props
  return (
    <div className="ali1688-plugin-assignment" data-testid="ali1688-plugin-assignment-panel">
      <div className="ali1688-plugin-assignment-head">
        <strong>{resolveAli1688PluginStatusLabel(assignment?.status)}</strong>
        {assignment?.status ? <Tag color={pluginAssignmentStatusColor(assignment.status)}>{assignment.status}</Tag> : null}
      </div>
      <div className="ali1688-plugin-assignment-grid">
        {assignment?.assignmentCode ? (
          <div>
            <span>插件任务码</span>
            <strong>{assignment.assignmentCode}</strong>
          </div>
        ) : null}
        {assignment?.assignmentId ? (
          <div>
            <span>任务ID</span>
            <strong>任务ID {assignment.assignmentId}</strong>
          </div>
        ) : null}
        {assignment?.expiresAt ? (
          <div>
            <span>过期时间</span>
            <strong>{assignment.expiresAt}</strong>
          </div>
        ) : null}
      </div>
      <Text type="secondary">
        请先登录插件。任务码只用于定位任务，插件仍需使用 Nuono 系统账号登录后提交候选。
      </Text>
      {assignment?.message ? <Text type="secondary">{assignment.message}</Text> : null}
      {assignment?.failureMessage ? <Text type="danger">{assignment.failureMessage}</Text> : null}
    </div>
  )
}

function pluginAssignmentStatusColor(status?: string) {
  if (status === 'accepted') {
    return 'success'
  }
  if (status === 'failed' || status === 'expired' || status === 'cancelled') {
    return 'error'
  }
  if (status === 'running') {
    return 'processing'
  }
  return 'blue'
}

function CandidateImageCarousel(props: { title: string; rankNo: number; images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set())
  const imageKey = props.images.join('\n')
  const visibleImages = props.images.filter((image) => !failedImages.has(image))
  const safeIndex = visibleImages.length ? Math.min(currentIndex, visibleImages.length - 1) : 0
  const activeImage = visibleImages[safeIndex]

  useEffect(() => {
    setCurrentIndex(0)
    setFailedImages(new Set())
  }, [imageKey])

  const goPrevious = () => {
    setCurrentIndex((current) => (current === 0 ? visibleImages.length - 1 : current - 1))
  }
  const goNext = () => {
    setCurrentIndex((current) => (current + 1) % visibleImages.length)
  }
  const markActiveImageFailed = () => {
    if (!activeImage) {
      return
    }
    setFailedImages((current) => {
      if (current.has(activeImage)) {
        return current
      }
      const next = new Set(current)
      next.add(activeImage)
      return next
    })
    setCurrentIndex(0)
  }

  return (
    <div className="ali1688-candidate-carousel">
      {activeImage ? (
        <img
          src={buildDisplayCandidateImageUrl(activeImage)}
          alt={`${props.title} ${safeIndex + 1}`}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={markActiveImageFailed}
        />
      ) : (
        <div className="ali1688-image-placeholder">NO IMAGE</div>
      )}
      <span className="ali1688-candidate-rank">#{props.rankNo}</span>
      {visibleImages.length > 1 ? (
        <>
          <button type="button" className="ali1688-carousel-arrow is-left" aria-label="上一张" onClick={goPrevious}>
            <LeftOutlined />
          </button>
          <button type="button" className="ali1688-carousel-arrow is-right" aria-label="下一张" onClick={goNext}>
            <RightOutlined />
          </button>
          <div className="ali1688-carousel-dots" aria-label={`${visibleImages.length} 张图片`}>
            {visibleImages.map((image, index) => (
              <i key={`${image}-${index}`} className={index === safeIndex ? 'is-active' : undefined} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

function buildDisplayCandidateImageUrl(imageUrl: string) {
  if (!/alicdn\.com/i.test(imageUrl)) {
    return imageUrl
  }

  return `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}nuono_img=1`
}

function ScoreBadge(props: { score?: number; label: CandidateScoring['label'] }) {
  const score = props.score
  const tone = score == null ? 'neutral' : score >= 80 ? 'green' : score >= 65 ? 'orange' : 'neutral'
  return (
    <div className={`ali1688-score-badge is-${tone}`} aria-label={`${props.label} ${score ?? '待评分'}`}>
      <span>{props.label}</span>
      <strong>{score ?? '-'}</strong>
    </div>
  )
}

function ScoreBreakdownPanel(props: { scoring: CandidateScoring }) {
  return (
    <div className="ali1688-score-panel">
      <div className="ali1688-score-panel-title">分项评分</div>
      <div className="ali1688-score-breakdown">
        {SCORE_BREAKDOWN_ITEMS.map((item) => {
          const value = props.scoring.breakdown[item.key]
          const width = value == null ? 0 : Math.min(Math.max(value / item.max, 0), 1) * 100
          return (
            <div key={item.key} className="ali1688-score-row">
              <span>{item.label}</span>
              <div className="ali1688-score-track">
                <i style={{ width: `${width}%` }} />
              </div>
              <strong>
                {value == null ? '待评分' : `${value}/${item.max}`}
              </strong>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CandidateStageLine(props: { stage: ProcurementStageMeta }) {
  return (
    <div className="ali1688-card-stage">
      <span>当前阶段</span>
      <Tag color={props.stage.color}>{props.stage.label}</Tag>
      <span className="ali1688-card-stage-note">{props.stage.description}</span>
    </div>
  )
}

function buildAli1688Task(record: ProductSelectionSourceCollection): Ali1688Task {
  const view = buildSourceCollectionAli1688View(record)
  const candidateCount = view.candidateCount ?? view.candidates?.length ?? 0
  const recommendedCount =
    view.recommendedCount ?? view.candidates?.filter((candidate) => candidate.level === 'recommended').length ?? 0
  const progress = normalizeProgress(view)

  return {
    record,
    view,
    group: resolveTaskGroup(view),
    progress,
    recommendedCount,
    candidateCount
  }
}

function getTaskId(task: Ali1688Task) {
  return task.view.taskId || task.view.id
}

function getSourceCollectionId(task: Ali1688Task) {
  return task.view.sourceCollectionId || task.record.id
}

function resolveTaskGroup(view: Ali1688CollectionView): Exclude<Ali1688TaskFilter, 'all'> {
  if (view.status === 'failed') {
    return 'exception'
  }
  if (view.status === 'queued' || view.status === 'running' || view.status === 'not_started') {
    return 'collecting'
  }
  if ((view.candidates || []).some((candidate) => candidate.selectedRankNo != null || candidate.level === 'recommended')) {
    return 'ready'
  }
  return 'review'
}

function resolvePendingSlotCount(view: Ali1688CollectionView, candidateCount: number) {
  if (candidateCount > 0) {
    return 0
  }
  return view.status === 'queued' || view.status === 'running' ? PROCUREMENT_PENDING_SLOT_COUNT : 0
}

function resolvePendingSlotStage(_status: Ali1688CollectionStatus, _index: number): ProcurementStageMeta {
  return getProcurementStageMeta('BACKUP_POOL')
}

function resolveCandidateStage(candidate: Ali1688CandidatePreview): ProcurementStageMeta {
  if (candidate.gate?.state) {
    return getCandidateGateStageMeta(
      candidate.gate.state,
      candidate.gate.label,
      candidate.inquiryEligibility?.reason || candidate.gate.reason
    )
  }
  const candidateWithStage = candidate as Ali1688CandidatePreview & {
    inquiryStatus?: string
    procurementInquiryStatus?: string
    poolInquiryStatus?: string
  }
  const explicitStatus = [
    candidateWithStage.inquiryStatus,
    candidateWithStage.procurementInquiryStatus,
    candidateWithStage.poolInquiryStatus
  ].find(isProcurementInquiryStatus)

  if (
    candidateWithStage.procurementInquiryStatus === 'PRICE_CONFIRMATION_REQUIRED'
    || candidate.priceState === 'list_hint_only'
    || candidate.autoInquiryEligible === false
  ) {
    return getPriceConfirmationRequiredStageMeta()
  }
  if (explicitStatus) {
    return getProcurementStageMeta(explicitStatus)
  }
  if (candidate.level === 'reject') {
    return getProcurementStageMeta('REMOVED_TERMINATED')
  }
  if (candidate.selectedRankNo != null || candidate.level === 'recommended') {
    return getProcurementStageMeta('IN_POOL_WAITING_SEND')
  }
  return getProcurementStageMeta('BACKUP_POOL')
}

function buildCandidatePoolSummary(view: Ali1688CollectionView, candidates: Ali1688CandidatePreview[]) {
  const candidateCount = view.candidateCount ?? candidates.length
  const recommendedCount = view.recommendedCount ?? 0
  if (view.inquiryEligibleCount == null && view.inquiryBlockedCount == null) {
    return `共 ${candidateCount} 个，推荐 ${recommendedCount} 个`
  }
  const eligibleCount = view.inquiryEligibleCount ?? candidates.filter((candidate) => candidate.autoInquiryEligible).length
  const blockedCount = view.inquiryBlockedCount ?? Math.max(0, candidateCount - eligibleCount)
  return `共 ${candidateCount} 个，推荐 ${recommendedCount} 个，可询盘池 ${eligibleCount} 个，待复核 ${blockedCount} 个`
}

function buildCandidateGateFilterOptions(candidates: Ali1688CandidatePreview[]) {
  const counts: Record<Ali1688CandidateGateFilter, number> = {
    all: candidates.length,
    ai: 0,
    mismatch: 0,
    spec: 0,
    pricePending: 0,
    priceFailed: 0,
    eligible: 0
  }
  candidates.forEach((candidate) => {
    const filter = resolveCandidateGateFilter(candidate)
    if (filter !== 'all') {
      counts[filter] += 1
    }
  })
  return (Object.keys(CANDIDATE_GATE_FILTER_LABELS) as Ali1688CandidateGateFilter[]).map((key) => ({
    label: `${CANDIDATE_GATE_FILTER_LABELS[key]} ${counts[key]}`,
    value: key
  }))
}

function filterCandidatesByGate(candidates: Ali1688CandidatePreview[], filter: Ali1688CandidateGateFilter) {
  if (filter === 'all') {
    return candidates
  }
  return candidates.filter((candidate) => resolveCandidateGateFilter(candidate) === filter)
}

function resolveCandidateGateFilter(candidate: Ali1688CandidatePreview): Ali1688CandidateGateFilter {
  switch (candidate.gate?.state) {
    case 'ai_pending':
    case 'ai_failed':
      return 'ai'
    case 'mismatch_rejected':
      return 'mismatch'
    case 'spec_uncertain':
      return 'spec'
    case 'price_probe_pending':
    case 'price_confirmed':
      return 'pricePending'
    case 'price_probe_failed':
      return 'priceFailed'
    case 'inquiry_eligible':
      return 'eligible'
    default:
      return 'all'
  }
}

function getCandidateGateStageMeta(
  state: Ali1688CandidateGateState,
  label?: string,
  reason?: string
): ProcurementStageMeta {
  return {
    status: state,
    label: label || CANDIDATE_GATE_FILTER_LABELS[resolveCandidateGateFilterFromState(state)] || '门禁待确认',
    color: CANDIDATE_GATE_COLORS[state] || 'default',
    description: reason || '候选门禁状态待确认。'
  }
}

function resolveCandidateGateFilterFromState(state: Ali1688CandidateGateState): Ali1688CandidateGateFilter {
  switch (state) {
    case 'ai_pending':
    case 'ai_failed':
      return 'ai'
    case 'mismatch_rejected':
      return 'mismatch'
    case 'spec_uncertain':
      return 'spec'
    case 'price_probe_pending':
    case 'price_confirmed':
      return 'pricePending'
    case 'price_probe_failed':
      return 'priceFailed'
    case 'inquiry_eligible':
      return 'eligible'
    default:
      return 'all'
  }
}

function buildCandidateImages(candidate: Ali1688CandidatePreview, fallbackImage?: string) {
  const candidateWithImages = candidate as Ali1688CandidatePreview & {
    imageUrls?: string[]
  }
  const candidateImages = Array.from(new Set([candidate.imageUrl, ...(candidateWithImages.imageUrls || [])].filter(Boolean) as string[]))

  if (candidateImages.length) {
    return candidateImages
  }

  return fallbackImage ? [fallbackImage] : []
}

function resolveCandidatePriceDisplay(candidate: Ali1688CandidatePreview, fallback: string) {
  if (candidate.priceState === 'price_confirmed' && candidate.confirmedPriceText) {
    return {
      label: '确认采购价',
      text: candidate.confirmedPriceText,
      badge: undefined
    }
  }
  return {
    label: '价格线索',
    text: candidate.listPriceHintText || candidate.priceText || fallback,
    badge: candidate.listPriceHintText || candidate.priceText ? '非真实采购价' : undefined
  }
}

function resolveCandidateScoring(candidate: Ali1688CandidatePreview): CandidateScoring {
  const breakdown = candidate.scoreBreakdown || {}
  if (candidate.totalScore != null && candidate.scoreStatus === 'final') {
    return {
      label: '综合分',
      totalScore: candidate.totalScore,
      breakdown
    }
  }
  if (candidate.ruleScore != null) {
    return {
      label: '规则分',
      totalScore: candidate.ruleScore,
      breakdown
    }
  }
  return {
    label: '待评分',
    breakdown
  }
}

function getPriceConfirmationRequiredStageMeta(): ProcurementStageMeta {
  return {
    status: 'PRICE_CONFIRMATION_REQUIRED',
    label: '待真实价格',
    color: 'warning',
    description: '需真实价格确认后才可自动询盘'
  }
}

function getProcurementStageMeta(status: ProcurementInquiryStatus): ProcurementStageMeta {
  const meta = inquiryStatusMeta[status]
  return {
    status,
    label: PROCUREMENT_STAGE_LABELS[status] || meta.label,
    color: meta.color,
    description: PROCUREMENT_STAGE_DESCRIPTIONS[status] || meta.description
  }
}

function isProcurementInquiryStatus(status?: string): status is ProcurementInquiryStatus {
  return Boolean(status && Object.prototype.hasOwnProperty.call(inquiryStatusMeta, status))
}

function normalizeProgress(view: Ali1688CollectionView) {
  if (view.progressPercent != null) {
    return Math.min(Math.max(view.progressPercent, 0), 100)
  }
  if (view.status === 'success' || view.status === 'partial_success') {
    return 100
  }
  if (view.status === 'queued') {
    return 12
  }
  if (view.status === 'running') {
    return 48
  }
  return 0
}

function sortAli1688Tasks(first: Ali1688Task, second: Ali1688Task) {
  const groupWeight: Record<Ali1688Task['group'], number> = {
    ready: 1,
    review: 2,
    collecting: 3,
    exception: 4
  }
  if (groupWeight[first.group] !== groupWeight[second.group]) {
    return groupWeight[first.group] - groupWeight[second.group]
  }
  return (second.record.collectedAt || '').localeCompare(first.record.collectedAt || '')
}

function openUrl(url?: string) {
  if (!url) {
    message.info('暂无可打开的链接。')
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}
