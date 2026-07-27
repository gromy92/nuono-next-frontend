import { Alert, Form, Input, Modal, Select, Typography } from 'antd';
import { YITE_MATERIAL_OPTIONS } from './warehouseShippingOrderModels';
import { quoteUnitDisplayText } from './warehouseShippingQuoteDomain';
import type { ShippingOrderQuoteActions } from './useShippingOrderQuoteActions';
import type { ShippingOrderQuoteState } from './useShippingOrderQuoteState';
import type { WarehouseShippingOrderData } from './useWarehouseShippingOrderData';

const { Text } = Typography;

export function WarehouseShippingOrderBulkQuoteModal({
  data,
  quote,
  actions
}: {
  data: WarehouseShippingOrderData;
  quote: ShippingOrderQuoteState;
  actions: ShippingOrderQuoteActions;
}) {
  return (
    <Modal
      title="批量添加报价"
      open={quote.bulkQuoteModalOpen}
      okText="批量保存"
      cancelText="取消"
      okButtonProps={{
        disabled: !quote.selectedQuoteLineIds.length || !quote.selectedChannel,
        loading: data.actionKey === `bulk-line-quote:${data.detailTarget?.id}`
      }}
      onOk={() => void actions.handleSaveBulkLineQuotes()}
      onCancel={actions.closeBulkModal}
      width={520}
    >
      <div className="warehouse-shipping-order-bulk-quote-modal">
        <Alert
          type={quote.selectedChannel ? 'info' : 'warning'}
          showIcon
          message={quote.selectedChannel
            ? `已选 ${quote.selectedQuoteLineIds.length} 个商品，将写入当前货代渠道。`
            : `已选 ${quote.selectedQuoteLineIds.length} 个商品，请先选择货代渠道。`}
        />
        <div className="warehouse-shipping-order-bulk-quote-scope">
          <Form.Item label="货代渠道" required>
            <Select
              options={quote.forwarderSelectOptions}
              value={quote.selectedOption.forwarderCode}
              placeholder="选择货代"
              onChange={actions.selectBulkForwarder}
            />
          </Form.Item>
          <Form.Item label="渠道" required>
            <Select
              options={quote.channelSelectOptions}
              value={quote.selectedOption.routeCode}
              placeholder="选择渠道"
              disabled={!quote.selectedOption.forwarderCode}
              onChange={actions.selectBulkChannel}
            />
          </Form.Item>
        </div>
        <Form.Item label="报价单价" required>
          <div className="warehouse-shipping-order-bulk-quote-price">
            <Input
              inputMode="decimal"
              value={quote.bulkQuoteUnitPrice}
              placeholder="输入统一单价"
              onChange={(event) => quote.setBulkQuoteUnitPrice(event.target.value)}
            />
            <Text type="secondary" className="warehouse-shipping-order-price-unit">
              {quoteUnitDisplayText(quote.activeSegment?.transportMode || quote.selectedLines[0]?.plannedTransportMode)}
            </Text>
          </div>
        </Form.Item>
        {quote.showYiteFields ? (
          <Form.Item label="义特材质">
            <Select
              allowClear
              options={YITE_MATERIAL_OPTIONS}
              value={quote.bulkQuoteYiteMaterial}
              placeholder="不修改现有材质"
              onChange={quote.setBulkQuoteYiteMaterial}
            />
          </Form.Item>
        ) : null}
      </div>
    </Modal>
  );
}
