import { Form, Input, Select } from 'antd'
import type { InTransitBatchEditorController } from './useInTransitBatchEditor'

type InTransitBatchBaseFormProps = {
  editor: InTransitBatchEditorController
  forwarderOptions: Array<{ label: string; value: number }>
  transportOptions: Array<{ label: string; value: string }>
  statusOptions: Array<{ label: string; value: string }>
  destinationOptions: Array<{ label: string; value: string }>
}

export function InTransitBatchBaseForm({
  editor,
  forwarderOptions,
  transportOptions,
  statusOptions,
  destinationOptions
}: InTransitBatchBaseFormProps) {
  return (
    <Form form={editor.form} layout="vertical" disabled={editor.batchOperationLocked}>
      <div className="in-transit-drawer__grid">
        <Form.Item name="standardForwarderId" label="标准货代">
          <Select allowClear options={forwarderOptions} placeholder="选择标准货代" />
        </Form.Item>
        <Form.Item name="rawForwarderName" label="原始货代名称">
          <Input placeholder="历史记录里的货代名称" />
        </Form.Item>
        <Form.Item name="transportMode" label="运输方式">
          <Select allowClear options={transportOptions} placeholder="选择运输方式" />
        </Form.Item>
        <Form.Item name="batchStatus" label="当前状态">
          <Select options={statusOptions} placeholder="选择状态" />
        </Form.Item>
        <Form.Item name="targetStoreCode" label="目的地">
          <Select allowClear options={destinationOptions} placeholder="选择目的地" />
        </Form.Item>
        <Form.Item name="targetWarehouseName" label="目的仓">
          <Input placeholder="如 FBN-DXB" />
        </Form.Item>
        <Form.Item name="batchReferenceNo" label="批次号">
          <Input placeholder="内部批次或货代批次号" />
        </Form.Item>
        <Form.Item name="departureDate" label="发货日期">
          <Input placeholder="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item name="etaDate" label="预计到仓">
          <Input placeholder="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item name="trackingNo" label="物流单号">
          <Input placeholder="物流单号" />
        </Form.Item>
        <Form.Item name="containerNo" label="柜号">
          <Input placeholder="柜号" />
        </Form.Item>
      </div>
    </Form>
  )
}
