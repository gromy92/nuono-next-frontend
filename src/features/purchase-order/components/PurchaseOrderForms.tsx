import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { AutoComplete, Button, Empty, Form, InputNumber, Select, Spin } from 'antd'
import type { ReactNode } from 'react'
import type { PurchaseSiteCode } from '../types'
import { createEmptyPskuEntry, createEmptySiteQuantityEntry } from '../model/purchaseOrderStoreModel'
import {
  DEFAULT_SITE_CODES,
  FULFILLMENT_TYPE_OPTIONS,
  TRANSPORT_MODE_OPTIONS
} from '../model/purchaseOrderUiMeta'

export function SiteQuantityFormList({
  addButtonText,
  siteOptions
}: {
  addButtonText: string
  siteOptions: Array<{ label: string; value: PurchaseSiteCode }>
}) {
  const defaultSite = siteOptions[0]?.value || DEFAULT_SITE_CODES[0]

  return (
    <div className="purchase-psku-entry">
      <Form.List name="siteQuantities">
        {(fields, { add, remove }) => (
          <div className="purchase-psku-entry-list">
            {fields.length ? (
              fields.map((field) => (
                <div className="purchase-site-quantity-row" key={field.key}>
                  <Form.Item name={[field.name, 'siteCode']} rules={[{ required: true, message: '请选择站点' }]}>
                    <Select options={siteOptions} placeholder="选择站点" />
                  </Form.Item>
                  <Form.Item name={[field.name, 'transportMode']} rules={[{ required: true, message: '请选择运输方式' }]}>
                    <Select options={TRANSPORT_MODE_OPTIONS} placeholder="运输方式" />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, 'quantity']}
                    rules={[
                      {
                        validator: (_, value: number | null | undefined) =>
                          typeof value === 'number' && value > 0
                            ? Promise.resolve()
                            : Promise.reject(new Error('请输入数量'))
                      }
                    ]}
                  >
                    <InputNumber min={1} precision={0} placeholder="数量" />
                  </Form.Item>
                  <Button aria-label="删除" icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                </div>
              ))
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无记录" />
            )}
            <Button icon={<PlusOutlined />} onClick={() => add(createEmptySiteQuantityEntry(defaultSite))}>
              {addButtonText}
            </Button>
          </div>
        )}
      </Form.List>
    </div>
  )
}

export function PskuRowsFormList({
  addButtonText,
  siteOptions,
  productOptions,
  productSearchLoading,
  onProductSearch
}: {
  addButtonText: string
  siteOptions: Array<{ label: string; value: PurchaseSiteCode }>
  productOptions?: Array<{ value: string; label: ReactNode }>
  productSearchLoading?: boolean
  onProductSearch?: (keyword: string) => void
}) {
  const defaultSite = siteOptions[0]?.value || DEFAULT_SITE_CODES[0]

  return (
    <div className="purchase-psku-entry">
      <Form.List name="items">
        {(fields, { add, remove }) => (
          <div className="purchase-psku-entry-list">
            {fields.length ? (
              fields.map((field) => (
                <div className="purchase-psku-entry-row" key={field.key}>
                  <Form.Item
                    name={[field.name, 'psku']}
                  >
                    <AutoComplete
                      allowClear
                      filterOption={false}
                      notFoundContent={productSearchLoading ? <Spin size="small" /> : null}
                      options={productOptions}
                      placeholder="输入 PSKU / 标题搜索"
                      onSearch={onProductSearch}
                    />
                  </Form.Item>
                  <Form.Item name={[field.name, 'site']} rules={[{ required: true, message: '请选择站点' }]}>
                    <Select options={siteOptions} placeholder="选择站点" />
                  </Form.Item>
                  <Form.Item name={[field.name, 'transportMode']} rules={[{ required: true, message: '请选择运输方式' }]}>
                    <Select options={TRANSPORT_MODE_OPTIONS} placeholder="运输方式" />
                  </Form.Item>
                  <Form.Item name={[field.name, 'fulfillmentType']} rules={[{ required: true, message: '请选择到货方式' }]}>
                    <Select options={FULFILLMENT_TYPE_OPTIONS} placeholder="到货方式" />
                  </Form.Item>
                  <Form.Item
                    name={[field.name, 'quantity']}
                    rules={[
                      {
                        validator: (_, value: number | null | undefined) =>
                          typeof value === 'number' && value > 0
                            ? Promise.resolve()
                            : Promise.reject(new Error('请输入数量'))
                      }
                    ]}
                  >
                    <InputNumber min={1} precision={0} placeholder="数量" />
                  </Form.Item>
                  <Button aria-label="删除" icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                </div>
              ))
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无记录" />
            )}
            <Button icon={<PlusOutlined />} onClick={() => add(createEmptyPskuEntry(defaultSite))}>
              {addButtonText}
            </Button>
          </div>
        )}
      </Form.List>
    </div>
  )
}

