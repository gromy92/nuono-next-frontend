import { ExportOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import type { ReactNode } from 'react';
import type { ProductMasterSnapshotPayload, ProductSummarySurface } from '../types';
import { buildNoonCatalogProductUrl, buildNoonProductUrl } from '../utils';
import { ProductBaselineHeader } from './ProductBaselineDisplay';

type ProductDetailSummaryBarProps = {
  summary?: ProductSummarySurface | null;
  productSnapshotView?: ProductMasterSnapshotPayload;
  activeProductSiteOffer?: Record<string, unknown>;
  productLeadImage?: string;
  openCurrentProductGallery: (index: number) => void;
  syncAlert?: ReactNode;
  actions?: ReactNode;
  showExternalLinks?: boolean;
};

export function ProductDetailSummaryBar({
  summary,
  productSnapshotView,
  activeProductSiteOffer,
  productLeadImage,
  openCurrentProductGallery,
  syncAlert,
  actions,
  showExternalLinks = true
}: ProductDetailSummaryBarProps) {
  const imageUrl = productLeadImage || summary?.imageUrl || summary?.galleryImages[0];
  const productUrl = showExternalLinks && summary ? buildNoonProductUrl(summary) : undefined;
  const catalogUrl = showExternalLinks ? buildNoonCatalogProductUrl(productSnapshotView, activeProductSiteOffer) : undefined;

  return (
    <ProductBaselineHeader
      summary={summary}
      imageUrl={imageUrl}
      imageCount={summary?.galleryImages.length}
      onImageClick={productLeadImage ? () => openCurrentProductGallery(0) : undefined}
      syncAlert={syncAlert}
      metaActions={
        <>
          {productUrl ? (
            <Button size="small" href={productUrl} target="_blank" rel="noreferrer" icon={<ExportOutlined />}>
              打开前台详情
            </Button>
          ) : null}
          {catalogUrl ? (
            <Button size="small" href={catalogUrl} target="_blank" rel="noreferrer" icon={<ExportOutlined />}>
              打开后台详情
            </Button>
          ) : null}
        </>
      }
      actions={actions}
    />
  );
}
