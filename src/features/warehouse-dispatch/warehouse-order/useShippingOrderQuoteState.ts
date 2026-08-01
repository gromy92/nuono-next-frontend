import { message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { loadShippingOrderLogisticsQuoteOptionsForScope } from './warehouseShippingOrderRequests';
import type {
  OrderLogisticsQuoteChannelOption,
  OrderLogisticsQuoteForwarderOption,
  OrderLogisticsQuoteOptions
} from '../../logistics-quote/types';
import type { ShippingOrderLine } from './warehouseShippingOrderTypes';
import {
  hasLineQuotePrice,
  isMissingYiteQuoteMaterial,
  isYiteQuoteForwarder
} from './warehouseShippingOrderDomain';
import {
  isInquiryRequiredForwarderEligibility,
  isSupportedForwarderEligibility,
  isUnknownForwarderEligibility,
  isUnsupportedForwarderEligibility
} from './warehouseForwarderEligibilityDomain';
import { applySelectedChannelQuoteToLine } from './warehouseShippingQuoteLineMatching';
import type {
  DetailLineFilter,
  DetailUnitPriceFilter,
  LineQuoteDraft,
  QuoteBillingUnit,
  QuoteExportSelection
} from './warehouseShippingOrderModels';
import {
  buildQuoteUnitPriceFilterOptions,
  buildQuoteChannelSelectOptions,
  buildQuoteForwarderSelectOptions,
  defaultSegmentQuoteSelection,
  findQuoteChannelOption,
  findQuoteForwarderOption,
  firstAvailableSegmentQuoteSelection,
  formatQuoteInputValue,
  matchesQuoteUnitPriceFilter,
  resolveQuoteBillingUnit,
  sortShippingOrderSegments,
  warehouseQuotePriceState
} from './warehouseShippingQuoteDomain';
import type { WarehouseShippingOrderData } from './useWarehouseShippingOrderData';

export function useShippingOrderQuoteState(data: WarehouseShippingOrderData) {
  const [detailLineFilter, setDetailLineFilter] = useState<DetailLineFilter>('ALL');
  const [detailUnitPriceFilter, setDetailUnitPriceFilter] = useState<DetailUnitPriceFilter>('ALL');
  const [lineQuoteDrafts, setLineQuoteDrafts] = useState<Record<string, LineQuoteDraft>>({});
  const [selectedQuoteLineIds, setSelectedQuoteLineIds] = useState<string[]>([]);
  const [bulkQuoteModalOpen, setBulkQuoteModalOpen] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [bulkQuoteUnitPrice, setBulkQuoteUnitPrice] = useState('');
  const [bulkQuoteBillingUnit, setBulkQuoteBillingUnit] = useState<QuoteBillingUnit>('KG');
  const [bulkQuoteYiteMaterial, setBulkQuoteYiteMaterial] = useState<string>();
  const [activeSegmentQuoteOptions, setActiveSegmentQuoteOptions] = useState<OrderLogisticsQuoteOptions | null>(null);
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
    () => activeLines.map((line) => applySelectedChannelQuoteToLine(line, selectedChannel, activeLines)),
    [activeLines, selectedChannel]
  );
  const showYiteFields = isYiteQuoteForwarder(selectedForwarder);
  const missingMaterialCount = useMemo(
    () => showYiteFields ? linesWithSelectedQuote.filter(isMissingYiteQuoteMaterial).length : 0,
    [linesWithSelectedQuote, showYiteFields]
  );
  const missingPriceCount = useMemo(
    () => linesWithSelectedQuote
      .filter(isSupportedForwarderEligibility)
      .filter((line) => warehouseQuotePriceState(line) === 'MISSING_PRICE').length,
    [linesWithSelectedQuote]
  );
  const inquiryRequiredCount = useMemo(
    () => linesWithSelectedQuote.filter(isInquiryRequiredForwarderEligibility).length,
    [linesWithSelectedQuote]
  );
  const unsupportedCount = useMemo(
    () => linesWithSelectedQuote.filter(isUnsupportedForwarderEligibility).length,
    [linesWithSelectedQuote]
  );
  const unknownEligibilityCount = useMemo(
    () => linesWithSelectedQuote.filter(isUnknownForwarderEligibility).length,
    [linesWithSelectedQuote]
  );
  const unitPriceFilterOptions = useMemo(
    () => buildQuoteUnitPriceFilterOptions(linesWithSelectedQuote, activeSegment?.transportMode),
    [activeSegment?.transportMode, linesWithSelectedQuote]
  );
  const visibleLines = useMemo(() => linesWithSelectedQuote
    .filter((line) => matchesQuoteUnitPriceFilter(
      line.unitPrice,
      line.billingUnit,
      detailUnitPriceFilter,
      activeSegment?.transportMode || line.plannedTransportMode
    ))
    .filter((line) => showYiteFields && detailLineFilter === 'MISSING_MATERIAL'
      ? isMissingYiteQuoteMaterial(line)
      : true)
    .filter((line) => detailLineFilter === 'MISSING_PRICE'
      ? isSupportedForwarderEligibility(line) && warehouseQuotePriceState(line) === 'MISSING_PRICE'
      : true)
    .filter((line) => detailLineFilter === 'INQUIRY_REQUIRED'
      ? isInquiryRequiredForwarderEligibility(line)
      : true)
    .filter((line) => detailLineFilter === 'UNSUPPORTED'
      ? isUnsupportedForwarderEligibility(line)
      : true)
    .filter((line) => detailLineFilter === 'ELIGIBILITY_UNKNOWN'
      ? isUnknownForwarderEligibility(line)
      : true),
  [activeSegment?.transportMode, detailLineFilter, detailUnitPriceFilter, linesWithSelectedQuote, showYiteFields]);
  const selectedLines = useMemo(() => {
    const ids = new Set(selectedQuoteLineIds);
    return linesWithSelectedQuote.filter((line) => ids.has(line.id));
  }, [linesWithSelectedQuote, selectedQuoteLineIds]);

  useEffect(() => {
    setDetailLineFilter('ALL');
    setDetailUnitPriceFilter('ALL');
    setLineQuoteDrafts({});
    setSelectedQuoteLineIds([]);
    setBulkQuoteModalOpen(false);
    setReassignModalOpen(false);
    setBulkQuoteUnitPrice('');
    setBulkQuoteBillingUnit('KG');
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
    if (!unitPriceFilterOptions.some((option) => option.value === detailUnitPriceFilter)) {
      setDetailUnitPriceFilter('ALL');
    }
  }, [detailUnitPriceFilter, unitPriceFilterOptions]);
  useEffect(() => {
    const selectable = new Set(linesWithSelectedQuote
      .filter((line) => line.shippingSubmitStatus !== 'SUBMITTED')
      .map((line) => line.id));
    setSelectedQuoteLineIds((current) => current.filter((id) => selectable.has(id)));
  }, [linesWithSelectedQuote]);

  const readLineDraft = (line: ShippingOrderLine): LineQuoteDraft => ({
    unitPrice: lineQuoteDrafts[line.id]?.unitPrice ?? formatQuoteInputValue(line.unitPrice),
    billingUnit: resolveQuoteBillingUnit(
      lineQuoteDrafts[line.id]?.billingUnit
        ?? (hasLineQuotePrice(line) ? line.billingUnit : undefined),
      activeSegment?.transportMode || line.plannedTransportMode
    ),
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
    setBulkQuoteBillingUnit(resolveQuoteBillingUnit(undefined, activeSegment?.transportMode));
    setBulkQuoteYiteMaterial(undefined);
  };
  const selectSegment = (segmentId: string) => {
    setSelectedSegmentIds([segmentId]);
    setDetailLineFilter('ALL');
    setDetailUnitPriceFilter('ALL');
    resetQuoteEditing();
  };
  const selectQuoteOption = (
    forwarder: OrderLogisticsQuoteForwarderOption,
    channel: OrderLogisticsQuoteChannelOption
  ) => {
    setSelectedOption({ forwarderCode: forwarder.forwarderCode, routeCode: channel.routeCode });
    if (!isYiteQuoteForwarder(forwarder)) setDetailLineFilter('ALL');
    setDetailUnitPriceFilter('ALL');
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
    setBulkQuoteBillingUnit(resolveQuoteBillingUnit(
      undefined,
      activeSegment?.transportMode || selectedLines[0]?.plannedTransportMode
    ));
    setBulkQuoteYiteMaterial(undefined);
    setBulkQuoteModalOpen(true);
  };
  const openReassignModal = () => {
    if (!selectedQuoteLineIds.length) {
      message.warning('请选择要调整运输方案的商品。');
      return;
    }
    setReassignModalOpen(true);
  };

  return {
    detailLineFilter, setDetailLineFilter, detailUnitPriceFilter, setDetailUnitPriceFilter,
    unitPriceFilterOptions, selectedQuoteLineIds, setSelectedQuoteLineIds,
    bulkQuoteModalOpen, setBulkQuoteModalOpen, bulkQuoteUnitPrice, setBulkQuoteUnitPrice,
    bulkQuoteBillingUnit, setBulkQuoteBillingUnit,
    reassignModalOpen, setReassignModalOpen,
    bulkQuoteYiteMaterial, setBulkQuoteYiteMaterial, activeSegmentQuoteOptions,
    setActiveSegmentQuoteOptions, optionsLoading, selectedOption, setSelectedOption,
    selectedSegmentIds, detailLines, detailSegments, sortedSegments, activeSegment, activeSegmentIds,
    activeLines, selectedForwarder, selectedChannel, linesWithSelectedQuote, showYiteFields,
    missingMaterialCount, missingPriceCount, inquiryRequiredCount, unsupportedCount,
    unknownEligibilityCount, visibleLines, selectedLines,
    forwarderSelectOptions: buildQuoteForwarderSelectOptions(activeSegmentQuoteOptions),
    channelSelectOptions: buildQuoteChannelSelectOptions(selectedForwarder),
    activeMaintenanceKey: `${selectedOption.forwarderCode || ''}:${selectedOption.routeCode || ''}:${detailLineFilter}:${detailUnitPriceFilter}`,
    activeSegmentSubmitted: activeSegment?.shippingSubmitStatus === 'SUBMITTED',
    warehouseOrderSubmitted: data.detailTarget?.shippingSubmitStatus === 'SUBMITTED',
    readLineDraft, updateLineDraft, clearLineDrafts, resetQuoteEditing, selectSegment, selectQuoteOption,
    openBulkModal, openReassignModal
  };
}

export type ShippingOrderQuoteState = ReturnType<typeof useShippingOrderQuoteState>;
