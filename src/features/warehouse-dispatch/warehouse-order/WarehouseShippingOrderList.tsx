import {
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { Button, Empty, Input, Select, Spin, Table, Tabs, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import type { ShippingOrder, ShippingOrderSegment } from './warehouseShippingOrderTypes';
import {
  matchesLogisticsPartition,
  summarizeLogisticsPartitions
} from '../logisticsPartitionDomain';
import type {
  LogisticsSiteFilter,
  LogisticsTransportFilter
} from '../logisticsPartitionDomain';
import {
  LogisticsPartitionFilters,
  LogisticsPartitionCombinationTags
} from '../LogisticsPartitionViews';
import { WarehouseOrderIssueTags } from './WarehouseShippingOrderSharedViews';
import {
  filterShippingOrdersByStatus,
  formatDate,
  formatQuantity,
  SHIPPING_ORDER_STATUS_FILTER_OPTIONS,
  shippingOrderStatusMeta
} from './warehouseShippingOrderDomain';
import type { ShippingOrderStatusFilter } from './warehouseShippingOrderDomain';
import type { WarehouseShippingOrderData } from './useWarehouseShippingOrderData';
import { WarehouseOrderJourneyCell } from './WarehouseOrderJourneyCell';

const { Text, Title } = Typography;

export function WarehouseShippingOrderList({
  data,
  embedded
}: {
  data: WarehouseShippingOrderData;
  embedded: boolean;
}) {
  const [siteFilter, setSiteFilter] = useState<LogisticsSiteFilter>('all');
  const [transportFilter, setTransportFilter] = useState<LogisticsTransportFilter>('all');
  const [statusFilter, setStatusFilter] = useState<ShippingOrderStatusFilter>('all');
  const filteredOrders = useMemo(() => filterShippingOrdersByStatus(
    data.visibleShippingOrders.filter((order) => (
      matchesLogisticsPartition(orderPartition(order), siteFilter, transportFilter)
    )),
    statusFilter,
    data.journeysByOrder
  ), [data.journeysByOrder, data.visibleShippingOrders, siteFilter, statusFilter, transportFilter]);
  const orderList = (
    <Spin spinning={data.loading}>
      <div className="warehouse-shipping-order-main">
        <section className="warehouse-shipping-order-list-section">
          <Table<ShippingOrder>
            size="small"
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            columns={[
              {
                title: '仓库单',
                dataIndex: 'title',
                width: 260,
                render: (_, order) => {
                  const journeys = data.journeysByOrder.get(order.id) || [];
                  const status = shippingOrderStatusMeta(order, journeys);
                  return (
                    <div className="warehouse-shipping-order-source-name">
                      <button
                        type="button"
                        className="warehouse-shipping-order-title-button"
                        disabled={data.actionKey === `update-shipping-order:${order.id}`}
                        onClick={() => data.openEditModal(order)}
                      >
                        {order.title || '未命名仓库单'}
                      </button>
                      <div className="warehouse-shipping-order-status-tags">
                        <Tag color={status.color}>{status.label}</Tag>
                      </div>
                    </div>
                  );
                }
              },
              {
                title: '分区明细',
                width: 500,
                render: (_, order) => <WarehouseOrderPartitionDetails order={order} />
              },
              {
                title: '总SKU / 总件数',
                width: 150,
                render: (_, order) => (
                  <div className="warehouse-order-total-cell">
                    <Text strong>{formatQuantity(Number(order.skuCount || 0))} SKU</Text>
                    <Text>{formatQuantity(Number(order.totalQuantity || 0))} 件</Text>
                  </div>
                )
              },
              {
                title: '关联发运',
                width: 260,
                render: (_, order) => (
                  <WarehouseOrderJourneyCell journeys={data.journeysByOrder.get(order.id) || []} />
                )
              },
              {
                title: '问题',
                width: 180,
                render: (_, order) => <WarehouseOrderIssueTags order={order} />
              },
              {
                title: '创建时间',
                dataIndex: 'createdAt',
                width: 120,
                render: (value) => formatDate(String(value || ''))
              },
              {
                title: '操作',
                width: 110,
                render: (_, order) => (
                  <div className="warehouse-shipping-order-table-actions" onClick={(event) => event.stopPropagation()}>
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      disabled={!order.lineCount}
                      loading={data.detailLoading && data.detailTarget?.id === order.id}
                      onClick={() => void data.openDetail(order)}
                    >
                      查看详情
                    </Button>
                  </div>
                )
              }
            ]}
            dataSource={filteredOrders}
            locale={{
              emptyText: data.loadError ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={data.loadError}>
                  <Button size="small" icon={<ReloadOutlined />} onClick={() => void data.loadPage()}>
                    重新读取
                  </Button>
                </Empty>
              ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无仓库单" />
            }}
          />
        </section>
      </div>
    </Spin>
  );

  return (
    <>
      <div className="warehouse-shipping-order-toolbar">
        {embedded ? null : (
          <div>
            <Title level={4}>发货单</Title>
            <Text type="secondary">仓库单负责采购合并、报价和提交仓库；实际发运流程在仓库发运中处理。</Text>
          </div>
        )}
        <div className="warehouse-shipping-order-toolbar-actions">
          <LogisticsPartitionFilters siteFilter={siteFilter} transportFilter={transportFilter}
            onSiteFilterChange={setSiteFilter} onTransportFilterChange={setTransportFilter} />
          <Select
            className="warehouse-shipping-order-status-filter"
            aria-label="筛选发货单状态"
            value={statusFilter}
            options={SHIPPING_ORDER_STATUS_FILTER_OPTIONS}
            onChange={(value) => setStatusFilter(value)}
          />
          <Input
            className="warehouse-shipping-order-keyword-search"
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索仓库单 / 发运批次 / SKU / 采购单"
            value={data.keyword}
            onChange={(event) => data.setKeyword(event.target.value)}
          />
          {embedded ? null : (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => void data.openCreateModal()}>
              新增仓库单
            </Button>
          )}
          <Button icon={<ReloadOutlined />} onClick={() => void data.loadPage()} loading={data.loading}>
            刷新
          </Button>
        </div>
      </div>
      {embedded ? orderList : (
        <Tabs
          className="warehouse-shipping-order-workbench-tabs"
          activeKey="warehouse-order"
          items={[{ key: 'warehouse-order', label: '仓库单', children: orderList }]}
        />
      )}
    </>
  );
}

function orderPartition(order: ShippingOrder) {
  return summarizeLogisticsPartitions((order.segments || []).map((segment) => ({
    siteCode: segment.siteCode,
    transportMode: segment.transportMode
  })));
}

function WarehouseOrderPartitionDetails({ order }: { order: ShippingOrder }) {
  const segments = order.segments || [];
  if (!segments.length) {
    return <LogisticsPartitionCombinationTags points={[]} />;
  }
  return (
    <div className="warehouse-order-partition-list">
      {segments.map((segment) => (
        <WarehouseOrderPartitionRow
          key={segment.id || `${segment.siteCode}:${segment.transportMode}`}
          segment={segment}
        />
      ))}
    </div>
  );
}

function WarehouseOrderPartitionRow({
  segment
}: {
  segment: ShippingOrderSegment;
}) {
  return (
    <div className="warehouse-order-partition-row">
      <div className="warehouse-order-partition-route">
        <LogisticsPartitionCombinationTags points={[{
          siteCode: segment.siteCode,
          transportMode: segment.transportMode
        }]} />
      </div>
      <PartitionMetric label="来源采购单" value={segment.purchaseOrderNames || '—'} source />
      <PartitionMetric label="商品行" value={formatQuantity(Number(segment.lineCount || 0))} />
      <PartitionMetric label="SKU" value={formatQuantity(Number(segment.skuCount || 0))} />
      <PartitionMetric label="件数" value={`${formatQuantity(Number(segment.totalQuantity || 0))} 件`} />
    </div>
  );
}

function PartitionMetric({ label, value, source = false }: { label: string; value: string; source?: boolean }) {
  return (
    <span className={`warehouse-order-partition-metric${source ? ' warehouse-order-partition-metric--source' : ''}`}>
      <span className="warehouse-order-partition-metric-label">{label}</span>
      <strong title={source ? value : undefined}>{value}</strong>
    </span>
  );
}
