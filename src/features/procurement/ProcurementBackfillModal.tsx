import { Alert, Button, Card, Col, Form, Input, Modal, Row, Space, type FormInstance } from 'antd';
import {
  buildProcurementBackfillDraftCandidate,
  procurement1688SearchKeyword,
  procurementDemandDisplayTitle
} from './domain';
import type { ProcurementBackfillFormValues, ProcurementDemandItem } from './types';

type ProcurementBackfillModalProps = {
  open: boolean;
  submitting: boolean;
  selectedProcurementItem?: ProcurementDemandItem;
  form: FormInstance<ProcurementBackfillFormValues>;
  onCancel: () => void;
  onSubmit: () => void | Promise<void>;
};

export function ProcurementBackfillModal({
  open,
  submitting,
  selectedProcurementItem,
  form,
  onCancel,
  onSubmit
}: ProcurementBackfillModalProps) {
  return (
    <Modal
      title="回填 1688 候选到采购池"
      open={open}
      onCancel={() => {
        if (submitting) {
          return;
        }
        onCancel();
      }}
      onOk={() => void onSubmit()}
      confirmLoading={submitting}
      okText="确认回填"
      width={1080}
      destroyOnClose
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message={selectedProcurementItem ? procurementDemandDisplayTitle(selectedProcurementItem) : '当前采购需求'}
          description={
            selectedProcurementItem
              ? `当前搜索词：${procurement1688SearchKeyword(selectedProcurementItem)}。这里只填你在 1688 页面上确认值得继续比对的候选，不需要把整页都录进来。`
              : '请先选择一条采购需求，再回填 1688 候选。'
          }
        />

        <Form
          form={form}
          layout="vertical"
          preserve={false}
          initialValues={{ candidates: [buildProcurementBackfillDraftCandidate()] }}
        >
          <Form.List name="candidates">
            {(fields, { add, remove }) => (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    title={`候选 ${index + 1}`}
                    extra={
                      fields.length > 1 ? (
                        <Button type="link" danger onClick={() => remove(field.name)}>
                          删除
                        </Button>
                      ) : null
                    }
                  >
                    <Row gutter={[12, 12]}>
                      <Col xs={24} xl={16}>
                        <Form.Item
                          {...field}
                          label="商品链接"
                          name={[field.name, 'candidateUrl']}
                          rules={[{ required: true, message: '请填写 1688 商品链接' }]}
                        >
                          <Input placeholder="请粘贴 1688 商品详情链接" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} xl={8}>
                        <Form.Item {...field} label="主图链接（可选）" name={[field.name, 'mainImageUrl']}>
                          <Input placeholder="能复制到图片链接时再填" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} xl={12}>
                        <Form.Item
                          {...field}
                          label="商品标题"
                          name={[field.name, 'title']}
                          rules={[{ required: true, message: '请填写候选商品标题' }]}
                        >
                          <Input placeholder="填写你在 1688 页面上看到的商品标题" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12} xl={6}>
                        <Form.Item {...field} label="供应商" name={[field.name, 'supplierName']}>
                          <Input placeholder="例如：义乌某某工厂" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12} xl={3}>
                        <Form.Item {...field} label="价格带" name={[field.name, 'priceText']}>
                          <Input placeholder="例如：12-18元" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12} xl={3}>
                        <Form.Item {...field} label="起订量" name={[field.name, 'moqText']}>
                          <Input placeholder="例如：50件" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12} xl={6}>
                        <Form.Item {...field} label="发货地" name={[field.name, 'locationText']}>
                          <Input placeholder="例如：义乌 / 深圳" />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item {...field} label="结果卡片摘要" name={[field.name, 'resultCardText']}>
                          <Input.TextArea
                            rows={2}
                            placeholder="复制结果卡片里最关键的信息，例如价格、起订量、供应商标签、页面短描述。"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} xl={12}>
                        <Form.Item {...field} label="页面卖点 / 详情摘要" name={[field.name, 'detailHighlightText']}>
                          <Input.TextArea
                            rows={3}
                            placeholder="复制你觉得最能判断像不像的页面卖点，例如材质、供电方式、核心用途。"
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} xl={12}>
                        <Form.Item {...field} label="关键规格 / 属性摘要" name={[field.name, 'attributeSnapshotText']}>
                          <Input.TextArea rows={3} placeholder="例如：ABS+陶瓷仓 / USB充电 / 高12cm / 礼盒包装。" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} xl={12}>
                        <Form.Item {...field} label="物流 / 交期摘要" name={[field.name, 'shippingSnapshotText']}>
                          <Input.TextArea rows={2} placeholder="例如：48小时发货 / 7天内可打样 / 支持海运整箱。" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} xl={12}>
                        <Form.Item {...field} label="包装 / 配件摘要" name={[field.name, 'packageSnapshotText']}>
                          <Input.TextArea rows={2} placeholder="例如：礼盒 / 内含镊子 / 单个独立包装。" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}

                <Button onClick={() => add(buildProcurementBackfillDraftCandidate())}>再加一条候选</Button>
              </Space>
            )}
          </Form.List>
        </Form>
      </Space>
    </Modal>
  );
}
