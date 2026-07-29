import { FileSearchOutlined, InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Empty, Image, Popover, Space, Tag, Typography } from 'antd'
import type { MutableRefObject } from 'react'
import type { ProductSelectionSourceCollection } from '../../source-collection/types'
import { MANUAL_SELECTION_IMAGE_FALLBACK } from '../constants'
import type { ManualSelectionAnalysisProjectView, ManualSelectionCompetitor } from '../types'
import {
  formatManualSelectionCompleteness,
  manualSelectionArabicText,
  manualSelectionCollectionSourceLabel,
  manualSelectionStatusText
} from '../utils'
import {
  ali1688CandidateCount,
  basicInfoPopoverContent,
  competitorStatusCounts,
  fetchStatusColor,
  fetchStatusText,
  formatFetchedAt,
  imageCount,
  recommendedCandidateCount,
  sourceImageUrl
} from './manualSelectionCompetitorPresentation'

const { Text } = Typography

type Props = {
  detailMode: boolean
  collectedCompetitors: ProductSelectionSourceCollection[]
  competitors: ManualSelectionCompetitor[]
  focus?: { kind: 'link' | 'collection'; id: string } | null
  focusTargetRefs: MutableRefObject<Record<string, HTMLDivElement | null>>
  project?: ManualSelectionAnalysisProjectView | null
  recollectingCompetitorIds: string[]
  onOpenDetail?: (record: ProductSelectionSourceCollection) => void
  onRecollectCompetitor?: (competitor: ManualSelectionCompetitor) => void
}

export function ManualSelectionCompetitorOverview(props: Props) {
  const {
    detailMode, collectedCompetitors, competitors, focus, focusTargetRefs,
    project, recollectingCompetitorIds, onOpenDetail, onRecollectCompetitor
  } = props
  const statusCounts = competitorStatusCounts(competitors)
  return (
    <>
        {!detailMode ? <div className="manual-selection-competitor-result-board">
          <div>
            <span>竞品</span>
            <strong>{collectedCompetitors.length + statusCounts.total}</strong>
          </div>
          <div>
            <span>采集竞品</span>
            <strong>{collectedCompetitors.length}</strong>
          </div>
          <div>
            <span>链接竞品</span>
            <strong>{statusCounts.total}</strong>
          </div>
          <div>
            <span>失败</span>
            <strong>{statusCounts.failed}</strong>
          </div>
        </div> : null}

        {!detailMode ? <div className="manual-selection-competitor-editor-head">
          <Text strong>采集竞品</Text>
          <Text type="secondary">来自人工采集并加入当前组的商品。</Text>
        </div> : null}

        {!detailMode && collectedCompetitors.length ? (
          <div className="manual-selection-collected-competitors">
            {collectedCompetitors.map((item) => {
              const arabicText = manualSelectionArabicText(item)
              const focusKey = `collection:${item.id}`
              const focused = focus?.kind === 'collection' && focus.id === item.id
              return (
                <div
                  key={item.id}
                  ref={(node) => {
                    focusTargetRefs.current[focusKey] = node
                  }}
                  className={`manual-selection-collected-competitor-card${focused ? ' is-focused' : ''}`}
                >
                  <div className="manual-selection-analysis-image" data-testid="manual-selection-analysis-image">
                    <Image
                      alt={item.sourceTitle || item.sourceTitleCn || '竞品主图'}
                      width={70}
                      height={70}
                      preview={false}
                      src={sourceImageUrl(item)}
                      fallback={MANUAL_SELECTION_IMAGE_FALLBACK}
                    />
                    <span className="manual-selection-analysis-image-count">{imageCount(item)}张</span>
                  </div>
                  <div className="manual-selection-collected-competitor-copy">
                    <Text strong title={item.sourceTitleCn || item.selectedText || item.sourceTitle || undefined}>
                      {item.sourceTitleCn || item.selectedText || item.sourceTitle || '-'}
                    </Text>
                    <Text type="secondary" title={item.sourceTitle || undefined}>
                      {item.sourceTitle || '-'}
                    </Text>
                    {arabicText ? (
                      <Text type="secondary" dir="rtl" lang="ar" title={arabicText}>
                        {arabicText}
                      </Text>
                    ) : null}
                    <Space size={4} wrap>
                      <Tag>{manualSelectionStatusText(item.status)}</Tag>
                      <Tag
                        color={manualSelectionCollectionSourceLabel(item) === '插件' ? undefined : 'blue'}
                        data-testid="manual-selection-collection-source"
                      >
                        {manualSelectionCollectionSourceLabel(item)}
                      </Tag>
                      <Tag>{ali1688CandidateCount(item)} 候选 / {recommendedCandidateCount(item)} 推荐</Tag>
                    </Space>
                    <Popover
                      mouseEnterDelay={0.15}
                      overlayClassName="manual-selection-basic-info-popover"
                      placement="left"
                      title="采集详情"
                      content={basicInfoPopoverContent(item)}
                    >
                      <button
                        className="manual-selection-basic-info-trigger"
                        data-testid="manual-selection-basic-info-trigger"
                        type="button"
                      >
                        <InfoCircleOutlined />
                        <span>{formatManualSelectionCompleteness(item).full}</span>
                      </button>
                    </Popover>
                  </div>
                  <Button size="small" icon={<FileSearchOutlined />} onClick={() => onOpenDetail?.(item)}>
                    详情
                  </Button>
                </div>
              )
            })}
          </div>
        ) : !detailMode ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无采集竞品" />
        ) : null}

        {!detailMode && competitors.length ? (
          <>
            <div className="manual-selection-competitor-editor-head">
              <Text strong>链接竞品</Text>
              <Text type="secondary">手动补充链接后的拉取结果。</Text>
            </div>
            <div className="manual-selection-competitor-results">
              {competitors.map((competitor, index) => {
                const focusId = competitor.id || competitor.url || String(index)
                const focusKey = `link:${focusId}`
                const focused = focus?.kind === 'link' && focus.id === focusId
                return (
                <div
                  key={competitor.id || competitor.url || index}
                  ref={(node) => {
                    focusTargetRefs.current[focusKey] = node
                  }}
                  className={`manual-selection-competitor-result-card${focused ? ' is-focused' : ''}`}
                >
                  <div className="manual-selection-competitor-result-card-head">
                    <Tag color={fetchStatusColor(competitor.fetchStatus)}>
                      {fetchStatusText(competitor.fetchStatus)}
                    </Tag>
                    <Text strong ellipsis title={competitor.fetchedTitle || competitor.url}>
                      {competitor.fetchedTitle || competitor.url || '-'}
                    </Text>
                  </div>
                  <div className="manual-selection-competitor-result-meta">
                    <Text type="secondary" ellipsis>
                      {[competitor.fetchedSourceHost, formatFetchedAt(competitor.fetchedAt)].filter(Boolean).join(' / ') || '-'}
                    </Text>
                  </div>
                  <Text className="manual-selection-competitor-result-url" type="secondary" ellipsis title={competitor.url}>
                    {competitor.url || '-'}
                  </Text>
                  {competitor.note ? (
                    <Text className="manual-selection-competitor-result-note" type="secondary" ellipsis title={competitor.note}>
                      {competitor.note}
                    </Text>
                  ) : null}
                  {competitor.fetchMessage && competitor.fetchStatus === 'failed' ? (
                    <Text type="danger">{competitor.fetchMessage}</Text>
                  ) : null}
                  {competitor.fetchStatus === 'failed' ? (
                    <Button
                      size="small"
                      icon={<ReloadOutlined />}
                      loading={Boolean(competitor.id && project?.projectId && recollectingCompetitorIds.includes(`${project.projectId}:${competitor.id}`))}
                      disabled={!competitor.id}
                      onClick={() => onRecollectCompetitor?.(competitor)}
                    >
                      重新采集
                    </Button>
                  ) : null}
                </div>
                )
              })}
            </div>
          </>
        ) : null}

        {!detailMode ? <div className="manual-selection-competitor-editor-head">
          <Text strong>维护竞品</Text>
          <Text type="secondary">填写链接和备注，保存后自动拉取竞品内容。</Text>
        </div> : null}


    </>
  )
}
