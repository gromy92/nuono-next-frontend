import { useMemo } from 'react';
import { Alert, Modal, Space, Spin, Table } from 'antd';
import type { ProductManagementWorkspace } from '../workspaceTypes';
import {
  closedProductSiteCompareModalState,
  formatSnapshotValue,
  productSummaryTitle,
  siteOfferCode
} from '../utils';
import { createProductSiteCompareColumns } from './ProductSiteCompareModal.helpers';
import { ProductBaselineIdentity } from '../../product-baseline';

type ProductSiteCompareModalProps = {
  workspace: ProductManagementWorkspace;
};

export function ProductSiteCompareModal({ workspace }: ProductSiteCompareModalProps) {
  const {
    productSiteCompareModalState,
    setProductSiteCompareModalState
  } = workspace;
  const { open, loading, summary, rows, dirtySiteOfferCodes, note } =
    productSiteCompareModalState;
  const columns = useMemo(
    () => createProductSiteCompareColumns({ dirtySiteOfferCodes }),
    [dirtySiteOfferCodes]
  );

  const closeModal = () => {
    setProductSiteCompareModalState(closedProductSiteCompareModalState());
  };

  return (
    <Modal
      open={open}
      title="站点对比"
      footer={null}
      onCancel={closeModal}
      width={1000}
      centered
      destroyOnClose
      styles={{ body: { paddingTop: 8 } }}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {summary ? (
          <div
            style={{
              padding: '8px 10px',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              background: '#f8fafc'
            }}
          >
            <ProductBaselineIdentity
              title={productSummaryTitle(summary)}
              imageUrl={summary.imageUrl || summary.galleryImages[0]}
              imageCount={summary.galleryImages.length}
              imageAlt={productSummaryTitle(summary)}
              imageWidth={56}
              compact
              titleMaxWidth={780}
              codes={[
                {
                  label: 'SKU',
                  value: formatSnapshotValue(summary.skuParent),
                  copyText: summary.skuParent
                },
                {
                  label: 'PSKU',
                  value: formatSnapshotValue(summary.partnerSku),
                  copyText: summary.partnerSku
                }
              ]}
            />
          </div>
        ) : null}

        {note ? <Alert type="info" showIcon message={note} /> : null}

        <Spin spinning={loading}>
          <div style={{ border: '1px solid #eef2f7', borderRadius: 6, overflow: 'hidden' }}>
            <Table
              columns={columns}
              dataSource={rows}
              rowKey={(record) => `${String(record.storeCode)}-${String(record.site)}`}
              pagination={false}
              size="small"
              tableLayout="fixed"
            />
          </div>
        </Spin>
      </Space>
    </Modal>
  );
}
