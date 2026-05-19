import { Progress, Tag } from 'antd';
import type { ProductFieldDomainSurface, ProductMasterSnapshotPayload } from '../types';
import { ProductContentTranslationEditor } from './ProductContentTranslationEditor';
import { ProductDetailSection } from './ProductDetailSection';
import { ProductLongDescriptionEditor } from './ProductLongDescriptionEditor';

export function ProductBasicContentPanel(props: {
  productContentDomain?: ProductFieldDomainSurface;
  productContentProgressDone: number;
  productContentProgressTotal: number;
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
        <ProductContentTranslationEditor
          productSnapshotView={productSnapshotView}
          updateProductSectionField={updateProductSectionField}
          updateProductMultilineField={updateProductMultilineField}
        />
        <ProductLongDescriptionEditor
          productSnapshotView={productSnapshotView}
          updateProductSectionField={updateProductSectionField}
        />
      </ProductDetailSection>
    </>
  );
}
