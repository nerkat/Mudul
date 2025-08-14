import { useEffect } from "react";
import { ThemeSwitch } from "./ThemeSwitch";
import { ModeSwitch } from "./ModeSwitch";
import { TreeNav } from "./TreeNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  // Initialize Preline components when the shell mounts
  useEffect(() => {
    const initPreline = async () => {
      await import('preline/preline');
      // @ts-ignore - Preline adds HSStaticMethods to window
      if (window.HSStaticMethods) {
        // @ts-ignore
        window.HSStaticMethods.autoInit();
      }
    };
    
    initPreline();
  }, []);

  return (
    <>
      {/* Navigation Toggle */}
      <div className="lg:hidden py-16 text-center">
        <button 
          type="button" 
          className="py-2 px-3 inline-flex justify-center items-center gap-x-2 text-start bg-gray-800 border border-gray-800 text-white text-sm font-medium rounded-lg shadow-2xs align-middle hover:bg-gray-950 focus:outline-hidden focus:bg-gray-900 dark:bg-white dark:text-neutral-800 dark:hover:bg-neutral-200 dark:focus:bg-neutral-200" 
          aria-haspopup="dialog" 
          aria-expanded="false" 
          aria-controls="hs-sidebar-content-push-to-mini-sidebar" 
          aria-label="Toggle navigation" 
          data-hs-overlay="#hs-sidebar-content-push-to-mini-sidebar"
        >
          Open
        </button>
      </div>

      {/* Sidebar */}
      <div 
        id="hs-sidebar-content-push-to-mini-sidebar" 
        className="hs-overlay [--auto-close:lg] hs-overlay-minified:w-13 lg:block lg:translate-x-0 lg:end-auto lg:bottom-0 w-64 hs-overlay-open:translate-x-0 -translate-x-full transition-all duration-300 transform h-full hidden overflow-x-hidden fixed top-0 start-0 bottom-0 z-60 bg-white border-e border-gray-200 dark:bg-neutral-800 dark:border-neutral-700" 
        role="dialog" 
        tabIndex={-1} 
        aria-label="Sidebar"
      >
        <div className="relative flex flex-col h-full max-h-full">
          {/* Header */}
          <header className="py-4 px-2 flex justify-between items-center gap-x-2">
            <div 
              className="flex-none font-semibold text-xl text-black focus:outline-hidden focus:opacity-80 dark:text-white hs-overlay-minified:hidden"
              aria-label="Brand"
            >
              Mudul
            </div>

            <div className="lg:hidden">
              {/* Close Button */}
              <button 
                type="button" 
                className="flex justify-center items-center gap-x-3 size-6 bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-100 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 dark:hover:text-neutral-200 dark:focus:text-neutral-200" 
                data-hs-overlay="#hs-sidebar-content-push-to-mini-sidebar"
              >
                <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
                <span className="sr-only">Close</span>
              </button>
            </div>

            <div className="hidden lg:block">
              {/* Toggle Button */}
              <button 
                type="button" 
                className="flex justify-center items-center flex-none gap-x-3 size-9 text-sm text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 dark:hover:text-neutral-200 dark:focus:text-neutral-200" 
                aria-haspopup="dialog" 
                aria-expanded="false" 
                aria-controls="hs-sidebar-content-push-to-mini-sidebar" 
                aria-label="Minify navigation" 
                data-hs-overlay-minifier="#hs-sidebar-content-push-to-mini-sidebar"
              >
                <svg className="hidden hs-overlay-minified:block shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                  <path d="M15 3v18"></path>
                  <path d="m8 9 3 3-3 3"></path>
                </svg>
                <svg className="hs-overlay-minified:hidden shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                  <path d="M15 3v18"></path>
                  <path d="m10 15-3-3 3-3"></path>
                </svg>
                <span className="sr-only">Navigation Toggle</span>
              </button>
            </div>
          </header>

          {/* Body */}
          <nav className="h-full overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-track]:bg-neutral-700 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
            <div className="pb-0 px-2 w-full flex flex-col flex-wrap">
              <TreeNav />
            </div>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-gray-50 transition-all duration-300 lg:ps-64 dark:bg-neutral-900">
        {/* Top header */}
        <header className="sticky top-0 inset-x-0 flex flex-wrap md:justify-start md:flex-nowrap z-50 w-full bg-white border-b text-sm py-2.5 lg:ps-[260px] dark:bg-neutral-800 dark:border-neutral-700">
          <nav className="px-4 sm:px-6 flex basis-full items-center w-full mx-auto">
            <div className="me-5 lg:me-0 lg:hidden">
              {/* Logo */}
              <div className="flex-none rounded-md text-xl inline-block font-semibold focus:outline-none focus:opacity-80" aria-label="Preline">
                Mudul
              </div>
            </div>

            <div className="w-full flex items-center justify-end ms-auto md:justify-between gap-x-1 md:gap-x-3">
              <div className="hidden md:block">
                {/* Search */}
              </div>

              <div className="flex flex-row items-center justify-end gap-1">
                <ModeSwitch />
                <ThemeSwitch />
              </div>
            </div>
          </nav>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {children}
        </main>
      </div>
    </>
  );
}