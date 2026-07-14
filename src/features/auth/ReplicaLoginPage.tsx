import { Alert, Button, Carousel, Checkbox, ConfigProvider, Form, Input, Space } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { useEffect, useMemo, useState } from 'react';
import { currentAppPathname, withPublicBasePath } from '../../runtimePaths';

type LoginFormValues = {
  accountNo: string;
  password: string;
};

type AuthView = 'login' | 'register' | 'reset-pwd';

type Props = {
  errorMessage?: string | null;
  form: FormInstance<LoginFormValues>;
  submitting: boolean;
  onInputChange?: () => void;
  onSubmit: () => void;
};

const LEGACY_LOGIN_PRIMARY = '#5E3CDE';

const carouselStyles = `
  .replica-login-dots {
    bottom: 20px !important;
  }
  .replica-login-dots li button {
    background: rgba(255, 255, 255, 0.6) !important;
    border-radius: 50% !important;
    width: 8px !important;
    height: 8px !important;
  }
  .replica-login-dots li.slick-active button {
    background: rgba(255, 255, 255, 1) !important;
  }
`;

function normalizeAuthView(pathname: string): AuthView {
  if (pathname === '/login/register') {
    return 'register';
  }
  if (pathname === '/login/reset-pwd') {
    return 'reset-pwd';
  }
  return 'login';
}

function navigateAuthView(nextPath: string) {
  if (typeof window === 'undefined') {
    return;
  }
  window.history.pushState({}, '', nextPath);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function HeaderLinks({ authView }: { authView: AuthView }) {
  if (authView === 'login') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: '#433F4F', fontSize: 14 }}>还没有账号？</span>
        <a
          href={withPublicBasePath('/login/register')}
          onClick={(event) => {
            event.preventDefault();
            navigateAuthView('/login/register');
          }}
          style={{ color: LEGACY_LOGIN_PRIMARY, fontSize: 14, fontWeight: 500, textDecoration: 'underline' }}
        >
          立即注册
        </a>
      </div>
    );
  }

  if (authView === 'reset-pwd') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: '#433F4F', fontSize: 14 }}>想起密码了？</span>
        <a
          href={withPublicBasePath('/login')}
          onClick={(event) => {
            event.preventDefault();
            navigateAuthView('/login');
          }}
          style={{ color: LEGACY_LOGIN_PRIMARY, fontSize: 14, fontWeight: 500, textDecoration: 'underline' }}
        >
          立即登录
        </a>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: '#433F4F', fontSize: 14 }}>已有账号？</span>
      <a
        href={withPublicBasePath('/login')}
        onClick={(event) => {
          event.preventDefault();
          navigateAuthView('/login');
        }}
        style={{ color: LEGACY_LOGIN_PRIMARY, fontSize: 14, fontWeight: 500, textDecoration: 'underline' }}
      >
        立即登录
      </a>
    </div>
  );
}

function HeaderTitle({ authView }: { authView: AuthView }) {
  const title = authView === 'login' ? '欢迎登陆' : authView === 'reset-pwd' ? '重置密码' : '欢迎注册';
  return (
    <div>
      <div style={{ color: '#433F4F', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>{title}</div>
      <HeaderLinks authView={authView} />
    </div>
  );
}

function LoginContent({
  errorMessage,
  form,
  onInputChange,
  submitting,
  onSubmit
}: {
  errorMessage?: string | null;
  form: FormInstance<LoginFormValues>;
  onInputChange?: () => void;
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <div style={{ marginTop: 100 }}>
      <Form
        data-testid="login-form"
        form={form}
        labelCol={{ span: 4 }}
        preserve={false}
        onFinish={onSubmit}
        onValuesChange={onInputChange}
      >
        {errorMessage ? (
          <Form.Item style={{ marginBottom: 16 }}>
            <Alert data-testid="login-error-alert" type="error" showIcon message={errorMessage} />
          </Form.Item>
        ) : null}
        <Form.Item label="用户名" name="accountNo" rules={[{ required: true, message: '请输入用户名' }]}>
          <Input data-testid="login-username-input" placeholder="请输入用户名" size="large" />
        </Form.Item>

        <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
          <Input.Password data-testid="login-password-input" autoComplete="password" placeholder="请输入密码" size="large" />
        </Form.Item>

        <div style={{ marginBottom: 25, display: 'flex', justifyContent: 'flex-end' }}>
          <a
            href={withPublicBasePath('/login/reset-pwd')}
            onClick={(event) => {
              event.preventDefault();
              navigateAuthView('/login/reset-pwd');
            }}
            style={{ color: LEGACY_LOGIN_PRIMARY, fontSize: 14, fontWeight: 500 }}
          >
            忘记密码？
          </a>
        </div>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button data-testid="login-submit-button" block htmlType="submit" shape="round" size="large" type="primary" loading={submitting}>
            登录
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

function RegisterContent() {
  return (
    <Form labelCol={{ span: 4 }} style={{ marginTop: 12 }}>
      <Form.Item label="用户名">
        <Input placeholder="请输入用户名" />
      </Form.Item>
      <Form.Item label="手机号">
        <Input placeholder="请输入手机号" />
      </Form.Item>
      <Form.Item label="密码">
        <Input.Password placeholder="请输入密码" />
      </Form.Item>
      <Form.Item label="邮箱">
        <Input placeholder="请输入邮箱" />
      </Form.Item>
      <Form.Item label="验证码">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Input placeholder="请输入验证码" />
          <Button type="primary">获取验证码</Button>
        </div>
      </Form.Item>
      <Space direction="vertical" size={18} style={{ width: '100%' }}>
        <Button block shape="round" size="large" type="primary" disabled>
          注册
        </Button>
        <Checkbox>
          勾选代表同意
          <span style={{ color: LEGACY_LOGIN_PRIMARY, marginInline: 4 }}>《隐私协议》</span>和
          <span style={{ color: LEGACY_LOGIN_PRIMARY, marginInlineStart: 4 }}>《服务协议》</span>
        </Checkbox>
      </Space>
    </Form>
  );
}

function ResetPwdContent() {
  return (
    <Form labelCol={{ span: 4 }} style={{ marginTop: 60 }}>
      <Form.Item label="手机号">
        <Input placeholder="请输入手机号" />
      </Form.Item>
      <Form.Item label="验证码">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Input placeholder="请输入验证码" />
          <Button type="primary">获取验证码</Button>
        </div>
      </Form.Item>
      <Form.Item label="密码">
        <Input.Password placeholder="请输入密码" />
      </Form.Item>
      <Form.Item label="确认密码">
        <Input.Password placeholder="请再次输入密码" />
      </Form.Item>
      <Button block shape="round" size="large" type="primary" disabled>
        确认
      </Button>
    </Form>
  );
}

export function ReplicaLoginPage({ errorMessage, form, submitting, onInputChange, onSubmit }: Props) {
  const [authView, setAuthView] = useState<AuthView>(() =>
    typeof window === 'undefined' ? 'login' : normalizeAuthView(currentAppPathname())
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (currentAppPathname() === '/') {
      window.history.replaceState({}, '', '/login');
      setAuthView('login');
    }

    const sync = () => setAuthView(normalizeAuthView(currentAppPathname()));
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const rightContent = useMemo(() => {
    if (authView === 'register') {
      return <RegisterContent />;
    }
    if (authView === 'reset-pwd') {
      return <ResetPwdContent />;
    }
    return (
      <LoginContent
        errorMessage={errorMessage}
        form={form}
        onInputChange={onInputChange}
        submitting={submitting}
        onSubmit={onSubmit}
      />
    );
  }, [authView, errorMessage, form, onInputChange, onSubmit, submitting]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: LEGACY_LOGIN_PRIMARY
        }
      }}
    >
      <div
        data-testid={`auth-page-${authView}`}
        style={{
          minHeight: '100vh',
          backgroundImage: `url(${withPublicBasePath('/auth/login-bg.png')})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#01010133'
          }}
        />

        <style>{carouselStyles}</style>

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
        >
          <div
            style={{
              width: 1300,
              maxWidth: '100%',
              display: 'flex',
              gap: 40,
              alignItems: 'stretch'
            }}
          >
            <div style={{ flex: '0 0 720px', minWidth: 0 }}>
              <Carousel
                autoplay
                effect="fade"
                dots={{ className: 'replica-login-dots' }}
                style={{ borderRadius: 24, overflow: 'hidden' }}
              >
                <div>
                  <div
                    style={{
                      height: 520,
                      backgroundImage: `url(${withPublicBasePath('/auth/banner-1.jpg')})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                </div>
              </Carousel>
            </div>

            <div
              style={{
                flex: '0 0 520px',
                padding: 32,
                background: 'rgba(251,249,255,0.88)',
                border: '1px solid #D5D2E0',
                borderRadius: 15,
                boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <HeaderTitle authView={authView} />
                <div className="nuono-shell-brand-lockup" aria-label="诺诺管家">
                  <span className="nuono-shell-brand-mark">诺</span>
                  <span className="nuono-shell-brand-text">诺诺管家</span>
                </div>
              </div>

              {rightContent}
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            zIndex: 3,
            bottom: 16,
            width: '100%',
            textAlign: 'center'
          }}
        >
          <a
            href="https://beian.miit.gov.cn"
            rel="noopener noreferrer"
            style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: 14 }}
            target="_blank"
          >
            浙ICP备2025165687号-1
          </a>
        </div>
      </div>
    </ConfigProvider>
  );
}
