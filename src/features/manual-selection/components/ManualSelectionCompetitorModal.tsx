import { DeleteOutlined, FileSearchOutlined, InfoCircleOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Drawer, Empty, Form, Image, Input, Popover, Space, Tag, Typography } from 'antd'
import { useEffect, useRef } from 'react'
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

function normalizeCompetitors(values: ManualSelectionCompetitorFormValues): ManualSelectionCompetitor[] {
  return (values.competitors || [])
    .map((item, index) => ({
      id: item.id || `manual-competitor-${Date.now()}-${index}`,
      url: item.url?.trim(),
      note: item.note?.trim(),
      fetchStatus: item.fetchStatus,
      fetchedTitle: item.fetchedTitle,
      fetchedTitleAr: item.fetchedTitleAr,
      fetchedSourceImageUrl: item.fetchedSourceImageUrl,
      fetchedImageUrls: item.fetchedImageUrls || [],
      fetchedDescriptionEn: item.fetchedDescriptionEn,
      fetchedDescriptionAr: item.fetchedDescriptionAr,
      fetchedSellingPointsEn: item.fetchedSellingPointsEn || [],
      fetchedSellingPointsAr: item.fetchedSellingPointsAr || [],
      fetchedSourceHost: item.fetchedSourceHost,
      fetchedPriceSummary: item.fetchedPriceSummary,
      fetchedCategoryName: item.fetchedCategoryName,
      fetchedCategoryPath: item.fetchedCategoryPath,
      fetchedCategoryUrl: item.fetchedCategoryUrl,
      fetchedCategoryLinks: item.fetchedCategoryLinks || [],
      fetchedCompleteness: item.fetchedCompleteness,
      fetchedCollectionSource: item.fetchedCollectionSource,
      fetchedAt: item.fetchedAt,
      fetchMessage: item.fetchMessage
    }))
    .filter((item) => Boolean(item.url))
}

function fetchStatusColor(status?: ManualSelectionCompetitor['fetchStatus']) {
  if (status === 'success') return 'success'
  if (status === 'failed') return 'error'
  if (status === 'fetching') return 'processing'
  return 'default'
}

function fetchStatusText(status?: ManualSelectionCompetitor['fetchStatus']) {
  if (status === 'success') return '已拉取'
  if (status === 'failed') return '拉取失败'
  if (status === 'fetching') return '拉取中'
  return '未拉取'
}

function formatFetchedAt(value?: string) {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

function competitorStatusCounts(competitors: ManualSelectionCompetitor[]) {
  return {
    total: competitors.length,
    fetched: competitors.filter((competitor) => competitor.fetchStatus === 'success').length,
    fetching: competitors.filter((competitor) => competitor.fetchStatus === 'fetching').length,
    failed: competitors.filter((competitor) => competitor.fetchStatus === 'failed').length
  }
}

function sourceImageUrl(record: ProductSelectionSourceCollection) {
  return manualSelectionImageCandidates(record)[0] || MANUAL_SELECTION_IMAGE_FALLBACK
}

function imageCount(record: ProductSelectionSourceCollection) {
  return record.imageCount || record.imageUrls?.length || 0
}

function collectedDetailRows(record: ProductSelectionSourceCollection) {
  const completeness = formatManualSelectionCompleteness(record)
  const priceSummary = formatManualSelectionPriceSummary(record)
  const sourceTitleArText = record.sourceTitleAr || ''
  const sourceDescriptionArText = record.sourceDescriptionAr || record.selectedTextAr || ''
  const sourceTitleAr = containsArabicText(sourceTitleArText) ? sourceTitleArText : '未采集'
  const sourceDescriptionAr = containsArabicText(sourceDescriptionArText)
    ? sourceDescriptionArText
    : '未采集'
  return [
    { label: '采集编号', value: record.collectionNo },
    { label: '采集来源', value: manualSelectionCollectionSourceLabel(record) },
    { label: '三方渠道', value: record.sourcePlatform },
    { label: '采集单价', value: priceSummary },
    { label: '采集状态', value: manualSelectionStatusText(record.status) },
    { label: '采集时间', value: record.collectedAt },
    { label: '采集人', value: record.collectedBy },
    { label: '基础信息', value: completeness.full },
    { label: '图片', value: `${imageCount(record)} 张` },
    { label: '规格', value: `${record.specAttributeCount ?? record.specHints?.length ?? 0} 条` },
    { label: '英文标题', value: record.sourceTitle },
    { label: '中文标题', value: record.sourceTitleCn || record.selectedText },
    { label: '阿语标题', value: sourceTitleAr },
    { label: '阿语描述', value: sourceDescriptionAr }
  ].filter((item) => item.value)
}

function basicInfoPopoverContent(record: ProductSelectionSourceCollection) {
  const specHints = (record.specHints || []).filter(Boolean).slice(0, 5)
  const arabicSellingPoints = (record.sourceSellingPointsAr || []).filter(Boolean).slice(0, 5)
  return (
    <div className="manual-selection-basic-info-popover-content">
      <div className="manual-selection-basic-info-detail-grid">
        {collectedDetailRows(record).map((item) => (
          <div key={item.label} className="manual-selection-basic-info-detail-row">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
      {specHints.length ? (
        <div className="manual-selection-basic-info-specs">
          <Text type="secondary">采集规格</Text>
          {specHints.map((item) => (
            <div key={item}>{item}</div>
          ))}
        </div>
      ) : null}
      {arabicSellingPoints.length ? (
        <div className="manual-selection-basic-info-specs" dir="rtl" lang="ar">
          <Text type="secondary">阿语卖点</Text>
          {arabicSellingPoints.map((item) => (
            <div key={item}>{item}</div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ali1688CandidateCount(record: ProductSelectionSourceCollection) {
  return record.ali1688Collection?.candidateCount || record.ali1688Collection?.candidates?.length || 0
}

function recommendedCandidateCount(record: ProductSelectionSourceCollection) {
  return record.ali1688Collection?.recommendedCount
    ?? (record.ali1688Collection?.candidates || []).filter((candidate) => candidate.level === 'recommended').length
}

function linkCompetitorDetailRows(competitor: ManualSelectionCompetitor) {
  return [
    { label: '状态', value: fetchStatusText(competitor.fetchStatus) },
    { label: '平台', value: competitor.fetchedSourceHost || '-' },
    { label: '单价', value: competitor.fetchedPriceSummary || '未采集' },
    { label: '完整度', value: competitor.fetchedCompleteness || '未采集' },
    { label: '来源', value: competitor.fetchedCollectionSource || '手动链接' },
    { label: '拉取时间', value: formatFetchedAt(competitor.fetchedAt) || '-' },
    { label: '备注', value: competitor.note || '-' },
    { label: '链接', value: competitor.url || '-' }
  ]
}

function linkCompetitorTitle(competitor: ManualSelectionCompetitor) {
  return competitor.fetchedTitle || competitor.url || '未命名竞品'
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
                        color={manualSelectionCollectionSourceLabel(item) === '插件' ? 'purple' : 'blue'}
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

        {!detailMode ? <Form form={form} layout="vertical" initialValues={{ competitors: [{}] }}>
          <Form.List name="competitors">
            {(fields, { add, remove }) => (
              <Space className="manual-selection-competitor-editor-list" direction="vertical" size={10}>
                {fields.length ? fields.map((field, index) => (
                  <div key={field.key} className="manual-selection-competitor-row">
                    <div className="manual-selection-competitor-row-head">
                      <Text strong>竞品 {index + 1}</Text>
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        title="删除竞品"
                        disabled={fields.length === 1}
                        onClick={() => remove(field.name)}
                      />
                    </div>
                    <Form.Item name={[field.name, 'id']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'fetchStatus']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'fetchedTitle']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'fetchedTitleAr']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'fetchedDescriptionEn']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'fetchedDescriptionAr']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'fetchedSourceHost']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'fetchedPriceSummary']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'fetchedCompleteness']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'fetchedCollectionSource']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'fetchedAt']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'fetchMessage']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item label="竞品链接" name={[field.name, 'url']}>
                      <Input placeholder="粘贴竞品链接" />
                    </Form.Item>
                    <Form.Item label="备注" name={[field.name, 'note']}>
                      <Input placeholder="差异点 / 卖点 / 风险 / 价格备注" />
                    </Form.Item>
                    <div className="manual-selection-competitor-fetch">
                      <Tag color={fetchStatusColor(competitors[index]?.fetchStatus)}>
                        {fetchStatusText(competitors[index]?.fetchStatus)}
                      </Tag>
                      {competitors[index]?.fetchedTitle ? (
                        <Text ellipsis title={competitors[index]?.fetchedTitle}>
                          {competitors[index]?.fetchedTitle}
                        </Text>
                      ) : null}
                      {competitors[index]?.fetchedSourceHost || competitors[index]?.fetchedAt ? (
                        <Text type="secondary">
                          {[competitors[index]?.fetchedSourceHost, formatFetchedAt(competitors[index]?.fetchedAt)].filter(Boolean).join(' / ')}
                        </Text>
                      ) : null}
                      {competitors[index]?.fetchMessage && competitors[index]?.fetchStatus === 'failed' ? (
                        <Text type="danger">{competitors[index]?.fetchMessage}</Text>
                      ) : null}
                      {competitors[index]?.fetchStatus === 'failed' ? (
                        <Button
                          size="small"
                          icon={<ReloadOutlined />}
                          loading={Boolean(competitors[index]?.id && project?.projectId && recollectingCompetitorIds.includes(`${project.projectId}:${competitors[index]?.id}`))}
                          disabled={!competitors[index]?.id}
                          onClick={() => {
                            const competitor = competitors[index]
                            if (competitor) {
                              onRecollectCompetitor?.(competitor)
                            }
                          }}
                        >
                          重新采集
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无竞品" />
                )}
                <Button block icon={<PlusOutlined />} onClick={() => add({})}>
                  添加一条竞品
                </Button>
              </Space>
            )}
          </Form.List>
        </Form> : null}
      </Space>
    </Drawer>
  )
}
