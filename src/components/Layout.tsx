import React from 'react';

import { Link } from '@lsg/components';
import { useTranslation } from 'react-i18next';

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

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between bg-primary text-secondary px-8 py-4">
        <Link href="/">LOGO</Link>

        <nav className="flex items-center gap-4">
          <Link href="/">Home</Link>
          <Link href="/">Home</Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8">{children}</main>

      <footer className="flex flex-col items-center bg-primary text-secondary text-center px-8 py-4">
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
      </footer>
    </div>
  );
};

export default Layout;
