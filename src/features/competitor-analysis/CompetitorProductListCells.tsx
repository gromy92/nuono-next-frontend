import { EditOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Tag, Tooltip, Typography } from 'antd'
import { buildNoonSearchUrl } from './competitorNoonLinks'
import { productTitleLines } from './competitorProductListModel'
import type {
  CompetitorKeyword,
  CompetitorWatchProduct
} from './types'

const { Text } = Typography

export function ProductTitleStack({
  titleLines
}: {
  titleLines: ReturnType<typeof productTitleLines>
}) {
  return (
    <span className="competitor-analysis-product-title-stack">
      <span className="competitor-analysis-product-title-cn">{titleLines.primary}</span>
      {titleLines.secondary ? (
        <Tooltip placement="topLeft" title={titleLines.secondary}>
          <span className="competitor-analysis-product-title-en">{titleLines.secondary}</span>
        </Tooltip>
      ) : null}
    </span>
  )
}

export function ProductKeywordLinks({
  product,
  onEdit
}: {
  product: CompetitorWatchProduct
  onEdit: () => void
}) {
  const activeKeywords = product.keywords
    .filter((keyword) => keyword.status === 'active' && keyword.keyword.trim())
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder)
  const visibleKeywords = activeKeywords.filter((keyword) => keyword.monitoredCount !== 0)
  const hiddenKeywordCount = activeKeywords.length - visibleKeywords.length

  return (
    <div className="competitor-analysis-keyword-cell">
      <div className="competitor-analysis-keyword-content">
        <div className="competitor-analysis-keyword-inline-list">
          {visibleKeywords.map((keyword) => {
            const rankChange = keywordRankChangeDisplay(keyword)
            return (
              <div className="competitor-analysis-keyword-row" key={keyword.id}>
                <a
                  className="competitor-analysis-keyword-link"
                  href={buildNoonSearchUrl(keyword.keyword, product.siteCode, product.id, keyword.id)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <SearchOutlined />
                  <span className="competitor-analysis-keyword-text">{keyword.keyword}</span>
                </a>
                <Tooltip title={rankChange.title}>
                  <Tag className="competitor-analysis-keyword-rank-tag" color={rankChange.color}>
                    {rankChange.label}
                  </Tag>
                </Tooltip>
              </div>
            )
          })}
          {hiddenKeywordCount ? (
            <Tag className="competitor-analysis-keyword-other-tag">其他 {hiddenKeywordCount} 个</Tag>
          ) : null}
          {!visibleKeywords.length && !hiddenKeywordCount ? <Text type="secondary">-</Text> : null}
        </div>
      </div>
      <Tooltip title="编辑关键词">
        <Button
          aria-label="编辑关键词"
          className="competitor-analysis-keyword-edit-button"
          icon={<EditOutlined />}
          size="small"
          type="text"
          onClick={onEdit}
        />
      </Tooltip>
    </div>
  )
}

function keywordRankChangeDisplay(keyword: CompetitorKeyword) {
  const change = keyword.selfRankChange
  const previousRankStatus = change?.previousRankStatus
  const rankStatus = change?.rankStatus
  if (!change || !previousRankStatus || !rankStatus) {
    return {
      label: '无数据',
      color: 'default' as const,
      title: '昨天到今天暂无可比本品排名'
    }
  }

  const title = `${change.previousDate || '昨天'} ${keywordRankValue(previousRankStatus, change.previousRankNo)} -> ${
    change.currentDate || '今天'
  } ${keywordRankValue(rankStatus, change.rankNo)}`
  if (previousRankStatus !== 'ranked' && rankStatus === 'ranked') {
    return { label: '进榜', color: 'green' as const, title }
  }
  if (previousRankStatus === 'ranked' && rankStatus !== 'ranked') {
    return { label: '出榜', color: 'red' as const, title }
  }
  if (previousRankStatus !== 'ranked' && rankStatus !== 'ranked') {
    return { label: '未进榜', color: 'default' as const, title }
  }
  const rankDelta = change.rankDelta
  if (typeof rankDelta === 'number' && Number.isFinite(rankDelta)) {
    if (rankDelta > 0) return { label: `升${rankDelta}名`, color: 'green' as const, title }
    if (rankDelta < 0) return { label: `降${Math.abs(rankDelta)}名`, color: 'red' as const, title }
  }
  return { label: '持平', color: 'default' as const, title }
}

function keywordRankValue(
  status: NonNullable<CompetitorKeyword['selfRankChange']>['rankStatus'],
  rankNo?: number
) {
  if (status === 'ranked') {
    return rankNo ? `第${rankNo}名` : '已进榜'
  }
  return '未进榜'
}
