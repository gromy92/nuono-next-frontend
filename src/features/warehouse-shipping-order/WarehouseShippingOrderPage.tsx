import type { AuthSession } from '../auth/session';
import { WarehouseShippingOrderBulkQuoteModal } from './WarehouseShippingOrderBulkQuoteModal';
import { WarehouseShippingOrderCreateModal } from './WarehouseShippingOrderCreateModal';
import { WarehouseShippingOrderDetailModal } from './WarehouseShippingOrderDetailModal';
import { WarehouseShippingOrderEditModal } from './WarehouseShippingOrderEditModal';
import { WarehouseShippingOrderList } from './WarehouseShippingOrderList';
import { WarehouseShippingQuoteExportModal } from './WarehouseShippingQuoteExportModal';
import { useShippingOrderQuoteActions } from './useShippingOrderQuoteActions';
import { useShippingOrderQuoteState } from './useShippingOrderQuoteState';
import { useShippingOrderQuoteTransfer } from './useShippingOrderQuoteTransfer';
import { useShippingOrderSubmit } from './useShippingOrderSubmit';
import { useWarehouseShippingOrderData } from './useWarehouseShippingOrderData';
import './WarehouseShippingOrderPage.css';

type WarehouseShippingOrderPageProps = {
  session?: AuthSession | null;
};

export function WarehouseShippingOrderPage(props: WarehouseShippingOrderPageProps) {
  return <WarehouseShippingOrderPanel {...props} />;
}

export function WarehouseShippingOrderPanel({
  embedded = false
}: WarehouseShippingOrderPageProps & { embedded?: boolean }) {
  const data = useWarehouseShippingOrderData();
  const quote = useShippingOrderQuoteState(data);
  const quoteActions = useShippingOrderQuoteActions(data, quote);
  const transfer = useShippingOrderQuoteTransfer(data, quote);
  const submit = useShippingOrderSubmit(data);

  return (
    <div
      className={`warehouse-shipping-order-page${embedded ? ' warehouse-shipping-order-page--embedded' : ''}`}
      data-testid="warehouse-shipping-order-page"
    >
      <WarehouseShippingOrderList data={data} embedded={embedded} />
      <WarehouseShippingOrderEditModal data={data} />
      <WarehouseShippingOrderDetailModal
        data={data}
        quote={quote}
        quoteActions={quoteActions}
        transfer={transfer}
        submit={submit}
      />
      <WarehouseShippingOrderBulkQuoteModal data={data} quote={quote} actions={quoteActions} />
      <WarehouseShippingOrderCreateModal data={data} />
      <WarehouseShippingQuoteExportModal data={data} transfer={transfer} />
    </div>
  );
}
