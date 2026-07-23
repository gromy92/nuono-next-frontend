import { Alert, Modal, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo } from 'react';
import { HistoryQuotesCell, QuotePriceCell, RouteCell } from './ProductLogisticsCostCells';
import type { ProductCostTableRow } from './productLogisticsCostModels';
import { categoryLabel, categoryTitle } from './productLogisticsCostRouteDomain';
import {
  productImageUrl,
  productSubtitle,
  productTitle
} from './productLogisticsCostProductDomain';
import type { ProductLogisticsCostData } from './useProductLogisticsCostData';
import type { ProductLogisticsCostMutations } from './useProductLogisticsCostMutations';

export function ProductLogisticsCostsTable({
  data,
  mutations
}: {
  data: ProductLogisticsCostData;
  mutations: ProductLogisticsCostMutations;
}) {
  const columns = useMemo<ColumnsType<ProductCostTableRow>>(() => [
    {
      title: '商品',
      key: 'product',
      width: 220,
      fixed: 'left',
      render: (_, row) => {
        const imageUrl = productImageUrl(row.product);
        const imageAvailable = !!imageUrl && !data.failedImageUrls.has(imageUrl);
        const content = (
          <div className="product-logistics-costs-page__product">
            {imageAvailable ? (
              <img
                className="product-logistics-costs-page__product-image"
                src={imageUrl}
                alt=""
                onError={() => data.markImageFailed(imageUrl)}
              />
            ) : (
              <div className="product-logistics-costs-page__product-image product-logistics-costs-page__product-image--empty" />
            )}
            <div className="product-logistics-costs-page__product-text">
              <span className="product-logistics-costs-page__product-title">{productTitle(row.product)}</span>
              <span className="product-logistics-costs-page__subtext">{productSubtitle(row.product, row.partnerSku)}</span>
            </div>
          </div>
        );
        if (!imageAvailable) return content;
        return (
          <button
            type="button"
            className="product-logistics-costs-page__product-button"
            onClick={() => data.setImagePreview({ url: imageUrl, title: productTitle(row.product) })}
          >
            {content}
          </button>
        );
      }
    },
    {
      title: '站点 / 货代 / 方式',
      key: 'routeSummary',
      width: 132,
      render: (_, row) => <RouteCell row={row} filters={data.appliedFilters} />
    },
    {
      title: '类别',
      key: 'cargoCategory',
      width: 72,
      align: 'center',
      render: (_, row) => {
        const sourceRow = row.currentCost || row.historyCosts[0];
        return (
          <span className="product-logistics-costs-page__category" title={categoryTitle(sourceRow)}>
            {categoryLabel(sourceRow)}
          </span>
        );
      }
    },
    {
      title: '当前报价',
      key: 'currentCost',
      width: 154,
      align: 'right',
      render: (_, row) => (
        <QuotePriceCell
          row={row.currentCost}
          emptyText="无当前价"
          dateValue={row.currentCost?.refreshedAt || row.currentCost?.costOccurredAt}
          onClick={() => mutations.openManualQuoteModal(row)}
        />
      )
    },
    {
      title: '历史报价',
      key: 'historyQuotes',
      width: 660,
      render: (_, row) => <HistoryQuotesCell rows={row.historyCosts} />
    }
  ], [data.appliedFilters, data.failedImageUrls, data.markImageFailed, data.setImagePreview, mutations]);

  return (
    <>
      {data.errorMessage ? <Alert type="error" showIcon message={data.errorMessage} /> : null}
      {!data.errorMessage && data.routeHasNoCost ? (
        <Alert type="info" showIcon message={`当前组合暂无商品级报价：${data.routeLabel}`} />
      ) : null}
      <Table
        rowKey={(row) => row.rowKey}
        columns={columns}
        dataSource={data.tableRows}
        loading={data.loading}
        size="small"
        rowSelection={data.rowSelection}
        scroll={{ x: 1320, y: 620 }}
        pagination={{
          current: data.pagination.current,
          pageSize: data.pagination.pageSize,
          total: data.tableRows.length,
          pageSizeOptions: [50, 100, 200],
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}`,
          position: ['bottomRight']
        }}
        onChange={data.handleTableChange}
        locale={{ emptyText: data.loading ? '加载中' : '当前店铺没有匹配的商品报价' }}
      />
      <Modal
        title={data.imagePreview?.title || '商品图片'}
        open={!!data.imagePreview}
        footer={null}
        width={720}
        onCancel={() => data.setImagePreview(undefined)}
        destroyOnClose
      >
        {data.imagePreview ? (
          <img className="product-logistics-costs-page__preview-image" src={data.imagePreview.url} alt="" />
        ) : null}
      </Modal>
    </>
  );
}
