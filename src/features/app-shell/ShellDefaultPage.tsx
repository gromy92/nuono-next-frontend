import { ReloadOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { SystemStatePanel } from '../../shared/system-state/SystemStatePanel'

export function ShellDefaultPage() {
  return (
    <div className="nuono-shell-default-page" data-testid="shell-default-page">
      <SystemStatePanel
        variant="forbidden"
        title="暂时没有可用工作台"
        description="当前账号尚未分配功能菜单。完成角色或菜单授权后，可用功能会自动显示在左侧导航。"
        facts={[
          { label: '账号状态', value: '登录正常', tone: 'success' },
          { label: '菜单权限', value: '等待配置', tone: 'warning' },
          { label: '下一步', value: '联系管理员', tone: 'info' }
        ]}
        actions={
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={() => window.location.reload()}
          >
            重新检查权限
          </Button>
        }
      />
    </div>
  )
}
