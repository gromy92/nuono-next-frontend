import type { MessageInstance } from 'antd/es/message/interface';
import type {
  NoonImageAssetMetadata
} from '../product-image-profile/noonListingImageRequirements';
import type {
  ProductImageRoleAssignment
} from '../product-image-profile/productImageRole';

export type ProductImageManagerDrawerProps = {
  open: boolean;
  images: string[];
  imageRoleAssignments?: ProductImageRoleAssignment[];
  imageAssetMetadata?: NoonImageAssetMetadata[];
  onClose: () => void;
  onSave: (
    images: string[],
    imageRoleAssignments: ProductImageRoleAssignment[],
    imageAssetMetadata: NoonImageAssetMetadata[]
  ) => void;
  onUploadImage: (file: File) => Promise<string>;
  onImportRemoteImage?: (imageUrl: string) => Promise<string>;
  messageApi: MessageInstance;
  allowEmptyImages?: boolean;
};

export type ProductImageAutoAdaptFeedback = {
  imageUrl: string;
  content: string;
  type: 'info' | 'success' | 'warning' | 'error';
};
