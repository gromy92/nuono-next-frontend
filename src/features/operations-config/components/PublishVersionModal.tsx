import { Button, Modal, Space, Typography } from 'antd'
import type { useOperationConfigLibraryController } from '../hooks/useOperationConfigLibraryController'
import type { useOperationConfigPublishActions } from '../hooks/useOperationConfigPublishActions'

const { Text } = Typography

export function PublishVersionModal({ state, publish }: {
  state: ReturnType<typeof useOperationConfigLibraryController>
  publish: ReturnType<typeof useOperationConfigPublishActions>
}) {
  const { publishCandidate, setPublishCandidate, publishingVersionNo } = state
  const { confirmPublish } = publish
  return (
        <Modal
          title="发布确认"
          open={Boolean(publishCandidate)}
          onCancel={() => setPublishCandidate(null)}
          footer={[
            <Button key="cancel" onClick={() => setPublishCandidate(null)} disabled={Boolean(publishingVersionNo)}>
              取消
            </Button>,
            <Button
              key="publish"
              type="primary"
              data-testid="operation-config-publish-confirm-submit"
              loading={Boolean(publishingVersionNo)}
              onClick={confirmPublish}
            >
              确认发布
            </Button>
          ]}
        >
          {publishCandidate ? (
            <Space direction="vertical" size={8} data-testid="operation-config-publish-confirm">
              <Text>配置类型：{publishCandidate.configTypeLabel}</Text>
              <Text>版本名称：{publishCandidate.displayName}</Text>
              <Text>范围：{publishCandidate.scopeSummary || '未设置范围'}</Text>
              <Text>摘要：{publishCandidate.summary || `${publishCandidate.itemCount} 项`}</Text>
              <Text type="secondary">发布后将成为当前版本；同类型同范围的旧当前版本会转为历史。</Text>
            </Space>
          ) : null}
        </Modal>
  )
}
