import { SaveOutlined } from '@ant-design/icons';
import { Button, Empty, Image, Input, Select, Table, Typography } from 'antd';
import type { ShippingOrderLine } from '../purchase-order/types';
import { buildYiteMaterialCellModel } from './WarehouseShippingOrderPage.models';
import {
  isLineQuoteConfirmed,
  shippingOrderLineImageUrl,
  shippingOrderLineTitleCn,
  shippingOrderLineTitleEn
} from './warehouseShippingOrderDomain';
import { YITE_MATERIAL_OPTIONS } from './warehouseShippingOrderModels';
import { quoteUnitDisplayText } from './warehouseShippingQuoteDomain';
import type { ShippingOrderQuoteActions } from './useShippingOrderQuoteActions';
import type { ShippingOrderQuoteState } from './useShippingOrderQuoteState';
import type { WarehouseShippingOrderData } from './useWarehouseShippingOrderData';

const { Text } = Typography;

export function WarehouseShippingOrderLineTable({
  data,
  quote,
  actions
}: {
  data: WarehouseShippingOrderData;
  quote: ShippingOrderQuoteState;
  actions: ShippingOrderQuoteActions;
}) {
  const yiteColumns = quote.showYiteFields ? [
    {
      title: '义特材质',
      dataIndex: 'yiteMaterial',
      width: 150,
      render: (_: unknown, line: ShippingOrderLine) => {
        const cell = buildYiteMaterialCellModel(line);
        const draft = quote.readLineDraft(line);
        return (
          <Select
            size="small"
            allowClear
            placeholder="选择材质"
            options={YITE_MATERIAL_OPTIONS}
            value={draft.yiteMaterial || cell.value}
            disabled={!cell.editable || line.shippingSubmitStatus === 'SUBMITTED'}
            onChange={(yiteMaterial) => quote.updateLineDraft(line.id, { yiteMaterial })}
          />
        );
      }
    },
    {
      title: '义特价格',
      dataIndex: 'unitPrice',
      width: 105,
      render: (_: unknown, line: ShippingOrderLine) => (
        <Text type="secondary" className="warehouse-shipping-order-yite-price">
          {buildYiteMaterialCellModel(line).priceText}
        </Text>
      )
    }
  ] : [];

  return (
    <Table<ShippingOrderLine>
      size="small"
      key={quote.activeMaintenanceKey}
      rowKey="id"
      rowSelection={{
        selectedRowKeys: quote.selectedQuoteLineIds,
        onChange: (keys) => quote.setSelectedQuoteLineIds(keys.map(String)),
        getCheckboxProps: (line) => ({ disabled: line.shippingSubmitStatus === 'SUBMITTED' })
      }}
      scroll={{ x: quote.showYiteFields ? 1120 : 860 }}
      pagination={{ pageSize: 8, showSizeChanger: false }}
      columns={[
        {
          title: '商品',
          dataIndex: 'productTitle',
          width: 420,
          render: (_, line) => {
            const imageUrl = shippingOrderLineImageUrl(line);
            const titleCn = shippingOrderLineTitleCn(line);
            return (
              <div className="warehouse-shipping-order-product-cell">
                {imageUrl ? (
                  <Image
                    className="warehouse-shipping-order-product-image"
                    src={imageUrl}
                    alt={titleCn}
                    width={70}
                    height={70}
                    preview={{ src: imageUrl }}
                  />
                ) : <div className="warehouse-shipping-order-product-placeholder" />}
                <div>
                  <Text strong className="warehouse-shipping-order-product-title-cn">{titleCn}</Text>
                  <Text type="secondary" className="warehouse-shipping-order-product-title-en">
                    {shippingOrderLineTitleEn(line)}
                  </Text>
                </div>
              </div>
            );
          }
        },
        {
          title: '来源/数量',
          dataIndex: 'lineMeta',
          width: 180,
          render: (_, line) => (
            <div className="warehouse-shipping-order-line-meta-cell">
              <Text strong className="warehouse-shipping-order-line-meta-barcode">{line.barcode || '-'}</Text>
              <Text type="secondary" className="warehouse-shipping-order-line-meta-source">
                {line.purchaseOrderTitle || line.purchaseOrderNo || '-'}
              </Text>
              <Text className="warehouse-shipping-order-line-meta-quantity">
                {Number(line.quantity || 0).toLocaleString('zh-CN')} 件
              </Text>
            </div>
          )
        },
        ...yiteColumns,
        {
          title: '报价单价',
          dataIndex: 'unitPrice',
          width: 138,
          render: (_, line) => {
            const draft = quote.readLineDraft(line);
            return (
              <div className="warehouse-shipping-order-price-cell">
                <Input
                  className="warehouse-shipping-order-quote-field"
                  size="small"
                  inputMode="decimal"
                  value={draft.unitPrice}
                  placeholder="单价"
                  disabled={line.shippingSubmitStatus === 'SUBMITTED'}
                  onChange={(event) => quote.updateLineDraft(line.id, { unitPrice: event.target.value })}
                />
                <Text type="secondary" className="warehouse-shipping-order-price-unit">
                  {quoteUnitDisplayText(quote.activeSegment?.transportMode || line.plannedTransportMode)}
                </Text>
              </div>
            );
          }
        },
        {
          title: '报价操作',
          width: 112,
          render: (_, line) => (
            <Button
              size="small"
              type={isLineQuoteConfirmed(line) ? 'default' : 'primary'}
              icon={<SaveOutlined />}
              loading={data.actionKey === `line-quote:${line.id}`}
              disabled={line.shippingSubmitStatus === 'SUBMITTED'}
              onClick={() => void actions.handleSaveLineQuote(line)}
            >
              保存报价
            </Button>
          )
        }
      ]}
      dataSource={quote.visibleLines}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={quote.detailLineFilter === 'PENDING_QUOTE'
              ? '暂无缺报价商品'
              : quote.detailLineFilter === 'MISSING_MATERIAL' ? '暂无材料缺失商品' : '暂无商品'}
          />
        )
      }}
    />
  );
}
