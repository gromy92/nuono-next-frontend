export type ProductVariantSpecLogisticsValue =
  | 'unknown'
  | 'none'
  | 'battery'
  | 'magnetic'
  | 'battery_and_magnetic'
  | 'liquid'
  | 'powder'
  | 'liquid_and_powder';

export type ProductVariantSpecSourceType = 'ali1688' | 'warehouse' | 'noon_official';

export type ProductVariantSpecCartonSourceType =
  | 'none'
  | 'factory_carton'
  | 'warehouse_measured'
  | 'derived_from_warehouse';

export type ProductVariantSpecPayload = {
  storeCode?: string;
  skuParent?: string;
  currentZCode?: string;
  title?: string;
  imageUrl?: string;
  variantId?: number;
  partnerSku?: string;
  childSku?: string;
  sizeEn?: string;
  sizeAr?: string;
  effectiveSourceId?: number;
  effectiveSourceType?: ProductVariantSpecSourceType | string;
  productLengthCm?: number;
  productWidthCm?: number;
  productHeightCm?: number;
  productWeightG?: number;
  cartonLengthCm?: number;
  cartonWidthCm?: number;
  cartonHeightCm?: number;
  cartonWeightKg?: number;
  cartonQuantity?: number;
  cartonSourceType?: ProductVariantSpecCartonSourceType | string;
  batteryMagneticType?: 'unknown' | 'none' | 'battery' | 'magnetic' | 'battery_and_magnetic';
  liquidPowderType?: 'unknown' | 'none' | 'liquid' | 'powder' | 'liquid_and_powder';
  completenessStatus?: string;
  missingFields?: string[];
  sources?: ProductVariantSpecSourcePayload[];
  logisticsProfile?: ProductLogisticsProfilePayload;
  sourceType?: string;
  confirmedAt?: string;
  confirmedBy?: number;
  createdBy?: number;
  updatedBy?: number;
  gmtCreate?: string;
  gmtUpdated?: string;
  isDeleted?: boolean;
};

export type ProductVariantSpecSourcePayload = {
  sourceId?: number;
  variantId?: number;
  sourceType?: ProductVariantSpecSourceType | string;
  productLengthCm?: number;
  productWidthCm?: number;
  productHeightCm?: number;
  productWeightG?: number;
  cartonLengthCm?: number;
  cartonWidthCm?: number;
  cartonHeightCm?: number;
  cartonWeightKg?: number;
  cartonQuantity?: number;
  cartonSourceType?: ProductVariantSpecCartonSourceType | string;
  batteryMagneticType?: 'unknown' | 'none' | 'battery' | 'magnetic' | 'battery_and_magnetic';
  liquidPowderType?: 'unknown' | 'none' | 'liquid' | 'powder' | 'liquid_and_powder';
  sourceRecordedAt?: string;
  confirmedAt?: string;
  confirmedBy?: number;
  updatedBy?: number;
  gmtUpdated?: string;
};

export type ProductVariantSpecListPayload = {
  ready: boolean;
  source?: string;
  message?: string;
  ownerUserId?: number;
  storeCode?: string;
  skuParent?: string;
  currentZCode?: string;
  partnerSku?: string;
  warnings?: string[];
  items: ProductVariantSpecPayload[];
};

export type ProductVariantSpecOverviewPayload = {
  ready: boolean;
  source?: string;
  message?: string;
  ownerUserId?: number;
  storeCode?: string;
  warnings?: string[];
  items: ProductVariantSpecPayload[];
};

export type ProductVariantSpecDetailPayload = {
  ready: boolean;
  ownerUserId?: number;
  storeCode?: string;
  variantId?: number;
  partnerSku?: string;
  childSku?: string;
  skuParent?: string;
  currentZCode?: string;
  title?: string;
  imageUrl?: string;
  effectiveSourceId?: number;
  effectiveSourceType?: ProductVariantSpecSourceType | string;
  effectiveSpec?: ProductVariantSpecPayload;
  sources?: ProductVariantSpecSourcePayload[];
  warnings?: string[];
};

export type ProductVariantSpecSaveRequest = ProductVariantSpecPayload & {
  ownerUserId?: number;
  storeCode: string;
  skuParent?: string;
  currentZCode?: string;
  partnerSku?: string;
};

export type ProductVariantSpecSourceSaveRequest = ProductVariantSpecSourcePayload & {
  ownerUserId?: number;
  storeCode: string;
  variantId?: number;
  partnerSku?: string;
  skuParent?: string;
  currentZCode?: string;
  sourceType: ProductVariantSpecSourceType;
};

export type ProductVariantSpecEffectiveSourceRequest = {
  ownerUserId?: number;
  storeCode: string;
  variantId?: number;
  partnerSku?: string;
  skuParent?: string;
  currentZCode?: string;
  sourceId: number;
};

export type ProductLogisticsProfilePayload = {
  profileId?: number;
  storeCode?: string;
  skuParent?: string;
  currentZCode?: string;
  title?: string;
  imageUrl?: string;
  variantId?: number;
  partnerSku?: string;
  childSku?: string;
  sizeEn?: string;
  sizeAr?: string;
  profileStatus?: 'needs_review' | 'confirmed' | string;
  batteryElectricType?: 'unknown' | 'none' | 'battery_or_electric' | string;
  batteryType?: 'unknown' | 'none' | 'battery_equipment' | string;
  magneticType?: 'unknown' | 'none' | 'magnetic' | string;
  liquidType?: 'unknown' | 'none' | 'liquid' | string;
  powderType?: 'unknown' | 'none' | 'powder' | string;
  liquidPowderType?: 'unknown' | 'none' | 'liquid' | 'powder' | 'liquid_and_powder' | string;
  electricType?: 'unknown' | 'none' | 'battery_equipment' | 'electric_equipment_review' | string;
  plugType?: 'unknown' | 'none' | 'none_or_usb_review' | 'plug_required_review' | string;
  voltageCompatibleType?: 'unknown' | 'none' | string;
  madeInChinaLabelStatus?: string;
  msdsStatus?: string;
  seaTransportReportStatus?: string;
  brandRiskType?: string;
  foodContactType?: string;
  medicalType?: string;
  cosmeticType?: string;
  wirelessCameraGpsType?: string;
  laserType?: string;
  bladeWeaponType?: string;
  culturalRestrictionType?: string;
  woodenMaterialType?: string;
  sensitiveTagsJson?: string;
  prohibitedTagsJson?: string;
  manualConfirmRequired?: boolean;
  confirmedAt?: string;
  confirmedBy?: number;
  notes?: string;
  gmtUpdated?: string;
};

export type ProductLogisticsProfileListPayload = {
  ready: boolean;
  ownerUserId?: number;
  storeCode?: string;
  skuParent?: string;
  currentZCode?: string;
  partnerSku?: string;
  items: ProductLogisticsProfilePayload[];
};

export type ProductLogisticsProfileSaveRequest = ProductLogisticsProfilePayload & {
  ownerUserId?: number;
  storeCode: string;
  variantId?: number;
  partnerSku?: string;
  currentZCode?: string;
};
