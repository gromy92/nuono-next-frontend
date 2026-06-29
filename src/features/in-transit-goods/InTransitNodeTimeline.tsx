import { Button, Form, Input, Select, Space, Tag, Timeline, Typography } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { InTransitBatchEditorController } from './useInTransitBatchEditor'
import {
  formatNodeDateTime,
  logisticsNodeDisplayLabel,
  nodeTimelineColor,
  shouldShowNodeDescription
} from './InTransitGoodsPage.utils'

const { Text, Title } = Typography

type InTransitNodeTimelineProps = {
  editor: InTransitBatchEditorController
  nodeOptions: Array<{ label: string; value: string }>
  nodeStatusLabel: Map<string, string>
}

export function InTransitNodeTimeline({
  editor,
  nodeOptions,
  nodeStatusLabel
}: InTransitNodeTimelineProps) {
  return (
    <div className="in-transit-nodes">
      <div className="in-transit-nodes__header">
        <Title level={5} style={{ margin: 0 }}>物流时间线</Title>
        {editor.batchOperationLocked ? null : (
          <Button icon={<PlusOutlined />} onClick={editor.openCreateNode}>添加节点</Button>
        )}
      </div>
      {editor.nodes.length ? (
        <Timeline
          pending={editor.loadingNodes ? '加载中' : undefined}
          items={editor.nodes.map((node) => {
            const label = logisticsNodeDisplayLabel(nodeStatusLabel, node.nodeStatus, node.description)
            return {
              color: nodeTimelineColor(node.nodeStatus),
              children: (
                <Space direction="vertical" size={2}>
                  <Space size={8} wrap>
                    <Tag color={nodeTimelineColor(node.nodeStatus)} style={{ marginInlineEnd: 0 }}>{label}</Tag>
                    <Text type="secondary">{formatNodeDateTime(node.nodeHappenedAt)}</Text>
                  </Space>
                  {shouldShowNodeDescription(node.description) ? <Text>{node.description}</Text> : null}
                  {node.operatorName ? <Text type="secondary">操作人 {node.operatorName}</Text> : null}
                  {editor.batchOperationLocked ? null : (
                    <Space size={6}>
                      <Button size="small" icon={<EditOutlined />} onClick={() => editor.openEditNode(node)}>编辑节点</Button>
                      <Button size="small" danger icon={<DeleteOutlined />} loading={editor.submittingNode} onClick={() => void editor.removeNode(node)}>
                        删除节点
                      </Button>
                    </Space>
                  )}
                </Space>
              )
            }
          })}
        />
      ) : (
        <Text type="secondary">{editor.loadingNodes ? '物流节点加载中' : '暂无物流节点'}</Text>
      )}
      <InTransitNodeEditor editor={editor} nodeOptions={nodeOptions} />
    </div>
  )
}

function InTransitNodeEditor({
  editor,
  nodeOptions
}: Pick<InTransitNodeTimelineProps, 'editor' | 'nodeOptions'>) {
  if (!editor.nodeEditorOpen) {
    return null
  }
  return (
    <div className="in-transit-node-editor">
      <Title level={5} style={{ margin: 0 }}>{editor.editingNode ? '编辑节点' : '添加节点'}</Title>
      <Form form={editor.nodeForm} layout="vertical">
        <div className="in-transit-node-editor__grid">
          <Form.Item name="nodeStatus" label="节点状态" rules={[{ required: true, message: '请选择节点状态' }]}>
            <Select id="nodeStatus" options={nodeOptions} placeholder="选择节点状态" />
          </Form.Item>
          <Form.Item name="nodeHappenedAt" label="发生时间">
            <Input placeholder="YYYY-MM-DD HH:mm:ss" />
          </Form.Item>
          <Form.Item name="operatorName" label="操作人">
            <Input placeholder="操作人" />
          </Form.Item>
          <Form.Item name="description" label="节点说明" className="in-transit-node-editor__wide">
            <Input.TextArea rows={2} placeholder="节点说明" />
          </Form.Item>
        </div>
        <Space>
          <Button type="primary" loading={editor.submittingNode} onClick={() => void editor.submitNode()}>
            保存节点
          </Button>
          <Button onClick={() => editor.setNodeEditorOpen(false)}>取消</Button>
        </Space>
      </Form>
    </div>
  )
}
