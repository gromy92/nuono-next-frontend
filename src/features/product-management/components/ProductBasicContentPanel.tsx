import { Progress, Tag } from 'antd';
import type { ProductFieldDomainSurface } from '../../product-editor/productFieldDomain';
import type { ProductMasterSnapshotPayload } from '../../product-domain/productMasterSnapshot';
import type { ProductCompetitorContentMaterial } from '../../product-domain/productCompetitorContent';
import { ProductBilingualContentEditor } from './ProductBilingualContentEditor';
import { ProductDetailSection } from '../../product-editor/ProductDetailSection';

export function ProductBasicContentPanel(props: {
  productContentDomain?: ProductFieldDomainSurface;
  productContentProgressDone: number;
  productContentProgressTotal: number;
  productCompetitorMaterials?: ProductCompetitorContentMaterial[];
  productListingKeywordSuggestions?: {
    EN?: string[];
    AR?: string[];
  };
  enableCompetitorContentMerge?: boolean;
  productSnapshotView?: ProductMasterSnapshotPayload;
  updateProductSectionField: (
    section: 'identity' | 'taxonomy' | 'content' | 'group',
    field: string,
    value: unknown
  ) => void;
  updateProductMultilineField: (field: 'highlightsEn' | 'highlightsAr' | 'images', value: string) => void;
}) {
  const {
    productContentDomain,
    productContentProgressDone,
    productContentProgressTotal,
    productCompetitorMaterials,
    productListingKeywordSuggestions,
    enableCompetitorContentMerge,
    productSnapshotView,
    updateProductSectionField,
    updateProductMultilineField
  } = props;

  return (
    <>
      <ProductDetailSection
        title="Basic Content"
        domain={productContentDomain}
        extra={
          <Tag color="processing" style={{ marginInlineEnd: 0 }}>
            {productContentProgressDone}/{productContentProgressTotal} Attributes
          </Tag>
        }
      >
        <Progress
          percent={Math.round((productContentProgressDone / productContentProgressTotal) * 100)}
          size="small"
          style={{ marginBottom: 12 }}
        />
        <ProductBilingualContentEditor
          productSnapshotView={productSnapshotView}
          productCompetitorMaterials={productCompetitorMaterials}
          productListingKeywordSuggestions={productListingKeywordSuggestions}
          enableCompetitorContentMerge={enableCompetitorContentMerge}
          updateProductSectionField={updateProductSectionField}
          updateProductMultilineField={updateProductMultilineField}
        />
      </ProductDetailSection>
    </>
  );
}
