import { Image, Modal, Progress, Typography } from 'antd'
import type { ProductSelectionSourceCollection } from '../../source-collection/types'
import { MANUAL_SELECTION_IMAGE_FALLBACK } from '../constants'
import { manualSelectionCollectionUrl } from '../utils'
import {
  DetailMetric,
  DetailPanel,
  DetailPanelGrid,
  DetailSection,
  detailCompleteness,
  formatPriceSummary,
  isLikelyChineseTitle,
  legacySellingPointsFromSpecHints,
  legacySellingPointsFromText,
  renderDetailItemList,
  renderDetailText,
  renderImages,
  TitleBlock
} from './ManualSelectionDetailModal.parts'
import { ManualSelectionLogisticsAssessment } from './ManualSelectionLogisticsAssessment'
import { ManualSelectionSpecGroups } from './ManualSelectionSpecGroups'
import { ManualSelectionAli1688DetailPanel } from './ManualSelectionAli1688Panel'
import './ManualSelectionDetailModal.css'

const { Text } = Typography

type ManualSelectionDetailModalProps = {
  record?: ProductSelectionSourceCollection | null
  onCancel: () => void
}

export function ManualSelectionDetailModal({ record, onCancel }: ManualSelectionDetailModalProps) {
  const sourceUrl = record ? manualSelectionCollectionUrl(record) : ''
  const sourceTitleCn = record ? record.sourceTitleCn || (isLikelyChineseTitle(record.selectedText) ? record.selectedText || '' : '') : ''
  const selectedTextSummary = record?.selectedText && record.selectedText !== sourceTitleCn ? record.selectedText : ''
  const sourceDescriptionEn = record?.sourceDescriptionEn || selectedTextSummary
  const sourceDescriptionAr = record?.sourceDescriptionAr || record?.selectedTextAr
  const sourceSellingPointsEn = record?.sourceSellingPointsEn?.length
    ? record.sourceSellingPointsEn
    : legacySellingPointsFromSpecHints(record?.specHints)
  const sourceSellingPointsAr = record?.sourceSellingPointsAr?.length
    ? record.sourceSellingPointsAr
    : legacySellingPointsFromText(record?.selectedTextAr)
  const completeness = record ? detailCompleteness(record) : null

  return (
    <Modal
      title="采集详情"
      open={Boolean(record)}
      data-testid="manual-selection-detail-modal"
      width={1080}
      className="manual-selection-detail-modal"
      footer={null}
      destroyOnClose
      styles={{
        body: {
          boxSizing: 'border-box',
          maxHeight: 'calc(100vh - 132px)',
          overflowX: 'hidden',
          overflowY: 'auto',
          paddingInlineEnd: 28,
          scrollbarGutter: 'stable',
          paddingTop: 8
        }
      }}
      onCancel={onCancel}
    >
      {record ? (
        <div className="manual-selection-detail-content">
          <div className="manual-selection-detail-hero">
            <Image
              alt={record.sourceTitle || sourceTitleCn || '源头商品主图'}
              width={132}
              height={132}
              src={record.sourceImageUrl || MANUAL_SELECTION_IMAGE_FALLBACK}
              fallback={MANUAL_SELECTION_IMAGE_FALLBACK}
              className="manual-selection-detail-main-image"
            />
            <div className="manual-selection-detail-hero-main">
              <div className="manual-selection-detail-progress">
                <div className="manual-selection-detail-progress-head">
                  <span>采集信息进度</span>
                  <strong>{completeness?.count}/{completeness?.total}</strong>
                </div>
                <Progress percent={completeness?.percent || 0} showInfo={false} size="small" />
              </div>
              <div className="manual-selection-detail-metrics">
                <DetailMetric label="价格" value={formatPriceSummary(record)} />
                <DetailMetric label="品牌" value={record.brandName} />
                <DetailMetric label="颜色" value={record.colorName} />
                <DetailMetric label="单位数量" value={record.unitCount} />
              </div>
              <div className="manual-selection-detail-title-grid">
                <TitleBlock label="中文名" value={sourceTitleCn} />
                <TitleBlock label="英文标题" value={record.sourceTitle} href={sourceUrl} />
                <TitleBlock label="阿语标题" value={record.sourceTitleAr} rtl />
              </div>
            </div>
          </div>

          <DetailSection title="商品图片">
            {renderImages(record, sourceTitleCn)}
          </DetailSection>

          <DetailSection title="1688查询展示">
            <ManualSelectionAli1688DetailPanel record={record} />
          </DetailSection>

          <DetailSection title="卖点信息">
            <DetailPanelGrid>
              <DetailPanel label="英文卖点">
                {renderDetailItemList(sourceSellingPointsEn, false, 260)}
              </DetailPanel>
              <DetailPanel label="阿语卖点" rtl>
                {renderDetailItemList(sourceSellingPointsAr, true, 260)}
              </DetailPanel>
            </DetailPanelGrid>
          </DetailSection>

          <DetailSection title="详情摘要">
            <DetailPanelGrid>
              <DetailPanel label="英文详情摘要">
                {renderDetailText(sourceDescriptionEn, false, 180)}
              </DetailPanel>
              <DetailPanel label="阿语详情摘要" rtl>
                {renderDetailText(sourceDescriptionAr, true, 220)}
              </DetailPanel>
            </DetailPanelGrid>
          </DetailSection>

          <DetailSection title="物流评估">
            <ManualSelectionLogisticsAssessment record={record} />
          </DetailSection>

          <DetailSection title="规格线索">
            <ManualSelectionSpecGroups specHints={record.specHints} />
          </DetailSection>

          {record.notes ? (
            <DetailSection title="备注">
              {renderDetailText(record.notes)}
            </DetailSection>
          ) : null}

          {record.failureMessage ? (
            <DetailSection title="失败原因">
              <div>
                <Text type="danger">{record.failureMessage}</Text>
              </div>
            </DetailSection>
          ) : null}
        </div>
      ) : null}
    </Modal>
  )
}
