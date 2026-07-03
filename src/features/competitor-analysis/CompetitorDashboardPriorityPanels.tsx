import { Button, Empty, Image, Space, Tag, Tooltip } from 'antd'
import { useMemo, type ReactNode } from 'react'
import { EChartPanel } from '../../shared/charts'
import { buildRankChangeChartOption } from './dashboardCharts'
import type { CompetitorDashboardAttributeChangeItem, CompetitorDashboardRankChangeItem } from './types'
import { ChartDaysSelector, PanelHeader, RankDirectionSelector } from './CompetitorDashboardCommon'
import { dashboardDaysSummary, type DashboardDays, type RankChangeDirection } from './dashboardShared'

export function RankChangePanel({
  title,
  explanation,
  loading,
  days,
  onDaysChange,
  direction,
  onDirectionChange,
  items,
  emptyText,
  testId,
  fullWidth,
  onItemClick
}: {
  title: string
  explanation: string
  loading: boolean
  days: DashboardDays
  onDaysChange: (days: DashboardDays) => void
  direction?: RankChangeDirection
  onDirectionChange?: (direction: RankChangeDirection) => void
  items: CompetitorDashboardRankChangeItem[]
  emptyText: string
  testId: string
  fullWidth?: boolean
  onItemClick: (item: CompetitorDashboardRankChangeItem) => void
}) {
  const chartOption = useMemo(() => buildRankChangeChartOption(items, title), [items, title])
  const chartItems = useMemo(() => items.slice(0, 100), [items])
  const directionLabel = direction ? rankDirectionLabel(direction) : '最新'

  return (
    <section className={`competitor-analysis-dashboard-panel competitor-analysis-dashboard-priority-panel${fullWidth ? ' competitor-analysis-dashboard-priority-panel-wide' : ''}`}>
      <PanelHeader
        title={title}
        explanation={explanation}
        summary={`${dashboardDaysSummary(days)} · ${directionLabel} ${items.length} 条关键词变化`}
        action={
          <Space size={6} wrap>
            <ChartDaysSelector value={days} onChange={onDaysChange} ariaLabel={`${title}时间范围`} />
            {direction && onDirectionChange ? (
              <RankDirectionSelector value={direction} onChange={onDirectionChange} ariaLabel={`${title}方向`} />
            ) : null}
          </Space>
        }
      />
      <EChartPanel
        option={chartOption}
        state={loading ? 'loading' : items.length ? 'ready' : 'empty'}
        emptyText={emptyText}
        height={fullWidth ? 320 : 260}
        testId={testId}
        ariaLabel={title}
        onChartClick={(params) => {
          const item = typeof params.dataIndex === 'number' ? chartItems[params.dataIndex] : undefined
          if (item) onItemClick(item)
        }}
      />
    </section>
  )
}

function rankDirectionLabel(direction: RankChangeDirection) {
  return direction === 'UP' ? '增长 Top' : '下降 Top'
}

export function CompetitorAttributeChangePanel({
  loading,
  items,
  snapshotCount,
  changeDate,
  days,
  onDaysChange,
  siteCode,
  onItemClick
}: {
  loading: boolean
  items: CompetitorDashboardAttributeChangeItem[]
  snapshotCount: number
  changeDate?: string
  days: DashboardDays
  onDaysChange: (days: DashboardDays) => void
  siteCode?: string
  onItemClick: (item: CompetitorDashboardAttributeChangeItem) => void
}) {
  const splitItems = useMemo(() => splitAttributeChangeItems(items), [items])
  const totalChangeCount = splitItems.priceItems.length + splitItems.titleItems.length
  const dateLabel = formatDashboardDate(changeDate) || dashboardDaysSummary(days)
  const emptyText = snapshotCount > 0
    ? `${dateLabel}：未发现竞品详情变化`
    : `${dateLabel}：没有抓取到竞品详情快照，不能判断详情变化`
  const summary = totalChangeCount
    ? `${dashboardDaysSummary(days)} · 价格 ${splitItems.priceItems.length} 条 / 标题 ${splitItems.titleItems.length} 条`
    : snapshotCount > 0
      ? `${dashboardDaysSummary(days)} · ${snapshotCount} 个详情快照，未发现详情变化`
      : `${dashboardDaysSummary(days)} · 未抓取详情快照`

  return (
    <section className="competitor-analysis-dashboard-panel">
      <PanelHeader
        title="最近详情变化的竞品"
        explanation="列出所选时间范围内出现价格或标题变化的竞品，方便快速判断竞品动作。"
        summary={summary}
        action={
          <Space size={6} wrap>
            <ChartDaysSelector value={days} onChange={onDaysChange} ariaLabel="最近详情变化的竞品时间范围" />
          </Space>
        }
      />
      {totalChangeCount ? (
        <div className="competitor-analysis-detail-change-tables" data-testid="competitor-dashboard-detail-change-tables">
          <AttributeChangeTable
            title="价格变化"
            items={splitItems.priceItems}
            emptyText={`${dateLabel}：未发现价格变化`}
            siteCode={siteCode}
            onItemClick={onItemClick}
          />
          <AttributeChangeTable
            title="标题变化"
            items={splitItems.titleItems}
            emptyText={`${dateLabel}：未发现标题变化`}
            siteCode={siteCode}
            onItemClick={onItemClick}
          />
        </div>
      ) : (
        <div className="competitor-analysis-dashboard-empty">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={loading ? '加载详情变化...' : emptyText} />
        </div>
      )}
    </section>
  )
}

function formatDashboardDate(date?: string) {
  if (!date) return ''
  return date.length >= 10 ? date.slice(5, 10) : date
}

function AttributeChangeTable({
  title,
  items,
  emptyText,
  siteCode,
  onItemClick
}: {
  title: string
  items: CompetitorDashboardAttributeChangeItem[]
  emptyText: string
  siteCode?: string
  onItemClick: (item: CompetitorDashboardAttributeChangeItem) => void
}) {
  return (
    <section className="competitor-analysis-detail-change-table" data-testid={`competitor-dashboard-${title === '价格变化' ? 'price' : 'title'}-change-table`}>
      <div className="competitor-analysis-detail-change-table-header">
        <strong>{title}</strong>
        <span>{items.length} 条</span>
      </div>
      {items.length ? (
        <div className="competitor-analysis-price-change-list">
          {items.map((item, index) => {
            const display = buildAttributeChangeDisplayModel(item, siteCode)
            return (
              <article
                className={`competitor-analysis-price-change-item${isPriorityPriceChange(item) ? ' competitor-analysis-price-change-item-priority' : ''}`}
                key={`${item.watchProductId || item.partnerSku}-${item.noonProductCode}-${item.changeType}-${item.currentDate || index}-${index}`}
              >
                <ProductPriceChangeBlock
                  imageUrl={item.productImageUrl}
                  eyebrow={display.self.eyebrow}
                  code={display.self.code}
                  underImageLines={display.self.underImageLines}
                  primaryLine={display.self.primaryLine}
                  lines={display.self.lines}
                  lineHrefs={display.self.lineHrefs}
                />
                <ProductPriceChangeBlock
                  imageUrl={item.competitorImageUrl}
                  eyebrow={display.competitor.eyebrow}
                  code={display.competitor.code}
                  codeHref={display.competitor.codeHref}
                  underImageLines={display.competitor.underImageLines}
                  primaryLine={display.competitor.primaryLine}
                  lines={display.competitor.lines}
                  lineHrefs={display.competitor.lineHrefs}
                  tag={attributeChangeTag(item)}
                  action={
                    <Button
                      className="competitor-analysis-price-change-action-button"
                      size="small"
                      type="text"
                      title="打开商品分析"
                      onClick={() => onItemClick(item)}
                    >
                      分析
                    </Button>
                  }
                />
              </article>
            )
          })}
        </div>
      ) : (
        <div className="competitor-analysis-detail-change-table-empty">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
        </div>
      )}
    </section>
  )
}

function ProductPriceChangeBlock({
  imageUrl,
  eyebrow,
  code,
  codeHref,
  underImageLines,
  primaryLine,
  lines,
  lineHrefs,
  tag,
  action
}: {
  imageUrl?: string
  eyebrow: string
  code: string
  codeHref?: string
  underImageLines: string[]
  primaryLine: string
  lines: string[]
  lineHrefs?: Array<string | undefined>
  tag?: {
    color: string
    text: string
  }
  action?: ReactNode
}) {
  return (
    <div className="competitor-analysis-price-change-product">
      <div className="competitor-analysis-price-change-media">
        <div className="competitor-analysis-price-change-thumb">
          {imageUrl ? (
            <Image src={imageUrl} alt={`${eyebrow}商品图`} preview={{ mask: '查看大图' }} />
          ) : (
            <span>无图</span>
          )}
        </div>
        {underImageLines.length ? (
          <div className="competitor-analysis-price-change-image-meta">
            {underImageLines.map((line, index) => (
              <span key={`${line}-${index}`}>{line}</span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="competitor-analysis-price-change-product-text">
        <div className="competitor-analysis-price-change-heading">
          <span className="competitor-analysis-price-change-eyebrow">{eyebrow}</span>
          {codeHref ? (
            <a
              className="competitor-analysis-price-change-code"
              href={codeHref}
              target="_blank"
              rel="noreferrer"
            >
              {code}
            </a>
          ) : (
            <span className="competitor-analysis-price-change-code">{code}</span>
          )}
          {action ? <div className="competitor-analysis-price-change-action">{action}</div> : null}
        </div>
        <strong className="competitor-analysis-price-change-primary">
          {tag ? <Tag color={tag.color}>{tag.text}</Tag> : null}
          {primaryLine}
        </strong>
        {lines.map((line, index) => {
          const lineHref = lineHrefs?.[index]
          const lineContent = (
            <span
              className="competitor-analysis-price-change-line"
              data-tooltip={shouldShowLineTooltip(line) ? line : undefined}
            >
              {lineHref ? (
                <a
                  className="competitor-analysis-price-change-line-link"
                  href={lineHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  {line}
                </a>
              ) : (
                <span className="competitor-analysis-price-change-line-text">{line}</span>
              )}
            </span>
          )
          if (!shouldShowLineTooltip(line)) {
            return <span key={`${line}-${index}`}>{lineContent}</span>
          }
          return (
            <Tooltip
              key={`${line}-${index}`}
              title={line}
              mouseEnterDelay={0.25}
              overlayClassName="competitor-analysis-price-change-line-tooltip"
            >
              {lineContent}
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}

function shouldShowLineTooltip(line: string) {
  return line.startsWith('原标题：') || line.startsWith('新标题：')
}

type ProductPriceChangeSummary = {
  previousValue: string
  currentValue: string
  currentDate?: string
  latestValue?: string
  missingSnapshot?: boolean
}

export type PriceChangeDisplaySide = {
  eyebrow: string
  code: string
  codeHref?: string
  underImageLines: string[]
  primaryLine: string
  lines: string[]
  lineHrefs?: Array<string | undefined>
}

export type PriceChangeDisplayModel = {
  self: PriceChangeDisplaySide
  competitor: PriceChangeDisplaySide
}

export function splitAttributeChangeItems(items: CompetitorDashboardAttributeChangeItem[]) {
  const priceItems = items.filter((item) => item.changeType === 'PRICE')
  return {
    priceItems: sortPriorityPriceChanges(priceItems),
    titleItems: items.filter((item) => item.changeType === 'TITLE')
  }
}

function sortPriorityPriceChanges(items: CompetitorDashboardAttributeChangeItem[]) {
  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const leftPriority = isPriorityPriceChange(left.item) ? 1 : 0
      const rightPriority = isPriorityPriceChange(right.item) ? 1 : 0
      return rightPriority - leftPriority || left.index - right.index
    })
    .map(({ item }) => item)
}

export function isPriorityPriceChange(item: CompetitorDashboardAttributeChangeItem) {
  if (item.changeType !== 'PRICE') {
    return false
  }
  return competitorPriceLowerThanSelf(item) || competitorRankHigherThanSelf(item)
}

function competitorPriceLowerThanSelf(item: CompetitorDashboardAttributeChangeItem) {
  const competitorPrice = numericPrice(item.currentValue)
  const selfPrice = currentSelfPriceNumber(item)
  return competitorPrice !== undefined && selfPrice !== undefined && competitorPrice < selfPrice
}

function currentSelfPriceNumber(item: CompetitorDashboardAttributeChangeItem) {
  const priceChange = selfPriceChangeSummary(item)
  if (!priceChange || priceChange.missingSnapshot) {
    return undefined
  }
  return numericPrice(priceChange.currentValue || priceChange.latestValue || '')
}

function competitorRankHigherThanSelf(item: CompetitorDashboardAttributeChangeItem) {
  if (!item.latestRankNo) {
    return false
  }
  if (item.selfLatestRankStatus !== 'ranked' || !item.selfLatestRankNo) {
    return true
  }
  return item.latestRankNo < item.selfLatestRankNo
}

export function buildAttributeChangeDisplayModel(item: CompetitorDashboardAttributeChangeItem, siteCode = 'SA'): PriceChangeDisplayModel {
  const selfPrice = selfPriceChangeSummary(item)
  const selfCurrentPrice = currentSelfPriceText(selfPrice)
  const selfKeyword = item.selfLatestRankKeyword || item.latestRankKeyword || '暂无关键词'
  const selfKeywordHref = selfKeyword === '暂无关键词' ? undefined : buildNoonSearchUrl(selfKeyword, siteCode)
  const competitorChange = competitorChangeSummary(item)
  return {
    self: {
      eyebrow: '我的商品',
      code: item.partnerSku || '-',
      underImageLines: [selfRankText(item)],
      primaryLine: `当前价格：${selfCurrentPrice}`,
      lines: [
        `价格变化：${selfPriceChangeValueText(selfPrice)}`,
        `关键词：${selfKeyword}`
      ],
      lineHrefs: [undefined, selfKeywordHref]
    },
    competitor: {
      eyebrow: '竞品',
      code: item.noonProductCode || '-',
      codeHref: buildNoonProductSearchUrl(item.noonProductCode, siteCode),
      underImageLines: [rankImageText(item.latestRankNo)],
      primaryLine: competitorChange.primaryLine,
      lines: competitorChange.lines
    }
  }
}

export const buildPriceChangeDisplayModel = buildAttributeChangeDisplayModel

function buildNoonProductSearchUrl(productCode: string, siteCode = 'SA') {
  const code = normalizeNoonProductCode(productCode)
  return code ? buildNoonSearchUrl(code, siteCode) : undefined
}

function buildNoonSearchUrl(query: string, siteCode = 'SA') {
  const normalizedQuery = query.trim()
  return normalizedQuery ? `https://www.noon.com/${noonMarketPath(siteCode)}/search/?q=${encodeURIComponent(normalizedQuery)}` : undefined
}

function noonMarketPath(siteCode: string) {
  const normalized = siteCode.trim().toUpperCase()
  if (normalized === 'SA' || normalized === 'KSA') return 'saudi-en'
  if (normalized === 'EG') return 'egypt-en'
  return 'uae-en'
}

function normalizeNoonProductCode(value?: string) {
  return (value || '').trim().toUpperCase()
}

function selfPriceChangeSummary(item: CompetitorDashboardAttributeChangeItem): ProductPriceChangeSummary | undefined {
  if (!item.selfPreviousValue && !item.selfCurrentValue) {
    if (item.selfLatestValue || item.selfSnapshotCount > 0) {
      return {
        previousValue: '',
        currentValue: '',
        currentDate: formatFullDate(item.selfLatestDate),
        latestValue: formatPriceValue(item.selfLatestValue || '')
      }
    }
    return {
      previousValue: '',
      currentValue: '',
      missingSnapshot: true
    }
  }
  return {
    previousValue: formatPriceValue(item.selfPreviousValue || ''),
    currentValue: formatPriceValue(item.selfCurrentValue || ''),
    currentDate: formatFullDate(item.selfCurrentDate)
  }
}

function selfPriceChangeValueText(priceChange?: ProductPriceChangeSummary) {
  if (!priceChange || priceChange.missingSnapshot) {
    return '未抓取'
  }
  if (!priceChange.previousValue && !priceChange.currentValue) {
    return `最近无变化${priceChange.currentDate ? ` · ${priceChange.currentDate}` : ''}`
  }
  return `${priceChange.previousValue} -> ${priceChange.currentValue}${priceChange.currentDate ? ` · ${priceChange.currentDate}` : ''}`
}

function currentSelfPriceText(priceChange?: ProductPriceChangeSummary) {
  if (!priceChange || priceChange.missingSnapshot) {
    return '未抓取'
  }
  return priceChange.currentValue || priceChange.latestValue || '-'
}

function selfRankText(item: CompetitorDashboardAttributeChangeItem) {
  if (item.selfLatestRankStatus === 'ranked' && item.selfLatestRankNo) {
    return `第 ${item.selfLatestRankNo} 名`
  }
  if (item.selfLatestRankStatus === 'not_in_scan_depth') {
    return `未进前${item.selfLatestScanDepth || 100}`
  }
  if (item.selfLatestRankStatus === 'not_in_top_20') {
    return '未进前20'
  }
  return '暂无排名'
}

function rankImageText(rankNo?: number) {
  return rankNo ? `第 ${rankNo} 名` : '未进榜'
}

function rankChangeText(item: CompetitorDashboardAttributeChangeItem) {
  return `排名变化：${rankShortText(item.changeDateRankNo)} -> ${rankShortText(item.latestRankNo)}`
}

function rankShortText(rankNo?: number) {
  return rankNo ? `#${rankNo}` : '未进榜'
}

function competitorChangeSummary(item: CompetitorDashboardAttributeChangeItem) {
  const dateLine = `日期：${formatFullDate(item.currentDate) || '日期未知'}`
  const rankLine = rankChangeText(item)
  if (item.changeType === 'TITLE') {
    return {
      primaryLine: '标题变化',
      lines: [
        rankLine,
        `原标题：${formatChangeValue(item.previousValue)}`,
        `新标题：${formatChangeValue(item.currentValue)}`,
        dateLine
      ]
    }
  }
  return {
    primaryLine: `价格变化：${formatPriceValue(item.previousValue)} -> ${formatPriceValue(item.currentValue)}`,
    lines: [rankLine, dateLine]
  }
}

function priceChangeDirection(item: CompetitorDashboardAttributeChangeItem) {
  const previous = numericPrice(item.previousValue)
  const current = numericPrice(item.currentValue)
  if (previous === undefined || current === undefined) {
    return 'ALL'
  }
  if (current < previous) return 'DOWN'
  if (current > previous) return 'UP'
  return 'ALL'
}

function attributeChangeTag(item: CompetitorDashboardAttributeChangeItem) {
  if (item.changeType === 'TITLE') {
    return undefined
  }
  const direction = priceChangeDirection(item)
  if (direction === 'DOWN') return { color: 'red', text: '降价' }
  if (direction === 'UP') return { color: 'green', text: '涨价' }
  return { color: 'default', text: '价格' }
}

function numericPrice(value: string) {
  const match = String(value || '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)
  if (!match) return undefined
  const numericValue = Number(match[0])
  return Number.isFinite(numericValue) ? numericValue : undefined
}

function formatPriceValue(value: string) {
  const text = String(value || '').trim()
  if (!text) return '-'
  return text.replace(/^"|"$/g, '') || '-'
}

function formatChangeValue(value: string) {
  return formatPriceValue(value)
}

function formatFullDate(date?: string) {
  return date && date.length >= 10 ? date.slice(0, 10) : date
}
