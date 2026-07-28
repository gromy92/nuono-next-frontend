import { SyncOutlined } from '@ant-design/icons'
import { Button, Empty, Input, Select, Space, Table, Tooltip } from 'antd'
import { useMemo } from 'react'
import type { AuthSession } from '../../auth/session'
import { useProductSpecColumns } from '../hooks/useProductSpecColumns'
import { useProductSpecsController } from '../hooks/useProductSpecsController'
import {
  logisticsAttributeFilterOptions,
  type LogisticsAttributeFilter
} from '../specPageConfig'
import {
  findSource,
  isDomesticSpecMissing,
  isLogisticsProfileMissing,
  isOfficialSpecMissing,
  isSourceProductSpecMissing,
  productSpecRowKey,
  rowMatchesLogisticsAttributeFilter
} from '../specDomain'
import type { ProductVariantSpecPayload } from '../types'

export function ProductSpecsWorkbench({
  session,
  activeOwnerId
}: {
  session: AuthSession
  activeOwnerId?: number
}) {
  const state = useProductSpecsController({ session, activeOwnerId })
  const columns = useProductSpecColumns(state)
  const filteredRows = useMemo(() => {
    let result: ProductVariantSpecPayload[]
    switch (state.completenessFilter) {
      case 'ali1688_missing':
        result = state.rows.filter((row) => isSourceProductSpecMissing(findSource(row.sources, 'ali1688')))
        break
      case 'warehouse_missing':
        result = state.rows.filter((row) => isSourceProductSpecMissing(findSource(row.sources, 'warehouse')))
        break
      case 'domestic_missing':
        result = state.rows.filter(isDomesticSpecMissing)
        break
      case 'official_missing':
        result = state.rows.filter(isOfficialSpecMissing)
        break
      case 'logistics_missing':
        result = state.rows.filter(isLogisticsProfileMissing)
        break
      default:
        result = state.rows
    }
    return state.logisticsAttributeFilter === 'all'
      ? result
      : result.filter((row) =>
        rowMatchesLogisticsAttributeFilter(row, state.logisticsAttributeFilter)
      )
  }, [state.completenessFilter, state.logisticsAttributeFilter, state.rows])

  return (
    <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        gap: 12, flexWrap: 'wrap'
      }}>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="SKU / 标题"
            value={state.keyword}
            style={{ width: 260 }}
            onChange={(event) => state.setKeyword(event.target.value)}
            onSearch={() => void state.loadRows()}
          />
          <Select
            data-testid="product-specs-completeness-filter"
            value={state.completenessFilter}
            options={[
              { value: 'all', label: '全部规格' },
              { value: 'ali1688_missing', label: '1688规格缺失' },
              { value: 'warehouse_missing', label: '仓管规格缺失' },
              { value: 'domestic_missing', label: '国内规格缺失' },
              { value: 'official_missing', label: 'Noon官方尺寸缺失' },
              { value: 'logistics_missing', label: '物流属性缺失' }
            ]}
            style={{ width: 172 }}
            onChange={state.setCompletenessFilter}
          />
          <span data-testid="product-specs-logistics-attribute-filter">
            <Select<LogisticsAttributeFilter>
              value={state.logisticsAttributeFilter}
              options={logisticsAttributeFilterOptions}
              showSearch
              optionFilterProp="label"
              style={{ width: 190 }}
              onChange={state.setLogisticsAttributeFilter}
            />
          </span>
          <Tooltip title="刷新">
            <Button icon={<SyncOutlined />} loading={state.loading} onClick={() => void state.loadRows()} />
          </Tooltip>
        </Space>
      </div>

      <Table<ProductVariantSpecPayload>
        rowKey={productSpecRowKey}
        size="middle"
        loading={state.loading}
        columns={columns}
        dataSource={filteredRows}
        scroll={{ x: 1230 }}
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条数据`
        }}
        locale={{
          emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无商品规格" />
        }}
      />
    </div>
  )
}
