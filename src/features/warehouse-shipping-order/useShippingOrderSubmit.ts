import { Modal, message } from 'antd';
import { submitShippingOrder } from '../purchase-order/api';
import type { ShippingOrder } from '../purchase-order/types';
import {
  countShippingOrderPendingQuoteLines,
  isMissingYiteMaterial,
  isYiteSegment
} from './warehouseShippingOrderDomain';
import type { WarehouseShippingOrderData } from './useWarehouseShippingOrderData';

export function useShippingOrderSubmit(data: WarehouseShippingOrderData) {
  const handleSubmit = async (order: ShippingOrder) => {
    const pendingQuoteCount = countShippingOrderPendingQuoteLines(order);
    const yiteSegmentIds = new Set((order.segments || []).filter(isYiteSegment).map((segment) => segment.id));
    const missingMaterialCount = order.lines?.length
      ? order.lines.filter((line) => isMissingYiteMaterial(line, yiteSegmentIds)).length
      : (order.segments || []).reduce((sum, segment) => sum + Number(segment.missingYiteMaterialCount || 0), 0);
    if (order.shippingSubmitStatus === 'SUBMITTED') {
      Modal.warning({
        title: '仓库单已提交',
        content: '该仓库单已经整体提交，不能重复提交。',
        okText: '知道了'
      });
      return;
    }
    if (pendingQuoteCount > 0) {
      Modal.warning({
        title: '报价缺失',
        content: `还有 ${pendingQuoteCount} 个商品缺少物流报价，补齐后才能提交给仓库装箱。`,
        okText: '知道了'
      });
      return;
    }
    if (missingMaterialCount > 0) {
      Modal.warning({
        title: '义特材质缺失',
        content: `还有 ${missingMaterialCount} 个商品材质缺失，补齐后才能提交给仓库装箱。`,
        okText: '知道了'
      });
      return;
    }
    data.setActionKey(`submit-shipping:${order.id}`);
    try {
      const result = await submitShippingOrder(order.id);
      await data.loadPage();
      if (data.detailTarget?.id === order.id) await data.refreshDetail(order.id);
      Modal.success({
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
