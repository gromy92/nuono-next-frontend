import { SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Input, Modal, Table, Typography } from 'antd';
import type { PurchaseOrder } from '../purchase-order/types';
import {
  countPurchaseOrderSku,
  formatDate,
  formatQuantity,
  sumPurchaseOrderQuantity
} from './warehouseShippingOrderDomain';
import type { WarehouseShippingOrderData } from './useWarehouseShippingOrderData';

const { Text } = Typography;

export function WarehouseShippingOrderCreateModal({ data }: { data: WarehouseShippingOrderData }) {
  return (
    <Modal
      title="新增仓库单"
      open={data.createModalOpen}
      width={860}
      onCancel={() => data.setCreateModalOpen(false)}
      footer={[
        <Button key="cancel" onClick={() => data.setCreateModalOpen(false)}>取消</Button>,
        <Button
          key="submit"
          type="primary"
          disabled={!data.selectedSourceOrderIds.length}
          loading={data.actionKey === 'create-shipping-order'}
          onClick={() => void data.handleCreate()}
        >
          创建仓库单
        </Button>
      ]}
    >
      <div className="warehouse-shipping-order-create-modal">
        <Alert
          type="info"
          showIcon
          message={`只显示已提交采购单。已选 ${data.selectedSourceOrders.length} 单，合计 ${formatQuantity(sumPurchaseOrderQuantity(data.selectedSourceOrders))} 件。`}
        />
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索采购单 / SKU"
          value={data.sourceKeyword}
          onChange={(event) => data.setSourceKeyword(event.target.value)}
        />
        <Table<PurchaseOrder>
          size="small"
          rowKey="id"
          rowSelection={data.sourceOrderSelection}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          columns={[
            {
              title: '采购单',
              dataIndex: 'title',
              render: (_, order) => (
                <div className="warehouse-shipping-order-source-name">
                  <Text strong>{order.title || order.orderNo}</Text>
                  <Text type="secondary">{order.orderNo}</Text>
                </div>
              )
            },
            {
              title: '店铺',
              dataIndex: 'storeName',
              width: 150,
              render: (_, order) => order.storeName || order.storeCode
            },
            { title: 'SKU', width: 90, render: (_, order) => countPurchaseOrderSku(order) },
            {
              title: '数量',
              width: 100,
              render: (_, order) => formatQuantity(sumPurchaseOrderQuantity([order]))
            },
            {
              title: '创建时间',
              dataIndex: 'createdAt',
              width: 120,
              render: (value) => formatDate(String(value || ''))
            }
          ]}
          dataSource={data.visiblePurchaseOrders}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无已提交采购单" /> }}
        />
      </div>
    </Modal>
  );
}
