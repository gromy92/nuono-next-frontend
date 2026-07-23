import { Alert, Checkbox, Empty, Form, Modal, Select, Spin, Tag, Typography } from 'antd';
import {
  quoteChannelLabel,
  quoteExportEmptyDescription,
  quoteForwarderLabel
} from './warehouseShippingQuoteDomain';
import type { ShippingOrderQuoteTransfer } from './useShippingOrderQuoteTransfer';
import type { WarehouseShippingOrderData } from './useWarehouseShippingOrderData';

const { Text } = Typography;

export function WarehouseShippingQuoteExportModal({
  data,
  transfer
}: {
  data: WarehouseShippingOrderData;
  transfer: ShippingOrderQuoteTransfer;
}) {
  const selected = transfer.selectedForwarder && transfer.selectedChannel;
  return (
    <Modal
      title="导出仓库单审核单"
      open={Boolean(transfer.exportTarget)}
      okText={transfer.selectedForwarder?.templateName
        ? `导出 ${transfer.selectedForwarder.templateName}`
        : '导出'}
      cancelText="取消"
      okButtonProps={{
        disabled: transfer.exportLoading
          || !transfer.exportSelection.forwarderCode
          || !transfer.exportSelection.routeCode
          || (transfer.exportMissingOnly && transfer.pendingCount <= 0),
        loading: data.actionKey === `logistics-quote-export:${transfer.exportTarget?.id}`
      }}
      onOk={() => void transfer.handleExport()}
      onCancel={transfer.closeExportModal}
      width={720}
    >
      <Spin spinning={transfer.exportLoading}>
        {transfer.exportableOptions?.forwarders?.length ? (
          <div className="warehouse-shipping-quote-export">
            <Alert
              type={selected ? 'success' : 'warning'}
              showIcon
              message={selected
                ? transfer.exportMissingOnly
                  ? `将导出报价缺失 ${transfer.pendingCount} 行：${quoteChannelLabel(transfer.selectedForwarder, transfer.selectedChannel!)}`
                  : `将导出全部 ${transfer.totalCount} 行：${quoteChannelLabel(transfer.selectedForwarder, transfer.selectedChannel!)}（待报价 ${transfer.pendingCount}，已报价 ${transfer.confirmedCount}）`
                : `请先选择货代和渠道，待报价 ${transfer.exportOptions?.pendingLineCount || 0} 行，已报价商品会一并导出`}
            />
            <div className="warehouse-shipping-quote-export-controls">
              <Form.Item label="选择货代" required>
                <Select
                  options={transfer.forwarderOptions}
                  value={transfer.exportSelection.forwarderCode}
                  onChange={transfer.selectExportForwarder}
                  placeholder="选择货代"
                  allowClear
                />
              </Form.Item>
              <Form.Item label="选择渠道" required>
                <Select
                  options={transfer.channelOptions}
                  value={transfer.exportSelection.routeCode}
                  onChange={(routeCode) => transfer.setExportSelection((current) => ({ ...current, routeCode }))}
                  placeholder="选择渠道"
                  disabled={!transfer.exportSelection.forwarderCode}
                  allowClear
                />
              </Form.Item>
            </div>
            <Checkbox
              checked={transfer.exportMissingOnly}
              disabled={!transfer.selectedChannel}
              onChange={(event) => transfer.setExportMissingOnly(event.target.checked)}
            >
              只导出报价缺失
            </Checkbox>
            {transfer.selectedChannel ? (
              <div className="warehouse-shipping-quote-export-detail">
                <Tag color="blue">{quoteForwarderLabel(transfer.selectedForwarder)}</Tag>
                <Tag color="processing">{transfer.selectedChannel.siteCode || '-'}</Tag>
                <strong>{transfer.exportMissingOnly
                  ? `报价缺失 ${transfer.pendingCount} 行`
                  : `全部 ${transfer.totalCount} 行`}</strong>
              </div>
            ) : null}
            {transfer.selectedForwarder?.templateName ? (
              <Text type="secondary">{transfer.selectedForwarder.templateName}</Text>
            ) : null}
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={transfer.exportOptions
              ? quoteExportEmptyDescription(transfer.exportOptions)
              : '正在读取可导出渠道'}
          />
        )}
      </Spin>
    </Modal>
  );
}
