import React, { useMemo } from 'react';
import { Drawer, Grid, Layout, Menu, Button, theme } from 'antd';
import {
  BarsOutlined,
  LeftOutlined,
  LogoutOutlined,
  RightOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import {
  CanAccess,
  pickNotDeprecated,
  useActiveAuthProvider,
  useIsExistAuthentication,
  useLogout,
  useMenu,
  useTranslate,
  useWarnAboutChange,
} from '@refinedev/core';
import type { RefineThemedLayoutV2SiderProps } from '@refinedev/antd';
import { ThemedTitleV2, useThemedLayoutContext } from '@refinedev/antd';
import { useLink, useRouterContext, useRouterType, useTitle } from '@refinedev/core';
import './sider.css';

const floatingActionButtonStyles: React.CSSProperties = {
  borderStartStartRadius: 0,
  borderEndStartRadius: 0,
  position: 'fixed',
  top: 64,
  zIndex: 999,
};

const MENU_SECTIONS: { key: string; title: string }[] = [
  { key: 'geral', title: 'Geral' },
  { key: 'vendas', title: 'Vendas & Caixa' },
  { key: 'cadastros', title: 'Cadastros' },
];

export const AppSider = ({
  Title,
  render,
  meta,
  fixed,
  activeItemDisabled = false,
}: RefineThemedLayoutV2SiderProps) => {
  const { token } = theme.useToken();
  const { siderCollapsed, setSiderCollapsed, mobileSiderOpen, setMobileSiderOpen } =
    useThemedLayoutContext();
  const hasAuth = useIsExistAuthentication();
  const routerType = useRouterType();
  const LinkFromRouter = useLink();
  const { Link: LegacyLink } = useRouterContext();
  const { warnWhen, setWarnWhen } = useWarnAboutChange();
  const translate = useTranslate();
  const TitleFromContext = useTitle();
  const { menuItems, selectedKey } = useMenu({ meta });
  const breakpoint = Grid.useBreakpoint();
  const activeAuthProvider = useActiveAuthProvider();
  const { mutate: logout } = useLogout({
    v3LegacyAuthProviderCompatible: !!(activeAuthProvider?.isLegacy),
  });

  const isMobile = typeof breakpoint.lg === 'undefined' ? false : !breakpoint.lg;
  const RenderTitle = Title ?? TitleFromContext ?? ThemedTitleV2;
  const Link = routerType === 'legacy' ? LegacyLink : LinkFromRouter;

  const openKeys = useMemo(
    () =>
      menuItems
        .filter((item) => item.children.length > 0)
        .map((item) => item.key),
    [menuItems]
  );

  const renderTreeView = (
    items: (typeof menuItems)[number][],
    selected: string
  ): React.JSX.Element[] =>
    items.map((item) => {
      const { icon, label, route, key, name, children, meta: itemMeta, options } = item;

      if (children.length > 0) {
        return (
          <CanAccess
            key={item.key}
            resource={name}
            action="list"
            params={{ resource: item }}
          >
            <Menu.SubMenu key={item.key} icon={icon ?? <UnorderedListOutlined />} title={label}>
              {renderTreeView(children, selected)}
            </Menu.SubMenu>
          </CanAccess>
        );
      }

      const isSelected = key === selected;
      const isChild =
        pickNotDeprecated(itemMeta?.parent, options?.parent, item.parentName) !== undefined;
      const showIcon = !(isChild && children.length === 0);
      const linkStyle: React.CSSProperties =
        activeItemDisabled && isSelected ? { pointerEvents: 'none' } : {};

      return (
        <CanAccess key={item.key} resource={name} action="list" params={{ resource: item }}>
          <Menu.Item
            key={item.key}
            icon={icon ?? (showIcon && <UnorderedListOutlined />)}
            style={linkStyle}
          >
            <Link to={route ?? ''} style={linkStyle}>
              {isChild && <span className="sider-bullet">•</span>}
              {label}
            </Link>
          </Menu.Item>
        </CanAccess>
      );
    });

  const handleLogout = () => {
    if (warnWhen) {
      const confirmed = window.confirm(
        translate(
          'warnWhenUnsavedChanges',
          'Are you sure you want to leave? You have unsaved changes.'
        )
      );
      if (!confirmed) return;
      setWarnWhen(false);
    }
    logout();
  };

  const renderLogoutControl = (collapsedB: boolean) =>
    hasAuth && (
      <div className="sider-footer">
        {!collapsedB && <div className="sider-footer-title">CONTA</div>}
        <button
          type="button"
          className={`sider-logout-button${collapsedB ? ' collapsed' : ''}`}
          onClick={() => {
            setMobileSiderOpen(false);
            handleLogout();
          }}
        >
          <LogoutOutlined />
          {!collapsedB && (
            <span className="sider-logout-label">
              {translate('buttons.logout', 'Logout')}
            </span>
          )}
        </button>
      </div>
    );

  const renderSider = (collapsedB: boolean) => {
    if (render) {
      return render({
        items: renderTreeView(menuItems, selectedKey),
        logout: renderLogoutControl(siderCollapsed),
        dashboard: null,
        collapsed: siderCollapsed,
      });
    }
    if (collapsedB) {
      return <>{renderTreeView(menuItems, selectedKey)}</>;
    }
    return (
      <>
        {MENU_SECTIONS.map((section) => {
          const sectionItems = menuItems.filter(
            (item) => (item.meta as { section?: string })?.section === section.key
          );
          if (sectionItems.length === 0) return null;
          return (
            <Menu.ItemGroup key={section.key} title={section.title}>
              {renderTreeView(sectionItems, selectedKey)}
            </Menu.ItemGroup>
          );
        })}
      </>
    );
  };

  const renderMenu = (collapsedB: boolean) => (
    <Menu
      selectedKeys={selectedKey ? [selectedKey] : []}
      openKeys={collapsedB ? [] : openKeys}
      mode="inline"
      inlineCollapsed={collapsedB}
      style={{ paddingTop: '8px', border: 'none', minHeight: 0 }}
      onClick={() => setMobileSiderOpen(false)}
    >
      {renderSider(collapsedB)}
    </Menu>
  );

  const renderDrawerSider = () => (
    <>
      <Drawer
        open={mobileSiderOpen}
        onClose={() => setMobileSiderOpen(false)}
        placement="left"
        closable={false}
        width={200}
        styles={{ body: { padding: 0 } }}
        maskClosable
      >
        <Layout>
          <Layout.Sider
            className="app-sider"
            style={{ height: '100vh', backgroundColor: token.colorBgContainer }}
          >
            <div
              style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <div
                style={{
                  width: 200,
                  padding: '0 16px',
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  height: 64,
                  backgroundColor: token.colorBgElevated,
                }}
              >
                <RenderTitle collapsed={false} />
              </div>
              <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                {renderMenu(false)}
              </div>
              {renderLogoutControl(false)}
            </div>
          </Layout.Sider>
        </Layout>
      </Drawer>
      <Button
        style={floatingActionButtonStyles}
        size="large"
        onClick={() => setMobileSiderOpen(true)}
        icon={<BarsOutlined />}
      />
    </>
  );

  if (isMobile) {
    return renderDrawerSider();
  }

  const siderStyles: React.CSSProperties = {
    backgroundColor: token.colorBgContainer,
    borderRight: `1px solid ${token.colorBgElevated}`,
  };
  if (fixed) {
    siderStyles.position = 'fixed';
    siderStyles.top = 0;
    siderStyles.height = '100vh';
    siderStyles.zIndex = 999;
  }

  const renderClosingIcons = () => {
    const iconStyle = { color: token.colorPrimary };
    return siderCollapsed ? (
      <LeftOutlined {...iconStyle} />
    ) : (
      <RightOutlined {...iconStyle} />
    );
  };

  return (
    <>
      {fixed && (
        <div style={{ width: siderCollapsed ? 80 : 200, transition: 'all 0.2s' }} />
      )}
      <Layout.Sider
        className="app-sider"
        style={siderStyles}
        collapsible
        collapsed={siderCollapsed}
        onCollapse={(collapsed, type) => {
          if (type === 'clickTrigger') setSiderCollapsed(collapsed);
        }}
        collapsedWidth={80}
        breakpoint="lg"
        trigger={
          <Button
            type="text"
            style={{
              borderRadius: 0,
              height: '100%',
              width: '100%',
              backgroundColor: token.colorBgElevated,
            }}
          >
            {renderClosingIcons()}
          </Button>
        }
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              width: siderCollapsed ? 80 : 200,
              padding: siderCollapsed ? 0 : '0 16px',
              display: 'flex',
              justifyContent: siderCollapsed ? 'center' : 'flex-start',
              alignItems: 'center',
              height: 64,
              backgroundColor: token.colorBgElevated,
              fontSize: 14,
            }}
          >
            <RenderTitle collapsed={siderCollapsed} />
          </div>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflow: 'auto',
              width: '100%',
            }}
          >
            {renderMenu(siderCollapsed)}
          </div>
          {renderLogoutControl(siderCollapsed)}
        </div>
      </Layout.Sider>
    </>
  );
};
