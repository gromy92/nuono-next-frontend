import { Empty, Typography } from 'antd'

const { Text } = Typography

type SpecCategory = 'basic' | 'package' | 'channel' | 'market' | 'category'

type ParsedSpec = {
  label: string
  value: string
  category: SpecCategory
}

type SpecGroup = {
  key: SpecCategory
  title: string
}

const SPEC_GROUPS: SpecGroup[] = [
  { key: 'basic', title: '基础规格' },
  { key: 'package', title: '包装信息' },
  { key: 'channel', title: '渠道信息' },
  { key: 'market', title: '市场信号' },
  { key: 'category', title: '类目规格' }
]

type ManualSelectionSpecGroupsProps = {
  specHints?: string[]
}

export function ManualSelectionSpecGroups({ specHints = [] }: ManualSelectionSpecGroupsProps) {
  const parsedSpecs = specHints.map(parseSpecHint)
  const structuredSpecs = parsedSpecs.filter((item): item is ParsedSpec => Boolean(item))

  if (!structuredSpecs.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无规格线索" />
  }

  return (
    <div className="manual-selection-detail-spec-grid">
      {SPEC_GROUPS.map((group) => {
        const items = structuredSpecs.filter((item) => item.category === group.key)
        if (!items.length) {
          return null
        }
        return <SpecGroupTable key={group.key} title={group.title} items={items} />
      })}
    </div>
  )
}

function SpecGroupTable(props: { title: string; items: ParsedSpec[] }) {
  return (
    <div className="manual-selection-detail-spec-card">
      <div className="manual-selection-detail-spec-card-title">{props.title}</div>
      <div className="manual-selection-detail-spec-table">
        {props.items.map((item) => (
          <div
            key={`${item.label}-${item.value}`}
            className="manual-selection-detail-spec-row"
          >
            <Text
              type="secondary"
              className="manual-selection-detail-spec-label"
            >
              {item.label}
            </Text>
            <Text
              className="manual-selection-detail-spec-value"
            >
              {item.value}
            </Text>
          </div>
        ))}
      </div>
    </div>
  )
}

function parseSpecHint(value: string): ParsedSpec | null {
  const separatorIndex = value.search(/[:：]/)
  if (separatorIndex <= 0) {
    return null
  }
  const label = value.slice(0, separatorIndex).trim()
  const specValue = value.slice(separatorIndex + 1).trim()
  if (!label || !specValue || label.length > 80) {
    return null
  }
  return {
    label,
    value: specValue,
    category: classifySpec(label)
  }
}

function classifySpec(label: string): SpecCategory {
  const normalized = normalizeLabel(label)

  if (['asin'].includes(normalized) || normalized.includes('model number')) {
    return 'channel'
  }
  if (
    normalized.includes('customer reviews') ||
    normalized.includes('review count') ||
    normalized === 'rating' ||
    normalized.includes('best sellers rank')
  ) {
    return 'market'
  }
  if (
    normalized.includes('package quantity') ||
    normalized.includes('unit count') ||
    normalized.includes('number of items') ||
    normalized.includes('item package quantity') ||
    normalized.includes('package count')
  ) {
    return 'package'
  }
  if (
    normalized.includes('brand') ||
    normalized.includes('manufacturer') ||
    normalized.includes('color') ||
    normalized.includes('material') ||
    normalized.includes('dimension') ||
    normalized === 'size'
  ) {
    return 'basic'
  }
  return 'category'
}

function normalizeLabel(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}
