import { CheckCircleFilled, InfoCircleFilled } from '@ant-design/icons'
import { Alert, Button, Card, List, Skeleton, Space, Tag, Typography } from 'antd'
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
      <Card className="official-warehouse-batch-summary" size="small" title="所选物流批次商品汇总">
        <Skeleton active paragraph={{ rows: 1 }} />
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
      className="official-warehouse-batch-summary"
      size="small"
      title="所选物流批次商品汇总"
      extra={(
        <Text className="official-warehouse-batch-summary-extra" type="secondary">
          物流单原始 {number(summary.totalLineCount)} 行，重复 SKU 已合并
        </Text>
      )}
    >
      <Space className="official-warehouse-batch-summary-content" direction="vertical" size={8}>
        <div className="official-warehouse-batch-summary-metrics">
          <SummaryMetric
            label="整票商品"
            quantity={summary.totalQuantity}
            skuCount={summary.totalSkuCount}
          />
          <SummaryMetric
            label={`当前店铺 · ${current.storeName || current.storeCode}`}
            quantity={current.totalQuantity}
            skuCount={current.totalSkuCount}
          />
          <SummaryMetric
            label="当前店铺可约"
            quantity={current.bookableQuantity || 0}
            skuCount={current.bookableSkuCount || 0}
            emphasized
          />
        </div>

        {current.missingDimensionItems.length ? (
          <Alert
            type="warning"
            showIcon
            message={`缺尺寸：${number(current.missingDimensionSkuCount || 0)} SKU / ${number(current.missingDimensionQuantity || 0)} 件`}
            description={<IssueList items={current.missingDimensionItems} />}
          />
        ) : (
          <div className="official-warehouse-batch-summary-status official-warehouse-batch-summary-status-success">
            <CheckCircleFilled />
            <Text strong>当前店铺没有缺尺寸商品</Text>
          </div>
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
          <div className="official-warehouse-batch-summary-status official-warehouse-batch-summary-status-info">
            <div className="official-warehouse-batch-summary-status-title">
              <InfoCircleFilled />
              <Text strong>别的店铺：{summary.otherStores.length} 家</Text>
            </div>
            <div className="official-warehouse-batch-summary-store-list">
              {summary.otherStores.map((store) => (
                <div className="official-warehouse-batch-summary-store" key={`${store.storeCode}:${store.siteCode}`}>
                  <Text className="official-warehouse-batch-summary-store-name">
                    {store.storeName || store.storeCode}（{store.storeCode} / {store.siteCode}）
                  </Text>
                  <Text className="official-warehouse-batch-summary-store-quantity" type="secondary">
                    {number(store.totalQuantity)} 件 / {number(store.totalSkuCount)} SKU
                  </Text>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="official-warehouse-batch-summary-status official-warehouse-batch-summary-status-info">
            <InfoCircleFilled />
            <Text strong>别的有权限店铺没有这票商品</Text>
          </div>
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

function SummaryMetric({
  label,
  quantity,
  skuCount,
  emphasized = false
}: {
  label: string
  quantity: number
  skuCount: number
  emphasized?: boolean
}) {
  return (
    <div className={`official-warehouse-batch-summary-metric${emphasized ? ' is-emphasized' : ''}`}>
      <Text className="official-warehouse-batch-summary-metric-label" type="secondary">{label}</Text>
      <Text className="official-warehouse-batch-summary-metric-value" strong>
        {number(quantity)} 件 <span>/ {number(skuCount)} SKU</span>
      </Text>
    </div>
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
