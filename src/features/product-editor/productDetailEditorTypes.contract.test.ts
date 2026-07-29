import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import type {
  ProductContentEditorProps,
  ProductDetailEditorHostProps,
  ProductInsightsEditorProps,
  ProductOfferEditorProps,
  ProductSizesEditorProps
} from './productDetailEditorTypes';

const oldInterfacePath = 'src/features/product-management/components/ProductDetailOfficialTabs.types.ts';
assert.equal(existsSync(oldInterfacePath), false, 'product-management must not retain the shared editor Interface');

type DeadEditorProp =
  | 'productActionSubmitting'
  | 'activeSiteDirty'
  | 'activeSiteOfferCode'
  | 'siteOfferColumns'
  | 'productPlatformSignals'
  | 'productPlatformRejectionReasons'
  | 'productPlatformAffectingAttributes'
  | 'productRequiredAttributeCount'
  | 'productFilledRequiredAttributeCount'
  | 'productGroupMembers'
  | 'productCandidateGroups'
  | 'productListSourceItems'
  | 'previewProductAction'
  | 'setActiveSiteOfferCode'
  | 'addProductVariant'
  | 'updateProductAxes';

type NarrowEditorProp =
  | keyof ProductDetailEditorHostProps
  | keyof ProductOfferEditorProps
  | keyof ProductContentEditorProps
  | keyof ProductSizesEditorProps
  | keyof ProductInsightsEditorProps;
type RemainingDeadProp = Extract<NarrowEditorProp, DeadEditorProp>;
function assertNoDeadEditorProps<Value extends never>(_value?: Value): void {}
assertNoDeadEditorProps<RemainingDeadProp>();

const narrowInterfaceKeys = [
  'updateSiteOfferField' satisfies keyof ProductOfferEditorProps,
  'openCurrentProductGallery' satisfies keyof ProductContentEditorProps,
  'removeProductVariant' satisfies keyof ProductSizesEditorProps,
  'productInsightMetrics' satisfies keyof ProductInsightsEditorProps
];
assert.deepEqual(narrowInterfaceKeys, [
  'updateSiteOfferField',
  'openCurrentProductGallery',
  'removeProductVariant',
  'productInsightMetrics'
]);
