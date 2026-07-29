import { Tag, Typography } from 'antd';
import type { StoreSyncStore } from '../store-sync/types';

const { Text } = Typography;

export function storeConnectionStatusColor(connectionStatus?: string) {
  if (connectionStatus === '正常') {
    return 'success';
  }
  if (connectionStatus === '部分站点待补绑定') {
    return 'warning';
  }
  return 'default';
}

export function renderCompactStoreText(value?: string, fallback = '-', strong = false) {
  const textValue = value || fallback;
  if (!value) {
    return <Text style={{ color: '#94a3b8' }}>{fallback}</Text>;
  }
  return (
    <span
      className={`nuono-store-compact-text${strong ? ' nuono-store-compact-text-strong' : ''}`}
      title={textValue}
    >
      {textValue}
    </span>
  );
}

export function managerRoleMatches(manager: StoreSyncStore['managers'][number], roleKind: 'ops' | 'warehouse' | 'purchase') {
  const roleName = (manager.role || '').trim();
  if (roleKind === 'ops') {
    return roleName.includes('运营');
  }
  if (roleKind === 'warehouse') {
    return roleName.includes('仓管') || roleName.toUpperCase().includes('WAREHOUSE');
  }
  return roleName.includes('采购') || roleName.toUpperCase().includes('PURCHASE');
}

export function renderStoreManagers(managers: StoreSyncStore['managers'], roleKind: 'ops' | 'warehouse' | 'purchase') {
  const scopedManagers = managers.filter((manager) => managerRoleMatches(manager, roleKind));
  if (!scopedManagers.length) {
    return <Text style={{ color: '#94a3b8' }}>-</Text>;
  }
  const title = scopedManagers
    .map((manager) => `${manager.name}${manager.role === '运营主管' ? '（主管）' : ''}`)
    .join('、');

  const color =
    roleKind === 'warehouse'
      ? 'cyan'
      : roleKind === 'purchase'
        ? 'green'
        : 'blue';

  return (
    <div className="nuono-store-manager-tags" title={title}>
      {scopedManagers.map((manager) => (
        <Tag
          key={`${manager.id}-${manager.role}`}
          color={manager.role === '运营主管' ? 'purple' : color}
          className="nuono-store-manager-tag"
        >
          {manager.name}
          {manager.role === '运营主管' ? '（主管）' : ''}
        </Tag>
      ))}
    </div>
  );
}
