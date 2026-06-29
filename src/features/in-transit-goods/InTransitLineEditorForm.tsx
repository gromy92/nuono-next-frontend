import { Button, Form, Input, InputNumber, Space, Typography } from 'antd'
import type { InTransitBatchEditorController } from './useInTransitBatchEditor'

const { Title } = Typography

type InTransitLineEditorFormProps = {
  editor: InTransitBatchEditorController
}

export function InTransitLineEditorForm({ editor }: InTransitLineEditorFormProps) {
  if (!editor.lineEditorOpen) {
    return null
  }
  return (
    <div className="in-transit-line-editor">
      <Title level={5} style={{ margin: 0 }}>{editor.editingLine ? '编辑商品' : '添加商品'}</Title>
      <Form form={editor.lineForm} layout="vertical">
        <div className="in-transit-line-editor__grid">
          <Form.Item name="boxNo" label="箱号" rules={[{ required: true, message: '请输入箱号' }]}>
            <Input placeholder="箱号" />
          </Form.Item>
          <Form.Item name="psku" label="PSKU" rules={[{ required: true, message: '请输入 PSKU' }]}>
            <Input placeholder="商品 PSKU" />
          </Form.Item>
          <Form.Item name="msku" hidden><Input /></Form.Item>
          <Form.Item name="sku" hidden><Input /></Form.Item>
          <Form.Item name="productName" label="商品名称"><Input placeholder="商品名称" /></Form.Item>
          <Form.Item name="storeCode" label="店铺"><Input placeholder="店铺编码" /></Form.Item>
          <Form.Item name="siteCode" label="站点"><Input placeholder="站点" /></Form.Item>
          <NumberField name="shippedQuantity" label="发货数量" placeholder="发货数量" precision={0} />
          <NumberField name="receivedQuantity" label="已入仓数量" placeholder="已入仓数量" precision={0} />
          <NumberField name="cartonCount" label="箱数" placeholder="箱数" precision={0} />
          <NumberField name="unitsPerCarton" label="单箱数量" placeholder="单箱数量" precision={0} />
          <NumberField name="cartonWeightKg" label="单箱重量" placeholder="单箱重量" />
          <NumberField name="cartonVolumeCbm" label="单箱体积" placeholder="单箱体积" />
          <Form.Item name="externalBoxNo" label="外部箱号"><Input placeholder="外部箱号" /></Form.Item>
          <Form.Item name="packageTrackingNo" label="包裹追踪号"><Input placeholder="包裹追踪号" /></Form.Item>
          <NumberField name="packageWeightKg" label="包裹重量" placeholder="包裹重量" />
          <NumberField name="packageLengthCm" label="包裹长" placeholder="包裹长" />
          <NumberField name="packageWidthCm" label="包裹宽" placeholder="包裹宽" />
          <NumberField name="packageHeightCm" label="包裹高" placeholder="包裹高" />
          <NumberField name="packageVolumeCbm" label="包裹体积" placeholder="包裹体积" />
          <NumberField name="measuredWeightKg" label="仓库称重" placeholder="仓库称重" />
          <NumberField name="measuredLengthCm" label="仓库测量长" placeholder="仓库测量长" />
          <NumberField name="measuredWidthCm" label="仓库测量宽" placeholder="仓库测量宽" />
          <NumberField name="measuredHeightCm" label="仓库测量高" placeholder="仓库测量高" />
          <NumberField name="measuredVolumeCbm" label="仓库测量体积" placeholder="仓库测量体积" />
          <Form.Item name="packageStatus" label="包裹状态"><Input placeholder="包裹状态" /></Form.Item>
          <Form.Item name="logisticsStatus" label="物流状态"><Input placeholder="物流状态" /></Form.Item>
        </div>
        <Space>
          <Button type="primary" loading={editor.submittingLine} onClick={() => void editor.submitLine()}>
            保存商品
          </Button>
          <Button onClick={() => editor.setLineEditorOpen(false)}>取消</Button>
        </Space>
      </Form>
    </div>
  )
}

type NumberFieldProps = {
  name: string
  label: string
  placeholder: string
  precision?: number
}

function NumberField({ name, label, placeholder, precision = 6 }: NumberFieldProps) {
  return (
    <Form.Item name={name} label={label}>
      <InputNumber min={0} precision={precision} placeholder={placeholder} style={{ width: '100%' }} />
    </Form.Item>
  )
}
