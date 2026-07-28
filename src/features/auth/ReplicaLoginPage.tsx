import { Carousel, ConfigProvider } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { useEffect, useMemo, useState } from 'react';
import { currentAppPathname, withPublicBasePath } from '../../runtimePaths';
import {
  LEGACY_LOGIN_PRIMARY,
  normalizeAuthView,
  ReplicaAuthHeader,
  ReplicaLoginContent,
  ReplicaRegisterContent,
  ReplicaResetPwdContent,
  type AuthView,
  type LoginFormValues
} from './ReplicaAuthContent';

type Props = {
  errorMessage?: string | null;
  form: FormInstance<LoginFormValues>;
  submitting: boolean;
  onInputChange?: () => void;
  onSubmit: () => void;
};

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
      return <ReplicaRegisterContent />;
    }
    if (authView === 'reset-pwd') {
      return <ReplicaResetPwdContent />;
    }
    return (
      <ReplicaLoginContent
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
                <ReplicaAuthHeader authView={authView} />
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
