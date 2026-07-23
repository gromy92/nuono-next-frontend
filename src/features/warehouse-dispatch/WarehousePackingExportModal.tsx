import { Form, Modal, Select, Space, Tag, Typography } from 'antd'
import { useMemo } from 'react'
import { channelKey } from './packingExportDomain'
import type { PackingExportChannel, PackingExportSelection } from './packingExportDomain'
import type { ShippingBatch } from './types'

const { Text } = Typography

type Props = {
  batch?: ShippingBatch
  channels: PackingExportChannel[]
  selection: PackingExportSelection
  loading: boolean
  onSelectionChange: (selection: PackingExportSelection) => void
  onConfirm: () => void
  onClose: () => void
}

export function WarehousePackingExportModal({
  batch,
  channels,
  selection,
  loading,
  onSelectionChange,
  onConfirm,
  onClose
}: Props) {
  const forwarders = useMemo(() => Array.from(new Map(channels.map((channel) => [
    channel.forwarderCode,
    { value: channel.forwarderCode, label: channel.forwarderName }
  ])).values()), [channels])
  const routes = channels.filter((channel) => channel.forwarderCode === selection.forwarderCode)
  const selectedChannel = channels.find((channel) => (
    channel.key === channelKey(selection.forwarderCode, selection.routeCode)
  ))

  function selectForwarder(forwarderCode: string) {
    const matching = channels.filter((channel) => channel.forwarderCode === forwarderCode)
    onSelectionChange({
      forwarderCode,
      routeCode: matching.length === 1 ? matching[0].routeCode : undefined
    })
  }

  return (
    <Modal title="导出装箱单" open={Boolean(batch)} okText="导出装箱单" cancelText="取消"
      okButtonProps={{ disabled: !selectedChannel, loading }} onOk={onConfirm} onCancel={onClose}
      width={640} destroyOnClose>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Text strong>{batch?.batchNo || batch?.id}</Text>
        <Form layout="vertical">
          <Form.Item label="选择货代" required>
            <Select value={selection.forwarderCode} options={forwarders} placeholder="选择货代"
              onChange={selectForwarder} />
          </Form.Item>
          <Form.Item label="选择渠道" required>
            <Select value={selection.routeCode} disabled={!selection.forwarderCode}
              options={routes.map((channel) => ({ value: channel.routeCode, label: channel.routeName }))}
              placeholder="选择渠道"
              onChange={(routeCode) => onSelectionChange({ ...selection, routeCode })} />
          </Form.Item>
        </Form>
        {selectedChannel ? (
          <Space wrap>
            <Tag color="blue">{selectedChannel.forwarderName}</Tag>
            <Tag color="processing">{selectedChannel.routeName}</Tag>
            <Text>{selectedChannel.boxCount} 箱</Text>
            <Text>{selectedChannel.skuCount} PSKU</Text>
            <Text>{selectedChannel.quantity.toLocaleString('zh-CN')} 件</Text>
          </Space>
        ) : null}
      </Space>
    </Modal>
  )
}
