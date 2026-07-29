import type { ProductDetailedAttributeKind } from '../product-domain/productDetailedAttributeCatalog';

export const VALID_FIELD_KINDS = new Set<ProductDetailedAttributeKind>([
  'text',
  'textarea',
  'select',
  'dimension'
]);

export const OFFER_ONLY_ATTRIBUTE_CODES = new Set(['barcode', 'barcodes', 'ean', 'gtin', 'upc']);
export const DUPLICATE_CLASSIFICATION_GROUP_KEYS = new Set(['classification', 'classfication']);

export const HIDDEN_SELLER_ATTRIBUTE_CODES = new Set([
  'external_qc_rejection_reason_fatal',
  'external_qc_rejection_reason_fatal_common',
  'id_partner',
  'brand',
  'fulltype',
  'product_fulltype',
  'number_of_pieces',
  'pending_virtual_attributes',
  'grade'
]);

export const DUPLICATE_BASIC_CONTENT_CODES = new Set([
  'product_title',
  'full_product_title',
  'long_description',
  'short_description',
  'description'
]);

export const ATTRIBUTE_UI_META: Record<
  string,
  { labelZh?: string; maxLength?: number; multiple?: boolean }
> = {
  base_material: { labelZh: '基础材质' },
  care_instructions: { labelZh: '护理说明' },
  colour_family: { labelZh: '颜色' },
  colour_name: { labelZh: '颜色名称' },
  connection_type: { labelZh: '连接类型' },
  control_method: { labelZh: '控制方式', multiple: true },
  country_of_origin: { labelZh: '原产国' },
  hs_code: { labelZh: '海关编码' },
  item_condition: { labelZh: '商品成色' },
  lighting_technology: { labelZh: '照明技术' },
  material_finish: { labelZh: '表面工艺' },
  model_name: { labelZh: '型号名称' },
  model_number: { labelZh: '型号' },
  occasion: { labelZh: '适用场景' },
  pattern: { labelZh: '图案' },
  product_height: { labelZh: '商品高度' },
  product_length: { labelZh: '商品长度' },
  product_weight: { labelZh: '商品重量' },
  product_width_depth: { labelZh: '商品宽度/深度' },
  secondary_material: { labelZh: '辅材' },
  set_includes: { labelZh: '包含物', maxLength: 4000 },
  shape: { labelZh: '形状' },
  whats_in_the_box: { labelZh: '包装清单' },
  mpn: { labelZh: '制造商零件号' },
  shipping_height: { labelZh: '包装高度' },
  shipping_length: { labelZh: '包装长度' },
  shipping_weight: { labelZh: '包装重量' },
  shipping_width_depth: { labelZh: '包装宽度/深度' },
  vat_rate_ae: { labelZh: '阿联酋 VAT 税率' },
  vat_rate_eg: { labelZh: '埃及 VAT 税率' },
  vat_rate_sa: { labelZh: '沙特 VAT 税率' }
};
