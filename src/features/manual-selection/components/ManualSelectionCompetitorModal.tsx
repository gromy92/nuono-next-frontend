import { DeleteOutlined, FileSearchOutlined, InfoCircleOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Drawer, Empty, Form, Image, Input, Popover, Space, Tag, Typography } from 'antd'
import { useEffect, useRef } from 'react'
import { ManualSelectionCompetitorForm } from './ManualSelectionCompetitorForm'
import { ManualSelectionCompetitorOverview } from './ManualSelectionCompetitorOverview'
import {
  ali1688CandidateCount,
  basicInfoPopoverContent,
  collectedDetailRows,
  competitorStatusCounts,
  fetchStatusColor,
  fetchStatusText,
  formatFetchedAt,
  imageCount,
  linkCompetitorDetailRows,
  linkCompetitorTitle,
  normalizeCompetitors,
  recommendedCandidateCount,
  sourceImageUrl
} from './manualSelectionCompetitorPresentation'
import type { ProductSelectionSourceCollection } from '../../source-collection/types'
import { MANUAL_SELECTION_IMAGE_FALLBACK } from '../constants'
import type {
  ManualSelectionAnalysisProjectView,
  ManualSelectionCompetitor,
  ManualSelectionCompetitorFormValues
} from '../types'
import {
  containsArabicText,
  formatManualSelectionPriceSummary,
  formatManualSelectionCompleteness,
  manualSelectionArabicText,
  manualSelectionCollectionSourceLabel,
  manualSelectionImageCandidates,
  manualSelectionStatusText
} from '../utils'

const { Text } = Typography

type ManualSelectionCompetitorModalProps = {
  competitors: ManualSelectionCompetitor[]
  focus?: { kind: 'link' | 'collection'; id: string } | null
  open: boolean
  project?: ManualSelectionAnalysisProjectView | null
  record: ProductSelectionSourceCollection | null
  recollectingCompetitorIds?: string[]
  onCancel: () => void
  onOpenDetail?: (record: ProductSelectionSourceCollection) => void
  onRecollectCompetitor?: (competitor: ManualSelectionCompetitor) => void
  onSave: (record: ProductSelectionSourceCollection, competitors: ManualSelectionCompetitor[]) => void
}

export function ManualSelectionCompetitorModal(props: ManualSelectionCompetitorModalProps) {
  const {
    competitors,
    focus,
    open,
    project,
    record,
    recollectingCompetitorIds = [],
    onCancel,
    onOpenDetail,
    onRecollectCompetitor,
    onSave
  } = props
  const [form] = Form.useForm<ManualSelectionCompetitorFormValues>()
  const focusTargetRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const statusCounts = competitorStatusCounts(competitors)
  const collectedCompetitors = project?.records || []
  const selectedCollectedCompetitor = focus?.kind === 'collection'
    ? collectedCompetitors.find((item) => item.id === focus.id)
    : undefined
  const selectedLinkCompetitor = focus?.kind === 'link'
    ? competitors.find((competitor, index) => (competitor.id || competitor.url || String(index)) === focus.id)
    : undefined
  const detailMode = Boolean(selectedCollectedCompetitor || selectedLinkCompetitor)

  useEffect(() => {
    if (!open) {
      return
    }
    form.setFieldsValue({
      competitors: competitors.length ? competitors : [{}]
    })
  }, [competitors, form, open])

  useEffect(() => {
    if (!open || !focus?.id) {
      return
    }
    window.setTimeout(() => {
      const target = focusTargetRefs.current[`${focus.kind}:${focus.id}`]
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
  }, [focus?.id, focus?.kind, open])

  const handleSave = () => {
    if (!record) {
      return
    }
    const normalizedCompetitors = normalizeCompetitors(form.getFieldsValue(true))
    if (!normalizedCompetitors.length && !collectedCompetitors.length) {
      form.setFields([
        {
          name: ['competitors', 0, 'url'],
          errors: ['至少填写一个竞品链接']
        }
      ])
      return
    }
    onSave(record, normalizedCompetitors)
  }

  return (
    <Drawer
      title={detailMode ? '竞品详情' : '竞品'}
      open={open}
      destroyOnClose
      placement="right"
      rootClassName="manual-selection-competitor-drawer"
      width={960}
      onClose={onCancel}
      footer={(
        <Space className="manual-selection-competitor-drawer-footer">
          <Button onClick={onCancel}>{detailMode ? '关闭' : '取消'}</Button>
          {!detailMode ? <Button type="primary" onClick={handleSave}>保存竞品</Button> : null}
        </Space>
      )}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Text strong ellipsis={{ tooltip: project?.projectName || record?.sourceTitleCn || record?.selectedText || record?.sourceTitle }}>
          {project?.projectName || record?.sourceTitleCn || record?.selectedText || record?.sourceTitle || '-'}
        </Text>

        {selectedCollectedCompetitor ? (
          <div className="manual-selection-competitor-detail-card">
            <div className="manual-selection-competitor-detail-media">
              <Image
                alt={selectedCollectedCompetitor.sourceTitle || selectedCollectedCompetitor.sourceTitleCn || '竞品主图'}
                width={180}
                height={180}
                preview
                src={sourceImageUrl(selectedCollectedCompetitor)}
                fallback={MANUAL_SELECTION_IMAGE_FALLBACK}
              />
              <span>{imageCount(selectedCollectedCompetitor)} 张图</span>
            </div>
            <div className="manual-selection-competitor-detail-main">
              <Text strong className="manual-selection-competitor-detail-title">
                {selectedCollectedCompetitor.sourceTitleCn || selectedCollectedCompetitor.selectedText || selectedCollectedCompetitor.sourceTitle || '-'}
              </Text>
              <Text type="secondary">{selectedCollectedCompetitor.sourceTitle || '-'}</Text>
              {manualSelectionArabicText(selectedCollectedCompetitor) ? (
                <Text type="secondary" dir="rtl" lang="ar">
                  {manualSelectionArabicText(selectedCollectedCompetitor)}
                </Text>
              ) : null}
              <div className="manual-selection-competitor-detail-grid">
                {collectedDetailRows(selectedCollectedCompetitor).map((item) => (
                  <div key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
              {selectedCollectedCompetitor.specHints?.length ? (
                <div className="manual-selection-competitor-detail-section">
                  <Text strong>采集规格</Text>
                  {selectedCollectedCompetitor.specHints.map((item) => <span key={item}>{item}</span>)}
                </div>
              ) : null}
              <Button icon={<FileSearchOutlined />} onClick={() => onOpenDetail?.(selectedCollectedCompetitor)}>
                查看完整采集详情
              </Button>
            </div>
          </div>
        ) : null}

        {selectedLinkCompetitor ? (
          <div className="manual-selection-competitor-detail-card">
            <div className="manual-selection-competitor-detail-link-media">
              <Tag color={fetchStatusColor(selectedLinkCompetitor.fetchStatus)}>
                {fetchStatusText(selectedLinkCompetitor.fetchStatus)}
              </Tag>
              <strong>{selectedLinkCompetitor.fetchedSourceHost || '链接竞品'}</strong>
            </div>
            <div className="manual-selection-competitor-detail-main">
              <Text strong className="manual-selection-competitor-detail-title">
                {linkCompetitorTitle(selectedLinkCompetitor)}
              </Text>
              {selectedLinkCompetitor.fetchedTitleAr ? (
                <Text type="secondary" dir="rtl" lang="ar">{selectedLinkCompetitor.fetchedTitleAr}</Text>
              ) : null}
              <div className="manual-selection-competitor-detail-grid">
                {linkCompetitorDetailRows(selectedLinkCompetitor).map((item) => (
                  <div key={item.label}>
                    <span>{item.label}</span>
                    <strong title={item.value}>{item.value}</strong>
                  </div>
                ))}
              </div>
              {selectedLinkCompetitor.fetchedDescriptionEn || selectedLinkCompetitor.fetchedDescriptionAr ? (
                <div className="manual-selection-competitor-detail-section">
                  <Text strong>描述</Text>
                  {selectedLinkCompetitor.fetchedDescriptionEn ? <p>{selectedLinkCompetitor.fetchedDescriptionEn}</p> : null}
                  {selectedLinkCompetitor.fetchedDescriptionAr ? <p dir="rtl" lang="ar">{selectedLinkCompetitor.fetchedDescriptionAr}</p> : null}
                </div>
              ) : null}
              {selectedLinkCompetitor.fetchedSellingPointsEn?.length || selectedLinkCompetitor.fetchedSellingPointsAr?.length ? (
                <div className="manual-selection-competitor-detail-section">
                  <Text strong>卖点</Text>
                  {(selectedLinkCompetitor.fetchedSellingPointsEn || []).map((item) => <span key={item}>{item}</span>)}
                  {(selectedLinkCompetitor.fetchedSellingPointsAr || []).map((item) => <span key={item} dir="rtl" lang="ar">{item}</span>)}
                </div>
              ) : null}
              {selectedLinkCompetitor.fetchMessage ? (
                <Text type={selectedLinkCompetitor.fetchStatus === 'failed' ? 'danger' : 'secondary'}>
                  {selectedLinkCompetitor.fetchMessage}
                </Text>
              ) : null}
            </div>
          </div>
        ) : null}

        <ManualSelectionCompetitorOverview
          detailMode={detailMode}
          collectedCompetitors={collectedCompetitors}
          competitors={competitors}
          focus={focus}
          focusTargetRefs={focusTargetRefs}
          project={project}
          recollectingCompetitorIds={recollectingCompetitorIds}
          onOpenDetail={onOpenDetail}
          onRecollectCompetitor={onRecollectCompetitor}
        />
        <ManualSelectionCompetitorForm
          detailMode={detailMode}
          form={form}
          competitors={competitors}
          project={project}
          recollectingCompetitorIds={recollectingCompetitorIds}
          onRecollectCompetitor={onRecollectCompetitor}
        />
      </Space>
    </Drawer>
  )
}
