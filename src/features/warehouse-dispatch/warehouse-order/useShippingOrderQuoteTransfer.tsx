import { App as AntdApp, Modal } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createLatestRequestGate } from '../../../shared/latestRequestGate';
import {
  exportShippingOrderLogisticsQuoteReport,
  importShippingOrderLogisticsQuoteReport,
  loadShippingOrderLogisticsQuoteOptions,
  loadShippingOrderLogisticsQuoteOptionsForScope
} from './warehouseShippingOrderRequests';
import type { OrderLogisticsQuoteOptions } from '../../logistics-quote/types';
import type { ShippingOrder } from './warehouseShippingOrderTypes';
import { QuoteImportResultContent } from './WarehouseShippingOrderSharedViews';
import {
  hasLineQuotePrice,
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
  findQuoteChannelOption,
  findQuoteForwarderOption
} from './warehouseShippingQuoteDomain';
import type { ShippingOrderQuoteState } from './useShippingOrderQuoteState';
import type { WarehouseShippingOrderData } from './useWarehouseShippingOrderData';
import { requireShippingOrderResponseOrderId } from './shippingOrderInteractionScope';

export function useShippingOrderQuoteTransfer(
  data: WarehouseShippingOrderData,
  quote: ShippingOrderQuoteState
) {
  const { message, notification } = AntdApp.useApp();
  const [exportTarget, setExportTarget] = useState<ShippingOrder | null>(null);
  const [exportSegmentIds, setExportSegmentIds] = useState<string[]>([]);
  const [exportOptions, setExportOptions] = useState<OrderLogisticsQuoteOptions | null>(null);
  const [exportSelection, setExportSelection] = useState<QuoteExportSelection>({});
  const [exportMissingOnly, setExportMissingOnly] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [lastImportResult, setLastImportResult] = useState<QuoteImportResultState | null>(null);
  const exportRequestGateRef = useRef(createLatestRequestGate<string>());
  const exportRequestScopeRef = useRef<string | undefined>(undefined);

  useEffect(() => () => {
    exportRequestGateRef.current.invalidate();
    exportRequestScopeRef.current = undefined;
  }, []);

  const exportableOptions = exportOptions;
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
    ?? Math.max(0, scopeLines.length - scopeLines.filter(hasLineQuotePrice).length));
  const confirmedCount = Number(selectedChannel?.confirmedLineCount
    ?? Math.max(0, totalCount - pendingCount));
  const unsupportedCount = Number(selectedChannel?.unsupportedLineCount || 0);
  const inquiryRequiredCount = Number(selectedChannel?.inquiryRequiredLineCount || 0);
  const visibleImportResult = useMemo(() => {
    if (!data.detailTarget || !lastImportResult) return null;
    if (lastImportResult.orderId !== data.detailTarget.id) return null;
    return sameStringSet(lastImportResult.segmentIds, quote.activeSegmentIds)
      ? lastImportResult.result
      : null;
  }, [data.detailTarget, lastImportResult, quote.activeSegmentIds]);

  const closeExportModal = () => {
    exportRequestGateRef.current.invalidate();
    exportRequestScopeRef.current = undefined;
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
    const requestScope = quoteExportRequestScope(order.id, segmentIds);
    exportRequestScopeRef.current = requestScope;
    const requestIdentity = exportRequestGateRef.current.begin(requestScope);
    const isCurrentRequest = () => exportRequestScopeRef.current !== undefined
      && exportRequestGateRef.current.isCurrent(requestIdentity, exportRequestScopeRef.current);
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
      if (!isCurrentRequest()) return;
      requireShippingOrderResponseOrderId(order.id, options.purchaseOrderId);
      setExportOptions(options);
    } catch (error) {
      if (!isCurrentRequest()) return;
      setExportOptions(null);
      message.error(error instanceof Error ? error.message : '读取可导出货代渠道失败');
    } finally {
      if (isCurrentRequest()) setExportLoading(false);
    }
  };

  const handleExport = () => {
    if (!exportTarget?.id) return;
    if (!exportSelection.forwarderCode || !exportSelection.routeCode) {
      message.warning('请选择货代和渠道。');
      return;
    }
    if (unsupportedCount > 0) {
      message.warning(`当前货代有 ${unsupportedCount} 个商品不接，请先调整运输方案。`);
      return;
    }
    const orderId = exportTarget.id;
    const request = {
      forwarderCode: exportSelection.forwarderCode,
      routeCode: exportSelection.routeCode,
      segmentIds: [...exportSegmentIds],
      missingOnly: exportMissingOnly
    };
    const action = data.beginAction(`logistics-quote-export:${orderId}`);
    closeExportModal();
    notification.success({
      message: '已提交导出',
      description: '文件正在后台生成，完成后将自动下载。',
      placement: 'topRight',
      duration: 5
    });
    void (async () => {
      try {
        const report = await exportShippingOrderLogisticsQuoteReport(orderId, request);
        saveBlobFile(report.blob, report.filename);
        message.success('审核单已生成，文件开始下载。');
        try {
          await data.loadPage();
        } catch {
          message.warning('文件已下载，列表刷新失败，请手动刷新。');
        }
      } catch (error) {
        message.error(error instanceof Error ? error.message : '导出物流报价表失败');
      } finally {
        data.finishAction(action);
      }
    })();
  };

  const selectExportForwarder = (forwarderCode: string) => {
    const forwarder = findQuoteForwarderOption(exportableOptions, forwarderCode);
    setExportSelection({
      forwarderCode,
      routeCode: forwarder?.channels?.length === 1 ? forwarder.channels[0].routeCode : undefined
    });
  };

  const handleImport = async (order: ShippingOrder, file: File, segmentIds?: string[]) => {
    if (!quote.detailMutationAllowed) {
      message.warning('当前仓库单或分区状态不可回传报价。');
      return;
    }
    const action = data.beginDetailAction(`logistics-quote-import:${order.id}`, order.id, segmentIds);
    if (!action) return;
    try {
      const result = await importShippingOrderLogisticsQuoteReport(order.id, file, segmentIds);
      if (!data.isCurrentDetailAction(action)) return;
      setLastImportResult({ orderId: order.id, segmentIds: segmentIds || [], result });
      await data.loadPage();
      if (!data.isCurrentDetailAction(action)) return;
      await data.refreshDetail(order.id);
      if (!data.isCurrentDetailAction(action)) return;
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
      if (data.isCurrentDetailAction(action)) {
        message.error(error instanceof Error ? error.message : '回传物流报价表失败');
      }
    } finally {
      data.finishDetailAction(action);
    }
  };

  return {
    exportTarget, exportOptions, exportSelection, setExportSelection, exportMissingOnly,
    setExportMissingOnly, exportLoading, exportableOptions, selectedForwarder, selectedChannel,
    totalCount, pendingCount, confirmedCount, unsupportedCount, inquiryRequiredCount, visibleImportResult,
    forwarderOptions: buildQuoteForwarderSelectOptions(exportableOptions),
    channelOptions: buildQuoteChannelSelectOptions(selectedForwarder),
    openExportModal, closeExportModal, handleExport, selectExportForwarder, handleImport,
    importResultTitle: visibleImportResult ? quoteImportResultTitle(visibleImportResult) : '',
    clearImportResult: () => setLastImportResult(null)
  };
}

function quoteExportRequestScope(orderId: string, segmentIds: string[] = []) {
  const normalizedSegmentIds = [...new Set(segmentIds)].sort();
  return `${orderId}:${normalizedSegmentIds.join(',')}`;
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
