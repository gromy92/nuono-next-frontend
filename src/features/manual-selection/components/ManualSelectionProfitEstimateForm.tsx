import { LinkOutlined } from '@ant-design/icons'
import { Button, Col, Form, Input, InputNumber, Row, Select, Space, Spin, Tag, Typography } from 'antd'
import type { FormInstance } from 'antd'
import { systemCategoryDisplayLabel, systemCategoryOptionSearchText, type ManualSelectionSystemCategoryOption } from '../profitCategoryMatching'
import type { LogisticsProviderOption } from '../profitEstimateLogisticsOptions'
import type { ManualSelectionProfitEstimateSeed } from '../types'
import { ManualSelectionProfitLogisticsFields } from './ManualSelectionProfitLogisticsFields'
import {
  categorySelectOptionLabel,
  initialValues,
  siteLabel,
  type ProfitEstimateFormValues
} from './manualSelectionProfitEstimateModel'

const { Text } = Typography

type Props = {
  form: FormInstance<ProfitEstimateFormValues>
  seed?: ManualSelectionProfitEstimateSeed | null
  currentSiteCode: 'SA' | 'AE'
  categoryOptions: ManualSelectionSystemCategoryOption[]
  categoryLoading: boolean
  setCompetitorCategoryOpen: (open: boolean) => void
  airProviders: LogisticsProviderOption[]
  seaProviders: LogisticsProviderOption[]
  selectedAirProvider?: LogisticsProviderOption
  selectedSeaProvider?: LogisticsProviderOption
  logisticsLoading: boolean
  logisticsHydrated: boolean
  effectiveSite: 'SA' | 'AE'
  handleLogisticsProviderChange: (mode: 'AIR' | 'SEA', value: string) => void
  handleLogisticsQuoteChange: () => void
}

export function ManualSelectionProfitEstimateForm(props: Props) {
  const {
    form, seed, currentSiteCode, categoryOptions, categoryLoading,
    setCompetitorCategoryOpen, airProviders, seaProviders, selectedAirProvider,
    selectedSeaProvider, logisticsLoading, logisticsHydrated, effectiveSite,
    handleLogisticsProviderChange, handleLogisticsQuoteChange
  } = props
  return (
        <Form form={form} layout="vertical" initialValues={initialValues(seed, currentSiteCode)}>
          <Row gutter={10}>
            <Col span={9}>
              <Form.Item label="1688采购链接" name="ali1688Url">
                <Input placeholder="粘贴 1688 商品链接" />
              </Form.Item>
            </Col>
            <Col span={11}>
              <Form.Item
                label={(
                  <Space size={6}>
                    <span>商品类目</span>
                    <Button
                      type="link"
                      size="small"
                      icon={<LinkOutlined />}
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        setCompetitorCategoryOpen(true)
                      }}
                    >
                      查看竞品类目
                    </Button>
                  </Space>
                )}
                name="categoryKey"
                rules={[{ required: true, message: '请选择商品类目' }]}
              >
                <Select
                  loading={categoryLoading}
                  optionFilterProp="searchText"
                  options={categoryOptions.map((option) => {
                    return {
                      label: categorySelectOptionLabel(option),
                      displayLabel: systemCategoryDisplayLabel(option),
                      searchText: systemCategoryOptionSearchText(option),
                      value: option.value
                    }
                  })}
                  optionLabelProp="displayLabel"
                  placeholder={categoryLoading ? '读取系统类目' : '选择系统类目'}
                  popupClassName="manual-selection-profit-category-dropdown"
                  popupMatchSelectWidth={860}
                  showSearch
                  virtual
                  notFoundContent={categoryLoading ? <Spin size="small" /> : '暂无匹配系统类目'}
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <div className="manual-selection-profit-site">
                <Text type="secondary">当前站点</Text>
                <Tag color="blue">{siteLabel(currentSiteCode)}</Tag>
              </div>
            </Col>
          </Row>
          <Row gutter={10}>
            <ManualSelectionProfitLogisticsFields
              mode="AIR"
              providers={airProviders}
              selectedProvider={selectedAirProvider}
              loading={logisticsLoading}
              disabled={!logisticsHydrated}
              onProviderChange={(value) => handleLogisticsProviderChange('AIR', value)}
              onQuoteChange={handleLogisticsQuoteChange}
            />
            <ManualSelectionProfitLogisticsFields
              mode="SEA"
              providers={seaProviders}
              selectedProvider={selectedSeaProvider}
              loading={logisticsLoading}
              disabled={!logisticsHydrated}
              onProviderChange={(value) => handleLogisticsProviderChange('SEA', value)}
              onQuoteChange={handleLogisticsQuoteChange}
            />
          </Row>
          <Row gutter={10}>
            <Col span={5}>
              <Form.Item label="目标售价" name="salePrice" rules={[{ required: true, message: '请输入目标售价' }]}>
                <InputNumber min={0} precision={2} addonAfter={effectiveSite === 'AE' ? 'AED' : 'SAR'} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item label="采购单价" name="purchasePrice" rules={[{ required: true, message: '请输入采购单价' }]}>
                <InputNumber min={0} precision={2} addonAfter="RMB" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label="长" name="lengthCm" rules={[{ required: true, message: '请输入长度' }]}>
                <InputNumber min={0} precision={1} addonAfter="cm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label="宽" name="widthCm" rules={[{ required: true, message: '请输入宽度' }]}>
                <InputNumber min={0} precision={1} addonAfter="cm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item label="高" name="heightCm" rules={[{ required: true, message: '请输入高度' }]}>
                <InputNumber min={0} precision={1} addonAfter="cm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item label="毛重" name="grossWeightKg" rules={[{ required: true, message: '请输入毛重' }]}>
                <InputNumber min={0} precision={3} addonAfter="kg" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
  )
}
