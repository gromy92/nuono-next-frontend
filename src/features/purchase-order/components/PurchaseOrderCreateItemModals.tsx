import { Alert, Form, Input, Modal, Select } from 'antd'
import type { FormInstance } from 'antd'
import type { ReactNode } from 'react'
import type { AuthSession } from '../../auth/session'
import type { PurchaseOrder } from '../types'
import { PskuRowsFormList, SiteQuantityFormList } from './PurchaseOrderForms'
import { defaultCreateStoreCode, getOrderSiteOptions } from '../model/purchaseOrderStoreModel'
import { FULFILLMENT_TYPE_OPTIONS } from '../model/purchaseOrderUiMeta'
import type {
  AddItemsFormValues,
  CreateOrderFormValues,
  DeleteItemTarget,
  UpdateItemFormValues
} from '../model/purchaseOrderViewTypes'

type CreateItemModalsProps = {
  session?: AuthSession | null
  storeCode?: string
  createStoreCode?: string
  createStoreOptions: Array<{ label: string; value: string }>
  createSiteOptions: Array<{ label: string; value: string }>
  productOptions: Array<{ value: string; label: ReactNode }>
  productSearchLoading: boolean
  actionKey?: string
  createModalOpen: boolean
  createErrorMessage?: string
  createOrderForm: FormInstance<CreateOrderFormValues>
  addItemsOrder?: PurchaseOrder
  addItemsErrorMessage?: string
  addItemsForm: FormInstance<AddItemsFormValues>
  editItemTarget: DeleteItemTarget | null
  editItemErrorMessage?: string
  editItemForm: FormInstance<UpdateItemFormValues>
  handleCreateOrder: () => Promise<void>
  closeCreateOrderModal: () => void
  handleCreateStoreChange: (storeCode: string) => void
  handleAddItemsToOrder: () => Promise<void>
  closeAddItemsModal: () => void
  handleUpdateItem: () => Promise<void>
  closeEditItemModal: () => void
  handleProductSearch: (storeCode: string | undefined, keyword: string) => Promise<void>
}

export function PurchaseOrderCreateItemModals({
  session, storeCode, createStoreCode, createStoreOptions, createSiteOptions,
  productOptions: productAutoCompleteOptions, productSearchLoading, actionKey,
  createModalOpen, createErrorMessage, createOrderForm, addItemsOrder,
  addItemsErrorMessage, addItemsForm, editItemTarget, editItemErrorMessage,
  editItemForm, handleCreateOrder, closeCreateOrderModal, handleCreateStoreChange,
  handleAddItemsToOrder, closeAddItemsModal, handleUpdateItem, closeEditItemModal,
  handleProductSearch
}: CreateItemModalsProps) {
  return (
    <>
    <Modal
      title="新建采购单"
      open={createModalOpen}
      okText="创建"
      cancelText="取消"
      okButtonProps={{ loading: actionKey === 'create-order' }}
      onOk={() => void handleCreateOrder()}
      onCancel={closeCreateOrderModal}
      width={980}
    >
      <Form form={createOrderForm} layout="vertical" requiredMark={false} className="purchase-create-form">
        {createErrorMessage ? (
          <Alert type="error" showIcon message={createErrorMessage} style={{ marginBottom: 12 }} />
        ) : null}
        <Form.Item
          label="采购单名"
          name="title"
          rules={[{ required: true, whitespace: true, message: '请输入采购单名' }]}
        >
          <Input placeholder="例如 xingyao 6月新品采集单" maxLength={60} showCount />
        </Form.Item>
        <Form.Item
          label="店铺选择"
          name="storeCode"
          rules={[{ required: true, message: '请选择店铺' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={createStoreOptions}
            placeholder="选择店铺"
            onChange={handleCreateStoreChange}
          />
        </Form.Item>
        <PskuRowsFormList
          addButtonText="添加 PSKU"
          siteOptions={createSiteOptions}
          productOptions={productAutoCompleteOptions}
          productSearchLoading={productSearchLoading}
          onProductSearch={(nextKeyword) => {
            void handleProductSearch(createStoreCode || defaultCreateStoreCode(session) || storeCode, nextKeyword)
          }}
        />
        <Form.Item label="备注" name="remark">
          <Input.TextArea placeholder="输入备注" autoSize={{ minRows: 3, maxRows: 5 }} maxLength={160} showCount />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      title="添加商品"
      open={Boolean(addItemsOrder)}
      okText="添加"
      cancelText="取消"
      okButtonProps={{ loading: actionKey === `add-items:${addItemsOrder?.id}` }}
      onOk={() => void handleAddItemsToOrder()}
      onCancel={closeAddItemsModal}
      width={980}
    >
      <Form form={addItemsForm} layout="vertical" requiredMark={false} className="purchase-create-form">
        {addItemsErrorMessage ? (
          <Alert type="error" showIcon message={addItemsErrorMessage} style={{ marginBottom: 12 }} />
        ) : null}
        <PskuRowsFormList
          addButtonText="添加 PSKU"
          siteOptions={getOrderSiteOptions(addItemsOrder, session)}
          productOptions={productAutoCompleteOptions}
          productSearchLoading={productSearchLoading}
          onProductSearch={(nextKeyword) => {
            void handleProductSearch(addItemsOrder?.storeCode || storeCode, nextKeyword)
          }}
        />
      </Form>
    </Modal>

    <Modal
      title="编辑商品"
      open={Boolean(editItemTarget)}
      okText="保存"
      cancelText="取消"
      okButtonProps={{ loading: actionKey === `edit-item:${editItemTarget?.item.id}` }}
      onOk={() => void handleUpdateItem()}
      onCancel={closeEditItemModal}
      width={820}
    >
      <Form form={editItemForm} layout="vertical" requiredMark={false} className="purchase-create-form purchase-edit-item-form">
        {editItemErrorMessage ? (
          <Alert type="error" showIcon message={editItemErrorMessage} style={{ marginBottom: 12 }} />
        ) : null}
        <div className="purchase-edit-item-header">
          <Form.Item label="PSKU" name="psku">
            <Input disabled />
          </Form.Item>
          <Form.Item label="到货方式" name="fulfillmentType" rules={[{ required: true, message: '请选择到货方式' }]}>
            <Select options={FULFILLMENT_TYPE_OPTIONS} />
          </Form.Item>
        </div>
        <SiteQuantityFormList
          addButtonText="添加站点数量"
          siteOptions={getOrderSiteOptions(editItemTarget?.order, session)}
        />
      </Form>
    </Modal>
    </>
  )
}
