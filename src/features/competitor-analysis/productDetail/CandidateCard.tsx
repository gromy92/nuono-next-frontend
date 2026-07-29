import {
  CheckOutlined,
  CloseOutlined,
  StarFilled
} from '@ant-design/icons'
import { Button, Checkbox, Space, Tag, Tooltip, Typography } from 'antd'
import {
  formatRankStatus,
  isNotInRankRange
} from '../competitorRankFormatting'
import type {
  CompetitorCandidate,
  CompetitorRankPoint
} from '../types'

const { Text } = Typography

export function CandidateCard({
  candidate,
  readonly,
  selectable,
  selected,
  keywordId,
  reviewStatus,
  rankPoint,
  isOwnProduct,
  onCandidateSelectionChange,
  onCandidateStatusChange,
  actionLoading
}: {
  candidate: CompetitorCandidate
  readonly?: boolean
  selectable?: boolean
  selected?: boolean
  keywordId: string
  reviewStatus: 'pending' | 'confirmed' | 'ignored'
  rankPoint?: CompetitorRankPoint
  isOwnProduct?: boolean
  onCandidateSelectionChange?: (candidateId: string, checked: boolean) => void
  onCandidateStatusChange: (
    keywordId: string,
    candidateId: string,
    status: 'confirmed' | 'ignored' | 'removed'
  ) => void
  actionLoading: string | null
}) {
  const isSponsored = rankPoint?.isSponsored ?? candidate.isSponsored
  const batchLoading = actionLoading?.startsWith('candidate-batch-') ?? false

  return (
    <article
      className={`competitor-analysis-candidate-card${reviewStatus === 'confirmed' ? ' competitor-analysis-candidate-card-confirmed' : ''}${selected ? ' competitor-analysis-candidate-card-selected' : ''}`}
      role="link"
      tabIndex={0}
      aria-label={`打开 Noon 商品 ${candidate.noonProductCode}`}
      onClick={() => openCandidateLink(candidate.canonicalUrl)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openCandidateLink(candidate.canonicalUrl)
        }
      }}
    >
      <div className="competitor-analysis-candidate-media">
        {readonly ? (
          <Tooltip title="从当前关键词移除">
            <Button
              aria-label="移除竞品"
              className="competitor-analysis-candidate-action-remove competitor-analysis-candidate-action-remove-top"
              icon={<CloseOutlined />}
              loading={actionLoading === `candidate-removed-${keywordId}-${candidate.id}`}
              shape="circle"
              size="small"
              type="text"
              onClick={(event) => {
                event.stopPropagation()
                onCandidateStatusChange(keywordId, candidate.id, 'removed')
              }}
            />
          </Tooltip>
        ) : selectable && reviewStatus === 'pending' ? (
          <Checkbox
            aria-label={`选择竞品 ${candidate.noonProductCode}`}
            className="competitor-analysis-candidate-select"
            checked={selected}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) =>
              onCandidateSelectionChange?.(candidate.id, event.target.checked)
            }
          />
        ) : null}
        <div className="competitor-analysis-candidate-badges">
          {isOwnProduct ? <Tag color="blue">我的</Tag> : null}
          {isSponsored ? <Tag color="purple">广告</Tag> : null}
          <Tag color={rankPoint && isNotInRankRange(rankPoint.rankStatus) ? 'default' : 'gold'}>
            {formatRankStatus(rankPoint, candidate.latestRankNo)}
          </Tag>
        </div>
        <img src={candidate.imageUrl} alt="" />
        <span className="competitor-analysis-candidate-placeholder">
          {candidate.brand.slice(0, 2).toUpperCase()}
        </span>
      </div>

      <div className="competitor-analysis-candidate-body">
        <Text strong className="competitor-analysis-candidate-code">
          {candidate.noonProductCode}
        </Text>
        <Text
          className="competitor-analysis-candidate-title"
          ellipsis={{ tooltip: candidate.title }}
        >
          {candidate.title}
        </Text>
        <div className="competitor-analysis-candidate-meta">
          <Text type="secondary" className="competitor-analysis-candidate-brand">
            {candidate.brand}
          </Text>
          <Tag color={candidate.sourceType === 'manual_add' ? 'cyan' : 'geekblue'}>
            {candidate.sourceType === 'manual_add' ? '人工' : '搜索'}
          </Tag>
          <Space size={4} className="competitor-analysis-candidate-rating">
            {candidate.rating ? (
              <>
                <StarFilled />
                <Text>{candidate.rating}</Text>
                <Text type="secondary">({candidate.reviewCount || 0})</Text>
              </>
            ) : (
              <Text type="secondary">暂无评分</Text>
            )}
          </Space>
        </div>

        <div className="competitor-analysis-candidate-commerce">
          <Text strong className="competitor-analysis-candidate-price">
            {candidate.priceAmount ? (
              <>
                <span>{candidate.priceAmount}</span>
                {candidate.currencyCode ? (
                  <span className="competitor-analysis-candidate-price-currency">
                    {candidate.currencyCode}
                  </span>
                ) : null}
              </>
            ) : (
              '--'
            )}
          </Text>
          {!readonly && reviewStatus === 'pending' ? (
            <Space size={6} className="competitor-analysis-candidate-inline-actions">
              <Tooltip title="加入竞品">
                <Button
                  aria-label="加入竞品"
                  className="competitor-analysis-candidate-action-confirm"
                  disabled={batchLoading}
                  icon={<CheckOutlined />}
                  loading={actionLoading === `candidate-confirmed-${keywordId}-${candidate.id}`}
                  shape="circle"
                  size="small"
                  type="text"
                  onClick={(event) => {
                    event.stopPropagation()
                    onCandidateStatusChange(keywordId, candidate.id, 'confirmed')
                  }}
                />
              </Tooltip>
              <Tooltip title="忽略">
                <Button
                  aria-label="忽略竞品"
                  className="competitor-analysis-candidate-action-ignore"
                  disabled={batchLoading}
                  icon={<CloseOutlined />}
                  loading={actionLoading === `candidate-ignored-${keywordId}-${candidate.id}`}
                  shape="circle"
                  size="small"
                  type="text"
                  onClick={(event) => {
                    event.stopPropagation()
                    onCandidateStatusChange(keywordId, candidate.id, 'ignored')
                  }}
                />
              </Tooltip>
            </Space>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function openCandidateLink(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}
