import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Typography } from 'antd'
import type { ManualSelectionAnalysisProjectView, ManualSelectionCompetitor } from '../types'
import { manualSelectionCollectionSourceLabel } from '../utils'
import {
  collectionOverviewText,
  competitorCollectionSourceSummary,
  competitorCompletenessSummary,
  competitorOverviewText,
  competitorPlatformLabel,
  competitorPlatformTone,
  competitorPriceSummary,
  competitorStatusLabel,
  competitorStatusTone
} from './manualSelectionAnalysisPresentation'

const { Text } = Typography

type Props = {
  project: ManualSelectionAnalysisProjectView
  deletingCompetitorIds: string[]
  recollectingCompetitorIds: string[]
  onDeleteCompetitor: (project: ManualSelectionAnalysisProjectView, competitor: ManualSelectionCompetitor) => void
  onOpenCompetitorDetail: (project: ManualSelectionAnalysisProjectView, focus: { kind: 'link' | 'collection'; id: string }) => void
  onRecollectCompetitor: (project: ManualSelectionAnalysisProjectView, competitor: ManualSelectionCompetitor) => void
}

export function ManualSelectionAnalysisCollectionOverview({
  project,
  deletingCompetitorIds,
  recollectingCompetitorIds,
  onDeleteCompetitor,
  onOpenCompetitorDetail,
  onRecollectCompetitor
}: Props) {
  return (
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
          <span className="manual-selection-analysis-competitor-status is-source">
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
        const recollecting = Boolean(
          competitor.id && recollectingCompetitorIds.includes(`${project.projectId}:${competitor.id}`)
        )
        const deleting = Boolean(
          competitor.id && deletingCompetitorIds.includes(`${project.projectId}:${competitor.id}`)
        )
        return (
          <div key={focusId} className="manual-selection-analysis-competitor-overview-row has-action">
            <button
              type="button"
              className={`manual-selection-analysis-competitor-overview-main${isFailed ? ' has-status' : ''}`}
              title={competitorOverviewText(competitor)}
              onClick={() => onOpenCompetitorDetail(project, { kind: 'link', id: focusId })}
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
}
