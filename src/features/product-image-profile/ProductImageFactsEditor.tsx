import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Input, Space, Typography } from 'antd'

const { Text } = Typography
const { TextArea } = Input

export type ProductImageFactsValue = {
  specSummary: string
  titleEn: string
  titleAr: string
  sizeAttributesText: string
  heroSellingPoints: string[]
  packageAttributesText: string
}

type ProductImageFactsEditorProps = {
  value: ProductImageFactsValue
  disabled: boolean
  extracting: boolean
  onChange: (value: ProductImageFactsValue) => void
  onExtract: () => void
}

export function ProductImageFactsEditor({
  value,
  disabled,
  extracting,
  onChange,
  onExtract
}: ProductImageFactsEditorProps) {
  const patchValue = (patch: Partial<ProductImageFactsValue>) => {
    onChange({ ...value, ...patch })
  }

  const updateHeroPoint = (index: number, point: string) => {
    patchValue({
      heroSellingPoints: value.heroSellingPoints.map(
        (currentPoint, pointIndex) => pointIndex === index ? point : currentPoint
      )
    })
  }

  const addHeroPoint = () => {
    if (value.heroSellingPoints.length >= 5) {
      return
    }
    patchValue({ heroSellingPoints: [...value.heroSellingPoints, ''] })
  }

  const removeHeroPoint = (index: number) => {
    if (value.heroSellingPoints.length <= 1) {
      return
    }
    patchValue({
      heroSellingPoints: value.heroSellingPoints.filter((_, pointIndex) => pointIndex !== index)
    })
  }

  return (
    <section className="product-image-profile-panel product-image-profile-fact-panel">
      <div className="product-image-profile-panel-head">
        <strong>商品资料</strong>
        <Space className="product-image-profile-fact-actions" wrap>
          <Button
            disabled={disabled}
            icon={<ReloadOutlined />}
            loading={extracting}
            onClick={onExtract}
          >
            AI 提取
          </Button>
        </Space>
      </div>

      <div className="product-image-profile-fact-groups">
        <div className="product-image-profile-fact-group">
          <Text strong>主图数据</Text>
          <div className="product-image-profile-fact-field-grid">
            <label className="product-image-profile-fact-field">
              <span>规格</span>
              <Input
                disabled={disabled}
                value={value.specSummary}
                placeholder="规格"
                onChange={(event) => patchValue({ specSummary: event.target.value })}
              />
            </label>
            <label className="product-image-profile-fact-field product-image-profile-fact-field--wide">
              <span>英文短标题</span>
              <Input
                disabled={disabled}
                value={value.titleEn}
                placeholder="英文短标题"
                onChange={(event) => patchValue({ titleEn: event.target.value })}
              />
            </label>
            <label className="product-image-profile-fact-field product-image-profile-fact-field--wide">
              <span>阿语短标题</span>
              <Input
                dir="rtl"
                disabled={disabled}
                value={value.titleAr}
                placeholder="阿语短标题"
                onChange={(event) => patchValue({ titleAr: event.target.value })}
              />
            </label>
          </div>
        </div>

        <div className="product-image-profile-fact-group">
          <Text strong>尺寸数据</Text>
          <TextArea
            disabled={disabled}
            rows={3}
            value={value.sizeAttributesText}
            placeholder="尺寸文案；没有可信尺寸就留空，用户手填"
            onChange={(event) => patchValue({ sizeAttributesText: event.target.value })}
          />
        </div>

        <div className="product-image-profile-fact-group">
          <div className="product-image-profile-fact-group-head">
            <Text strong>英文卖点</Text>
            <Button
              icon={<PlusOutlined />}
              disabled={disabled || value.heroSellingPoints.length >= 5}
              onClick={addHeroPoint}
            >
              添加
            </Button>
          </div>
          <div className="product-image-profile-selling-points">
            {value.heroSellingPoints.map((point, index) => (
              <Input
                disabled={disabled}
                key={index}
                value={point}
                placeholder={`English selling point ${index + 1}`}
                addonAfter={
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    disabled={disabled || value.heroSellingPoints.length <= 1}
                    onClick={() => removeHeroPoint(index)}
                  />
                }
                onChange={(event) => updateHeroPoint(index, event.target.value)}
              />
            ))}
          </div>
        </div>

        <div className="product-image-profile-fact-group">
          <Text strong>包装数据</Text>
          <TextArea
            disabled={disabled}
            rows={3}
            value={value.packageAttributesText}
            placeholder="数量、套装内容、配件、颜色组合或包装说明"
            onChange={(event) => patchValue({ packageAttributesText: event.target.value })}
          />
        </div>
      </div>
    </section>
  )
}
