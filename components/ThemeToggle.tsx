/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from "react";
import { SunIcon, MoonIcon } from "./Icons";

type Theme = "light" | "dark";

interface ThemeToggleProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, setTheme }) => {
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleTheme}
      className="hidden sm:flex items-center justify-center p-2 rounded-full bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === "light" ? <MoonIcon /> : <SunIcon />}
    </button>
  );
};

export default ThemeToggle;