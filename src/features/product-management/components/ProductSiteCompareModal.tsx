import { useMemo } from 'react';
import { Alert, Modal, Space, Spin, Table, Typography } from 'antd';
import type { ProductManagementWorkspace } from '../workspaceTypes';
import {
  closedProductSiteCompareModalState,
  formatSnapshotValue,
  productSummaryTitle,
  siteOfferCode
} from '../utils';
import { createProductSiteCompareColumns } from './ProductSiteCompareModal.helpers';
import { ProductImageThumb } from './ProductBaselineDisplay';

const { Text } = Typography;

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
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              padding: '8px 10px',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              background: '#f8fafc'
            }}
          >
            <ProductImageThumb
              src={summary.imageUrl || summary.galleryImages[0]}
              alt={productSummaryTitle(summary)}
              imageCount={summary.galleryImages.length}
              width={56}
            />
            <div style={{ minWidth: 0 }}>
              <Text
                strong
                style={{
                  display: 'block',
                  maxWidth: 780,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: '#0f172a',
                  fontSize: 14,
                  lineHeight: '20px'
                }}
              >
                {productSummaryTitle(summary)}
              </Text>
              <Text type="secondary" style={{ fontSize: 12, lineHeight: '18px' }}>
                {formatSnapshotValue(summary.skuParent)} · {formatSnapshotValue(summary.partnerSku || summary.pskuCode)}
              </Text>
            </div>
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
