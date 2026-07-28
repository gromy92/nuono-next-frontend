import { Tag, Typography } from 'antd'
import type { ProductListRowPayload } from '../../product-domain/productListTypes'
import { buildNoonProductUrl, buildProductSummarySurfaceFromListItem, mergeGalleryImageUrls, ProductBaselineListCell } from '../../product-baseline'

const { Text } = Typography

export function ProductIdentityCell(props: { record: ProductListRowPayload }) {
  const { record } = props;
  const summary = buildProductSummarySurfaceFromListItem(record);
  const galleryImages = mergeGalleryImageUrls(record.galleryImages, record.imageUrl);
  const noonProductUrl = buildNoonProductUrl(summary);

  return (
    <ProductBaselineListCell
      summary={summary}
      imageUrl={galleryImages[0]}
      imageCount={galleryImages.length}
      imageAlt={record.title || record.skuParent}
      titleHref={noonProductUrl}
      actions={
        record.variantCount && record.variantCount > 1 ? (
          <Tag color="warning" style={{ marginInlineEnd: 0, fontSize: 11, lineHeight: '16px' }}>
            多变体 {record.variantCount}
          </Tag>
        ) : null
      }
    />
  );
}

export function ProfitPlaceholderCell() {
  return <Text type="secondary">-</Text>;
}
