export type ProductDetailedAttributeKind = 'text' | 'textarea' | 'select' | 'dimension';

export type ProductDetailedAttributeField = {
  code: string;
  label: string;
  labelAr?: string;
  labelZh?: string;
  kind: ProductDetailedAttributeKind;
  options?: ProductDetailedAttributeOption[];
  unitOptions?: string[];
  dictionarySource?: string;
  multiple?: boolean;
  maxLength?: number;
};

export type ProductDetailedAttributeOption = {
  value: string;
  en: string;
  ar?: string;
  zh?: string;
};

export type ProductDetailedAttributeGroup = {
  key: string;
  title: string;
  officialGroupNames: string[];
  fields: ProductDetailedAttributeField[];
};

export const PRODUCT_DETAILED_ATTRIBUTE_GROUPS: ProductDetailedAttributeGroup[] = [
  {
    key: 'product-detail',
    title: 'Product Detail Attributes（商品详情属性）',
    officialGroupNames: ['Product Detail', 'Product Detail Attributes'],
    fields: [
      {
        code: 'base_material',
        label: 'Base Material',
        kind: 'select',
        options: [
          { value: 'plastic', en: 'Plastic', ar: 'بلاستيك', zh: '塑料' },
          { value: 'abs', en: 'ABS', ar: 'ABS' },
          { value: 'cotton', en: 'Cotton', ar: 'قطن', zh: '棉' },
          { value: 'glass', en: 'Glass', ar: 'زجاج', zh: '玻璃' },
          { value: 'fabric', en: 'Fabric', ar: 'قماش', zh: '布料' },
          { value: 'pvc', en: 'PVC', ar: 'PVC' },
          { value: 'metal', en: 'Metal', ar: 'معدن', zh: '金属' },
          { value: 'ceramic', en: 'Ceramic', ar: 'سيراميك', zh: '陶瓷' },
          { value: 'wood', en: 'Wood', ar: 'خشب', zh: '木材' }
        ]
      },
      {
        code: 'care_instructions',
        label: 'Care Instructions',
        kind: 'select',
        options: [
          { value: 'machine_wash', en: 'Machine Wash', ar: 'غسيل في الغسالة', zh: '机洗' },
          { value: 'hand_wash', en: 'Hand Wash', ar: 'غسيل يدوي', zh: '手洗' },
          { value: 'spot_clean', en: 'Spot Clean', ar: 'تنظيف موضعي', zh: '局部清洁' },
          { value: 'wipe_clean', en: 'Wipe Clean', ar: 'ينظف بالمسح', zh: '擦拭清洁' },
          { value: 'dry_clean', en: 'Dry Clean', ar: 'تنظيف جاف', zh: '干洗' }
        ]
      },
      {
        code: 'colour_family',
        label: 'Colour',
        kind: 'select',
        options: [
          { value: 'black', en: 'Black', ar: 'أسود', zh: '黑色' },
          { value: 'white', en: 'White', ar: 'أبيض', zh: '白色' },
          { value: 'grey', en: 'Grey', ar: 'رمادي', zh: '灰色' },
          { value: 'blue', en: 'Blue', ar: 'أزرق', zh: '蓝色' },
          { value: 'green', en: 'Green', ar: 'أخضر', zh: '绿色' },
          { value: 'pink', en: 'Pink', ar: 'وردي', zh: '粉色' },
          { value: 'red', en: 'Red', ar: 'أحمر', zh: '红色' },
          { value: 'yellow', en: 'Yellow', ar: 'أصفر', zh: '黄色' },
          { value: 'multicolour', en: 'Multicolour', ar: 'متعدد الألوان', zh: '多色' }
        ]
      },
      { code: 'colour_name', label: 'Colour Name', kind: 'text' },
      {
        code: 'connection_type',
        label: 'Connection Type',
        kind: 'select',
        options: [
          { value: 'bluetooth', en: 'Bluetooth', ar: 'بلوتوث' },
          { value: 'wifi', en: 'Wi-Fi', ar: 'واي فاي' },
          { value: 'usb', en: 'USB', ar: 'USB' },
          { value: 'wired', en: 'Wired', ar: 'سلكي' },
          { value: 'wireless', en: 'Wireless', ar: 'لاسلكي' }
        ]
      },
      {
        code: 'control_method',
        label: 'Control Method',
        kind: 'select',
        options: [
          { value: 'touch', en: 'touch', ar: 'touch' },
          { value: 'remote', en: 'Remote', ar: 'جهاز تحكم عن بعد' },
          { value: 'button', en: 'Button', ar: 'زر' },
          { value: 'app', en: 'App', ar: 'تطبيق' },
          { value: 'voice', en: 'Voice', ar: 'صوت' }
        ]
      },
      {
        code: 'country_of_origin',
        label: 'Country of Origin',
        kind: 'select',
        options: [
          { value: 'china', en: 'China', ar: 'الصين' },
          { value: 'india', en: 'India', ar: 'الهند' },
          { value: 'united_arab_emirates', en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة' },
          { value: 'saudi_arabia', en: 'Saudi Arabia', ar: 'المملكة العربية السعودية' },
          { value: 'egypt', en: 'Egypt', ar: 'مصر' }
        ]
      },
      { code: 'hs_code', label: 'HS Code', kind: 'text' },
      {
        code: 'item_condition',
        label: 'Item Condition',
        kind: 'select',
        options: [
          { value: 'new', en: 'New', ar: 'جديد' },
          { value: 'renewed', en: 'Renewed', ar: 'مجدد' },
          { value: 'used', en: 'Used', ar: 'مستعمل' }
        ]
      },
      {
        code: 'lighting_technology',
        label: 'Lighting Technology',
        kind: 'select',
        options: [
          { value: 'led', en: 'LED', ar: 'LED' },
          { value: 'incandescent', en: 'Incandescent', ar: 'متوهج' },
          { value: 'fluorescent', en: 'Fluorescent', ar: 'فلورسنت' },
          { value: 'halogen', en: 'Halogen', ar: 'هالوجين' }
        ]
      },
      {
        code: 'material_finish',
        label: 'Finish',
        kind: 'select',
        options: [
          { value: 'matte', en: 'Matte', ar: 'مطفي', zh: '哑光' },
          { value: 'glossy', en: 'Glossy', ar: 'لامع', zh: '亮面' },
          { value: 'polished', en: 'Polished', ar: 'مصقول', zh: '抛光' },
          { value: 'painted', en: 'Painted', ar: 'مطلي', zh: '喷漆' }
        ]
      },
      { code: 'model_name', label: 'Model Name', kind: 'text' },
      { code: 'model_number', label: 'Model Number', kind: 'text' },
      { code: 'msrp_ae', label: 'MSRP AE', kind: 'text' },
      { code: 'msrp_eg', label: 'MSRP EG', kind: 'text' },
      { code: 'msrp_sa', label: 'MSRP SA', kind: 'text' },
      {
        code: 'occasion',
        label: 'Occasion',
        kind: 'select',
        options: [
          { value: 'sport', en: 'Sport', ar: 'رياضة' },
          { value: 'birthday', en: 'Birthday', ar: 'عيد ميلاد' },
          { value: 'wedding', en: 'Wedding', ar: 'زفاف' },
          { value: 'party', en: 'Party', ar: 'حفلة' },
          { value: 'everyday', en: 'Everyday', ar: 'يومي' }
        ]
      },
      {
        code: 'pattern',
        label: 'Pattern',
        kind: 'select',
        options: [
          { value: 'solid', en: 'Solid', ar: 'سادة' },
          { value: 'printed', en: 'Printed', ar: 'مطبوع' },
          { value: 'striped', en: 'Striped', ar: 'مخطط' },
          { value: 'plain', en: 'Plain', ar: 'عادي' }
        ]
      },
      { code: 'product_height', label: 'Product Height', kind: 'dimension' },
      { code: 'product_length', label: 'Product Length', kind: 'dimension' },
      { code: 'product_weight', label: 'Product Weight', kind: 'dimension' },
      { code: 'product_width_depth', label: 'Product Width', kind: 'dimension' },
      {
        code: 'secondary_material',
        label: 'Secondary Material',
        kind: 'select',
        options: [
          { value: 'plastic', en: 'Plastic', ar: 'بلاستيك', zh: '塑料' },
          { value: 'metal', en: 'Metal', ar: 'معدن', zh: '金属' },
          { value: 'glass', en: 'Glass', ar: 'زجاج', zh: '玻璃' },
          { value: 'wood', en: 'Wood', ar: 'خشب', zh: '木材' },
          { value: 'fabric', en: 'Fabric', ar: 'قماش', zh: '布料' }
        ]
      },
      { code: 'set_includes', label: 'Set Includes', kind: 'textarea' },
      {
        code: 'shape',
        label: 'Shape',
        kind: 'select',
        options: [
          { value: 'round', en: 'Round', ar: 'دائري' },
          { value: 'square', en: 'Square', ar: 'مربع' },
          { value: 'rectangle', en: 'Rectangle', ar: 'مستطيل' },
          { value: 'oval', en: 'Oval', ar: 'بيضاوي' },
          { value: 'irregular', en: 'Irregular', ar: 'غير منتظم' }
        ]
      },
      { code: 'whats_in_the_box', label: "What's In The Box", kind: 'text' }
    ]
  },
  {
    key: 'identifiers',
    title: 'Identifiers Attributes（标识属性）',
    officialGroupNames: ['SKU Identifiers', 'Identifiers Attributes'],
    fields: [{ code: 'mpn', label: 'MPN', kind: 'text' }]
  },
  {
    key: 'shipping',
    title: 'Shipping Attributes（物流属性）',
    officialGroupNames: ['Shipping', 'Shipping Attributes'],
    fields: [
      { code: 'shipping_height', label: 'Shipping Height', kind: 'dimension' },
      { code: 'shipping_length', label: 'Shipping Length', kind: 'dimension' },
      { code: 'shipping_weight', label: 'Shipping Weight', kind: 'dimension' },
      { code: 'shipping_width_depth', label: 'Shipping Width/Depth', kind: 'dimension' }
    ]
  },
  {
    key: 'finance',
    title: 'Finance Attributes（财务属性）',
    officialGroupNames: ['Finance related Attributes', 'Finance Attributes'],
    fields: [
      {
        code: 'vat_rate_ae',
        label: 'VAT Rate AE',
        kind: 'select',
        options: [
          { value: 'std', en: 'Std', ar: 'Std' },
          { value: 'zero', en: 'Zero', ar: 'Zero' },
          { value: 'exempt', en: 'Exempt', ar: 'Exempt' }
        ]
      },
      {
        code: 'vat_rate_eg',
        label: 'Vat Rate Egypt',
        kind: 'select',
        options: [
          { value: 'std', en: 'Std', ar: 'Std' },
          { value: 'zero', en: 'Zero', ar: 'Zero' },
          { value: 'exempt', en: 'Exempt', ar: 'Exempt' }
        ]
      },
      {
        code: 'vat_rate_sa',
        label: 'VAT Rate SA',
        kind: 'select',
        options: [
          { value: 'std', en: 'Std', ar: 'Std' },
          { value: 'zero', en: 'Zero', ar: 'Zero' },
          { value: 'exempt', en: 'Exempt', ar: 'Exempt' }
        ]
      }
    ]
  }
];

export const PRODUCT_DETAILED_ATTRIBUTE_VALUE_LABELS: Record<string, { en: string; ar?: string; zh?: string }> = {
  bluetooth: { en: 'Bluetooth', ar: 'بلوتوث' },
  machine_wash: { en: 'Machine Wash', ar: 'غسيل في الغسالة', zh: '机洗' },
  new: { en: 'New', ar: 'جديد' },
  pink: { en: 'Pink', ar: 'وردي', zh: '粉色' },
  plastic: { en: 'Plastic', ar: 'بلاستيك', zh: '塑料' },
  sport: { en: 'Sport', ar: 'رياضة' },
  std: { en: 'Std', ar: 'Std' },
  touch: { en: 'touch', ar: 'touch' }
};
