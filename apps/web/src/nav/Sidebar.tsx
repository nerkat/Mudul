import { useLocation } from "react-router-dom";
import { useNavTree } from "./useNavTree";
import { SidebarItem } from "./SidebarItem";
import type { NavNode } from "./nav.types";

export function Sidebar({ org }: { org: string }) {
  const loc = useLocation();
  const path = decodeURIComponent(loc.pathname); // "/acme/..."
  const { chain, children, open, toggle, ensureChildren, loading } = useNavTree(org, path);

  if (loading) {
    return (
      <aside className="w-[280px] shrink-0 border-r border-border hidden md:block">
        <div className="p-3">
          <div className="text-sm text-muted">Loading navigation...</div>
        </div>
      </aside>
    );
  }

  // Root visible + last chain's children
  const root = chain[0];
  const last = chain[chain.length - 1];
  const list = (last && children[last.id]) || [];

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
    <aside className="w-[280px] shrink-0 border-r border-border hidden md:block">
      <div className="p-3">
        {/* Breadcrumb chain */}
        {chain.map((n, index) => (
          <div key={n.id} className="mb-1">
            <div className="text-xs text-muted px-2 py-1">
              {index === 0 ? n.name : `/ ${n.name}`}
            </div>
          </div>
        ))}
        
        <div className="mt-2">
          {list.map((n: NavNode) => (
            <div key={n.id} className="mb-0.5">
              <SidebarItem
                node={n}
                openStates={open}
                onToggle={toggle}
                onEnsureChildren={ensureChildren}
                childrenMap={children}
              />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}