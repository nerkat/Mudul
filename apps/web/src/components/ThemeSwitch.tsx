import { useTheme } from "../theme/hooks";
import { useEffect } from "react";

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  
  // Initialize Preline theme functionality
  useEffect(() => {
    const initThemeSwitch = async () => {
      await import('preline/preline');
      // @ts-ignore - Preline adds HSStaticMethods to window
      if (window.HSStaticMethods) {
        // @ts-ignore
        window.HSStaticMethods.autoInit();
      }
    };
    
    initThemeSwitch();
  }, []);

  // Handle theme changes to ensure Preline data attributes are correct
  useEffect(() => {
    const html = document.documentElement;
    
    if (theme === 'dark') {
      html.classList.add('dark');
      html.setAttribute('data-hs-theme-appearance', 'dark');
    } else if (theme === 'light') {
      html.classList.remove('dark');
      html.setAttribute('data-hs-theme-appearance', 'light');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        html.classList.add('dark');
        html.setAttribute('data-hs-theme-appearance', 'dark');
      } else {
        html.classList.remove('dark');
        html.setAttribute('data-hs-theme-appearance', 'light');
      }
    }
  }, [theme]);
  
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (theme === 'dark') {
      return (
        <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
        </svg>
      );
    } else if (theme === 'light') {
      return (
        <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2"></path>
          <path d="M12 20v2"></path>
          <path d="m4.93 4.93 1.41 1.41"></path>
          <path d="m17.66 17.66 1.41 1.41"></path>
          <path d="M2 12h2"></path>
          <path d="M20 12h2"></path>
          <path d="m6.34 17.66-1.41 1.41"></path>
          <path d="m19.07 4.93-1.41 1.41"></path>
        </svg>
      );
    } else {
      return (
        <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    }
  };

  const getLabel = () => {
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  };
  
  return (
    <button 
      type="button" 
      className="flex items-center gap-x-2 py-2 px-3 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-800 hover:bg-gray-200 focus:outline-none focus:bg-gray-200 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
      onClick={toggleTheme}
      title={`Current theme: ${theme}. Click to cycle.`}
    >
      {getIcon()}
      <span className="hs-overlay-minified:hidden">{getLabel()}</span>
    </button>
  );
}