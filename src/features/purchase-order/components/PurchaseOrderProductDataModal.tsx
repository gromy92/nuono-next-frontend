import { Alert, Form, Input, InputNumber, Modal, Select, Spin, Tag, Typography } from 'antd'
import type { FormInstance } from 'antd'
import { ProductThumbnail } from './ProductDetailButton'
import {
  validateProductDataAttributeField,
  validateProductDataNumberField
} from '../model/productDataCompletionModel'
import {
  PRODUCT_DATA_CARTON_SPEC_FIELDS,
  PRODUCT_DATA_LOGISTICS_FIELDS,
  PRODUCT_DATA_PRODUCT_SPEC_FIELDS
} from '../model/purchaseOrderUiMeta'
import type {
  ProductDataCompletionFormValues,
  ProductDataCompletionTarget
} from '../model/purchaseOrderViewTypes'

const { Text } = Typography

type ProductDataModalProps = {
  form: FormInstance<ProductDataCompletionFormValues>
  target: ProductDataCompletionTarget | null
  loading: boolean
  error?: string
  actionKey?: string
  handleSaveProductDataCompletion: () => Promise<void>
  closeProductDataCompletionModal: () => void
}

export function PurchaseOrderProductDataModal({
  form: productDataCompletionForm,
  target: productDataCompletionTarget,
  loading: productDataCompletionLoading,
  error: productDataCompletionError,
  actionKey,
  handleSaveProductDataCompletion,
  closeProductDataCompletionModal
}: ProductDataModalProps) {
  return (
    <Modal
      title="补齐商品资料"
      open={Boolean(productDataCompletionTarget)}
      okText="保存商品资料"
      cancelText="取消"
      okButtonProps={{
        loading: Boolean(productDataCompletionTarget && actionKey === `product-data-completion:${productDataCompletionTarget.item.id}`)
      }}
      onOk={() => void handleSaveProductDataCompletion()}
      onCancel={closeProductDataCompletionModal}
      width={880}
    >
      {productDataCompletionTarget ? (
        <Spin spinning={productDataCompletionLoading}>
          <Form
            form={productDataCompletionForm}
            layout="vertical"
            requiredMark={false}
            className="purchase-product-data-form"
          >
            {productDataCompletionError ? (
              <Alert type="warning" showIcon message={productDataCompletionError} />
            ) : null}
            <div className="purchase-product-data-summary">
              <ProductThumbnail
                imageUrl={productDataCompletionTarget.item.productImageUrl || productDataCompletionTarget.item.sourceImageUrl}
              />
              <div className="purchase-product-data-summary-copy">
                <Text strong>{productDataCompletionTarget.item.partnerSku || productDataCompletionTarget.item.skuParent}</Text>
                <Text type="secondary" ellipsis>
                  {productDataCompletionTarget.item.productTitle || productDataCompletionTarget.item.sourceTitle}
                </Text>
                <div className="purchase-product-data-summary-tags">
                  <Tag>{productDataCompletionTarget.order.storeName || productDataCompletionTarget.order.storeCode}</Tag>
                  {productDataCompletionTarget.focusIssue ? (
                    <Tag color={productDataCompletionTarget.focusIssue === '箱规缺失' ? 'gold' : 'red'}>
                      {productDataCompletionTarget.focusIssue}
                    </Tag>
                  ) : null}
                </div>
              </div>
            </div>
            <section className="purchase-product-data-section">
              <div className="purchase-product-data-section-title">
                <Text strong>采购备注</Text>
                <Tag>选填</Tag>
              </div>
              <div className="purchase-product-data-sourcing-grid">
                <Form.Item label="款式/型号" name="sourcingSpec">
                  <Input placeholder="例如 A5 横线" maxLength={80} />
                </Form.Item>
                <Form.Item label="尺寸描述" name="sourcingSize">
                  <Input placeholder="例如 21x14cm" maxLength={80} />
                </Form.Item>
                <Form.Item label="颜色描述" name="sourcingColor">
                  <Input placeholder="例如 灰色" maxLength={80} />
                </Form.Item>
              </div>
            </section>
            <section
              className={`purchase-product-data-section${productDataCompletionTarget.focusIssue === '产品规格缺失' ? ' is-focused' : ''}`}
            >
              <div className="purchase-product-data-section-title">
                <Text strong>1688 产品规格</Text>
                {productDataCompletionTarget.item.productSpecComplete === false ? <Tag color="red">必填</Tag> : <Tag>已可选维护</Tag>}
              </div>
              <div className="purchase-product-data-spec-grid">
                {PRODUCT_DATA_PRODUCT_SPEC_FIELDS.map((field) => (
                  <Form.Item
                    key={field.key}
                    label={field.label}
                    name={field.key}
                    rules={[
                      {
                        validator: (_, value) => validateProductDataNumberField(
                          field.label,
                          value,
                          field.min,
                          productDataCompletionTarget.item.productSpecComplete === false
                        )
                      }
                    ]}
                  >
                    <InputNumber
                      min={field.min}
                      precision={field.precision}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                ))}
              </div>
            </section>
            <section
              className={`purchase-product-data-section${productDataCompletionTarget.focusIssue === '箱规缺失' ? ' is-focused' : ''}`}
            >
              <div className="purchase-product-data-section-title">
                <Text strong>箱规</Text>
                {productDataCompletionTarget.item.cartonSpecComplete === false ? <Tag color="gold">缺失仅提示</Tag> : <Tag>已可选维护</Tag>}
              </div>
              <div className="purchase-product-data-spec-grid">
                {PRODUCT_DATA_CARTON_SPEC_FIELDS.map((field) => (
                  <Form.Item
                    key={field.key}
                    label={field.label}
                    name={field.key}
                    rules={[
                      {
                        validator: (_, value) => validateProductDataNumberField(
                          field.label,
                          value,
                          field.min,
                          false
                        )
                      }
                    ]}
                  >
                    <InputNumber
                      min={field.min}
                      precision={field.precision}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                ))}
              </div>
            </section>
            <section
              className={`purchase-product-data-section${productDataCompletionTarget.focusIssue === '商品属性缺失' ? ' is-focused' : ''}`}
            >
              <div className="purchase-product-data-section-title">
                <Text strong>商品属性</Text>
                {productDataCompletionTarget.item.logisticsAttributeComplete === false ? <Tag color="red">必填</Tag> : <Tag>已可选维护</Tag>}
              </div>
              <div className="purchase-product-data-logistics-grid">
                {PRODUCT_DATA_LOGISTICS_FIELDS.map((field) => (
                  <Form.Item
                    key={field.key}
                    label={field.label}
                    name={field.key}
                    rules={[
                      {
                        validator: (_, value) => validateProductDataAttributeField(
                          field.label,
                          value,
                          productDataCompletionTarget.item.logisticsAttributeComplete === false
                        )
                      }
                    ]}
                  >
                    <Select options={field.options} />
                  </Form.Item>
                ))}
              </div>
            </section>
          </Form>
        </Spin>
      ) : null}
    </Modal>
  )
}
