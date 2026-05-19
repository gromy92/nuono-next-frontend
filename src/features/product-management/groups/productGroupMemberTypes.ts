export type ProductGroupMemberCardView = {
  key: string;
  skuParent: string;
  childSku?: string;
  brand?: string;
  title?: string;
  imageUrl?: string;
  axisLabel?: string;
  axisValue?: string;
  axisRows?: Array<{ code?: string; label: string; value?: string }>;
  current?: boolean;
};
