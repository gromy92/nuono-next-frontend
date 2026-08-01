import { App } from 'antd';
import { submitShippingOrder } from './warehouseShippingOrderRequests';
import type { ShippingOrder } from './warehouseShippingOrderTypes';
import {
  shippingOrderQuoteIssueSummary
} from './warehouseShippingOrderDomain';
import type { WarehouseShippingOrderData } from './useWarehouseShippingOrderData';

export function useShippingOrderSubmit(data: WarehouseShippingOrderData) {
  const { modal, message } = App.useApp();

  const handleSubmit = async (order: ShippingOrder) => {
    const quoteIssue = shippingOrderQuoteIssueSummary(order);
    if (order.shippingSubmitStatus === 'SUBMITTED') {
      modal.warning({
        title: '仓库单已提交',
        content: '该仓库单已经整体提交，不能重复提交。',
        okText: '知道了'
      });
      return;
    }
    if (quoteIssue.totalCount > 0) {
      const reasons = [
        quoteIssue.unsupportedCount > 0
          ? `${quoteIssue.unsupportedCount} 个商品当前货代不接`
          : '',
        quoteIssue.inquiryRequiredCount > 0
          ? `${quoteIssue.inquiryRequiredCount} 个商品需询价确认`
          : '',
        quoteIssue.pendingQuoteCount > 0
          ? `${quoteIssue.pendingQuoteCount} 个商品缺单价`
          : '',
        quoteIssue.missingMaterialCount > 0
          ? `${quoteIssue.missingMaterialCount} 个义特商品缺少材质`
          : ''
      ].filter(Boolean).join('；');
      modal.warning({
        title: '暂不能提交发货',
        content: `整张仓库单仍有阻断项：${reasons}。处理完成后才能提交给仓库装箱。`,
        okText: '知道了'
      });
      return;
    }
    data.setActionKey(`submit-shipping:${order.id}`);
    try {
      const result = await submitShippingOrder(order.id);
      await data.loadPage();
      if (data.detailTarget?.id === order.id) await data.refreshDetail(order.id);
      modal.success({
        title: '已提交发货',
        content: `仓库单已整体提交，共 ${result.submittedLineCount} 行。`,
        okText: '知道了'
      });
    } catch (error) {
      message.error(error instanceof Error ? error.message : '提交发货失败');
    } finally {
      data.setActionKey(undefined);
    }
  };
  return { handleSubmit };
}

export type ShippingOrderSubmit = ReturnType<typeof useShippingOrderSubmit>;
