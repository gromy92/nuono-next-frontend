import { message } from 'antd';
import {
  loadShippingOrderLogisticsQuoteOptionsForScope,
  reassignShippingOrderLines,
  updateShippingOrderLineEligibility,
  updateShippingOrderLineQuote,
  updateShippingOrderLineQuotes
} from './warehouseShippingOrderRequests';
import type { ShippingOrderLine } from './warehouseShippingOrderTypes';
import { isUnsupportedForwarderEligibility } from './warehouseForwarderEligibilityDomain';
import { isYiteQuoteForwarder } from './warehouseShippingOrderDomain';
import {
  defaultSegmentQuoteSelection,
  findQuoteChannelOption,
  findQuoteForwarderOption,
  resolveQuoteBillingUnit
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
    if (isUnsupportedForwarderEligibility(line)) {
      message.warning('该货代当前不接此商品，不能保存报价。');
      return;
    }
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
        billingUnit: resolveQuoteBillingUnit(
          draft.billingUnit,
          quote.activeSegment?.transportMode || line.plannedTransportMode
        ),
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
    if (quote.selectedLines.some(isUnsupportedForwarderEligibility)) {
      message.warning('所选商品包含当前货代不接的商品，不能批量报价。');
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
        billingUnit: quote.bulkQuoteBillingUnit,
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
    quote.setBulkQuoteBillingUnit(resolveQuoteBillingUnit(undefined, quote.activeSegment?.transportMode));
    quote.setBulkQuoteYiteMaterial(undefined);
  };

  const handleSaveEligibility = async (
    line: ShippingOrderLine,
    eligibilityStatus: 'SUPPORTED' | 'INQUIRY_REQUIRED' | 'UNSUPPORTED'
  ) => {
    const order = data.detailTarget;
    const forwarderCode = quote.selectedOption.forwarderCode;
    if (!order) return;
    if (!forwarderCode) {
      message.warning('请先选择上方货代渠道。');
      return;
    }
    data.setActionKey(`line-eligibility:${line.id}`);
    try {
      const next = await updateShippingOrderLineEligibility(order.id, line.id, {
        forwarderCode,
        eligibilityStatus
      });
      data.setDetailTarget(next);
      data.replaceOrder(next);
      await refreshOptions(next.id);
      message.success('承运状态已更新。');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存承运状态失败');
    } finally {
      data.setActionKey(undefined);
    }
  };

  const handleReassignLines = async (
    targetTransportMode: 'AIR' | 'SEA',
    targetSegmentId?: string
  ) => {
    const order = data.detailTarget;
    if (!order || !quote.selectedQuoteLineIds.length) return;
    const lineIds = [...quote.selectedQuoteLineIds];
    data.setActionKey(`line-reassign:${order.id}`);
    try {
      const next = await reassignShippingOrderLines(order.id, {
        lineIds,
        targetSegmentId,
        targetTransportMode
      });
      const targetLine = (next.lines || []).find((line) => lineIds.includes(line.id));
      data.setDetailTarget(next);
      data.replaceOrder(next);
      quote.setReassignModalOpen(false);
      quote.setSelectedQuoteLineIds([]);
      if (targetLine?.shippingOrderSegmentId) {
        quote.selectSegment(targetLine.shippingOrderSegmentId);
      }
      message.success(`已调整 ${lineIds.length} 个商品的运输分区。`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '调整运输方案失败');
    } finally {
      data.setActionKey(undefined);
    }
  };

  return {
    handleSaveLineQuote,
    handleSaveBulkLineQuotes,
    selectBulkForwarder,
    selectBulkChannel,
    closeBulkModal,
    handleSaveEligibility,
    handleReassignLines
  };
}

export type ShippingOrderQuoteActions = ReturnType<typeof useShippingOrderQuoteActions>;
