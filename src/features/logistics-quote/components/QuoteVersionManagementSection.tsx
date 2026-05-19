import type { Dispatch, SetStateAction } from 'react'
import { Alert, Card, Descriptions, Space, Tag, Typography } from 'antd'
import type { AsyncActionState, NotePreviewState, QuoteDraftConfig } from '../state'
import type { LogisticsQuoteBundleDetailDto, LogisticsQuoteSourceNoteDto } from '../types'
import { bundleStatusColor } from '../utils'
import { NotePreviewDraftCard } from './NotePreviewDraftCard'
import { QuotePublishReviewCard } from './QuotePublishReviewCard'
import { SourceNotesCard } from './SourceNotesCard'
import { StructuredQuoteSection } from './StructuredQuoteSection'

const { Text } = Typography

type QuoteVersionManagementSectionProps = {
  bundle: LogisticsQuoteBundleDetailDto
  workbenchMode: string
  currentSelectedNoteId: number | null
  currentSelectedFileId: number | null
  editableNote: LogisticsQuoteSourceNoteDto | null
  noteEditDraft: string
  noteEditState: AsyncActionState
  appendNoteDraft: string
  appendNoteState: AsyncActionState
  noteDraft: string
  notePreviewState: NotePreviewState
  quoteDraftConfig: QuoteDraftConfig
  quoteDraftState: AsyncActionState
  setNoteEditDraft: Dispatch<SetStateAction<string>>
  setAppendNoteDraft: Dispatch<SetStateAction<string>>
  setNoteDraft: Dispatch<SetStateAction<string>>
  setQuoteDraftConfig: Dispatch<SetStateAction<QuoteDraftConfig>>
  rememberBundleSelection: (bundleId?: number | null, noteId?: number | null, fileId?: number | null) => void
  onSelectNote: (noteId: number) => void
  onUpdateSelectedNote: () => void
  onReloadSelectedNote: () => void
  onAppendNote: () => void
  onPreviewNote: () => void
  onSaveQuoteDraftFromNote: () => void
}

export function QuoteVersionManagementSection({
  bundle,
  workbenchMode,
  currentSelectedNoteId,
  currentSelectedFileId,
  editableNote,
  noteEditDraft,
  noteEditState,
  appendNoteDraft,
  appendNoteState,
  noteDraft,
  notePreviewState,
  quoteDraftConfig,
  quoteDraftState,
  setNoteEditDraft,
  setAppendNoteDraft,
  setNoteDraft,
  setQuoteDraftConfig,
  rememberBundleSelection,
  onSelectNote,
  onUpdateSelectedNote,
  onReloadSelectedNote,
  onAppendNote,
  onPreviewNote,
  onSaveQuoteDraftFromNote
}: QuoteVersionManagementSectionProps) {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card
        title="报价版本管理"
        bordered={false}
        style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
        extra={
          <Tag color={bundleStatusColor(bundle.quoteVersion.status)} style={{ marginInlineEnd: 0 }}>
            {bundle.quoteVersion.status}
          </Tag>
        }
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="补充文案归属报价版本"
            description="微信说明、人工口径和例外规则在业务上按报价版本管理；当前前端先按版本管理区呈现，后续版本表扩展后再从来源文案迁移到版本文案。"
          />
          <Descriptions column={2} size="small" colon={false}>
            <Descriptions.Item label="当前版本">{bundle.quoteVersion.versionNo || '未生成'}</Descriptions.Item>
            <Descriptions.Item label="生效时间">{bundle.quoteVersion.effectiveFrom || '-'}</Descriptions.Item>
            <Descriptions.Item label="补充文案">{bundle.notes.length} 条</Descriptions.Item>
            <Descriptions.Item label="结构化规则">{bundle.rules.length} 条</Descriptions.Item>
            <Descriptions.Item label="版本说明" span={2}>
              <Text>{bundle.quoteVersion.summary || '暂未生成报价版本说明'}</Text>
            </Descriptions.Item>
          </Descriptions>
        </Space>
      </Card>

      <SourceNotesCard
        bundle={bundle}
        workbenchMode={workbenchMode}
        currentSelectedNoteId={currentSelectedNoteId}
        currentSelectedFileId={currentSelectedFileId}
        editableNote={editableNote}
        noteEditDraft={noteEditDraft}
        noteEditState={noteEditState}
        appendNoteDraft={appendNoteDraft}
        appendNoteState={appendNoteState}
        setNoteEditDraft={setNoteEditDraft}
        setAppendNoteDraft={setAppendNoteDraft}
        rememberBundleSelection={rememberBundleSelection}
        onSelectNote={onSelectNote}
        onUpdateSelectedNote={onUpdateSelectedNote}
        onReloadSelectedNote={onReloadSelectedNote}
        onAppendNote={onAppendNote}
      />
      <NotePreviewDraftCard
        workbenchMode={workbenchMode}
        noteDraft={noteDraft}
        notePreviewState={notePreviewState}
        quoteDraftConfig={quoteDraftConfig}
        quoteDraftState={quoteDraftState}
        currentSelectedNoteId={currentSelectedNoteId}
        currentSelectedFileId={currentSelectedFileId}
        setNoteDraft={setNoteDraft}
        setQuoteDraftConfig={setQuoteDraftConfig}
        onPreviewNote={onPreviewNote}
        onSaveQuoteDraftFromNote={onSaveQuoteDraftFromNote}
      />
      <StructuredQuoteSection bundle={bundle} />
      <QuotePublishReviewCard bundle={bundle} />
    </Space>
  )
}
