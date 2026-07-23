import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Select } from 'antd';
import { FORWARDER_OPTIONS } from './productLogisticsCostModels';
import { dataStatusButtonClass } from './productLogisticsCostProductDomain';
import type { ProductLogisticsCostData } from './useProductLogisticsCostData';
import type { ProductLogisticsCostMutations } from './useProductLogisticsCostMutations';

export function ProductLogisticsCostsToolbar({
  data,
  mutations
}: {
  data: ProductLogisticsCostData;
  mutations: ProductLogisticsCostMutations;
}) {
  return (
    <>
      <div className="product-logistics-costs-page__toolbar">
        <Input
          allowClear
          className="product-logistics-costs-page__search"
          prefix={<SearchOutlined />}
          placeholder="搜索系统 PSKU / 商品名 / 条码"
          value={data.filters.searchText}
          onChange={(event) => data.setFilters((current) => ({ ...current, searchText: event.target.value }))}
          onPressEnter={data.applyFilters}
        />
        <Select
          aria-label="货代"
          options={FORWARDER_OPTIONS}
          value={data.filters.forwarderCode}
          onChange={(value) => data.applyRouteFilters({ forwarderCode: value })}
        />
        <Select
          aria-label="方式"
          options={data.activeTransportOptions}
          value={data.filters.transportMode}
          onChange={(value) => data.applyRouteFilters({ transportMode: value })}
        />
        <Select
          aria-label="类别"
          className="product-logistics-costs-page__category-filter"
          options={data.categoryFilterSelectOptions}
          value={data.filters.cargoCategoryCode}
          onChange={data.applyCategoryFilter}
        />
        <Button onClick={mutations.openRateCardModal}>维护报价</Button>
        <Button type="primary" icon={<SearchOutlined />} onClick={data.applyFilters}>查询</Button>
        <Button icon={<ReloadOutlined />} onClick={() => void data.load(data.appliedFilters)}>刷新</Button>
        <span className="product-logistics-costs-page__store">
          {data.currentStore?.projectName || data.currentStore?.projectCode || '当前店铺'} · {data.storeCode || '-'}
        </span>
      </div>

      <div className="product-logistics-costs-page__stats">
        <button
          type="button"
          className={dataStatusButtonClass(data.appliedFilters.dataStatus, 'ALL')}
          aria-pressed={data.appliedFilters.dataStatus === 'ALL'}
          onClick={() => data.applyDataStatusFilter('ALL')}
        >
          查询结果 {data.resultStats.total}
        </button>
        <button
          type="button"
          className={dataStatusButtonClass(data.appliedFilters.dataStatus, 'WITH_DATA')}
          aria-pressed={data.appliedFilters.dataStatus === 'WITH_DATA'}
          onClick={() => data.applyDataStatusFilter('WITH_DATA')}
        >
          有数据 {data.resultStats.priced}
        </button>
        <button
          type="button"
          className={dataStatusButtonClass(data.appliedFilters.dataStatus, 'MISSING_DATA')}
          aria-pressed={data.appliedFilters.dataStatus === 'MISSING_DATA'}
          onClick={() => data.applyDataStatusFilter('MISSING_DATA')}
        >
          无数据 {data.resultStats.missing}
        </button>
      </div>

      <div className="product-logistics-costs-page__batch-actions">
        <span className="product-logistics-costs-page__batch-count">
          已选 {data.assignableSelectedRows.length}
        </span>
        <Button
          disabled={!data.assignableSelectedRows.length}
          onClick={mutations.openBatchCategoryModal}
        >
          批量设类别
        </Button>
      </div>
    </>
  );
}
