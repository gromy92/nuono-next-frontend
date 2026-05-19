import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import { Alert, Button, Card, Col, Input, List, Row, Space, Tag, Typography } from 'antd'
import type { AppendFileDraft, AsyncActionState, FileEditDraft } from '../state'
import type { LogisticsQuoteBundleDetailDto, LogisticsQuoteSourceFileDto } from '../types'
import { withPublicBasePath } from '../../../runtimePaths'

const { Text } = Typography

type SourceFilesCardProps = {
  bundle: LogisticsQuoteBundleDetailDto
  workbenchMode: string
  currentSelectedNoteId: number | null
  currentSelectedFileId: number | null
  editableFile: LogisticsQuoteSourceFileDto | null
  fileEditDraft: FileEditDraft
  fileEditState: AsyncActionState
  appendFileDraft: AppendFileDraft
  appendFileState: AsyncActionState
  archiveFileState: AsyncActionState
  setSelectedFileId: Dispatch<SetStateAction<number | null>>
  setFileEditDraft: Dispatch<SetStateAction<FileEditDraft>>
  setAppendFileDraft: Dispatch<SetStateAction<AppendFileDraft>>
  rememberBundleSelection: (bundleId?: number | null, noteId?: number | null, fileId?: number | null) => void
  onUpdateFile: () => void
  onAppendFile: () => void
  onArchiveFileUpload: (file: File) => void
}

export function SourceFilesCard({
  bundle,
  workbenchMode,
  currentSelectedNoteId,
  currentSelectedFileId,
  editableFile,
  fileEditDraft,
  fileEditState,
  appendFileDraft,
  appendFileState,
  archiveFileState,
  setSelectedFileId,
  setFileEditDraft,
  setAppendFileDraft,
  rememberBundleSelection,
  onUpdateFile,
  onAppendFile,
  onArchiveFileUpload
}: SourceFilesCardProps) {
  const editableFileArchived = Boolean(editableFile?.archived || fileEditDraft.filePath.startsWith('archive://'))
  const handleArchiveFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onArchiveFileUpload(file)
    }
    event.target.value = ''
  }

  return (
    <Card
      title="来源文件"
      bordered={false}
      style={{ height: '100%', boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <List
          dataSource={bundle.files}
          locale={{ emptyText: '暂无来源文件' }}
          renderItem={(item) => (
            <List.Item style={{ paddingInline: 0 }}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Space wrap size={[8, 8]}>
                  <Text strong>{item.fileName}</Text>
                  <Tag color="default" style={{ marginInlineEnd: 0 }}>
                    {item.fileType}
                  </Tag>
                  {item.id === fileEditDraft.fileId ? (
                    <Tag color="success" style={{ marginInlineEnd: 0 }}>
                      当前编辑
                    </Tag>
                  ) : null}
                  {item.archived ? (
                    <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                      已归档原件
                    </Tag>
                  ) : (
                    <Tag color="warning" style={{ marginInlineEnd: 0 }}>
                      未归档原件
                    </Tag>
                  )}
                </Space>
                <Text type="secondary">{item.sourceLabel || '-'}</Text>
                {(workbenchMode === 'local-db' && item.id) || item.archiveUrl ? (
                  <Space wrap size={[8, 8]}>
                    {workbenchMode === 'local-db' && item.id ? (
                      <Button
                        size="small"
                        type={item.id === fileEditDraft.fileId ? 'primary' : 'default'}
                        onClick={() => {
                          setSelectedFileId(item.id ?? null)
                          rememberBundleSelection(bundle.id, currentSelectedNoteId, item.id ?? null)
                        }}
                      >
                        {item.id === fileEditDraft.fileId ? '已选中这条文件' : '切换为当前编辑文件'}
                      </Button>
                    ) : null}
                    {item.archiveUrl ? (
                      <Button size="small" href={withPublicBasePath(item.archiveUrl)}>
                        下载归档原件
                      </Button>
                    ) : null}
                  </Space>
                ) : null}
              </Space>
            </List.Item>
          )}
        />

        {workbenchMode === 'local-db' ? (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Alert
              type="success"
              showIcon
              message="文件归档与元数据管理"
              description="当前不解析报价文件内容，但会保存 PDF/Excel 等原件，并把归档原件挂到来源文件记录上，供后续追溯和下载。"
            />
            {archiveFileState.status === 'error' && archiveFileState.message ? (
              <Alert type="warning" showIcon message="报价文件归档失败" description={archiveFileState.message} />
            ) : null}
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Text strong>上传归档原件</Text>
              <input
                type="file"
                accept=".pdf,.xls,.xlsx,.csv,.txt,.doc,.docx,.png,.jpg,.jpeg,.webp"
                disabled={archiveFileState.status === 'loading'}
                onChange={handleArchiveFileChange}
              />
              <Text type="secondary">
                {fileEditDraft.fileId
                  ? '会覆盖当前选中文件记录的归档原件；不做 OCR、不提取报价。'
                  : '未选中文件时会新建一条来源文件记录并保存原件。'}
              </Text>
            </Space>
            {fileEditState.status === 'error' && fileEditState.message ? (
              <Alert type="warning" showIcon message="来源文件更新失败" description={fileEditState.message} />
            ) : null}
            <Input
              value={fileEditDraft.fileName}
              onChange={(event) => setFileEditDraft((current) => ({ ...current, fileName: event.target.value }))}
              placeholder="编辑当前文件名"
              disabled={!fileEditDraft.fileId}
            />
            <Row gutter={[8, 8]}>
              <Col xs={24} md={10}>
                <Input
                  value={fileEditDraft.fileType}
                  onChange={(event) => setFileEditDraft((current) => ({ ...current, fileType: event.target.value }))}
                  placeholder="编辑文件类型"
                  disabled={!fileEditDraft.fileId}
                />
              </Col>
              <Col xs={24} md={14}>
                <Input
                  value={fileEditDraft.filePath}
                  onChange={(event) => setFileEditDraft((current) => ({ ...current, filePath: event.target.value }))}
                  placeholder={editableFileArchived ? '归档路径由系统维护' : '编辑文件路径或来源标签'}
                  disabled={!fileEditDraft.fileId || editableFileArchived}
                />
              </Col>
            </Row>
            <Space>
              <Button
                type="primary"
                loading={fileEditState.status === 'loading'}
                onClick={onUpdateFile}
                disabled={!fileEditDraft.fileId || !fileEditDraft.fileName.trim()}
              >
                保存当前文件元数据
              </Button>
              <Button
                onClick={() =>
                  setFileEditDraft({
                    fileId: editableFile?.id ?? 0,
                    fileName: editableFile?.fileName ?? '',
                    fileType: editableFile?.fileType ?? '',
                    filePath: editableFile?.filePath ?? ''
                  })
                }
                disabled={!fileEditDraft.fileId}
              >
                回到当前已保存内容
              </Button>
            </Space>
            <Alert
              type="info"
              showIcon
              message="追加同 bundle 文件元数据"
              description="如果暂时没有原件，也可以先追加一条文件元数据；拿到 PDF/Excel 后再上传归档原件。"
            />
            {appendFileState.status === 'error' && appendFileState.message ? (
              <Alert type="warning" showIcon message="追加来源文件失败" description={appendFileState.message} />
            ) : null}
            <Input
              value={appendFileDraft.fileName}
              onChange={(event) => setAppendFileDraft((current) => ({ ...current, fileName: event.target.value }))}
              placeholder="文件名，例如：补充说明.pdf"
            />
            <Row gutter={[8, 8]}>
              <Col xs={24} md={10}>
                <Input
                  value={appendFileDraft.fileType}
                  onChange={(event) => setAppendFileDraft((current) => ({ ...current, fileType: event.target.value }))}
                  placeholder="文件类型，可选"
                />
              </Col>
              <Col xs={24} md={14}>
                <Input
                  value={appendFileDraft.filePath}
                  onChange={(event) => setAppendFileDraft((current) => ({ ...current, filePath: event.target.value }))}
                  placeholder="文件路径或来源标签，可选"
                />
              </Col>
            </Row>
            <Space>
              <Button
                type="primary"
                loading={appendFileState.status === 'loading'}
                onClick={onAppendFile}
                disabled={!appendFileDraft.fileName.trim()}
              >
                追加来源文件
              </Button>
              <Button onClick={() => setAppendFileDraft({ fileName: '', fileType: '', filePath: '' })}>
                清空新增草稿
              </Button>
            </Space>
          </Space>
        ) : null}
      </Space>
    </Card>
  )
}
