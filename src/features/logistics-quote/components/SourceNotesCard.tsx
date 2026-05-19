import type { Dispatch, SetStateAction } from 'react'
import { Alert, Button, Card, Input, List, Space, Tag, Typography } from 'antd'
import type { AsyncActionState } from '../state'
import type { LogisticsQuoteBundleDetailDto, LogisticsQuoteSourceNoteDto } from '../types'

const { Paragraph } = Typography
const { TextArea } = Input

type SourceNotesCardProps = {
  bundle: LogisticsQuoteBundleDetailDto
  workbenchMode: string
  currentSelectedNoteId: number | null
  currentSelectedFileId: number | null
  editableNote: LogisticsQuoteSourceNoteDto | null
  noteEditDraft: string
  noteEditState: AsyncActionState
  appendNoteDraft: string
  appendNoteState: AsyncActionState
  setNoteEditDraft: Dispatch<SetStateAction<string>>
  setAppendNoteDraft: Dispatch<SetStateAction<string>>
  rememberBundleSelection: (bundleId?: number | null, noteId?: number | null, fileId?: number | null) => void
  onSelectNote: (noteId: number) => void
  onUpdateSelectedNote: () => void
  onReloadSelectedNote: () => void
  onAppendNote: () => void
}

export function SourceNotesCard({
  bundle,
  workbenchMode,
  currentSelectedNoteId,
  currentSelectedFileId,
  editableNote,
  noteEditDraft,
  noteEditState,
  appendNoteDraft,
  appendNoteState,
  setNoteEditDraft,
  setAppendNoteDraft,
  rememberBundleSelection,
  onSelectNote,
  onUpdateSelectedNote,
  onReloadSelectedNote,
  onAppendNote
}: SourceNotesCardProps) {
  return (
    <Card
      title="版本补充文案"
      bordered={false}
      style={{ height: '100%', boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <List
          dataSource={bundle.notes}
          locale={{ emptyText: '暂无补充文案' }}
          renderItem={(item) => {
            const noteId = item.id
            return (
              <List.Item style={{ paddingInline: 0 }}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Space wrap size={[8, 8]}>
                    <Tag color="processing" style={{ marginInlineEnd: 0 }}>
                      {item.noteType}
                    </Tag>
                    <Tag color="default" style={{ marginInlineEnd: 0 }}>
                      {item.sourceChannel}
                    </Tag>
                    {noteId === currentSelectedNoteId ? (
                      <Tag color="success" style={{ marginInlineEnd: 0 }}>
                        当前编辑
                      </Tag>
                    ) : null}
                  </Space>
                  <Paragraph style={{ margin: 0 }}>{item.content}</Paragraph>
                  {workbenchMode === 'local-db' && typeof noteId === 'number' ? (
                    <Button
                      size="small"
                      type={noteId === currentSelectedNoteId ? 'primary' : 'default'}
                      onClick={() => {
                        rememberBundleSelection(bundle.id, noteId, currentSelectedFileId)
                        onSelectNote(noteId)
                      }}
                    >
                      {noteId === currentSelectedNoteId ? '已选中这条文案' : '切换为当前编辑文案'}
                    </Button>
                  ) : null}
                </Space>
              </List.Item>
            )
          }}
        />

        {workbenchMode === 'local-db' && editableNote?.id ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Alert
              type="success"
              showIcon
              message="已保存版本补充文案"
              description={`当前业务口径按报价版本管理补充文案；本阶段先复用已保存文案记录并从 workbench 回读。正在编辑 #${editableNote.id ?? '-'} ${editableNote.noteType} / ${editableNote.sourceChannel}。`}
            />
            {noteEditState.status === 'error' && noteEditState.message ? (
              <Alert type="warning" showIcon message="补充文案更新失败" description={noteEditState.message} />
            ) : null}
            <TextArea
              value={noteEditDraft}
              onChange={(event) => setNoteEditDraft(event.target.value)}
              autoSize={{ minRows: 3, maxRows: 6 }}
              placeholder="更新已保存补充文案"
            />
            <Space>
              <Button
                type="primary"
                loading={noteEditState.status === 'loading'}
                onClick={onUpdateSelectedNote}
                disabled={!noteEditDraft.trim()}
              >
                保存该条补充文案
              </Button>
              <Button onClick={() => setNoteEditDraft(editableNote.content)}>回到当前已保存内容</Button>
              <Button onClick={onReloadSelectedNote}>从已保存记录重新回读</Button>
            </Space>
          </Space>
        ) : null}

        {workbenchMode === 'local-db' ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Alert
              type="info"
              showIcon
              message="追加当前版本补充文案"
              description="用于记录微信口头说明、人工加价口径和例外限制；后续版本表落地后会正式挂到报价版本下。"
            />
            {appendNoteState.status === 'error' && appendNoteState.message ? (
              <Alert type="warning" showIcon message="追加补充文案失败" description={appendNoteState.message} />
            ) : null}
            <TextArea
              value={appendNoteDraft}
              onChange={(event) => setAppendNoteDraft(event.target.value)}
              autoSize={{ minRows: 2, maxRows: 5 }}
              placeholder="追加一条新的补充文案，例如：送仓最低 300 RMB/票"
            />
            <Space>
              <Button
                type="primary"
                loading={appendNoteState.status === 'loading'}
                onClick={onAppendNote}
                disabled={!appendNoteDraft.trim()}
              >
                追加补充文案
              </Button>
              <Button onClick={() => setAppendNoteDraft('')}>清空新增草稿</Button>
            </Space>
          </Space>
        ) : null}
      </Space>
    </Card>
  )
}
