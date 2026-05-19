# E2E 测试说明

## 范围

当前 Playwright 测试覆盖角色/账号/系统设置迁移主链：

- 登录、退出、未登录拦截和无效路由不白屏
- 账号管理页面加载、搜索、新增账号必填校验
- 角色分配页面加载、搜索
- 店铺管理页签加载、绑定新店铺必填校验
- 组织架构、权限总览页签加载
- 系统角色页面加载、必填校验、可选创建并删除临时角色
- 系统菜单页面加载、搜索、必填校验、可选创建并删除临时菜单
- 账号/角色接口异常时页面不白屏

## 环境

复制模板后按本机端口调整：

```bash
cp .env.e2e.example .env.e2e
```

如果本地库已有真实 `role_id=1` 管理员测试账号，建议设置：

```env
E2E_USE_DEV_SESSION=false
E2E_ADMIN_USERNAME=<TEST_ADMIN_USERNAME>
E2E_ADMIN_PASSWORD=<TEST_ADMIN_PASSWORD>
```

如果数据库刚按老系统快照重建且还没有管理员测试账号，可临时使用 `E2E_USE_DEV_SESSION=true` 走本地 `?devSession=1` 验收。

## 命令

只读和表单校验：

```bash
pnpm e2e
```

允许创建并删除临时角色/菜单：

```bash
E2E_ALLOW_WRITE_TESTS=true pnpm e2e
```

调试模式：

```bash
pnpm e2e:headed
```

## 不默认自动化的写入

账号、费用记录、店铺绑定、额度修改、账号启停和重置密码目前不默认写入执行。这些操作没有完整 UI 删除能力或会影响共享数据，除非使用可丢弃测试库和清理脚本，否则不要放入常规回归。
