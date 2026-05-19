import type { Dispatch, SetStateAction } from 'react'
import { Alert, Button, Card, Col, Input, List, Row, Space, Spin, Table, Tag, Typography } from 'antd'
import type { AsyncActionState, NotePreviewState, QuoteDraftConfig } from '../state'
import type { LogisticsQuoteNotePreviewResponse } from '../types'
import { severityColor } from '../utils'

const { Text } = Typography
const { TextArea } = Input

type NotePreviewDraftCardProps = {
  workbenchMode: string
  noteDraft: string
  notePreviewState: NotePreviewState
  quoteDraftConfig: QuoteDraftConfig
  quoteDraftState: AsyncActionState
  currentSelectedNoteId: number | null
  currentSelectedFileId: number | null
  setNoteDraft: Dispatch<SetStateAction<string>>
  setQuoteDraftConfig: Dispatch<SetStateAction<QuoteDraftConfig>>
  onPreviewNote: () => void
  onSaveQuoteDraftFromNote: () => void
}

export function NotePreviewDraftCard({
  workbenchMode,
  noteDraft,
  notePreviewState,
  quoteDraftConfig,
  quoteDraftState,
  currentSelectedNoteId,
  currentSelectedFileId,
  setNoteDraft,
  setQuoteDraftConfig,
  onPreviewNote,
  onSaveQuoteDraftFromNote
}: NotePreviewDraftCardProps) {
  const previewRuleColumns = [
    {
      title: '规则名',
      dataIndex: 'ruleName',
      key: 'ruleName'
    },
    {
      title: '类型',
      dataIndex: 'ruleType',
      key: 'ruleType'
    },
    {
      title: '触发条件',
      dataIndex: 'triggerCondition',
      key: 'triggerCondition'
    },
    {
      title: '单价',
      key: 'unitPrice',
      render: (_: unknown, record: LogisticsQuoteNotePreviewResponse['rulePreviews'][number]) => (
        <Text>
          {typeof record.unitPrice === 'number' ? record.unitPrice : '-'} / {record.billingUnit || '-'}
        </Text>
      )
    },
    {
      title: '摘要',
      dataIndex: 'summary',
      key: 'summary'
    }
  ]

  const previewRestrictionColumns = [
    {
      title: '限制',
      dataIndex: 'restrictionType',
      key: 'restrictionType'
    },
    {
      title: '条件',
      key: 'condition',
      render: (_: unknown, record: LogisticsQuoteNotePreviewResponse['restrictionPreviews'][number]) => (
        <Text>
          {record.operator || '-'} {record.value || '-'} {record.unit || ''}
        </Text>
      )
    },
    {
      title: '强度',
      dataIndex: 'severity',
      key: 'severity',
      render: (value: string) => (
        <Tag color={severityColor(value)} style={{ marginInlineEnd: 0 }}>
          {value}
        </Tag>
      )
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description'
    }
  ]

  return (
    <Card
      title="补充文案规则预览"
      bordered={false}
      style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
      extra={
        <Button type="primary" onClick={onPreviewNote} disabled={!noteDraft.trim()}>
          预览结构化结果
        </Button>
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="这一步只做补充文案解释，不直接发布"
          description="先把微信、口头转文字、人工备注变成可审核的规则预览；保存后会生成 DRAFT 报价版本，后续再人工确认发布。"
        />

        <TextArea
          value={noteDraft}
          onChange={(event) => setNoteDraft(event.target.value)}
          autoSize={{ minRows: 3, maxRows: 6 }}
          placeholder="例如：单品需要分别加240/方；单箱重量不超40公斤；单边超过100cm单询。"
        />

        {workbenchMode === 'local-db' ? (
          <Card size="small" title="保存为结构化报价草稿">
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Text type="secondary">
                保存动作会读取当前选中的已保存补充文案，生成一版 DRAFT 报价版本，并回读服务、规则、限制和证据。
              </Text>
              {quoteDraftState.status === 'error' && quoteDraftState.message ? (
                <Alert type="warning" showIcon message="报价草稿保存失败" description={quoteDraftState.message} />
              ) : null}
              <Row gutter={[8, 8]}>
                <Col xs={24} md={12}>
                  <Input
                    value={quoteDraftConfig.serviceName}
                    onChange={(event) =>
                      setQuoteDraftConfig((current) => ({ ...current, serviceName: event.target.value }))
                    }
                    placeholder="服务名称，例如：沙特海运双清包税"
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Input
                    value={quoteDraftConfig.countryCode}
                    onChange={(event) =>
                      setQuoteDraftConfig((current) => ({ ...current, countryCode: event.target.value }))
                    }
                    placeholder="国家，例如 SA"
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Input
                    value={quoteDraftConfig.routeCode}
                    onChange={(event) =>
                      setQuoteDraftConfig((current) => ({ ...current, routeCode: event.target.value }))
                    }
                    placeholder="线路，例如 CN-SA"
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Input
                    value={quoteDraftConfig.transportMode}
                    onChange={(event) =>
                      setQuoteDraftConfig((current) => ({ ...current, transportMode: event.target.value }))
                    }
                    placeholder="运输方式 SEA/AIR"
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Input
                    value={quoteDraftConfig.serviceScope}
                    onChange={(event) =>
                      setQuoteDraftConfig((current) => ({ ...current, serviceScope: event.target.value }))
                    }
                    placeholder="服务范围"
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Input
                    value={quoteDraftConfig.currency}
                    onChange={(event) =>
                      setQuoteDraftConfig((current) => ({ ...current, currency: event.target.value }))
                    }
                    placeholder="币种"
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Input
                    value={quoteDraftConfig.versionNo}
                    onChange={(event) =>
                      setQuoteDraftConfig((current) => ({ ...current, versionNo: event.target.value }))
                    }
                    placeholder="版本号，可选"
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Input
                    value={quoteDraftConfig.effectiveFrom}
                    onChange={(event) =>
                      setQuoteDraftConfig((current) => ({ ...current, effectiveFrom: event.target.value }))
                    }
                    placeholder="生效日期 YYYY-MM-DD，可选"
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Input
                    value={quoteDraftConfig.summary}
                    onChange={(event) =>
                      setQuoteDraftConfig((current) => ({ ...current, summary: event.target.value }))
                    }
                    placeholder="报价草稿说明，可选"
                  />
                </Col>
              </Row>
              <Space>
                <Button
                  type="primary"
                  loading={quoteDraftState.status === 'loading'}
                  onClick={onSaveQuoteDraftFromNote}
                  disabled={!quoteDraftConfig.serviceName.trim() || typeof currentSelectedNoteId !== 'number'}
                >
                  保存为报价草稿
                </Button>
                <Text type="secondary">
                  当前文案 #{currentSelectedNoteId ?? '-'}，文件 #{currentSelectedFileId ?? '-'}
                </Text>
              </Space>
            </Space>
          </Card>
        ) : null}

        {notePreviewState.status === 'loading' ? (
          <Space size={12}>
            <Spin size="small" />
            <Text>正在分析补充文案...</Text>
          </Space>
        ) : null}

        {notePreviewState.status === 'error' ? (
          <Alert type="warning" showIcon message="预览失败" description={notePreviewState.message} />
        ) : null}

        {notePreviewState.status === 'success' ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              type={notePreviewState.data.ready ? 'success' : 'warning'}
              showIcon
              message={notePreviewState.data.message || '已生成预览'}
              description={notePreviewState.data.normalizedNote || '未生成归一化文案'}
            />

            {notePreviewState.data.warnings.length ? (
              <Alert
                type="warning"
                showIcon
                message="预览提醒"
                description={
                  <List
                    size="small"
                    dataSource={notePreviewState.data.warnings}
                    renderItem={(item) => <List.Item style={{ paddingInline: 0 }}>{item}</List.Item>}
                  />
                }
              />
            ) : null}

            <Table
              title={() => '规则预览'}
              columns={previewRuleColumns}
              dataSource={notePreviewState.data.rulePreviews}
              pagination={false}
              rowKey={(record) => `${record.ruleName}-${record.triggerCondition}-${record.billingUnit}`}
              size="small"
              locale={{ emptyText: '当前没有识别到规则预览' }}
              scroll={{ x: 960 }}
            />

            <Table
              title={() => '限制预览'}
              columns={previewRestrictionColumns}
              dataSource={notePreviewState.data.restrictionPreviews}
              pagination={false}
              rowKey={(record) => `${record.restrictionType}-${record.value}-${record.unit}`}
              size="small"
              locale={{ emptyText: '当前没有识别到限制预览' }}
              scroll={{ x: 820 }}
            />
          </Space>
        ) : null}
      </Space>
    </Card>
  )
}
