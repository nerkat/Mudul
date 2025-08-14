import { useLocation } from "react-router-dom";
import { useNavTree } from "./useNavTree";
import { SidebarItem } from "./SidebarItem";
import { useEffect, useRef } from "react";

export function Sidebar({ org }: { org: string }) {
  const loc = useLocation();
  const path = decodeURIComponent(loc.pathname); // "/acme/..."
  const { chain, children, open, toggle, ensureChildren, loading } = useNavTree(org, path);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sidebarRef.current?.contains(document.activeElement)) return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown': {
          e.preventDefault();
          const focusable = sidebarRef.current.querySelectorAll('a, button');
          const current = Array.from(focusable).indexOf(document.activeElement as Element);
          const next = e.key === 'ArrowDown' ? current + 1 : current - 1;
          const target = focusable[Math.max(0, Math.min(next, focusable.length - 1))] as HTMLElement;
          target?.focus();
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          const button = document.activeElement as HTMLButtonElement;
          if (button.tagName === 'BUTTON' && button.getAttribute('aria-expanded') === 'false') {
            button.click();
          }
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          const button = document.activeElement as HTMLButtonElement;
          if (button.tagName === 'BUTTON' && button.getAttribute('aria-expanded') === 'true') {
            button.click();
          }
          break;
        }
        case 'Enter':
        case ' ': {
          e.preventDefault();
          (document.activeElement as HTMLElement)?.click();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <aside className="w-[280px] shrink-0 border-r border-border hidden md:block">
        <div className="p-3">
          <div className="text-sm text-muted">Loading navigation...</div>
        </div>
      </aside>
    );
  }

  const root = chain[0];

  if (!root) {
    return (
      <aside className="w-[280px] shrink-0 border-r border-border hidden md:block">
        <div className="p-3">
          <div className="text-sm text-muted">No navigation data</div>
        </div>
      </aside>
    );
  }

  return (
    <aside ref={sidebarRef} className="w-[280px] shrink-0 border-r border-border hidden md:block">
      <div className="p-3">
        <div className="text-sm font-medium text-muted mb-3">Navigation</div>
        
        <SidebarItem
          node={root}
          openStates={open}
          onToggle={toggle}
          onEnsureChildren={ensureChildren}
          childrenMap={children}
          depth={0}
        />
      </div>
    </aside>
  );
}