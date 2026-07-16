import {
  BulbOutlined,
  CalculatorOutlined,
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined,
  RocketOutlined
} from '@ant-design/icons'
import { Button, Empty, Image, Input, InputNumber, Modal, Popconfirm, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import type { ProductSelectionSourceCollection } from '../../source-collection/types'
import { MANUAL_SELECTION_IMAGE_FALLBACK } from '../constants'
import {
  MANUAL_SELECTION_GROUP_DELETE_OPTIONS,
  type ManualSelectionGroupDeleteMode
} from '../manualSelectionDeleteOptions'
import type {
  ManualSelectionAli1688ProcurementInfo,
  ManualSelectionAnalysisProjectView,
  ManualSelectionCompetitor
} from '../types'
import {
  formatManualSelectionCompleteness,
  formatManualSelectionPriceSummary,
  manualSelectionCollectionSourceLabel,
  manualSelectionImageCandidates,
  manualSelectionStatusText,
} from '../utils'

const { Text } = Typography

type Ali1688EditorState = {
  groupId: string
  groupName: string
  purchaseUrl: string
  purchasePrice?: number
}

type GroupNameEditorState = {
  groupId: string
  groupName: string
  draftName: string
}

type ManualSelectionAnalysisPanelProps = {
  analyzingCollectionIds: string[]
  dataSource: ProductSelectionSourceCollection[]
  projects: ManualSelectionAnalysisProjectView[]
  loading?: boolean
  deletingCompetitorIds?: string[]
  deletingGroupIds?: string[]
  recollectingCompetitorIds?: string[]
  onChangeGroupProcurementInfo: (groupId: string, values: Partial<ManualSelectionAli1688ProcurementInfo>) => void
  onChangeGroupName: (groupId: string, groupName: string) => Promise<void> | void
  onDeleteCompetitor: (project: ManualSelectionAnalysisProjectView, competitor: ManualSelectionCompetitor) => void
  onDeleteGroup: (
    project: ManualSelectionAnalysisProjectView,
    mode: ManualSelectionGroupDeleteMode
  ) => Promise<void> | void
  onOpenAiAnalysis: (project: ManualSelectionAnalysisProjectView) => void
  onOpenCompetitorDetail: (project: ManualSelectionAnalysisProjectView, focus: { kind: 'link' | 'collection'; id: string }) => void
  onOpenCompetitors: (project: ManualSelectionAnalysisProjectView) => void
  onOpenListing: (project: ManualSelectionAnalysisProjectView) => void
  onOpenProfitEstimate: (project: ManualSelectionAnalysisProjectView) => void
  onRecollectCompetitor: (project: ManualSelectionAnalysisProjectView, competitor: ManualSelectionCompetitor) => void
}

function ali1688CandidateCount(record: ProductSelectionSourceCollection) {
  return record.ali1688Collection?.candidateCount || record.ali1688Collection?.candidates?.length || 0
}

function recommendedCandidateCount(record: ProductSelectionSourceCollection) {
  return record.ali1688Collection?.recommendedCount
    ?? (record.ali1688Collection?.candidates || []).filter((candidate) => candidate.level === 'recommended').length
}

function sourceImageUrl(record: ProductSelectionSourceCollection) {
  return manualSelectionImageCandidates(record)[0] || MANUAL_SELECTION_IMAGE_FALLBACK
}

function collectionOverviewText(record: ProductSelectionSourceCollection) {
  const priceSummary = formatManualSelectionPriceSummary(record) || '未采集'
  const completeness = formatManualSelectionCompleteness(record).basics.replace('基础信息：', '')
  return `单价 ${priceSummary} 完整度 ${completeness} 平台 ${record.sourcePlatform || '-'} ${manualSelectionCollectionSourceLabel(record)}`
}

function competitorHost(competitor: ManualSelectionCompetitor) {
  if (competitor.fetchedSourceHost) {
    return competitor.fetchedSourceHost
  }
  if (!competitor.url) {
    return ''
  }
  try {
    return new URL(competitor.url).host
  } catch {
    return ''
  }
}

function competitorPlatformLabel(competitor: ManualSelectionCompetitor) {
  const host = competitorHost(competitor).toLowerCase()
  if (host.includes('noon')) {
    return 'Noon'
  }
  if (host.includes('amazon')) {
    return 'Amazon'
  }
  return host.replace(/^www\./, '') || '链接'
}

function competitorPlatformTone(competitor: ManualSelectionCompetitor) {
  const platform = competitorPlatformLabel(competitor).toLowerCase()
  if (platform.includes('noon')) {
    return 'is-noon'
  }
  if (platform.includes('amazon')) {
    return 'is-amazon'
  }
  return 'is-link'
}

function competitorStatusLabel(status?: ManualSelectionCompetitor['fetchStatus']) {
  if (status === 'success') {
    return ''
  }
  if (status === 'failed') {
    return '失败'
  }
  if (status === 'fetching') {
    return '拉取中'
  }
  return '未拉取'
}

function competitorStatusTone(status?: ManualSelectionCompetitor['fetchStatus']) {
  if (status === 'success') {
    return 'is-success'
  }
  if (status === 'failed') {
    return 'is-failed'
  }
  if (status === 'fetching') {
    return 'is-fetching'
  }
  return 'is-pending'
}

function competitorPriceSummary(competitor: ManualSelectionCompetitor) {
  const priceSummary = competitor.fetchedPriceSummary?.trim()
  if (!priceSummary) {
    return '未采集'
  }
  return formatManualSelectionPriceSummary({
    id: competitor.id || '',
    collectionNo: '',
    sourceType: 'marketplace-url',
    sourcePlatform: competitorPlatformLabel(competitor),
    sourceUrl: competitor.url || '',
    pageUrl: competitor.url || '',
    sourceTitle: competitor.fetchedTitle || '',
    sourceImageUrl: '',
    imageUrls: [],
    priceSummary,
    specHints: [],
    status: 'success',
    statusText: '采集成功',
    collectedAt: '',
    collectedBy: '',
    collectedFieldCount: 0,
    imageCount: 0
  } as ProductSelectionSourceCollection) || priceSummary
}

function competitorCompletenessSummary(competitor: ManualSelectionCompetitor) {
  return competitor.fetchedCompleteness || (competitor.fetchStatus === 'success' ? '已拉取' : '未采集')
}

function competitorCollectionSourceSummary(competitor: ManualSelectionCompetitor) {
  return competitor.fetchedCollectionSource || '手动链接'
}

function competitorOverviewText(competitor: ManualSelectionCompetitor) {
  const platform = competitorPlatformLabel(competitor)
  return `单价 ${competitorPriceSummary(competitor)} / 完整度 ${competitorCompletenessSummary(competitor)} / 平台 ${platform} / 来源 ${competitorCollectionSourceSummary(competitor)}`
}

function projectCompetitorCount(project: ManualSelectionAnalysisProjectView) {
  return project.records.length + (project.competitors?.length || 0)
}

function projectCollectionStatusRows(project: ManualSelectionAnalysisProjectView) {
  const records = project.records || []
  const statusLabel = collectionStatusSummaryLabel(records)
  return uniqueTexts([
    statusLabel,
    ...records.map(collectionSourceTypeLabel),
    ...records.map(manualSelectionCollectionSourceLabel)
  ].filter(Boolean))
}

function collectionStatusSummaryLabel(records: ProductSelectionSourceCollection[]) {
  if (records.some((record) => record.status === 'failed')) {
    return '失败'
  }
  if (records.some((record) => record.status === 'running')) {
    return '采集中'
  }
  if (records.length && records.every((record) => record.status === 'success')) {
    return '成功'
  }
  return records[0] ? manualSelectionStatusText(records[0].status) : '未采集'
}

function collectionSourceTypeLabel(record: ProductSelectionSourceCollection) {
  const normalized = (record.sourceType || '').toLowerCase()
  if (normalized.includes('marketplace') || normalized.includes('url')) {
    return '浏览器'
  }
  if (normalized.includes('plugin') || normalized.includes('extension')) {
    return '插件'
  }
  return record.sourceType || ''
}

function collectionStatusColor(label: string) {
  if (label === '成功') {
    return 'green'
  }
  if (label === '失败') {
    return 'red'
  }
  if (label === '采集中') {
    return 'processing'
  }
  return 'default'
}

function uniqueTexts(values: string[]) {
  return values.filter((value, index, list) => value && list.indexOf(value) === index)
}

export function ManualSelectionAnalysisPanel(props: ManualSelectionAnalysisPanelProps) {
  const {
    analyzingCollectionIds,
    dataSource,
    projects,
    loading,
    deletingCompetitorIds = [],
    deletingGroupIds = [],
    recollectingCompetitorIds = [],
    onChangeGroupProcurementInfo,
    onChangeGroupName,
    onDeleteCompetitor,
    onDeleteGroup,
    onOpenAiAnalysis,
    onOpenCompetitorDetail,
    onOpenCompetitors,
    onOpenListing,
    onOpenProfitEstimate,
    onRecollectCompetitor
  } = props
  const [ali1688Editor, setAli1688Editor] = useState<Ali1688EditorState | null>(null)
  const [groupNameEditor, setGroupNameEditor] = useState<GroupNameEditorState | null>(null)
  const [groupNameSaving, setGroupNameSaving] = useState(false)
  const [groupNameError, setGroupNameError] = useState('')
  const [groupDeleteTarget, setGroupDeleteTarget] = useState<ManualSelectionAnalysisProjectView | null>(null)
  const collectedCount = dataSource.filter((record) => record.status === 'success').length
  const ali1688ReadyCount = dataSource.filter((record) => ali1688CandidateCount(record) > 0).length
  const recommendedCount = dataSource.reduce((total, record) => total + recommendedCandidateCount(record), 0)
  const imageReadyCount = dataSource.filter((record) => Boolean(record.sourceImageUrl || record.imageUrls?.length)).length

  const projectColumns: ColumnsType<ManualSelectionAnalysisProjectView> = [
    {
      title: '选品项目',
      key: 'project',
      width: 260,
      render: (_, project) => (
        <div className="manual-selection-project-cell">
          <div className="manual-selection-project-images">
            {project.records.slice(0, 1).map((record) => (
              <Image
                key={record.id}
                alt={record.sourceTitle || record.sourceTitleCn || '项目素材'}
                width={80}
                height={100}
                preview={false}
                src={sourceImageUrl(record)}
                fallback={MANUAL_SELECTION_IMAGE_FALLBACK}
              />
            ))}
          </div>
          <div className="manual-selection-project-copy">
            <div className="manual-selection-project-title-row">
              <Text strong title={project.projectName}>{project.projectName}</Text>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                data-testid="manual-selection-group-name-edit-button"
                title="编辑组名"
                aria-label={`编辑组名：${project.projectName}`}
                onClick={() => {
                  setGroupNameError('')
                  setGroupNameEditor({
                    groupId: project.projectId,
                    groupName: project.projectName,
                    draftName: project.projectName
                  })
                }}
              />
            </div>
            <button
              className="manual-selection-project-competitor-link"
              type="button"
              data-testid="manual-selection-competitor-button"
              onClick={() => onOpenCompetitors(project)}
            >
              竞品 {projectCompetitorCount(project)} 个
            </button>
          </div>
        </div>
      )
    },
    {
      title: '采集状态',
      key: 'collectionStatus',
      width: 104,
      render: (_, project) => (
        <div className="manual-selection-analysis-status-stack">
          {projectCollectionStatusRows(project).map((label) => (
            <span key={label} className="manual-selection-analysis-status-row">
              <Tag color={collectionStatusColor(label)}>{label}</Tag>
            </span>
          ))}
        </div>
      )
    },
    {
      title: '采集概况',
      key: 'collectionOverview',
      width: 690,
      render: (_, project) => (
        <div
          className="manual-selection-analysis-collection-overview"
          data-testid="manual-selection-analysis-collection-overview"
        >
          {project.records.map((record) => (
            <button
              key={record.id}
              type="button"
              className="manual-selection-analysis-competitor-overview-row"
              title={collectionOverviewText(record)}
              onClick={() => onOpenCompetitorDetail(project, { kind: 'collection', id: record.id })}
            >
              <span className="manual-selection-analysis-competitor-platform is-collected">
                {record.sourcePlatform || '平台'}
              </span>
              <span className="manual-selection-analysis-competitor-status is-success">
                {manualSelectionCollectionSourceLabel(record)}
              </span>
              <span className="manual-selection-analysis-competitor-summary">
                {collectionOverviewText(record)}
              </span>
            </button>
          ))}
          {project.competitors?.map((competitor, index) => {
              const focusId = competitor.id || competitor.url || String(index)
              const isFailed = competitor.fetchStatus === 'failed'
              const isSuccess = competitor.fetchStatus === 'success'
              const recollecting = Boolean(competitor.id && recollectingCompetitorIds.includes(`${project.projectId}:${competitor.id}`))
              const deleting = Boolean(competitor.id && deletingCompetitorIds.includes(`${project.projectId}:${competitor.id}`))
              return (
                <div
                  key={focusId}
                  className="manual-selection-analysis-competitor-overview-row has-action"
                >
                  <button
                    type="button"
                    className={`manual-selection-analysis-competitor-overview-main${isFailed ? ' has-status' : ''}`}
                    title={competitorOverviewText(competitor)}
                    onClick={() => onOpenCompetitorDetail(project, {
                      kind: 'link',
                      id: focusId
                    })}
                  >
                    <span className={`manual-selection-analysis-competitor-platform ${competitorPlatformTone(competitor)}`}>
                      {competitorPlatformLabel(competitor)}
                    </span>
                    {isFailed ? (
                      <span className={`manual-selection-analysis-competitor-status ${competitorStatusTone(competitor.fetchStatus)}`}>
                        {competitorStatusLabel(competitor.fetchStatus)}
                      </span>
                    ) : null}
                    <span className="manual-selection-analysis-competitor-summary">
                      <span className="manual-selection-analysis-competitor-field">
                        <b>单价</b>
                        <span className={`manual-selection-analysis-competitor-value${isSuccess ? ' is-success' : ''}`}>
                          {competitorPriceSummary(competitor)}
                        </span>
                      </span>
                      <span className="manual-selection-analysis-competitor-field">
                        <b>完整度</b>
                        <span className={`manual-selection-analysis-competitor-value${isSuccess ? ' is-success' : ''}`}>
                          {competitorCompletenessSummary(competitor)}
                        </span>
                      </span>
                      <span className="manual-selection-analysis-competitor-field">
                        <b>平台</b>
                        <span className={`manual-selection-analysis-competitor-value${isSuccess ? ' is-success' : ''}`}>
                          {competitorPlatformLabel(competitor)}
                        </span>
                      </span>
                      <span className="manual-selection-analysis-competitor-field">
                        <b>来源</b>
                        <span className={`manual-selection-analysis-competitor-value${isSuccess ? ' is-success' : ''}`}>
                          {competitorCollectionSourceSummary(competitor)}
                        </span>
                      </span>
                    </span>
                  </button>
                  <span className="manual-selection-analysis-competitor-actions">
                    {isFailed ? (
                      <Button
                        size="small"
                        icon={<ReloadOutlined />}
                        loading={recollecting}
                        disabled={!competitor.id || deleting}
                        className="manual-selection-analysis-competitor-recollect"
                        onClick={() => onRecollectCompetitor(project, competitor)}
                      >
                        重新采集
                      </Button>
                    ) : null}
                    <Popconfirm
                      title="删除竞品"
                      description="确认删除这条竞品吗？"
                      okText="删除"
                      cancelText="取消"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => onDeleteCompetitor(project, competitor)}
                    >
                      <Button
                        danger
                        size="small"
                        type="text"
                        icon={<DeleteOutlined />}
                        loading={deleting}
                        disabled={!competitor.id || recollecting}
                        className="manual-selection-analysis-competitor-delete"
                        aria-label="删除竞品"
                      />
                    </Popconfirm>
                  </span>
                </div>
              )
            })}
            {!project.records.length && !project.competitors?.length ? <Text type="secondary">暂无采集</Text> : null}
        </div>
      )
    },
    {
      title: '1688信息',
      key: 'ali1688Summary',
      width: 430,
      render: (_, project) => {
        const candidateCount = project.records.reduce((total, record) => total + ali1688CandidateCount(record), 0)
        const recommendedCount = project.records.reduce((total, record) => total + recommendedCandidateCount(record), 0)
        const purchaseUrl = project.procurement?.ali1688PurchaseUrl?.trim()
        const purchasePrice = project.procurement?.purchasePriceRmb ?? project.procurement?.purchasePrice
        return (
          <div className="manual-selection-analysis-ali1688-info">
            <Space size={4} wrap className="manual-selection-analysis-ali1688-status">
              <Text>{candidateCount} 候选 / {recommendedCount} 推荐</Text>
            </Space>
            <div className="manual-selection-analysis-ali1688-summary">
              <div className="manual-selection-analysis-ali1688-field" data-testid="manual-selection-ali1688-purchase-url">
                <span>链接</span>
                {purchaseUrl ? (
                  <a href={purchaseUrl} target="_blank" rel="noreferrer">链接</a>
                ) : (
                  <Text type="secondary">未填</Text>
                )}
              </div>
              <div className="manual-selection-analysis-ali1688-field" data-testid="manual-selection-ali1688-purchase-price">
                <span>价格</span>
                {typeof purchasePrice === 'number' ? (
                  <strong>RMB {purchasePrice.toFixed(2)}</strong>
                ) : (
                  <Text type="secondary">未填</Text>
                )}
              </div>
              <Button
                size="small"
                icon={<EditOutlined />}
                data-testid="manual-selection-ali1688-edit-button"
                title="编辑1688信息"
                aria-label="编辑1688信息"
                onClick={() => setAli1688Editor({
                  groupId: project.projectId,
                  groupName: project.projectName,
                  purchaseUrl: purchaseUrl || '',
                  purchasePrice
                })}
              />
            </div>
          </div>
        )
      }
    },
    {
      title: '操作',
      key: 'groupActions',
      width: 112,
      fixed: 'right',
      render: (_, project) => (
        <div className="manual-selection-analysis-actions" data-testid="manual-selection-analysis-actions">
          <Button
            size="small"
            icon={<BulbOutlined />}
            data-testid="manual-selection-ai-analysis-button"
            loading={analyzingCollectionIds.includes(project.projectId)}
            onClick={() => onOpenAiAnalysis(project)}
          >
            AI分析
          </Button>
          <Button
            size="small"
            icon={<CalculatorOutlined />}
            data-testid="manual-selection-profit-button"
            onClick={() => onOpenProfitEstimate(project)}
          >
            利润
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<RocketOutlined />}
            data-testid="manual-selection-analysis-listing-button"
            onClick={() => onOpenListing(project)}
          >
            上架
          </Button>
          <Button
            danger
            size="small"
            type="text"
            icon={<DeleteOutlined />}
            data-testid="manual-selection-analysis-group-delete-button"
            loading={deletingGroupIds.includes(project.groupId || project.projectId)}
            disabled={deletingGroupIds.includes(project.groupId || project.projectId)}
            aria-label={`删除整组选品分析：${project.projectName}`}
            onClick={() => setGroupDeleteTarget(project)}
          >
            删除
          </Button>
        </div>
      )
    }
  ]

  const handleSaveGroupName = async () => {
    if (!groupNameEditor) {
      return
    }
    const nextName = groupNameEditor.draftName.trim()
    if (!nextName) {
      setGroupNameError('组名不能为空')
      return
    }
    setGroupNameSaving(true)
    setGroupNameError('')
    try {
      await onChangeGroupName(groupNameEditor.groupId, nextName)
      setGroupNameEditor(null)
    } catch (error) {
      setGroupNameError(error instanceof Error ? error.message : '保存组名失败')
    } finally {
      setGroupNameSaving(false)
    }
  }

  const handleSaveAli1688Editor = () => {
    if (!ali1688Editor) {
      return
    }
    onChangeGroupProcurementInfo(ali1688Editor.groupId, {
      purchaseUrl: ali1688Editor.purchaseUrl,
      purchasePrice: ali1688Editor.purchasePrice
    })
    setAli1688Editor(null)
  }

  const handleDeleteGroup = async (mode: ManualSelectionGroupDeleteMode) => {
    if (!groupDeleteTarget) {
      return
    }
    try {
      await onDeleteGroup(groupDeleteTarget, mode)
      setGroupDeleteTarget(null)
    } catch {
      // 页面层已展示后端业务错误，保留弹窗方便用户重新选择。
    }
  }

  return (
    <div className="manual-selection-analysis">
      <div className="manual-selection-analysis-metrics">
        <div className="manual-selection-analysis-metric is-total">
          <span>采集商品</span>
          <strong>{dataSource.length}</strong>
        </div>
        <div className="manual-selection-analysis-metric is-success">
          <span>采集成功</span>
          <strong>{collectedCount}</strong>
        </div>
        <div className="manual-selection-analysis-metric is-candidate">
          <span>1688有候选</span>
          <strong>{ali1688ReadyCount}</strong>
        </div>
        <div className="manual-selection-analysis-metric is-recommended">
          <span>推荐候选</span>
          <strong>{recommendedCount}</strong>
        </div>
        <div className="manual-selection-analysis-metric is-image">
          <span>有图</span>
          <strong>{imageReadyCount}</strong>
        </div>
      </div>

      {projects.length || loading ? (
        <Table
          rowKey="projectId"
          size="small"
          loading={loading}
          className="manual-selection-analysis-project-table"
          tableLayout="fixed"
          pagination={{ pageSize: 20, showSizeChanger: false }}
          columns={projectColumns}
          dataSource={projects}
          scroll={{ x: 1596 }}
        />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无选品分析商品" />
      )}

      <Modal
        title="删除整组选品分析"
        open={Boolean(groupDeleteTarget)}
        width={560}
        closable={!groupDeleteTarget || !deletingGroupIds.includes(groupDeleteTarget.groupId || groupDeleteTarget.projectId)}
        maskClosable={false}
        onCancel={() => setGroupDeleteTarget(null)}
        footer={groupDeleteTarget ? [
          <Button
            key="cancel"
            disabled={deletingGroupIds.includes(groupDeleteTarget.groupId || groupDeleteTarget.projectId)}
            onClick={() => setGroupDeleteTarget(null)}
          >
            取消
          </Button>,
          ...MANUAL_SELECTION_GROUP_DELETE_OPTIONS.map((option) => (
            <Button
              key={option.mode}
              danger={option.mode === 'group-and-source-collections'}
              type={option.mode === 'group-and-source-collections' ? 'primary' : 'default'}
              loading={deletingGroupIds.includes(groupDeleteTarget.groupId || groupDeleteTarget.projectId)}
              onClick={() => void handleDeleteGroup(option.mode)}
            >
              {option.label}
            </Button>
          ))
        ] : null}
        destroyOnClose
      >
        {groupDeleteTarget ? (
          <Space direction="vertical" size={12}>
            <Text strong>{groupDeleteTarget.projectName}</Text>
            <Text type="secondary">该选品分析包含 {groupDeleteTarget.records.length} 条采集数据，删除会一次解除全部关联。</Text>
            {MANUAL_SELECTION_GROUP_DELETE_OPTIONS.map((option) => (
              <div key={option.mode}>
                <Text strong>{option.label}</Text>
                <br />
                <Text type="secondary">{option.description}</Text>
              </div>
            ))}
          </Space>
        ) : null}
      </Modal>

      <Modal
        title="编辑组名"
        open={Boolean(groupNameEditor)}
        width={480}
        okText="保存"
        cancelText="取消"
        confirmLoading={groupNameSaving}
        onCancel={() => {
          if (!groupNameSaving) {
            setGroupNameEditor(null)
            setGroupNameError('')
          }
        }}
        onOk={() => void handleSaveGroupName()}
        destroyOnClose
      >
        {groupNameEditor ? (
          <div className="manual-selection-group-name-editor">
            <label htmlFor="manual-selection-group-name-input">组名</label>
            <Input
              id="manual-selection-group-name-input"
              allowClear
              maxLength={200}
              value={groupNameEditor.draftName}
              onChange={(event) => {
                setGroupNameError('')
                setGroupNameEditor((current) => current
                  ? { ...current, draftName: event.target.value }
                  : current)
              }}
              onPressEnter={() => void handleSaveGroupName()}
            />
            {groupNameError ? (
              <Text type="danger">{groupNameError}</Text>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        title="编辑1688信息"
        open={Boolean(ali1688Editor)}
        width={520}
        okText="保存"
        cancelText="取消"
        onCancel={() => setAli1688Editor(null)}
        onOk={handleSaveAli1688Editor}
        destroyOnClose
      >
        {ali1688Editor ? (
          <div className="manual-selection-analysis-ali1688-editor">
            <label>
              <span>采购链接</span>
              <Input
                allowClear
                placeholder="https://detail.1688.com/offer/..."
                value={ali1688Editor.purchaseUrl}
                onChange={(event) => setAli1688Editor((current) => current
                  ? { ...current, purchaseUrl: event.target.value }
                  : current)}
              />
            </label>
            <label>
              <span>采购单价</span>
              <InputNumber
                min={0}
                precision={2}
                addonAfter="RMB"
                placeholder="单价"
                value={ali1688Editor.purchasePrice}
                style={{ width: '100%' }}
                onChange={(value) => setAli1688Editor((current) => current
                  ? { ...current, purchasePrice: typeof value === 'number' ? value : undefined }
                  : current)}
              />
            </label>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
