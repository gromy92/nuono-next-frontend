import {
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { Button, Empty, Input, Spin, Table, Tabs, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import type { ShippingOrder } from '../purchase-order/types';
import {
  matchesLogisticsPartition,
  summarizeLogisticsPartitions
} from '../warehouse-dispatch/logisticsPartitionDomain';
import type {
  LogisticsSiteFilter,
  LogisticsTransportFilter
} from '../warehouse-dispatch/logisticsPartitionDomain';
import {
  LogisticsPartitionFilters,
  LogisticsPartitionTags
} from '../warehouse-dispatch/LogisticsPartitionViews';
import { WarehouseOrderIssueTags } from './WarehouseShippingOrderSharedViews';
import {
  formatDate,
  formatQuantity,
  shippingOrderStatusMeta
} from './warehouseShippingOrderDomain';
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
  const filteredOrders = useMemo(() => data.visibleShippingOrders.filter((order) => (
    matchesLogisticsPartition(orderPartition(order), siteFilter, transportFilter)
  )), [data.visibleShippingOrders, siteFilter, transportFilter]);
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
                  const status = shippingOrderStatusMeta(order);
                  return (
                    <div className="warehouse-shipping-order-source-name">
                      <Text strong>{order.title || order.shippingOrderNo}</Text>
                      <Text type="secondary">{order.shippingOrderNo}</Text>
                      <div className="warehouse-shipping-order-status-tags">
                        <Tag color={status.color}>{status.label}</Tag>
                      </div>
                    </div>
                  );
                }
              },
              {
                title: '站点 / 运输方式',
                width: 190,
                render: (_, order) => <LogisticsPartitionTags summary={orderPartition(order)} />
              },
              {
                title: '来源采购单',
                dataIndex: 'purchaseOrderCount',
                width: 110,
                render: (value) => `${value || 0} 单`
              },
              { title: '商品行', dataIndex: 'lineCount', width: 90 },
              { title: 'SKU', dataIndex: 'skuCount', width: 80 },
              {
                title: '数量',
                dataIndex: 'totalQuantity',
                width: 100,
                align: 'right',
                render: (value) => formatQuantity(Number(value || 0))
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
                width: 180,
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
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      loading={data.actionKey === `update-shipping-order:${order.id}`}
                      onClick={() => data.openEditModal(order)}
                    >
                      改名
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
          <Input
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
