import type {
  ProductImageProfile,
  ProductImageProfileTabKey
} from './productImageProfileTypes';

export type ProductImageWorkflowFeedback = {
  error: (content: string) => void;
  success: (content: string) => void;
  warning: (content: string) => void;
};

export type ProductImageWorkflowConfirmModal = {
  confirm: (options: {
    cancelText: string;
    content: string;
    okText: string;
    onOk: () => void;
    title: string;
  }) => void;
};

export type ProductImageSuiteWorkflowOptions = {
  feedback: ProductImageWorkflowFeedback;
  modal: ProductImageWorkflowConfirmModal;
  onMissingProfile: (tab: ProductImageProfileTabKey) => void;
  patchSelectedProfile: (updater: (profile: ProductImageProfile) => ProductImageProfile) => void;
  persistProfile: (
    profile: ProductImageProfile,
    showSuccess?: boolean
  ) => Promise<ProductImageProfile | undefined>;
  replaceSelectedProfile: (currentId: string, nextProfile: ProductImageProfile) => void;
  requestOwnerId: number;
  selectedProfile?: ProductImageProfile;
  selectedSkinId?: number;
  storeCode: string;
  validSkinCount: number;
};
