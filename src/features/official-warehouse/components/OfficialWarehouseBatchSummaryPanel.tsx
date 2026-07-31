import { Alert, Button, Card, Col, List, Row, Skeleton, Space, Statistic, Tag, Typography } from 'antd'
import type {
  OfficialWarehouseBatchProductIssue,
  OfficialWarehouseBatchProductSummary
} from '../api'

const { Text } = Typography

type Props = {
  selectedBatchCount: number
  summary?: OfficialWarehouseBatchProductSummary
  loading: boolean
  error?: string
  onRetry: () => void
}

export function OfficialWarehouseBatchSummaryPanel({
  selectedBatchCount,
  summary,
  loading,
  error,
  onRetry
}: Props) {
  if (!selectedBatchCount) return null
  if (loading) {
    return (
      <Card size="small" title="所选物流批次商品汇总">
        <Skeleton active paragraph={{ rows: 2 }} />
      </Card>
    )
  }
  if (error || !summary) {
    return (
      <Alert
        type="error"
        showIcon
        message="物流批次商品汇总读取失败，暂不能创建 ASN"
        description={(
          <Space direction="vertical">
            <Text>{error || '未取得汇总结果，请重试。'}</Text>
            <Button size="small" onClick={onRetry}>重试</Button>
          </Space>
        )}
      />
    )
  }

  const current = summary.currentStore
  const otherBlockedItems = current.blockedItems
    .map((item) => ({ ...item, reasons: item.reasons.filter((reason) => reason !== '缺尺寸') }))
    .filter((item) => item.reasons.length)

  return (
    <Card
      size="small"
      title="所选物流批次商品汇总"
      extra={<Text type="secondary">物流单原始 {number(summary.totalLineCount)} 行，重复 SKU 已合并</Text>}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <Statistic
              title="整票商品"
              value={summary.totalQuantity}
              suffix={`件 / ${number(summary.totalSkuCount)} SKU`}
            />
          </Col>
          <Col xs={24} md={8}>
            <Statistic
              title={`当前店铺 · ${current.storeName || current.storeCode}`}
              value={current.totalQuantity}
              suffix={`件 / ${number(current.totalSkuCount)} SKU`}
            />
          </Col>
          <Col xs={24} md={8}>
            <Statistic
              title="当前店铺可约"
              value={current.bookableQuantity || 0}
              valueStyle={{ color: '#1677ff' }}
              suffix={`件 / ${number(current.bookableSkuCount || 0)} SKU`}
            />
          </Col>
        </Row>

        {current.missingDimensionItems.length ? (
          <Alert
            type="warning"
            showIcon
            message={`缺尺寸：${number(current.missingDimensionSkuCount || 0)} SKU / ${number(current.missingDimensionQuantity || 0)} 件`}
            description={<IssueList items={current.missingDimensionItems} />}
          />
        ) : (
          <Alert type="success" showIcon message="当前店铺没有缺尺寸商品" />
        )}

        {otherBlockedItems.length ? (
          <Alert
            type="error"
            showIcon
            message="当前店铺还有其他不可约商品"
            description={<IssueList items={otherBlockedItems} />}
          />
        ) : null}

        {summary.otherStores.length ? (
          <Alert
            type="info"
            showIcon
            message={`别的店铺：${summary.otherStores.length} 家`}
            description={(
              <List
                size="small"
                dataSource={summary.otherStores}
                renderItem={(store) => (
                  <List.Item>
                    <Text>
                      {store.storeName || store.storeCode}（{store.storeCode} / {store.siteCode}）：
                      {number(store.totalQuantity)} 件 / {number(store.totalSkuCount)} SKU
                    </Text>
                  </List.Item>
                )}
              />
            )}
          />
        ) : (
          <Alert type="info" showIcon message="别的有权限店铺没有这票商品" />
        )}

        {summary.unassignedQuantity > 0 ? (
          <Alert
            type="warning"
            showIcon
            message={`未归属或无权查看：${number(summary.unassignedQuantity)} 件 / ${number(summary.unassignedSkuCount)} SKU`}
            description="这部分没有归属到当前账号有权限查看的店铺，需要核对物流商品编码或店铺权限。"
          />
        ) : null}
        {summary.attributionWarning ? (
          <Alert
            type="warning"
            showIcon
            message="存在跨店铺重复匹配，请先核对商品归属"
          />
        ) : null}
      </Space>
    </Card>
  )
}

function IssueList({ items }: { items: OfficialWarehouseBatchProductIssue[] }) {
  return (
    <List
      size="small"
      dataSource={items}
      renderItem={(item) => (
        <List.Item>
          <Space size={6} wrap>
            <Text strong>{item.partnerSku || item.title || '未知 SKU'}</Text>
            <Text>× {number(item.quantity)} 件</Text>
            {item.reasons.map((reason) => <Tag key={reason} color="orange">{reason}</Tag>)}
          </Space>
        </List.Item>
      )}
    />
  )
}

function number(value: number) {
  return Number(value || 0).toLocaleString()
}
