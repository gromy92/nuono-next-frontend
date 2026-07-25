import { CopyOutlined } from '@ant-design/icons'
import { Button, Empty, Input, Select, Tag, Tooltip, Typography } from 'antd'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  type ProductImageProfileMissingField,
  type ProductImageProfileReadinessStatus,
  type ProductImageSummaryStatus
} from './profileSummaryStatus'
import { productProfileVirtualWindow } from './virtualProfileList'
import './ProductImageProfileSidebar.css'

const { Text } = Typography

export type ProductImageReadinessFilter = 'ALL' | ProductImageProfileReadinessStatus
export type ProductImageStatusFilter = 'ALL' | ProductImageSummaryStatus

export type ProductImageProfileSidebarItem = {
  activeSuiteCount: number
  coverImageUrl?: string
  id: string
  imageStatus: ProductImageSummaryStatus
  missingProfileFields: ProductImageProfileMissingField[]
  productTitle: string
  profileReadinessStatus: ProductImageProfileReadinessStatus
  pskuCode: string
}

type ProductImageProfileSidebarProps = {
  allItems: ProductImageProfileSidebarItem[]
  imageStatusFilter: ProductImageStatusFilter
  items: ProductImageProfileSidebarItem[]
  keyword: string
  loading: boolean
  onCopyPsku: (pskuCode: string, sourceElement?: HTMLElement | null) => void
  onImageStatusFilterChange: (value: ProductImageStatusFilter) => void
  onKeywordChange: (value: string) => void
  onReadinessFilterChange: (value: ProductImageReadinessFilter) => void
  onSelect: (id: string) => void
  readinessFilter: ProductImageReadinessFilter
  renderThumbnail: (item: ProductImageProfileSidebarItem) => ReactNode
  selectedId?: string
}

const readinessMeta: Record<ProductImageProfileReadinessStatus, { color: string; label: string }> = {
  COMPLETE: { color: 'success', label: '资料完整' },
  INCOMPLETE: { color: 'warning', label: '待补充' }
}

export const imageSummaryStatusMeta: Record<ProductImageSummaryStatus, { color: string; label: string }> = {
  NOT_REQUESTED: { color: 'default', label: '未申请' },
  CANDIDATE: { color: 'blue', label: '候选' },
  GENERATING: { color: 'processing', label: '制作中' },
  PENDING_CONFIRMATION: { color: 'warning', label: '待确认' },
  PUBLISHING: { color: 'processing', label: '发布中' },
  ONLINE: { color: 'success', label: '已上线' },
  ACTION_REQUIRED: { color: 'error', label: '需处理' }
}

const missingFieldLabel: Record<ProductImageProfileMissingField, string> = {
  BRAND: '品牌',
  BILINGUAL_TITLE: '英文或阿语标题',
  SPEC_SUMMARY: '规格摘要',
  PRODUCT_FACTS: '商品事实资料',
  BASE_IMAGE: '基础图片'
}

function countBy<T extends string>(items: ProductImageProfileSidebarItem[], value: (item: ProductImageProfileSidebarItem) => T) {
  return items.reduce<Partial<Record<T, number>>>((counts, item) => {
    const key = value(item)
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {})
}

export function ProductImageProfileSidebar({
  allItems,
  imageStatusFilter,
  items,
  keyword,
  loading,
  onCopyPsku,
  onImageStatusFilterChange,
  onKeywordChange,
  onReadinessFilterChange,
  onSelect,
  readinessFilter,
  renderThumbnail,
  selectedId
}: ProductImageProfileSidebarProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(640)
  const listRef = useRef<HTMLDivElement | null>(null)
  const readinessCounts = useMemo(() => countBy(allItems, (item) => item.profileReadinessStatus), [allItems])
  const imageStatusCounts = useMemo(() => countBy(allItems, (item) => item.imageStatus), [allItems])
  const windowed = useMemo(
    () => productProfileVirtualWindow(items.length, scrollTop, viewportHeight),
    [items.length, scrollTop, viewportHeight]
  )
  const visibleItems = useMemo(
    () => items.slice(windowed.startIndex, windowed.endIndex),
    [items, windowed.endIndex, windowed.startIndex]
  )

  useEffect(() => {
    setScrollTop(0)
    if (listRef.current) listRef.current.scrollTop = 0
  }, [imageStatusFilter, keyword, readinessFilter])

  useEffect(() => {
    const node = listRef.current
    if (!node) return undefined
    const updateViewportHeight = () => setViewportHeight(node.clientHeight || 640)
    updateViewportHeight()
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(updateViewportHeight)
    observer.observe(node)
    return () => observer.disconnect()
  }, [items.length])

  const readinessOptions = [
    { label: `全部资料（${allItems.length}）`, selectedLabel: '全部资料', value: 'ALL' },
    { label: `资料完整（${readinessCounts.COMPLETE ?? 0}）`, selectedLabel: '资料完整', value: 'COMPLETE' },
    { label: `待补充（${readinessCounts.INCOMPLETE ?? 0}）`, selectedLabel: '待补充', value: 'INCOMPLETE' }
  ]
  const imageStatusOptions = [
    { label: `全部图片（${allItems.length}）`, selectedLabel: '全部图片', value: 'ALL' },
    ...Object.entries(imageSummaryStatusMeta).map(([value, meta]) => ({
      label: `${meta.label}（${imageStatusCounts[value as ProductImageSummaryStatus] ?? 0}）`,
      selectedLabel: meta.label,
      value
    }))
  ]

  return (
    <aside className="product-image-profile-sidebar">
      <div className="product-image-profile-sidebar-head">
        <strong>PSKU</strong>
        <Text type="secondary">{loading ? '加载中' : `${items.length} / ${allItems.length} 个`}</Text>
      </div>
      <div className="product-image-profile-sidebar-search">
        <Input.Search
          allowClear
          placeholder="搜索 PSKU / 标题 / 品牌"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          onSearch={onKeywordChange}
        />
        <div className="product-image-profile-sidebar-filters">
          <Select
            aria-label="资料状态"
            optionLabelProp="selectedLabel"
            options={readinessOptions}
            size="small"
            value={readinessFilter}
            onChange={onReadinessFilterChange}
          />
          <Select
            aria-label="图片状态"
            optionLabelProp="selectedLabel"
            options={imageStatusOptions}
            size="small"
            value={imageStatusFilter}
            onChange={onImageStatusFilterChange}
          />
        </div>
      </div>
      <div
        className="product-image-profile-product-list"
        ref={listRef}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        {windowed.topPadding ? <div aria-hidden="true" style={{ height: windowed.topPadding }} /> : null}
        {visibleItems.map((item) => {
          const readiness = readinessMeta[item.profileReadinessStatus]
          const imageStatus = imageSummaryStatusMeta[item.imageStatus]
          const missingText = item.missingProfileFields.map((field) => missingFieldLabel[field]).join('、')
          const readinessDetail = missingText ? `缺少：${missingText}` : (item.profileReadinessStatus === 'COMPLETE' ? '已满足申请做图的资料要求' : '资料缺失项待刷新')
          const otherSuiteCount = Math.max(0, item.activeSuiteCount - 1)
          return (
            <div
              aria-pressed={item.id === selectedId}
              className={`product-image-profile-product-card${item.id === selectedId ? ' is-active' : ''}`}
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(item.id)}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelect(item.id)
                }
              }}
            >
              <span className="product-image-profile-product-row">
                {renderThumbnail(item)}
                <span className="product-image-profile-product-copy">
                  <Tooltip title={item.productTitle} placement="right">
                    <strong title={item.productTitle}>{item.productTitle}</strong>
                  </Tooltip>
                  <small className="product-image-profile-product-psku">
                    <span title={item.pskuCode} onClick={(event) => {
                      event.stopPropagation()
                      onCopyPsku(item.pskuCode, event.currentTarget)
                    }}>
                      {item.pskuCode}
                    </span>
                    <Tooltip title="复制 PSKU">
                      <Button
                        aria-label={`复制 ${item.pskuCode}`}
                        className="product-image-profile-product-copy-button"
                        icon={<CopyOutlined />}
                        size="small"
                        type="text"
                        onClick={(event) => {
                          event.stopPropagation()
                          onCopyPsku(item.pskuCode, event.currentTarget.previousElementSibling as HTMLElement | null)
                        }}
                      />
                    </Tooltip>
                  </small>
                </span>
              </span>
              <span className="product-image-profile-product-statuses">
                <Tooltip title={readinessDetail}>
                  <Tag color={readiness.color}>{readiness.label}</Tag>
                </Tooltip>
                <Tooltip title={otherSuiteCount ? `另有 ${otherSuiteCount} 套有效套图，完整状态请在右侧查看` : undefined}>
                  <Tag color={imageStatus.color}>
                    {imageStatus.label}{otherSuiteCount ? ` +${otherSuiteCount}` : ''}
                  </Tag>
                </Tooltip>
              </span>
            </div>
          )
        })}
        {!items.length && !loading ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有符合条件的 PSKU" /> : null}
        {windowed.bottomPadding ? <div aria-hidden="true" style={{ height: windowed.bottomPadding }} /> : null}
      </div>
    </aside>
  )
}
