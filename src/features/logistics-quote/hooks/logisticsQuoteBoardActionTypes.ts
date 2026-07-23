import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type {
  AppendFileDraft,
  AsyncActionState,
  FileEditDraft,
  SourceBundleCreateDraft
} from '../state';
import type {
  LogisticsQuoteBundleDetailDto,
  LogisticsQuoteSourceNoteDto,
  LogisticsQuoteWorkbenchResponse
} from '../types';

export type UseLogisticsQuoteBoardActionsParams = {
  selectedBundle: LogisticsQuoteBundleDetailDto | null;
  currentSelectedNoteId: number | null;
  currentSelectedFileId: number | null;
  editableNote: LogisticsQuoteSourceNoteDto | null;
  createDraft: SourceBundleCreateDraft;
  createArchiveFiles: File[];
  noteEditDraft: string;
  appendNoteDraft: string;
  appendFileDraft: AppendFileDraft;
  fileEditDraft: FileEditDraft;
  analysisSummaryDraft: string;
  beginWorkbenchRequest: () => number;
  commitWorkbenchData: (data: LogisticsQuoteWorkbenchResponse, requestId?: number) => boolean;
  workbenchRequestIdRef: MutableRefObject<number>;
  setCreateDraft: Dispatch<SetStateAction<SourceBundleCreateDraft>>;
  setCreateArchiveFiles: Dispatch<SetStateAction<File[]>>;
  setCreateState: Dispatch<SetStateAction<AsyncActionState>>;
  setNoteEditState: Dispatch<SetStateAction<AsyncActionState>>;
  setAppendNoteDraft: Dispatch<SetStateAction<string>>;
  setAppendNoteState: Dispatch<SetStateAction<AsyncActionState>>;
  setAppendFileDraft: Dispatch<SetStateAction<AppendFileDraft>>;
  setAppendFileState: Dispatch<SetStateAction<AsyncActionState>>;
  setArchiveFileState: Dispatch<SetStateAction<AsyncActionState>>;
  setFileEditState: Dispatch<SetStateAction<AsyncActionState>>;
  setAnalysisSummaryState: Dispatch<SetStateAction<AsyncActionState>>;
};
