import { message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Key } from 'react';
import {
  createShippingOrder,
  loadShippingOrder,
  loadShippingOrders,
  updateShippingOrder
} from './warehouseShippingOrderRequests';
import {
  loadWarehouseOrderPurchaseCandidates
} from './warehouseOrderPurchaseCandidateAdapter';
import type {
  WarehouseOrderPurchaseCandidate
} from './warehouseOrderPurchaseCandidateAdapter';
import type { ShippingOrder } from './warehouseShippingOrderTypes';
import {
  filterPurchaseOrders,
  filterShippingOrders
} from './warehouseShippingOrderDomain';
import {
  groupWarehouseOrderJourneys,
  loadWarehouseOrderJourneys
} from './warehouseOrderJourney';
import type { WarehouseOrderJourney } from './warehouseOrderJourney';
import type { ShippingOrderInteractionTicket } from './shippingOrderInteractionScope';
import { useShippingOrderInteractionController } from './useShippingOrderInteractionController';

export function useWarehouseShippingOrderData() {
  const [shippingOrders, setShippingOrders] = useState<ShippingOrder[]>([]);
  const [journeys, setJourneys] = useState<WarehouseOrderJourney[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<WarehouseOrderPurchaseCandidate[]>([]);
  const [selectedSourceOrderIds, setSelectedSourceOrderIds] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [sourceKeyword, setSourceKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ShippingOrder | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editRemark, setEditRemark] = useState('');
  const [detailTarget, setDetailTarget] = useState<ShippingOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionKey, setActionKey] = useState<string>();
  const interaction = useShippingOrderInteractionController({
    setActionKey,
    onScopeError: (error) => {
      setDetailTarget(null);
      setDetailLoading(false);
      message.error(error instanceof Error ? error.message : '仓库单交互范围校验失败');
    }
  });
  const {
    beginAction, finishAction, activateDetailInteractionScope, beginDetailRequest,
    isCurrentDetailRequest, beginDetailAction, isCurrentDetailAction, finishDetailAction,
    acceptCurrentInteractionResponse, invalidateDetailInteraction
  } = interaction;

  const selectedSourceOrders = useMemo(
    () => selectedSourceOrderIds
      .map((id) => purchaseOrders.find((order) => order.id === id))
      .filter((order): order is WarehouseOrderPurchaseCandidate => Boolean(order)),
    [purchaseOrders, selectedSourceOrderIds]
  );
  const journeysByOrder = useMemo(() => groupWarehouseOrderJourneys(journeys), [journeys]);
  const visibleShippingOrders = useMemo(
    () => filterShippingOrders(shippingOrders, keyword, journeysByOrder),
    [journeysByOrder, keyword, shippingOrders]
  );
  const visiblePurchaseOrders = useMemo(
    () => filterPurchaseOrders(purchaseOrders, sourceKeyword),
    [purchaseOrders, sourceKeyword]
  );

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const orders = await loadShippingOrders();
      setLoadError(undefined);
      setShippingOrders(orders);
      try {
        setJourneys(await loadWarehouseOrderJourneys());
      } catch (error) {
        setJourneys([]);
        message.warning(error instanceof Error ? error.message : '读取仓库单流转记录失败');
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : '读取仓库单失败';
      setLoadError(text);
      message.error(text);
    } finally {
      setLoading(false);
    }
    try {
      const orders = await loadWarehouseOrderPurchaseCandidates();
      setPurchaseOrders(orders);
      setSelectedSourceOrderIds((current) => current.filter((id) => orders.some((order) => order.id === id)));
    } catch {
      setPurchaseOrders([]);
      setSelectedSourceOrderIds([]);
    }
  }, []);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const replaceOrder = (nextOrder: ShippingOrder, preserveListLines = true) => {
    setShippingOrders((current) => current.map((order) => (
      order.id === nextOrder.id
        ? { ...order, ...nextOrder, lines: preserveListLines ? order.lines : nextOrder.lines }
        : order
    )));
  };

  const applyCurrentDetail = (
    request: ShippingOrderInteractionTicket,
    detail: ShippingOrder,
    preserveListLines = true
  ) => {
    if (!acceptCurrentInteractionResponse(request, detail.id)) return false;
    setDetailTarget(detail);
    replaceOrder(detail, preserveListLines);
    return true;
  };

  const refreshDetail = async (orderId: string) => {
    const request = beginDetailRequest('detail', orderId);
    if (!request) return undefined;
    const detail = await loadShippingOrder(orderId);
    return applyCurrentDetail(request, detail) ? detail : undefined;
  };

  const handleCreate = async () => {
    if (!selectedSourceOrderIds.length) {
      message.warning('请选择要合并的采购单。');
      return;
    }
    const action = beginAction('create-shipping-order');
    try {
      const order = await createShippingOrder({ purchaseOrderIds: selectedSourceOrderIds });
      setSelectedSourceOrderIds([]);
      setCreateModalOpen(false);
      await loadPage();
      message.success(`已创建仓库单 ${order.shippingOrderNo}。`);
      (order.warnings || []).forEach((warning) => message.warning(warning));
    } catch (error) {
      message.error(error instanceof Error ? error.message : '创建仓库单失败');
    } finally {
      finishAction(action);
    }
  };

  const openCreateModal = async () => {
    setCreateModalOpen(true);
    setSourceKeyword('');
    try {
      const orders = await loadWarehouseOrderPurchaseCandidates();
      setPurchaseOrders(orders);
      setSelectedSourceOrderIds((current) => current.filter((id) => orders.some((order) => order.id === id)));
    } catch (error) {
      message.error(error instanceof Error ? error.message : '读取已提交采购单失败');
    }
  };

  const openEditModal = (order: ShippingOrder) => {
    setEditTarget(order);
    setEditTitle(order.title || order.shippingOrderNo || '');
    setEditRemark(order.remark || '');
  };
  const closeEditModal = () => {
    setEditTarget(null);
    setEditTitle('');
    setEditRemark('');
  };
  const handleUpdateTitle = async () => {
    if (!editTarget) return;
    const title = editTitle.trim();
    if (!title) {
      message.warning('请输入仓库单名。');
      return;
    }
    const action = beginAction(`update-shipping-order:${editTarget.id}`);
    try {
      const next = await updateShippingOrder(editTarget.id, {
        title,
        remark: editRemark.trim() || undefined
      });
      replaceOrder(next, false);
      closeEditModal();
      message.success('已保存仓库单名。');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存仓库单失败');
    } finally {
      finishAction(action);
    }
  };

  const openDetail = async (order: ShippingOrder) => {
    activateDetailInteractionScope(order.id);
    const request = beginDetailRequest('detail', order.id, []);
    if (!request) return;
    setDetailTarget({ ...order, lines: [], segments: [] });
    setDetailLoading(true);
    try {
      const detail = await loadShippingOrder(order.id);
      applyCurrentDetail(request, detail);
    } catch (error) {
      if (isCurrentDetailRequest(request)) {
        message.error(error instanceof Error ? error.message : '读取仓库单详情失败');
      }
    } finally {
      if (isCurrentDetailRequest(request)) setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    invalidateDetailInteraction();
    setDetailTarget(null);
    setDetailLoading(false);
  };

  return {
    shippingOrders, setShippingOrders, journeysByOrder, purchaseOrders, selectedSourceOrderIds, setSelectedSourceOrderIds,
    keyword, setKeyword, sourceKeyword, setSourceKeyword, loading, loadError, createModalOpen,
    setCreateModalOpen, editTarget, editTitle, setEditTitle, editRemark, setEditRemark,
    detailTarget, detailLoading, actionKey,
    selectedSourceOrders, visibleShippingOrders, visiblePurchaseOrders, loadPage,
    beginAction, finishAction, activateDetailInteractionScope, beginDetailRequest, isCurrentDetailRequest,
    beginDetailAction, isCurrentDetailAction, finishDetailAction, acceptCurrentInteractionResponse,
    applyCurrentDetail,
    refreshDetail, handleCreate, openCreateModal, openEditModal, closeEditModal, handleUpdateTitle,
    openDetail, closeDetail,
    sourceOrderSelection: {
      selectedRowKeys: selectedSourceOrderIds,
      onChange: (keys: Key[]) => setSelectedSourceOrderIds(keys.map(String))
    }
  };
}

export type WarehouseShippingOrderData = ReturnType<typeof useWarehouseShippingOrderData>;
