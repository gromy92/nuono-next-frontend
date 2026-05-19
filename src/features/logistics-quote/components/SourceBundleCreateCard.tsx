import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import { Alert, Button, Card, Col, Input, Row, Space, Typography } from 'antd'
import type { AsyncActionState, SourceBundleCreateDraft } from '../state'

const { Text } = Typography
const { TextArea } = Input

type SourceBundleCreateCardProps = {
  createDraft: SourceBundleCreateDraft
  createArchiveFiles: File[]
  createState: AsyncActionState
  setCreateDraft: Dispatch<SetStateAction<SourceBundleCreateDraft>>
  setCreateArchiveFiles: Dispatch<SetStateAction<File[]>>
  onCreate: () => void
  onRefresh: () => void
}

export function SourceBundleCreateCard({
  createDraft,
  createArchiveFiles,
  createState,
  setCreateDraft,
  setCreateArchiveFiles,
  onCreate,
  onRefresh
}: SourceBundleCreateCardProps) {
  const handleCreateArchiveFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCreateArchiveFiles(Array.from(event.target.files ?? []))
  }

  return (
    <Card bordered={false} style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }} title="来源包录入">
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Text type="secondary">
          本轮管理来源层资料：货代、来源包、报价文件归档、补充文案。文件会存档管理，但不做内容解析、OCR 或运输方案生成。
        </Text>
        {createState.status === 'error' && createState.message ? (
          <Alert type="warning" showIcon message="来源包保存失败" description={createState.message} />
        ) : null}
        <Row gutter={[12, 12]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text strong>货代名称（必填）</Text>
              <Input
                placeholder="例如：义特"
                value={createDraft.forwarderName}
                onChange={(event) =>
                  setCreateDraft((current) => ({ ...current, forwarderName: event.target.value }))
                }
              />
              <Text type="secondary">用于识别和合并同一家货代，保存后进入货代档案。</Text>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text strong>货代别名（可选）</Text>
              <Input
                placeholder="例如：易通 / ET"
                value={createDraft.forwarderAlias}
                onChange={(event) =>
                  setCreateDraft((current) => ({ ...current, forwarderAlias: event.target.value }))
                }
              />
              <Text type="secondary">只记录常用叫法，不再单独维护公司名。</Text>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text strong>来源包名称（必填）</Text>
              <Input
                placeholder="例如：义特-沙特海运双清-2026-04"
                value={createDraft.bundleName}
                onChange={(event) => setCreateDraft((current) => ({ ...current, bundleName: event.target.value }))}
              />
              <Text type="secondary">表示这一批报价资料，后续版本、文件和补充文案都挂在这个来源包下。</Text>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text strong>来源包摘要（可选）</Text>
              <Input
                placeholder="例如：沙特海运双清报价，含微信补充加价说明"
                value={createDraft.analysisSummary}
                onChange={(event) =>
                  setCreateDraft((current) => ({ ...current, analysisSummary: event.target.value }))
                }
              />
              <Text type="secondary">用于人工快速判断资料范围，不参与自动计价。</Text>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text strong>报价文件记录 / 上传原件（至少一项）</Text>
              <TextArea
                rows={4}
                placeholder={
                  '每行一条：文件名|文件类型|本地路径或来源标签\n例如：沙特价格表.pdf|pdf|/Users/gromy/Downloads/沙特价格表.pdf'
                }
                value={createDraft.filesText}
                onChange={(event) => setCreateDraft((current) => ({ ...current, filesText: event.target.value }))}
              />
              <input
                type="file"
                multiple
                accept=".pdf,.xls,.xlsx,.csv,.txt,.doc,.docx,.png,.jpg,.jpeg,.webp"
                disabled={createState.status === 'loading'}
                onChange={handleCreateArchiveFilesChange}
              />
              {createArchiveFiles.length ? (
                <Text type="secondary">
                  已选择 {createArchiveFiles.length} 个原件：
                  {createArchiveFiles.map((file) => file.name).join('、')}
                </Text>
              ) : null}
              <Text type="secondary">可以直接选择 PDF/Excel 原件；保存来源包时系统会自动创建文件记录并归档原件。</Text>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text strong>补充文案登记（必填）</Text>
              <TextArea
                rows={4}
                placeholder={'每行一条：来源渠道|内容\n例如：wechat|单品需要分别加240/方'}
                value={createDraft.notesText}
                onChange={(event) => setCreateDraft((current) => ({ ...current, notesText: event.target.value }))}
              />
              <Text type="secondary">记录微信口头说明、人工补充规则等，会作为后续规则预览和证据来源。</Text>
            </Space>
          </Col>
        </Row>
        <Space>
          <Button loading={createState.status === 'loading'} type="primary" onClick={onCreate}>
            保存来源包
          </Button>
          <Button onClick={onRefresh}>刷新工作台</Button>
        </Space>
      </Space>
    </Card>
  )
}
