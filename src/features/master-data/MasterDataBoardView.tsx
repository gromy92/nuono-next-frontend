import { Card, Space, Spin, Typography } from 'antd';
import { MasterDataPaymentModals } from './MasterDataPaymentModals';
import { MasterDataRoleMenuModals } from './MasterDataRoleMenuModals';
import { MasterDataStoreQuotaModals } from './MasterDataStoreQuotaModals';
import { MasterDataSystemModes } from './MasterDataSystemModes';
import { MasterDataUserDetailModal } from './MasterDataUserDetailModal';
import { MasterDataUserEditorModals } from './MasterDataUserEditorModals';
import { MasterDataUserModes } from './MasterDataUserModes';
import type { MasterDataBoardModel } from './MasterDataBoard';

const { Text } = Typography;

export function MasterDataBoardView({ model }: { model: MasterDataBoardModel }) {
  const { mode, loading, panelStyle } = model;
  if (loading) {
    return (
      <Card data-testid={`master-data-loading-${mode}`} bordered={false} style={panelStyle}>
        <Space size={12}>
          <Spin size="small" />
          <Text>正在读取主数据管理页...</Text>
        </Space>
      </Card>
    );
  }
  return (
    <Space data-testid={`master-data-board-${mode}`} direction="vertical" size={16} style={{ width: '100%' }}>
      <MasterDataUserModes model={model.userModes} />
      <MasterDataSystemModes model={model.systemModes} />
      <MasterDataUserDetailModal model={model.userDetailModal} />
      <MasterDataUserEditorModals model={model.userEditorModals} />
      <MasterDataStoreQuotaModals model={model.storeQuotaModals} />
      <MasterDataPaymentModals model={model.paymentModals} />
      <MasterDataRoleMenuModals model={model.roleMenuModals} />
    </Space>
  );
}
