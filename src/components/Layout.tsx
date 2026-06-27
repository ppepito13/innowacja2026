import React from 'react';

import { Link } from '@lsg/components';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider';
import ThemeToggle from './ThemeToggle';

interface LayoutProps {
  children: React.ReactNode;
}

const LANGUAGES = [
  {
    code: 'en',
    label: 'English',
  },
  {
    code: 'pl',
    label: 'Polski',
  },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { i18n, t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex flex-wrap items-center justify-between bg-brand text-secondary px-4 sm:px-8 py-3 sm:py-4 gap-3">
        <Link href="/">{t('common.brand')}</Link>

        <nav className="flex items-center gap-4">
          <Link href="#events">{t('layout.events')}</Link>

          {user && <Link href="/admin/account">{t('layout.account')}</Link>}
        </nav>
      </header>
      <main className="flex-1 flex flex-col w-full">{children}</main>
      <footer className="relative flex flex-col items-center bg-brand text-secondary text-center px-4 sm:px-8 py-4">
        <p>{t('layout.projectName')} 2026</p>

        <div className="flex flex-row gap-4">
          {LANGUAGES.map(({ code, label }) => (
            <Link
              key={code}
              onClick={() => i18n.changeLanguage(code)}
              className={i18n.language === code ? 'opacity-100' : 'opacity-50'}
            >
              {label}
            </Link>
          ))}
        </div>
        <ThemeToggle className="absolute bottom-4 right-4 sm:right-8" />
      </footer>
    </div>
  );
};

export default Layout;
