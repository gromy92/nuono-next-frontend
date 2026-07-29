import { Button, Empty, Image, Space, Tag, Tooltip } from 'antd'
import { useMemo, type ReactNode } from 'react'
import type { CompetitorDashboardAttributeChangeItem } from './types'
import { ChartDaysSelector, PanelHeader } from './CompetitorDashboardCommon'
import { dashboardDaysSummary, type DashboardDays } from './dashboardShared'
import {
  attributeChangeTag,
  buildAttributeChangeDisplayModel,
  formatDashboardDate,
  isPriorityPriceChange,
  splitAttributeChangeItems
} from './competitorAttributeChangeModel'

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
    ? `${dateLabel}：未发现竞品列表信息变化`
    : `${dateLabel}：没有抓取到竞品列表快照，不能判断列表信息变化`
  const summary = totalChangeCount
    ? `${dashboardDaysSummary(days)} · 价格 ${splitItems.priceItems.length} 条 / 标题 ${splitItems.titleItems.length} 条`
    : snapshotCount > 0
      ? `${dashboardDaysSummary(days)} · ${snapshotCount} 个列表快照，未发现列表信息变化`
      : `${dashboardDaysSummary(days)} · 未抓取列表快照`

  return (
    <section className="competitor-analysis-dashboard-panel">
      <PanelHeader
        title="最近列表信息变化的竞品"
        explanation="列出所选时间范围内出现列表价格或标题变化的竞品，方便快速判断竞品动作。"
        summary={summary}
        action={
          <Space size={6} wrap>
            <ChartDaysSelector value={days} onChange={onDaysChange} ariaLabel="最近列表信息变化的竞品时间范围" />
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
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={loading ? '加载列表信息变化...' : emptyText} />
        </div>
      )}
    </section>
  )
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
  tag?: { color: string; text: string }
  action?: ReactNode
}) {
  return (
    <div className="competitor-analysis-price-change-product">
      <div className="competitor-analysis-price-change-media">
        <div className="competitor-analysis-price-change-thumb">
          {imageUrl ? <Image src={imageUrl} alt={`${eyebrow}商品图`} preview={{ mask: '查看大图' }} /> : <span>无图</span>}
        </div>
        {underImageLines.length ? (
          <div className="competitor-analysis-price-change-image-meta">
            {underImageLines.map((line, index) => <span key={`${line}-${index}`}>{line}</span>)}
          </div>
        ) : null}
      </div>
      <div className="competitor-analysis-price-change-product-text">
        <div className="competitor-analysis-price-change-heading">
          <span className="competitor-analysis-price-change-eyebrow">{eyebrow}</span>
          {codeHref ? (
            <a className="competitor-analysis-price-change-code" href={codeHref} target="_blank" rel="noreferrer">{code}</a>
          ) : (
            <span className="competitor-analysis-price-change-code">{code}</span>
          )}
          {action ? <div className="competitor-analysis-price-change-action">{action}</div> : null}
        </div>
        <strong className="competitor-analysis-price-change-primary">
          {tag ? <Tag color={tag.color}>{tag.text}</Tag> : null}
          {primaryLine}
        </strong>
        {lines.map((line, index) => (
          <ChangeLine key={`${line}-${index}`} line={line} href={lineHrefs?.[index]} />
        ))}
      </div>
    </div>
  )
}

function ChangeLine({ line, href }: { line: string; href?: string }) {
  const content = (
    <span className="competitor-analysis-price-change-line" data-tooltip={shouldShowLineTooltip(line) ? line : undefined}>
      {href ? (
        <a className="competitor-analysis-price-change-line-link" href={href} target="_blank" rel="noreferrer">{line}</a>
      ) : (
        <span className="competitor-analysis-price-change-line-text">{line}</span>
      )}
    </span>
  )
  return shouldShowLineTooltip(line) ? (
    <Tooltip title={line} mouseEnterDelay={0.25} overlayClassName="competitor-analysis-price-change-line-tooltip">
      {content}
    </Tooltip>
  ) : content
}

function shouldShowLineTooltip(line: string) {
  return line.startsWith('原标题：') || line.startsWith('新标题：')
}
