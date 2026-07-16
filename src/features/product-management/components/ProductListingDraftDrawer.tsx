import { EditOutlined, FileTextOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Drawer, Empty, List, Space, Tag, Tooltip, Typography, message } from 'antd'
import { useCallback, useState } from 'react'
import { PURCHASE_LISTING_PATH, withCurrentWorkspaceDevQuery } from '../../app-shell/WorkspaceRouting'
import { fetchProductListingDrafts } from '../../product-listing/api'
import { openProductListingTargetInNewTab } from '../../product-listing/listingTabNavigation'
import { saveProductListingDraftRecoveryPrefill } from '../../product-listing/sourcePrefill'
import type { ProductListingDraftView } from '../../product-listing/types'

const { Text, Paragraph } = Typography

type ProductListingDraftDrawerProps = {
  storeCode?: string
  activeOwnerId?: number
}

export function ProductListingDraftDrawer({ storeCode, activeOwnerId }: ProductListingDraftDrawerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [drafts, setDrafts] = useState<ProductListingDraftView[]>([])

  const loadDrafts = useCallback(async () => {
    if (!storeCode) {
      message.warning('请先选择店铺后再查看上架草稿。')
      return
    }
    setLoading(true)
    try {
      setDrafts(await fetchProductListingDrafts(storeCode, 30))
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取上架草稿失败')
    } finally {
      setLoading(false)
    }
  }, [storeCode])

  const openDrawer = () => {
    setOpen(true)
    void loadDrafts()
  }

  const continueDraft = (draft: ProductListingDraftView) => {
    saveProductListingDraftRecoveryPrefill(draft)
    const params = new URLSearchParams({
      listingSource: 'listing-draft',
      listingDraftId: String(draft.draftId)
    })
    if (!openProductListingTargetInNewTab(withCurrentWorkspaceDevQuery(`${PURCHASE_LISTING_PATH}?${params.toString()}`))) {
      message.warning('浏览器拦截了上架新标签页，请允许弹窗后重试')
    }
  }

  return (
    <>
      <Tooltip title="查看当前店铺未完成的上架草稿">
        <Button
          icon={<FileTextOutlined />}
          onClick={openDrawer}
          disabled={!storeCode || !activeOwnerId}
        >
          上架草稿
        </Button>
      </Tooltip>
      <Drawer
        title="上架草稿"
        width={920}
        open={open}
        onClose={() => setOpen(false)}
        extra={
          <Tooltip title="刷新草稿">
            <Button aria-label="刷新草稿" icon={<ReloadOutlined />} loading={loading} onClick={() => void loadDrafts()} />
          </Tooltip>
        }
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Text type="secondary">当前店铺：{storeCode || '-'}</Text>
          <List<ProductListingDraftView>
            className="product-listing-draft-list"
            loading={loading}
            dataSource={drafts}
            rowKey={(record) => String(record.draftId)}
            pagination={{ pageSize: 8, showSizeChanger: false, showTotal: (total) => `共 ${total} 个草稿` }}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前店铺暂无上架草稿" /> }}
            renderItem={(record) => {
              const title = draftTitle(record)
              const draftNo = record.draftNo || `#${record.draftId}`
              return (
                <List.Item style={{ padding: '8px 0' }}>
                  <div
                    className="product-listing-draft-card"
                    style={{
                      width: '100%',
                      border: '1px solid #edf0f5',
                      borderRadius: 8,
                      padding: 14,
                      background: '#fff',
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) minmax(168px, 220px) max-content',
                      gap: 16,
                      alignItems: 'center'
                    }}
                  >
                    <Space direction="vertical" size={4} style={{ minWidth: 0 }}>
                      <Space size={8} wrap>
                        <Text strong ellipsis={{ tooltip: draftNo }} style={{ maxWidth: 220 }}>
                          {draftNo}
                        </Text>
                        <Tag color={draftStatusColor(record.status)} style={{ marginInlineEnd: 0 }}>
                          {draftStatusLabel(record.status)}
                        </Tag>
                      </Space>
                      <Text ellipsis={{ tooltip: record.draft?.psku || '-' }} style={{ maxWidth: '100%' }}>
                        {record.draft?.psku || '-'}
                      </Text>
                      <Paragraph
                        type="secondary"
                        ellipsis={{ rows: 2, tooltip: title || '-' }}
                        style={{ marginBottom: 0, maxWidth: '100%' }}
                      >
                        {title || '-'}
                      </Paragraph>
                    </Space>

                    <Space
                      className="product-listing-draft-source"
                      direction="vertical"
                      size={2}
                      style={{ minWidth: 0 }}
                    >
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        来源
                      </Text>
                      <Text strong ellipsis={{ tooltip: draftSourceLabel(record.draft?.sourceType) }} style={{ whiteSpace: 'nowrap' }}>
                        {draftSourceLabel(record.draft?.sourceType)}
                      </Text>
                      {record.draft?.sourceRefId ? (
                        <Text type="secondary" style={{ whiteSpace: 'nowrap' }}>
                          #{record.draft.sourceRefId}
                        </Text>
                      ) : null}
                    </Space>

                    <Button
                      icon={<EditOutlined />}
                      type="primary"
                      onClick={() => continueDraft(record)}
                      style={{ flexShrink: 0 }}
                    >
                      继续编辑
                    </Button>
                  </div>
                </List.Item>
              )
            }}
          />
        </Space>
      </Drawer>
    </>
  )
}

function draftTitle(record: ProductListingDraftView) {
  return (
    record.draft?.productTitleCn ||
    record.draft?.productTitleEn ||
    record.draft?.productTitleAr ||
    ''
  )
}

function draftStatusLabel(status?: string) {
  if (status === 'ready_for_dry_run') {
    return '可提交'
  }
  if (status === 'validation_failed') {
    return '需修改'
  }
  return '草稿'
}

function draftStatusColor(status?: string) {
  if (status === 'ready_for_dry_run') {
    return 'green'
  }
  if (status === 'validation_failed') {
    return 'orange'
  }
  return 'default'
}

function draftSourceLabel(sourceType?: string) {
  const normalized = sourceType?.trim().toLowerCase()
  if (normalized === 'manual_selection_group' || normalized === 'manual-selection-group') {
    return '人工选品'
  }
  if (normalized === 'manual_selection' || normalized === 'manual-selection') {
    return '人工采集'
  }
  if (normalized === 'pre_order_profit' || normalized === 'pre-order-profit') {
    return '选品池'
  }
  if (normalized === 'product_rebuild' || normalized === 'product-rebuild') {
    return '商品重建'
  }
  return sourceType || '-'
}
