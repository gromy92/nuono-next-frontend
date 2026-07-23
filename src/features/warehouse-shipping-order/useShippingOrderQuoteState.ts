import { message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { loadShippingOrderLogisticsQuoteOptionsForScope } from '../purchase-order/api';
import type {
  PurchaseOrderLogisticsQuoteChannelOption,
  PurchaseOrderLogisticsQuoteForwarderOption,
  PurchaseOrderLogisticsQuoteOptions,
  ShippingOrderLine
} from '../purchase-order/types';
import {
  applySelectedChannelQuoteToLine,
  isLineQuoteConfirmed,
  isMissingYiteQuoteMaterial,
  isYiteQuoteForwarder
} from './warehouseShippingOrderDomain';
import type {
  DetailLineFilter,
  LineQuoteDraft,
  QuoteExportSelection
} from './warehouseShippingOrderModels';
import {
  buildQuoteChannelSelectOptions,
  buildQuoteForwarderSelectOptions,
  defaultSegmentQuoteSelection,
  findQuoteChannelOption,
  findQuoteForwarderOption,
  firstAvailableSegmentQuoteSelection,
  formatQuoteInputValue,
  sortShippingOrderSegments
} from './warehouseShippingQuoteDomain';
import type { WarehouseShippingOrderData } from './useWarehouseShippingOrderData';

export function useShippingOrderQuoteState(data: WarehouseShippingOrderData) {
  const [detailLineFilter, setDetailLineFilter] = useState<DetailLineFilter>('ALL');
  const [lineQuoteDrafts, setLineQuoteDrafts] = useState<Record<string, LineQuoteDraft>>({});
  const [selectedQuoteLineIds, setSelectedQuoteLineIds] = useState<string[]>([]);
  const [bulkQuoteModalOpen, setBulkQuoteModalOpen] = useState(false);
  const [bulkQuoteUnitPrice, setBulkQuoteUnitPrice] = useState('');
  const [bulkQuoteYiteMaterial, setBulkQuoteYiteMaterial] = useState<string>();
  const [activeSegmentQuoteOptions, setActiveSegmentQuoteOptions] = useState<PurchaseOrderLogisticsQuoteOptions | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<QuoteExportSelection>({});
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>([]);

  const detailLines = useMemo(() => data.detailTarget?.lines || [], [data.detailTarget]);
  const detailSegments = useMemo(() => data.detailTarget?.segments || [], [data.detailTarget]);
  const sortedSegments = useMemo(() => sortShippingOrderSegments(detailSegments), [detailSegments]);
  const activeSegment = useMemo(() => {
    const selectedId = selectedSegmentIds[0];
    return detailSegments.find((segment) => String(segment.id) === String(selectedId)) || sortedSegments[0];
  }, [detailSegments, selectedSegmentIds, sortedSegments]);
  const activeSegmentIds = useMemo(() => activeSegment ? [activeSegment.id] : [], [activeSegment]);
  const activeLines = useMemo(
    () => detailLines.filter((line) => !activeSegment || line.shippingOrderSegmentId === activeSegment.id),
    [activeSegment, detailLines]
  );
  const selectedForwarder = useMemo(
    () => findQuoteForwarderOption(activeSegmentQuoteOptions, selectedOption.forwarderCode),
    [activeSegmentQuoteOptions, selectedOption.forwarderCode]
  );
  const selectedChannel = useMemo(
    () => findQuoteChannelOption(selectedForwarder, selectedOption.routeCode),
    [selectedForwarder, selectedOption.routeCode]
  );
  const linesWithSelectedQuote = useMemo(
    () => activeLines.map((line) => applySelectedChannelQuoteToLine(line, selectedChannel)),
    [activeLines, selectedChannel]
  );
  const showYiteFields = isYiteQuoteForwarder(selectedForwarder);
  const missingMaterialCount = useMemo(
    () => showYiteFields ? linesWithSelectedQuote.filter(isMissingYiteQuoteMaterial).length : 0,
    [linesWithSelectedQuote, showYiteFields]
  );
  const confirmedQuoteCount = useMemo(() => {
    const computed = linesWithSelectedQuote.filter(isLineQuoteConfirmed).length;
    return selectedChannel?.confirmedLineCount == null
      ? computed
      : Number(selectedChannel.confirmedLineCount || 0);
  }, [linesWithSelectedQuote, selectedChannel?.confirmedLineCount]);
  const pendingQuoteCount = selectedChannel?.pendingLineCount == null
    ? Math.max(0, linesWithSelectedQuote.length - confirmedQuoteCount)
    : Number(selectedChannel.pendingLineCount || 0);
  const visibleLines = useMemo(() => linesWithSelectedQuote
    .filter((line) => showYiteFields && detailLineFilter === 'MISSING_MATERIAL'
      ? isMissingYiteQuoteMaterial(line)
      : true)
    .filter((line) => detailLineFilter === 'PENDING_QUOTE' ? !isLineQuoteConfirmed(line) : true),
  [detailLineFilter, linesWithSelectedQuote, showYiteFields]);
  const selectedLines = useMemo(() => {
    const ids = new Set(selectedQuoteLineIds);
    return linesWithSelectedQuote.filter((line) => ids.has(line.id));
  }, [linesWithSelectedQuote, selectedQuoteLineIds]);

  useEffect(() => {
    setDetailLineFilter('ALL');
    setLineQuoteDrafts({});
    setSelectedQuoteLineIds([]);
    setBulkQuoteModalOpen(false);
    setBulkQuoteUnitPrice('');
    setBulkQuoteYiteMaterial(undefined);
    setSelectedSegmentIds([]);
  }, [data.detailTarget?.id]);

  useEffect(() => {
    if (!data.detailTarget) return;
    const ids = sortedSegments.map((segment) => segment.id);
    setSelectedSegmentIds((current) => {
      const currentId = current[0];
      if (currentId && ids.includes(currentId)) return current.length === 1 ? current : [currentId];
      const firstOpen = sortedSegments.find((segment) => segment.shippingSubmitStatus !== 'SUBMITTED');
      return firstOpen ? [firstOpen.id] : ids[0] ? [ids[0]] : [];
    });
  }, [data.detailTarget, sortedSegments]);

  useEffect(() => {
    if (!data.detailTarget?.id || !activeSegmentIds.length) {
      setActiveSegmentQuoteOptions(null);
      setSelectedOption({});
      setOptionsLoading(false);
      return;
    }
    let cancelled = false;
    setOptionsLoading(true);
    loadShippingOrderLogisticsQuoteOptionsForScope(data.detailTarget.id, activeSegmentIds)
      .then((options) => {
        if (cancelled) return;
        setActiveSegmentQuoteOptions(options);
        setSelectedOption(defaultSegmentQuoteSelection(options, activeSegment));
      })
      .catch((error) => {
        if (cancelled) return;
        setActiveSegmentQuoteOptions(null);
        setSelectedOption({});
        message.error(error instanceof Error ? error.message : '读取货代渠道选项失败');
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeSegment, activeSegmentIds, data.detailTarget?.id]);

  useEffect(() => {
    if (!showYiteFields && detailLineFilter === 'MISSING_MATERIAL') setDetailLineFilter('ALL');
  }, [detailLineFilter, showYiteFields]);
  useEffect(() => {
    const selectable = new Set(linesWithSelectedQuote
      .filter((line) => line.shippingSubmitStatus !== 'SUBMITTED')
      .map((line) => line.id));
    setSelectedQuoteLineIds((current) => current.filter((id) => selectable.has(id)));
  }, [linesWithSelectedQuote]);

  const readLineDraft = (line: ShippingOrderLine): LineQuoteDraft => ({
    unitPrice: lineQuoteDrafts[line.id]?.unitPrice ?? formatQuoteInputValue(line.unitPrice),
    yiteMaterial: lineQuoteDrafts[line.id]?.yiteMaterial ?? line.yiteMaterial ?? undefined
  });
  const updateLineDraft = (lineId: string, patch: LineQuoteDraft) => {
    setLineQuoteDrafts((current) => ({
      ...current,
      [lineId]: { ...current[lineId], ...patch }
    }));
  };
  const clearLineDrafts = (lineIds: string[]) => {
    setLineQuoteDrafts((current) => {
      const next = { ...current };
      lineIds.forEach((lineId) => delete next[lineId]);
      return next;
    });
  };
  const resetQuoteEditing = () => {
    setLineQuoteDrafts({});
    setSelectedQuoteLineIds([]);
    setBulkQuoteModalOpen(false);
    setBulkQuoteUnitPrice('');
    setBulkQuoteYiteMaterial(undefined);
  };
  const selectSegment = (segmentId: string) => {
    setSelectedSegmentIds([segmentId]);
    setDetailLineFilter('ALL');
    resetQuoteEditing();
  };
  const selectQuoteOption = (
    forwarder: PurchaseOrderLogisticsQuoteForwarderOption,
    channel: PurchaseOrderLogisticsQuoteChannelOption
  ) => {
    setSelectedOption({ forwarderCode: forwarder.forwarderCode, routeCode: channel.routeCode });
    if (!isYiteQuoteForwarder(forwarder)) setDetailLineFilter('ALL');
    resetQuoteEditing();
  };
  const openBulkModal = () => {
    if (!selectedQuoteLineIds.length) {
      message.warning('请选择要批量报价的商品。');
      return;
    }
    if ((!selectedOption.forwarderCode || !selectedOption.routeCode) && activeSegmentQuoteOptions) {
      setSelectedOption(firstAvailableSegmentQuoteSelection(activeSegmentQuoteOptions));
    }
    setBulkQuoteUnitPrice('');
    setBulkQuoteYiteMaterial(undefined);
    setBulkQuoteModalOpen(true);
  };

  return {
    detailLineFilter, setDetailLineFilter, selectedQuoteLineIds, setSelectedQuoteLineIds,
    bulkQuoteModalOpen, setBulkQuoteModalOpen, bulkQuoteUnitPrice, setBulkQuoteUnitPrice,
    bulkQuoteYiteMaterial, setBulkQuoteYiteMaterial, activeSegmentQuoteOptions,
    setActiveSegmentQuoteOptions, optionsLoading, selectedOption, setSelectedOption,
    selectedSegmentIds, detailLines, detailSegments, sortedSegments, activeSegment, activeSegmentIds,
    activeLines, selectedForwarder, selectedChannel, linesWithSelectedQuote, showYiteFields,
    missingMaterialCount, confirmedQuoteCount, pendingQuoteCount, visibleLines, selectedLines,
    forwarderSelectOptions: buildQuoteForwarderSelectOptions(activeSegmentQuoteOptions),
    channelSelectOptions: buildQuoteChannelSelectOptions(selectedForwarder),
    activeMaintenanceKey: `${selectedOption.forwarderCode || ''}:${selectedOption.routeCode || ''}`,
    activeSegmentSubmitted: activeSegment?.shippingSubmitStatus === 'SUBMITTED',
    warehouseOrderSubmitted: data.detailTarget?.shippingSubmitStatus === 'SUBMITTED',
    readLineDraft, updateLineDraft, clearLineDrafts, resetQuoteEditing, selectSegment, selectQuoteOption, openBulkModal
  };
}

export type ShippingOrderQuoteState = ReturnType<typeof useShippingOrderQuoteState>;
