import { Progress, Tag } from 'antd';
import type { ProductFieldDomainSurface, ProductMasterSnapshotPayload } from '../types';
import type { ProductCompetitorContentMaterial } from '../types/competitorContent';
import { ProductBilingualContentEditor } from './ProductBilingualContentEditor';
import { ProductDetailSection } from './ProductDetailSection';

export function ProductBasicContentPanel(props: {
  productContentDomain?: ProductFieldDomainSurface;
  productContentProgressDone: number;
  productContentProgressTotal: number;
  productCompetitorMaterials?: ProductCompetitorContentMaterial[];
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
          enableCompetitorContentMerge={enableCompetitorContentMerge}
          updateProductSectionField={updateProductSectionField}
          updateProductMultilineField={updateProductMultilineField}
        />
      </ProductDetailSection>
    </>
  );
}
