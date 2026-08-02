import { message } from 'antd';
import { useEffect, useState } from 'react';
import type { OrderLogisticsQuoteOptions } from '../../logistics-quote/types';
import { loadShippingOrderLogisticsQuoteOptionsForScope } from './warehouseShippingOrderRequests';
import type { ShippingOrderSegment } from './warehouseShippingOrderTypes';
import { defaultSegmentQuoteSelection } from './warehouseShippingQuoteDomain';
import type { QuoteExportSelection } from './warehouseShippingOrderModels';
import type { WarehouseShippingOrderData } from './useWarehouseShippingOrderData';

export function useShippingOrderScopedOptions(
  data: WarehouseShippingOrderData,
  activeSegment: ShippingOrderSegment | undefined,
  activeSegmentIds: string[]
) {
  const [options, setOptions] = useState<OrderLogisticsQuoteOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState<QuoteExportSelection>({});

  useEffect(() => {
    const orderId = data.detailTarget?.id;
    if (!orderId) {
      setOptions(null);
      setSelection({});
      setLoading(false);
      return;
    }
    data.activateDetailInteractionScope(orderId, activeSegmentIds);
    if (!activeSegmentIds.length) {
      setOptions(null);
      setSelection({});
      setLoading(false);
      return;
    }
    const request = data.beginDetailRequest('options', orderId, activeSegmentIds);
    if (!request) return;
    setLoading(true);
    loadShippingOrderLogisticsQuoteOptionsForScope(orderId, activeSegmentIds)
      .then((nextOptions) => {
        if (!data.isCurrentDetailRequest(request)) return;
        if (!data.acceptCurrentInteractionResponse(request, nextOptions.purchaseOrderId)) return;
        setOptions(nextOptions);
        setSelection(defaultSegmentQuoteSelection(nextOptions, activeSegment));
      })
      .catch((error) => {
        if (!data.isCurrentDetailRequest(request)) return;
        setOptions(null);
        setSelection({});
        message.error(error instanceof Error ? error.message : '读取货代渠道选项失败');
      })
      .finally(() => {
        if (data.isCurrentDetailRequest(request)) setLoading(false);
      });
  }, [activeSegment, activeSegmentIds, data.detailTarget?.id]);

  return {
    activeSegmentQuoteOptions: options,
    setActiveSegmentQuoteOptions: setOptions,
    optionsLoading: loading,
    selectedOption: selection,
    setSelectedOption: setSelection
  };
}
