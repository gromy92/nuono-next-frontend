import {
  DownloadOutlined,
  SaveOutlined,
  SendOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { Button, Segmented, Tag, Typography, Upload } from 'antd';
import {
  ActiveSegmentQuoteControls,
  DetailLineFilterLabel,
  DetailSegmentChips
} from './WarehouseShippingOrderSharedViews';
import { formatQuantity } from './warehouseShippingOrderDomain';
import type { DetailLineFilter } from './warehouseShippingOrderModels';
import { shippingSubmitLabel } from './warehouseShippingQuoteDomain';
import type { ShippingOrderQuoteState } from './useShippingOrderQuoteState';
import type { ShippingOrderQuoteTransfer } from './useShippingOrderQuoteTransfer';
import type { ShippingOrderSubmit } from './useShippingOrderSubmit';
import type { WarehouseShippingOrderData } from './useWarehouseShippingOrderData';

const { Text } = Typography;

export function WarehouseShippingOrderDetailToolbar({
  data,
  quote,
  transfer,
  submit
}: {
  data: WarehouseShippingOrderData;
  quote: ShippingOrderQuoteState;
  transfer: ShippingOrderQuoteTransfer;
  submit: ShippingOrderSubmit;
}) {
  const order = data.detailTarget;
  const scopeActionDisabled = quote.detailSegments.length
    ? !quote.activeSegmentIds.length
    : !quote.detailLines.length;
  const submitDisabled = quote.warehouseOrderSubmitted || !quote.detailLines.length;
  return (
    <div className="warehouse-shipping-order-detail-toolbar">
      <div className="warehouse-shipping-order-detail-route-row">
        <DetailSegmentChips
          segments={quote.sortedSegments}
          activeSegment={quote.activeSegment}
          onSelect={quote.selectSegment}
        />
        <div className="warehouse-shipping-order-detail-actions">
          <Button
            size="small"
            icon={<DownloadOutlined />}
            disabled={scopeActionDisabled}
            onClick={() => order && void transfer.openExportModal(order, quote.activeSegmentIds)}
          >
            导出审核单
          </Button>
          <Upload
            accept=".xls,.xlsx"
            showUploadList={false}
            beforeUpload={(file) => {
              if (order) void transfer.handleImport(order, file as File, quote.activeSegmentIds);
              return false;
            }}
          >
            <Button
              size="small"
              icon={<UploadOutlined />}
              disabled={scopeActionDisabled}
              loading={data.actionKey === `logistics-quote-import:${order?.id}`}
            >
              回传报价
            </Button>
          </Upload>
          <Button
            size="small"
            icon={<SaveOutlined />}
            disabled={scopeActionDisabled || quote.activeSegmentSubmitted}
            loading={data.actionKey === `bulk-line-quote:${order?.id}`}
            onClick={quote.openBulkModal}
          >
            批量添加报价{quote.selectedQuoteLineIds.length ? ` ${quote.selectedQuoteLineIds.length}` : ''}
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<SendOutlined />}
            disabled={submitDisabled}
            loading={data.actionKey === `submit-shipping:${order?.id}`}
            onClick={() => order && void submit.handleSubmit(order)}
          >
            {quote.warehouseOrderSubmitted ? '已提交' : '提交发货'}
          </Button>
        </div>
      </div>
      <div className="warehouse-shipping-order-detail-status-row">
        <div className="warehouse-shipping-order-quote-control-bar">
          <ActiveSegmentQuoteControls
            options={quote.activeSegmentQuoteOptions}
            loading={quote.optionsLoading}
            selectedOption={quote.selectedOption}
            onSelect={quote.selectQuoteOption}
          />
        </div>
        <div className="warehouse-shipping-order-detail-subbar">
          <Segmented
            size="small"
            value={quote.detailLineFilter}
            options={[
              { label: `全部 ${quote.activeLines.length}`, value: 'ALL' },
              ...(quote.showYiteFields ? [{
                label: <DetailLineFilterLabel label="材料缺失" count={quote.missingMaterialCount} />,
                value: 'MISSING_MATERIAL'
              }] : []),
              {
                label: <DetailLineFilterLabel label="缺报价" count={quote.pendingQuoteCount} />,
                value: 'PENDING_QUOTE'
              }
            ]}
            onChange={(value) => quote.setDetailLineFilter(value as DetailLineFilter)}
          />
          {quote.activeSegment ? (
            <div className="warehouse-shipping-order-segment-summary">
              <Text type="secondary">
                {quote.selectedForwarder?.forwarderName || quote.selectedForwarder?.forwarderCode || '-'}
              </Text>
              <Text type="secondary">{formatQuantity(Number(quote.activeSegment.totalQuantity || 0))} 件</Text>
              <Tag color={quote.pendingQuoteCount > 0 ? 'red' : 'green'}>
                {quote.pendingQuoteCount > 0 ? '待报价' : '已报价'}
              </Tag>
              <Tag color={quote.activeSegment.shippingSubmitStatus === 'SUBMITTED' ? 'blue' : 'default'}>
                {shippingSubmitLabel(quote.activeSegment.shippingSubmitStatus)}
              </Tag>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
