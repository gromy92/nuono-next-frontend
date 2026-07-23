import { message } from 'antd';
import {
  loadShippingOrderLogisticsQuoteOptionsForScope,
  updateShippingOrderLineQuote,
  updateShippingOrderLineQuotes
} from '../purchase-order/api';
import type {
  PurchaseOrderLogisticsQuoteForwarderOption,
  ShippingOrderLine
} from '../purchase-order/types';
import { isYiteQuoteForwarder } from './warehouseShippingOrderDomain';
import {
  defaultQuoteBillingUnit,
  defaultSegmentQuoteSelection,
  findQuoteChannelOption,
  findQuoteForwarderOption
} from './warehouseShippingQuoteDomain';
import type { ShippingOrderQuoteState } from './useShippingOrderQuoteState';
import type { WarehouseShippingOrderData } from './useWarehouseShippingOrderData';

export function useShippingOrderQuoteActions(
  data: WarehouseShippingOrderData,
  quote: ShippingOrderQuoteState
) {
  const refreshOptions = async (orderId: string) => {
    const options = await loadShippingOrderLogisticsQuoteOptionsForScope(orderId, quote.activeSegmentIds);
    quote.setActiveSegmentQuoteOptions(options);
    quote.setSelectedOption((current) => {
      const forwarder = findQuoteForwarderOption(options, current.forwarderCode);
      const channel = findQuoteChannelOption(forwarder, current.routeCode);
      return forwarder && channel
        ? current
        : defaultSegmentQuoteSelection(options, quote.activeSegment);
    });
  };

  const handleSaveLineQuote = async (line: ShippingOrderLine) => {
    const order = data.detailTarget;
    if (!order) return;
    if (!quote.selectedOption.forwarderCode || !quote.selectedOption.routeCode) {
      message.warning('请先选择上方货代渠道。');
      return;
    }
    const draft = quote.readLineDraft(line);
    if (quote.showYiteFields && !draft.yiteMaterial?.trim()) {
      message.warning('请选择义特材质。');
      return;
    }
    const unitPriceText = String(draft.unitPrice || '').trim();
    const unitPrice = Number(unitPriceText);
    if (!unitPriceText || !Number.isFinite(unitPrice) || unitPrice <= 0) {
      message.warning('请输入有效单价。');
      return;
    }
    data.setActionKey(`line-quote:${line.id}`);
    try {
      const next = await updateShippingOrderLineQuote(order.id, line.id, {
        forwarderCode: quote.selectedOption.forwarderCode,
        routeCode: quote.selectedOption.routeCode,
        unitPrice,
        currency: 'CNY',
        billingUnit: defaultQuoteBillingUnit(quote.activeSegment?.transportMode || line.plannedTransportMode),
        yiteMaterial: quote.showYiteFields ? draft.yiteMaterial?.trim() : undefined
      });
      data.setDetailTarget(next);
      data.replaceOrder(next);
      await refreshOptions(next.id);
      quote.clearLineDrafts([line.id]);
      message.success('已保存商品报价。');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存商品报价失败');
    } finally {
      data.setActionKey(undefined);
    }
  };

  const handleSaveBulkLineQuotes = async () => {
    const order = data.detailTarget;
    if (!order) return;
    if (!quote.selectedQuoteLineIds.length) {
      message.warning('请选择要批量报价的商品。');
      return;
    }
    if (!quote.selectedOption.forwarderCode || !quote.selectedOption.routeCode) {
      message.warning('请先选择上方货代渠道。');
      return;
    }
    const unitPriceText = quote.bulkQuoteUnitPrice.trim();
    const unitPrice = Number(unitPriceText);
    if (!unitPriceText || !Number.isFinite(unitPrice) || unitPrice <= 0) {
      message.warning('请输入有效单价。');
      return;
    }
    const selectedIds = quote.selectedQuoteLineIds;
    data.setActionKey(`bulk-line-quote:${order.id}`);
    try {
      const next = await updateShippingOrderLineQuotes(order.id, {
        lineIds: selectedIds,
        forwarderCode: quote.selectedOption.forwarderCode,
        routeCode: quote.selectedOption.routeCode,
        unitPrice,
        currency: 'CNY',
        billingUnit: defaultQuoteBillingUnit(
          quote.activeSegment?.transportMode || quote.selectedLines[0]?.plannedTransportMode
        ),
        yiteMaterial: quote.showYiteFields ? quote.bulkQuoteYiteMaterial?.trim() : undefined
      });
      data.setDetailTarget(next);
      data.replaceOrder(next);
      await refreshOptions(next.id);
      quote.clearLineDrafts(selectedIds);
      quote.setSelectedQuoteLineIds([]);
      quote.setBulkQuoteModalOpen(false);
      quote.setBulkQuoteUnitPrice('');
      quote.setBulkQuoteYiteMaterial(undefined);
      message.success(`已批量保存 ${selectedIds.length} 个商品报价。`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '批量保存商品报价失败');
    } finally {
      data.setActionKey(undefined);
    }
  };

  const selectBulkForwarder = (forwarderCode: string) => {
    const forwarder = findQuoteForwarderOption(quote.activeSegmentQuoteOptions, forwarderCode);
    quote.setSelectedOption({ forwarderCode, routeCode: forwarder?.channels?.[0]?.routeCode });
    if (!isYiteQuoteForwarder(forwarder)) quote.setBulkQuoteYiteMaterial(undefined);
  };
  const selectBulkChannel = (routeCode: string) => {
    quote.setSelectedOption((current) => ({ ...current, routeCode }));
  };
  const closeBulkModal = () => {
    quote.setBulkQuoteModalOpen(false);
    quote.setBulkQuoteUnitPrice('');
    quote.setBulkQuoteYiteMaterial(undefined);
  };

  return {
    handleSaveLineQuote,
    handleSaveBulkLineQuotes,
    selectBulkForwarder,
    selectBulkChannel,
    closeBulkModal
  };
}

export type ShippingOrderQuoteActions = ReturnType<typeof useShippingOrderQuoteActions>;
