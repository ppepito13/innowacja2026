import React from "react";

import { Link } from "@lsg/components";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between bg-primary text-secondary px-8 py-4">
        <Link href="/">LOGO</Link>

        <nav className="flex items-center gap-4">
          <Link href="/">Home</Link>
          <Link href="/">Home</Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        {children}
      </main>

      <footer className="bg-primary text-secondary text-center px-8 py-4">
        <p>Projekt Innowacja 2026</p>
      </footer>
    </div>
  );
};

export default Layout;
