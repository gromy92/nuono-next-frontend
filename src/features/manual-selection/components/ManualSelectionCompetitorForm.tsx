import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Empty, Form, Input, Space, Tag, Typography } from 'antd'
import type { FormInstance } from 'antd'
import type { ManualSelectionAnalysisProjectView, ManualSelectionCompetitor, ManualSelectionCompetitorFormValues } from '../types'
import { fetchStatusColor, fetchStatusText, formatFetchedAt } from './manualSelectionCompetitorPresentation'

const { Text } = Typography

type Props = {
  detailMode: boolean
  form: FormInstance<ManualSelectionCompetitorFormValues>
  competitors: ManualSelectionCompetitor[]
  project?: ManualSelectionAnalysisProjectView | null
  recollectingCompetitorIds: string[]
  onRecollectCompetitor?: (competitor: ManualSelectionCompetitor) => void
}

export function ManualSelectionCompetitorForm(props: Props) {
  const { detailMode, form, competitors, project, recollectingCompetitorIds, onRecollectCompetitor } = props
  return (
    <>
        {!detailMode ? <Form form={form} layout="vertical" initialValues={{ competitors: [{}] }}>
          <Form.List name="competitors">
            {(fields, { add, remove }) => (
              <Space className="manual-selection-competitor-editor-list" direction="vertical" size={10}>
                {fields.length ? fields.map((field, index) => (
                  <div key={field.key} className="manual-selection-competitor-row">
                    <div className="manual-selection-competitor-row-head">
                      <Text strong>竞品 {index + 1}</Text>
                      <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        title="删除竞品"
                        disabled={fields.length === 1}
                        onClick={() => remove(field.name)}
                      />
                    </div>
                    <Form.Item name={[field.name, 'id']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'fetchStatus']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'fetchedTitle']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'fetchedTitleAr']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'fetchedDescriptionEn']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'fetchedDescriptionAr']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'fetchedSourceHost']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'fetchedPriceSummary']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'fetchedCompleteness']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'fetchedCollectionSource']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'fetchedAt']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, 'fetchMessage']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item label="竞品链接" name={[field.name, 'url']}>
                      <Input placeholder="粘贴竞品链接" />
                    </Form.Item>
                    <Form.Item label="备注" name={[field.name, 'note']}>
                      <Input placeholder="差异点 / 卖点 / 风险 / 价格备注" />
                    </Form.Item>
                    <div className="manual-selection-competitor-fetch">
                      <Tag color={fetchStatusColor(competitors[index]?.fetchStatus)}>
                        {fetchStatusText(competitors[index]?.fetchStatus)}
                      </Tag>
                      {competitors[index]?.fetchedTitle ? (
                        <Text ellipsis title={competitors[index]?.fetchedTitle}>
                          {competitors[index]?.fetchedTitle}
                        </Text>
                      ) : null}
                      {competitors[index]?.fetchedSourceHost || competitors[index]?.fetchedAt ? (
                        <Text type="secondary">
                          {[competitors[index]?.fetchedSourceHost, formatFetchedAt(competitors[index]?.fetchedAt)].filter(Boolean).join(' / ')}
                        </Text>
                      ) : null}
                      {competitors[index]?.fetchMessage && competitors[index]?.fetchStatus === 'failed' ? (
                        <Text type="danger">{competitors[index]?.fetchMessage}</Text>
                      ) : null}
                      {competitors[index]?.fetchStatus === 'failed' ? (
                        <Button
                          size="small"
                          icon={<ReloadOutlined />}
                          loading={Boolean(competitors[index]?.id && project?.projectId && recollectingCompetitorIds.includes(`${project.projectId}:${competitors[index]?.id}`))}
                          disabled={!competitors[index]?.id}
                          onClick={() => {
                            const competitor = competitors[index]
                            if (competitor) {
                              onRecollectCompetitor?.(competitor)
                            }
                          }}
                        >
                          重新采集
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无竞品" />
                )}
                <Button block icon={<PlusOutlined />} onClick={() => add({})}>
                  添加一条竞品
                </Button>
              </Space>
            )}
          </Form.List>
        </Form> : null}
    </>
  )
}
