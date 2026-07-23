import { Alert, Modal, Spin } from 'antd';
import { WarehouseShippingOrderDetailToolbar } from './WarehouseShippingOrderDetailToolbar';
import { WarehouseShippingOrderLineTable } from './WarehouseShippingOrderLineTable';
import { QuoteImportResultContent } from './WarehouseShippingOrderSharedViews';
import type { ShippingOrderQuoteActions } from './useShippingOrderQuoteActions';
import type { ShippingOrderQuoteState } from './useShippingOrderQuoteState';
import type { ShippingOrderQuoteTransfer } from './useShippingOrderQuoteTransfer';
import type { ShippingOrderSubmit } from './useShippingOrderSubmit';
import type { WarehouseShippingOrderData } from './useWarehouseShippingOrderData';

export function WarehouseShippingOrderDetailModal({
  data,
  quote,
  quoteActions,
  transfer,
  submit
}: {
  data: WarehouseShippingOrderData;
  quote: ShippingOrderQuoteState;
  quoteActions: ShippingOrderQuoteActions;
  transfer: ShippingOrderQuoteTransfer;
  submit: ShippingOrderSubmit;
}) {
  const close = () => {
    data.closeDetail();
    quote.resetQuoteEditing();
    transfer.clearImportResult();
  };
  return (
    <Modal
      title={data.detailTarget
        ? `${data.detailTarget.title || data.detailTarget.shippingOrderNo} 商品明细`
        : '仓库单商品明细'}
      open={Boolean(data.detailTarget)}
      footer={null}
      onCancel={close}
      width={1260}
    >
      <Spin spinning={data.detailLoading}>
        <WarehouseShippingOrderDetailToolbar
          data={data}
          quote={quote}
          transfer={transfer}
          submit={submit}
        />
        {transfer.visibleImportResult ? (
          <Alert
            className="warehouse-shipping-order-import-alert"
            type={Number(transfer.visibleImportResult.updatedRows || 0) > 0
              && !transfer.visibleImportResult.skippedRows ? 'success' : 'warning'}
            showIcon
            message={transfer.importResultTitle}
            description={<QuoteImportResultContent result={transfer.visibleImportResult} />}
          />
        ) : null}
        <WarehouseShippingOrderLineTable data={data} quote={quote} actions={quoteActions} />
      </Spin>
    </Modal>
  );
}
