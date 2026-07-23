import { useCallback } from 'react';
import {
  archiveLogisticsQuoteSourceBundleFile,
  createLogisticsQuoteSourceBundle
} from '../api';
import { emptyCreateDraft } from '../defaults';
import { buildSourceBundleCreateRequest } from '../requestMappers';
import type { LogisticsQuoteWorkbenchResponse } from '../types';
import type { UseLogisticsQuoteBoardActionsParams } from './logisticsQuoteBoardActionTypes';

export function useLogisticsQuoteSourceBundleCreate(params: UseLogisticsQuoteBoardActionsParams) {
  const {
    createDraft,
    createArchiveFiles,
    beginWorkbenchRequest,
    commitWorkbenchData,
    workbenchRequestIdRef,
    setCreateDraft,
    setCreateArchiveFiles,
    setCreateState
  } = params;

  return useCallback(async () => {
    setCreateState({ status: 'loading' });
    const requestId = beginWorkbenchRequest();
    let latestData: LogisticsQuoteWorkbenchResponse | null = null;
    try {
      let data = await createLogisticsQuoteSourceBundle(
        buildSourceBundleCreateRequest(createDraft, createArchiveFiles)
      );
      latestData = data;
      const usedFileIds = new Set<number>();
      for (const archiveFile of createArchiveFiles) {
        const targetFile = data.selectedBundle?.files.find((item) => {
          if (typeof item.id !== 'number' || usedFileIds.has(item.id)) return false;
          return item.fileName === archiveFile.name;
        });
        if (typeof targetFile?.id === 'number') usedFileIds.add(targetFile.id);
        data = await archiveLogisticsQuoteSourceBundleFile(
          data.selectedBundleId ?? data.selectedBundle?.id ?? 0,
          archiveFile,
          data.selectedBundle?.selectedNoteId ?? undefined,
          targetFile?.id
        );
        latestData = data;
      }
      if (!commitWorkbenchData(data, requestId)) {
        setCreateState({ status: 'idle' });
        return;
      }
      setCreateDraft(emptyCreateDraft);
      setCreateArchiveFiles([]);
      setCreateState({ status: 'idle' });
    } catch (error) {
      if (requestId !== workbenchRequestIdRef.current) {
        setCreateState({ status: 'idle' });
        return;
      }
      if (latestData) commitWorkbenchData(latestData, requestId);
      setCreateState({
        status: 'error',
        message: error instanceof Error ? error.message : '来源包保存或文件归档失败'
      });
    }
  }, [
    beginWorkbenchRequest,
    commitWorkbenchData,
    createArchiveFiles,
    createDraft,
    setCreateArchiveFiles,
    setCreateDraft,
    setCreateState,
    workbenchRequestIdRef
  ]);
}
