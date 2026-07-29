import { Avatar, Button, Empty, Input, List, Segmented, Space, Spin, Tag, Typography } from 'antd'
import type { Dispatch, SetStateAction } from 'react'
import type { Ali1688HistoricalOrderProductLinkCandidate } from '../types'
import type { ProductLineRow, ProductLinkStatusFilter } from '../model/pageTypes'
import { productLinkEmptyText, productLinkTargetLabel } from '../model/productLinkModel'
import { productLinkDisplayText } from '../presentation/productCells'
import { renderInfoGrid, quantityText } from '../presentation/orderContextCells'
import { compactJoin } from '../presentation/orderText'

const { Text } = Typography

type Props = {
  productLinkRows: ProductLineRow[]
  canLinkActionProductRows: boolean
  productLinkRow: ProductLineRow | null
  canMutateProductLinks: boolean
  productLinkUnlinkingAssignmentId?: number
  submitProductUnlinkFromModal: (assignmentId?: number) => Promise<void>
  canShowProductCandidateSearch: boolean
  productLinkSearch: string
  setProductLinkSearch: Dispatch<SetStateAction<string>>
  selectedProductCandidate: Ali1688HistoricalOrderProductLinkCandidate | null
  setSelectedProductCandidate: Dispatch<SetStateAction<Ali1688HistoricalOrderProductLinkCandidate | null>>
  productLinkStatusFilter: ProductLinkStatusFilter
  changeProductLinkStatusFilter: (status: ProductLinkStatusFilter) => Promise<void>
  productLinkLoading: boolean
  filteredProductLinkCandidates: Ali1688HistoricalOrderProductLinkCandidate[]
  productLinkCandidateCount: number
}

export function Ali1688ProductLinkEditor({
  productLinkRows, canLinkActionProductRows, productLinkRow,
  canMutateProductLinks, productLinkUnlinkingAssignmentId,
  submitProductUnlinkFromModal, canShowProductCandidateSearch,
  productLinkSearch, setProductLinkSearch, selectedProductCandidate,
  setSelectedProductCandidate, productLinkStatusFilter,
  changeProductLinkStatusFilter, productLinkLoading,
  filteredProductLinkCandidates, productLinkCandidateCount
}: Props) {
    return (
      <div className="ali1688-product-link-modal">
        <section className="ali1688-product-link-source">
          {productLinkRows.length > 1 ? (
            <Space direction="vertical" size={8}>
              <Text strong>已选 {productLinkRows.length} 条货品行</Text>
              {renderInfoGrid([
                { label: '分配店铺', value: productLinkTargetLabel(productLinkRows[0]?.item) },
                { label: '关联方式', value: canLinkActionProductRows ? '批量关联到同一个店铺商品' : '保存分配后批量关联' }
              ])}
              <List
                size="small"
                dataSource={productLinkRows}
                renderItem={(row) => (
                  <List.Item>
                    <Text>{row.item?.title || '未返回'}</Text>
                    <Text type="secondary">{compactJoin([row.order.orderNo, quantityText(row.item)], ' · ')}</Text>
                  </List.Item>
                )}
              />
            </Space>
          ) : (
            <>
              <Text strong>{productLinkRow?.item?.title || '未返回'}</Text>
              {renderInfoGrid([
                { label: '规格', value: compactJoin([productLinkRow?.item?.skuText, productLinkRow?.item?.modelText], ' / ') },
                { label: '货号', value: productLinkRow?.item?.productCode || productLinkRow?.item?.singleProductCode },
                { label: '供应商', value: productLinkRow?.order.supplierName },
                { label: '数量', value: quantityText(productLinkRow?.item) },
                { label: '分配店铺', value: productLinkTargetLabel(productLinkRow?.item) },
                { label: '当前关联', value: productLinkDisplayText(productLinkRow?.item?.productLink) }
              ])}
              {canMutateProductLinks && productLinkRow?.item?.productLink?.skuParent && productLinkRow.item.assignmentId ? (
                <Button
                  danger
                  size="small"
                  loading={productLinkUnlinkingAssignmentId === productLinkRow.item.assignmentId}
                  onClick={() => void submitProductUnlinkFromModal(productLinkRow.item?.assignmentId)}
                >
                  解除关联
                </Button>
              ) : null}
            </>
          )}
        </section>
        <section className="ali1688-product-link-candidates">
          {canShowProductCandidateSearch ? (
            <>
              <div className="ali1688-product-link-filter">
                <Input.Search
                  allowClear
                  aria-label="搜索商品"
                  placeholder="搜索 SKU Parent / Partner SKU / PSKU / 标题"
                  value={productLinkSearch}
                  onChange={(event) => {
                    setSelectedProductCandidate(null)
                    setProductLinkSearch(event.target.value)
                  }}
                  onSearch={(value) => {
                    setSelectedProductCandidate(null)
                    setProductLinkSearch(value)
                  }}
                />
                <Segmented
                  value={productLinkStatusFilter}
                  options={[
                    { label: '全部', value: 'all' },
                    { label: '未关联', value: 'unlinked' },
                    { label: '已关联', value: 'linked' }
                  ]}
                  onChange={(value) => void changeProductLinkStatusFilter(value as ProductLinkStatusFilter)}
                />
              </div>
              <Spin spinning={productLinkLoading}>
                <List
                  size="small"
                  dataSource={filteredProductLinkCandidates}
                  className="ali1688-product-link-candidate-list"
                  locale={{ emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={productLinkCandidateCount ? '没有匹配的商品' : productLinkEmptyText(productLinkStatusFilter)}
                    />
                  ) }}
                  renderItem={(product) => {
                    const selected = selectedProductCandidate?.skuParent === product.skuParent
                    return (
                      <List.Item
                        className={selected ? 'ali1688-product-link-candidate-selected' : undefined}
                        onClick={() => setSelectedProductCandidate(product)}
                        actions={[
                          <Button key="select" type={selected ? 'primary' : 'default'} size="small">
                            {selected ? '已选择' : '选择'}
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<Avatar shape="square" size={48} src={product.productImageUrl} />}
                          title={<Text>{product.productTitle || product.skuParent}</Text>}
                          description={
                            <Space size={6} wrap>
                              <Tag>SKU {product.skuParent}</Tag>
                              {product.partnerSku ? <Tag>Partner {product.partnerSku}</Tag> : null}
                              {product.pskuCode ? <Tag>Noon pskuCode {product.pskuCode}</Tag> : null}
                              {product.siteCode ? <Text type="secondary">{product.siteCode}</Text> : null}
                              {product.linkStatus === 'linked'
                                ? <Tag color="blue">已关联{product.linkedAssignmentCount ? ` ${product.linkedAssignmentCount}` : ''}</Tag>
                                : <Tag color="default">未关联</Tag>}
                            </Space>
                          }
                        />
                      </List.Item>
                    )
                  }}
                />
              </Spin>
            </>
          ) : null}
        </section>
      </div>
    )
  }
