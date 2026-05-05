import React from "react";

import { Link } from "@lsg/components";

import "./Layout.css";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <header className="layout_header">
        <Link href="/">LOGO</Link>

        <nav className="layout_nav">
          <Link href="/">Home</Link>
          <Link href="/">Home</Link>
        </nav>
      </header>

      <main className="layout_content">{children}</main>

      <footer className="layout_footer">
        <p>Projekt Innowacja 2026</p>
      </footer>
    </div>
  );
};

export default Layout;
