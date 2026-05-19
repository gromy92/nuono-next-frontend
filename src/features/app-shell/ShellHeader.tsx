import { DownOutlined } from '@ant-design/icons';
import { Button, Dropdown, Layout, Segmented, Space, Tag, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { GlobalStoreSwitch } from '../auth/GlobalStoreSwitch';
import type { AuthRoleView, AuthSession } from '../auth/session';
import { activeRoleView, canSwitchBossRoleView } from './WorkspaceRouting';
import { shellRoleAvatarText, shellRoleColorMap, shellRoleDisplayName } from './shellHeaderRole';
import {
  shellHeaderChevronStyle,
  shellHeaderMenuMarkStyle,
  shellHeaderPathLabelStyle,
  shellHeaderRoleTagStyle,
  shellHeaderStyle,
  shellHeaderTitleAreaStyle,
  shellHeaderUserButtonStyle,
  shellHeaderUserNameStyle
} from './shellHeaderStyles';

const { Header } = Layout;
const { Text } = Typography;

type ShellHeaderProps = {
  activeMenuPathLabel?: string | null;
  session: AuthSession;
  userDropdownItems: MenuProps['items'];
  onRoleViewChange: (value: AuthRoleView) => void;
  onSessionStoreChange: (nextSession: AuthSession) => void;
  onUserDropdownClick: NonNullable<MenuProps['onClick']>;
};

export function ShellHeader({
  activeMenuPathLabel,
  session,
  userDropdownItems,
  onRoleViewChange,
  onSessionStoreChange,
  onUserDropdownClick
}: ShellHeaderProps) {
  const roleName = shellRoleDisplayName(session);

  return (
    <Header style={shellHeaderStyle}>
      <div style={shellHeaderTitleAreaStyle}>
        <span style={shellHeaderMenuMarkStyle}>≡</span>
        {activeMenuPathLabel ? (
          <div style={shellHeaderPathLabelStyle}>
            {activeMenuPathLabel}
          </div>
        ) : null}
      </div>
      <Space size={14}>
        {canSwitchBossRoleView(session) ? (
          <Segmented
            data-testid="role-view-switch"
            size="small"
            value={activeRoleView(session)}
            options={[
              { label: '老板视角', value: 'boss' },
              { label: '运营视角', value: 'operator' }
            ]}
            onChange={(value) => onRoleViewChange(value as AuthRoleView)}
          />
        ) : null}
        <GlobalStoreSwitch session={session} onChange={onSessionStoreChange} />
        <Dropdown menu={{ items: userDropdownItems, onClick: onUserDropdownClick }} placement="bottomRight" trigger={['click']}>
          <Button
            data-testid="user-avatar-menu-button"
            type="text"
            style={shellHeaderUserButtonStyle}
          >
            <Tag
              bordered={false}
              color={shellRoleColorMap[roleName] || '#7c5cff'}
              style={shellHeaderRoleTagStyle}
            >
              {shellRoleAvatarText(session)}
            </Tag>
            <Text style={shellHeaderUserNameStyle} ellipsis>
              {session.realName || session.accountNo}
            </Text>
            <DownOutlined style={shellHeaderChevronStyle} />
          </Button>
        </Dropdown>
      </Space>
    </Header>
  );
}
