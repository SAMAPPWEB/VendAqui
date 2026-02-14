/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from "react";

interface MainLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  headerActions?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  leftPanel,
  rightPanel,
  headerActions,
}) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 p-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--brand-text)]">
            GenType
          </h1>
        </div>
        {headerActions && <div>{headerActions}</div>}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto">
          {/* Left Panel */}
          <aside className="w-full lg:w-[40vw] xl:w-[35vw] p-6 relative z-30">
            {leftPanel}
          </aside>

          {/* Right Panel */}
          <section className="w-full lg:w-[60vw] xl:w-[65vw] p-6 lg:pl-0 lg:pr-6 lg:pt-8 relative z-10">
            {rightPanel}
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="p-6 text-[var(--text-secondary)] text-sm flex-shrink-0 border-t border-[var(--border-secondary)]">
        <p className="leading-tight text-center">
          Disclaimer: AI outputs may sometimes be offensive or inaccurate
        </p>
      </footer>
    </div>
  );
};

export default MainLayout;