import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useHistory } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider';

import './AdminLayout.css';

import { ReactComponent as CalendarIcon } from '../assets/calendar-icon.svg';
import { ReactComponent as QrCodeIcon } from '../assets/qrcode-icon.svg';
import { ReactComponent as UsersIcon } from '../assets/users-icon.svg';
import { ReactComponent as SettingsIcon } from '../assets/settings-icon.svg';
import { ReactComponent as LogoutIcon } from '../assets/logout-icon.svg';
import { ReactComponent as ChevronLeftIcon } from '../assets/chevron-left-icon.svg';
import { ReactComponent as ChevronRightIcon } from '../assets/chevron-right-icon.svg';
import { ReactComponent as HomeIcon } from '../assets/home-icon.svg';

interface NavItem {
  icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  labelKey: string;
  path: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { icon: CalendarIcon, labelKey: 'nav.events', path: '/admin' },
  { icon: QrCodeIcon, labelKey: 'nav.checkIn', path: '/admin/check-in', adminOnly: true },
  { icon: UsersIcon, labelKey: 'nav.users', path: '/admin/users', adminOnly: true },
  { icon: SettingsIcon, labelKey: 'nav.account', path: '/admin/account' },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const history = useHistory();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (item: NavItem): boolean => {
    const p = location.pathname;
    if (item.path === '/admin') {
      return p === '/admin' || p.startsWith('/admin/events');
    }
    return p === item.path || p.startsWith(item.path + '/');
  };

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === 'Admin'
  );

  const handleLogout = async () => {
    await logout();
    history.push('/login');
  };

  const handleGoHome = () => {
    history.push('/');
  };

  const displayName = user?.fullName || user?.username || '';
  const collapsedClass = collapsed ? 'collapsed' : 'expanded';

  return (
    <div className="admin-layout-container">
      {/* ── SIDEBAR ── */}
      <aside className={`admin-sidebar admin-sidebar-${collapsedClass}`}>
        
        {/* Brand */}
        <div className={`admin-brand-section ${collapsedClass}`}>
          <div className="admin-brand-logo">
            <span className="admin-brand-logo-text">CE</span>
          </div>
          {!collapsed && (
            <div className="admin-brand-text-container">
              <div className="admin-brand-title">{t('nav.brand')}</div>
              <div className="admin-brand-subtitle">{t('nav.brandSub')}</div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="admin-nav-section">
          {visibleItems.map((item) => {
            const active = isActive(item);
            const activeClass = active ? 'admin-nav-item-active' : 'admin-nav-item-inactive';
            const IconComponent = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => history.push(item.path)}
                title={collapsed ? t(item.labelKey) : undefined}
                className={`admin-nav-item ${collapsedClass} ${activeClass}`}
              >
                <div className="admin-icon-container">
                  <IconComponent width="18" height="18" />
                </div>
                {!collapsed && <span>{t(item.labelKey)}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="admin-bottom-section">
          <div className="admin-action-buttons">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className={`admin-action-item admin-minimize-item ${collapsedClass}`}
            >
              <div className="admin-icon-container">
                {collapsed ? <ChevronRightIcon width="16" height="16" /> : <ChevronLeftIcon width="16" height="16" />}
              </div>
              {!collapsed && <span>{t('nav.minimize')}</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ── CONTENT WRAPPER ── */}
      <div className="admin-content-wrapper">
        
        {/* TOP BAR */}
        <header className="admin-topbar">
          <div className="admin-topbar-content">
            <div className="admin-welcome-text">
              <span className="admin-welcome-prefix">Welcome,</span> <span className="admin-welcome-name">{displayName}!</span>
            </div>
            <div className="admin-topbar-buttons">
              <button onClick={handleGoHome} className="admin-topbar-btn">
                <HomeIcon width="16" height="16" />
                Homepage
              </button>
              <button onClick={handleLogout} className="admin-topbar-btn">
                <LogoutIcon width="16" height="16" />
                Log out
              </button>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="admin-main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
