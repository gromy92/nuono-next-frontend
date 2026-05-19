import type { CSSProperties, ReactNode } from 'react';

type FormToolbarLayoutProps = {
  title?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
  style?: CSSProperties;
  titleStyle?: CSSProperties;
  fieldsStyle?: CSSProperties;
  actionsStyle?: CSSProperties;
};

export function FormToolbarLayout({
  title,
  children,
  actions,
  className,
  style,
  titleStyle,
  fieldsStyle,
  actionsStyle
}: FormToolbarLayoutProps) {
  const classNames = ['nuono-form-toolbar', className].filter(Boolean).join(' ');

  return (
    <div className={classNames} style={style}>
      {title ? (
        <div className="nuono-form-toolbar-title" style={titleStyle}>
          {title}
        </div>
      ) : null}
      {children ? (
        <div className="nuono-form-toolbar-fields" style={fieldsStyle}>
          {children}
        </div>
      ) : null}
      {actions ? (
        <div className="nuono-form-toolbar-actions" style={actionsStyle}>
          {actions}
        </div>
      ) : null}
    </div>
  );
}
