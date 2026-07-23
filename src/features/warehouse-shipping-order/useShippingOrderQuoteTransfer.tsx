import { Modal, message } from 'antd';
import { useMemo, useState } from 'react';
import {
  exportShippingOrderLogisticsQuoteReport,
  importShippingOrderLogisticsQuoteReport,
  loadShippingOrder,
  loadShippingOrderLogisticsQuoteOptions,
  loadShippingOrderLogisticsQuoteOptionsForScope
} from '../purchase-order/api';
import type {
  PurchaseOrderLogisticsQuoteOptions,
  ShippingOrder
} from '../purchase-order/types';
import { QuoteImportResultContent } from './WarehouseShippingOrderSharedViews';
import {
  quoteImportResultTitle,
  sameStringSet
} from './warehouseShippingOrderDomain';
import type {
  QuoteExportSelection,
  QuoteImportResultState
} from './warehouseShippingOrderModels';
import {
  buildQuoteChannelSelectOptions,
  buildQuoteForwarderSelectOptions,
  filterQuoteOptionsWithTemplates,
  findQuoteChannelOption,
  findQuoteForwarderOption
} from './warehouseShippingQuoteDomain';
import type { ShippingOrderQuoteState } from './useShippingOrderQuoteState';
import type { WarehouseShippingOrderData } from './useWarehouseShippingOrderData';

export function useShippingOrderQuoteTransfer(
  data: WarehouseShippingOrderData,
  quote: ShippingOrderQuoteState
) {
  const [exportTarget, setExportTarget] = useState<ShippingOrder | null>(null);
  const [exportSegmentIds, setExportSegmentIds] = useState<string[]>([]);
  const [exportOptions, setExportOptions] = useState<PurchaseOrderLogisticsQuoteOptions | null>(null);
  const [exportSelection, setExportSelection] = useState<QuoteExportSelection>({});
  const [exportMissingOnly, setExportMissingOnly] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [lastImportResult, setLastImportResult] = useState<QuoteImportResultState | null>(null);

  const exportableOptions = useMemo(
    () => filterQuoteOptionsWithTemplates(exportOptions),
    [exportOptions]
  );
  const selectedForwarder = useMemo(
    () => findQuoteForwarderOption(exportableOptions, exportSelection.forwarderCode),
    [exportSelection.forwarderCode, exportableOptions]
  );
  const selectedChannel = useMemo(
    () => findQuoteChannelOption(selectedForwarder, exportSelection.routeCode),
    [exportSelection.routeCode, selectedForwarder]
  );
  const scopeLines = useMemo(() => {
    const lines = exportTarget?.lines || [];
    if (!exportSegmentIds.length) return lines;
    const ids = new Set(exportSegmentIds);
    return lines.filter((line) => Boolean(line.shippingOrderSegmentId && ids.has(line.shippingOrderSegmentId)));
  }, [exportSegmentIds, exportTarget]);
  const totalCount = Number(selectedChannel?.totalLineCount
    ?? selectedChannel?.lineQuotes?.length
    ?? scopeLines.length
    ?? exportOptions?.pendingLineCount
    ?? 0);
  const pendingCount = Number(selectedChannel?.pendingLineCount
    ?? Math.max(0, scopeLines.length - scopeLines.filter((line) => line.quoteStatus === 'CONFIRMED').length));
  const confirmedCount = Number(selectedChannel?.confirmedLineCount
    ?? Math.max(0, totalCount - pendingCount));
  const visibleImportResult = useMemo(() => {
    if (!data.detailTarget || !lastImportResult) return null;
    if (lastImportResult.orderId !== data.detailTarget.id) return null;
    return sameStringSet(lastImportResult.segmentIds, quote.activeSegmentIds)
      ? lastImportResult.result
      : null;
  }, [data.detailTarget, lastImportResult, quote.activeSegmentIds]);

  const closeExportModal = () => {
    setExportTarget(null);
    setExportSegmentIds([]);
    setExportOptions(null);
    setExportSelection({});
    setExportMissingOnly(false);
    setExportLoading(false);
  };

  const openExportModal = async (order: ShippingOrder, segmentIds?: string[]) => {
    if (!order.lineCount) {
      message.warning('当前仓库单还没有商品。');
      return;
    }
    setExportTarget(order);
    setExportSegmentIds(segmentIds || []);
    setExportOptions(null);
    setExportSelection({});
    setExportMissingOnly(false);
    setExportLoading(true);
    try {
      const options = segmentIds?.length
        ? await loadShippingOrderLogisticsQuoteOptionsForScope(order.id, segmentIds)
        : await loadShippingOrderLogisticsQuoteOptions(order.id);
      setExportOptions(options);
    } catch (error) {
      setExportOptions(null);
      message.error(error instanceof Error ? error.message : '读取可导出货代渠道失败');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExport = async () => {
    if (!exportTarget?.id) return;
    if (!exportSelection.forwarderCode || !exportSelection.routeCode) {
      message.warning('请选择货代和渠道。');
      return;
    }
    data.setActionKey(`logistics-quote-export:${exportTarget.id}`);
    try {
      const report = await exportShippingOrderLogisticsQuoteReport(exportTarget.id, {
        forwarderCode: exportSelection.forwarderCode,
        routeCode: exportSelection.routeCode,
        segmentIds: exportSegmentIds,
        missingOnly: exportMissingOnly
      });
      saveBlobFile(report.blob, report.filename);
      closeExportModal();
      await data.loadPage();
      message.success('已导出物流报价表。');
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导出物流报价表失败');
    } finally {
      data.setActionKey(undefined);
    }
  };

  const selectExportForwarder = (forwarderCode: string) => {
    const forwarder = findQuoteForwarderOption(exportableOptions, forwarderCode);
    setExportSelection({
      forwarderCode,
      routeCode: forwarder?.channels?.length === 1 ? forwarder.channels[0].routeCode : undefined
    });
  };

  const handleImport = async (order: ShippingOrder, file: File, segmentIds?: string[]) => {
    data.setActionKey(`logistics-quote-import:${order.id}`);
    try {
      const result = await importShippingOrderLogisticsQuoteReport(order.id, file, segmentIds);
      setLastImportResult({ orderId: order.id, segmentIds: segmentIds || [], result });
      await data.loadPage();
      if (data.detailTarget?.id === order.id) {
        const detail = await loadShippingOrder(order.id);
        data.setDetailTarget(detail);
      }
      if (!result.updatedRows) {
        Modal.warning({
          title: '报价未更新',
          content: <QuoteImportResultContent result={result} />,
          okText: '知道了'
        });
        return;
      }
      message.success(`已回传物流报价 ${result.updatedRows} 行${result.skippedRows ? `，跳过 ${result.skippedRows} 行` : ''}。`);
      if (result.errors?.length || result.skippedRows) {
        Modal.warning({
          title: '部分报价未更新',
          content: <QuoteImportResultContent result={result} />,
          okText: '知道了'
        });
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '回传物流报价表失败');
    } finally {
      data.setActionKey(undefined);
    }
  };

  return {
    exportTarget, exportOptions, exportSelection, setExportSelection, exportMissingOnly,
    setExportMissingOnly, exportLoading, exportableOptions, selectedForwarder, selectedChannel,
    totalCount, pendingCount, confirmedCount, visibleImportResult,
    forwarderOptions: buildQuoteForwarderSelectOptions(exportableOptions),
    channelOptions: buildQuoteChannelSelectOptions(selectedForwarder),
    openExportModal, closeExportModal, handleExport, selectExportForwarder, handleImport,
    importResultTitle: visibleImportResult ? quoteImportResultTitle(visibleImportResult) : '',
    clearImportResult: () => setLastImportResult(null)
  };
}

function saveBlobFile(blob: Blob, filename: string) {
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export type ShippingOrderQuoteTransfer = ReturnType<typeof useShippingOrderQuoteTransfer>;
