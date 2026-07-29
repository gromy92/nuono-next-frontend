import { BulbOutlined, CalculatorOutlined, EditOutlined, RocketOutlined } from '@ant-design/icons'
import { Button, Empty, Image, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import type { ProductSelectionSourceCollection } from '../../source-collection/types'
import { MANUAL_SELECTION_IMAGE_FALLBACK } from '../constants'
import { ManualSelectionAnalysisCollectionOverview } from './ManualSelectionAnalysisCollectionOverview'
import {
  ManualSelectionAnalysisEditors,
  type Ali1688EditorState,
  type GroupNameEditorState
} from './ManualSelectionAnalysisEditors'
import {
  ali1688CandidateCount,
  collectionStatusColor,
  projectCollectionStatusRows,
  projectCompetitorCount,
  recommendedCandidateCount,
  sourceImageUrl
} from './manualSelectionAnalysisPresentation'
import type {
  ManualSelectionAli1688ProcurementInfo,
  ManualSelectionAnalysisProjectView,
  ManualSelectionCompetitor
} from '../types'

const { Text } = Typography

type ManualSelectionAnalysisPanelProps = {
  analyzingCollectionIds: string[]
  dataSource: ProductSelectionSourceCollection[]
  projects: ManualSelectionAnalysisProjectView[]
  loading?: boolean
  deletingCompetitorIds?: string[]
  recollectingCompetitorIds?: string[]
  onChangeGroupProcurementInfo: (groupId: string, values: Partial<ManualSelectionAli1688ProcurementInfo>) => void
  onChangeGroupName: (groupId: string, groupName: string) => Promise<void> | void
  onDeleteCompetitor: (project: ManualSelectionAnalysisProjectView, competitor: ManualSelectionCompetitor) => void
  onOpenAiAnalysis: (project: ManualSelectionAnalysisProjectView) => void
  onOpenCompetitorDetail: (project: ManualSelectionAnalysisProjectView, focus: { kind: 'link' | 'collection'; id: string }) => void
  onOpenCompetitors: (project: ManualSelectionAnalysisProjectView) => void
  onOpenListing: (project: ManualSelectionAnalysisProjectView) => void
  onOpenProfitEstimate: (project: ManualSelectionAnalysisProjectView) => void
  onRecollectCompetitor: (project: ManualSelectionAnalysisProjectView, competitor: ManualSelectionCompetitor) => void
}

export function ManualSelectionAnalysisPanel(props: ManualSelectionAnalysisPanelProps) {
  const {
    analyzingCollectionIds,
    dataSource,
    projects,
    loading,
    deletingCompetitorIds = [],
    recollectingCompetitorIds = [],
    onChangeGroupProcurementInfo,
    onChangeGroupName,
    onDeleteCompetitor,
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
        <ManualSelectionAnalysisCollectionOverview
          project={project}
          deletingCompetitorIds={deletingCompetitorIds}
          recollectingCompetitorIds={recollectingCompetitorIds}
          onDeleteCompetitor={onDeleteCompetitor}
          onOpenCompetitorDetail={onOpenCompetitorDetail}
          onRecollectCompetitor={onRecollectCompetitor}
        />
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
        </div>
      )
    }
  ]

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

      <ManualSelectionAnalysisEditors
        ali1688Editor={ali1688Editor}
        setAli1688Editor={setAli1688Editor}
        groupNameEditor={groupNameEditor}
        setGroupNameEditor={setGroupNameEditor}
        groupNameSaving={groupNameSaving}
        setGroupNameSaving={setGroupNameSaving}
        groupNameError={groupNameError}
        setGroupNameError={setGroupNameError}
        onChangeGroupProcurementInfo={onChangeGroupProcurementInfo}
        onChangeGroupName={onChangeGroupName}
      />
    </div>
  )
}
