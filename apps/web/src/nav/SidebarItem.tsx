import { Link, useLocation } from "react-router-dom";
import type { NavNode } from "./nav.types";

interface SidebarItemProps {
  node: NavNode;
  openStates: Record<string, boolean>;
  onToggle: (nodeId: string) => void;
  onEnsureChildren: (parentId: string) => Promise<void>;
  childrenMap: Record<string, NavNode[]>;
  depth?: number;
}

export function SidebarItem({
  node, 
  openStates, 
  onToggle, 
  onEnsureChildren, 
  childrenMap,
  depth = 0
}: SidebarItemProps) {
  const loc = useLocation();
  const active = decodeURIComponent(loc.pathname) === node.path;
  const isOpen = !!openStates[node.id];
  const childrenList = childrenMap[node.id] || [];

  const handleExpandClick = async () => {
    await onEnsureChildren(node.id);
    onToggle(node.id);
  };

  const paddingLeft = depth * 24; // 24px per level

  return (
    <div className={`group rounded-md ${active ? "bg-surface/50" : ""}`}>
      <div className="flex items-center gap-2 py-1" style={{ paddingLeft: `${paddingLeft}px` }}>
        {node.hasChildren ? (
          <button
            onClick={handleExpandClick}
            aria-expanded={isOpen}
            className="w-6 h-6 inline-flex items-center justify-center rounded hover:bg-surface"
          >
            <span className="inline-block" aria-hidden>{isOpen ? "▾" : "▸"}</span>
          </button>
        ) : (
          <span className="w-6 h-6" />
        )}

        <Link
          to={node.path}
          className={`flex-1 truncate px-2 py-1 rounded hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent ${
            active ? "text-accent font-medium" : ""
          }`}
        >
          <span className="text-sm">{node.name}</span>
          <span className="ml-2 text-xs text-muted">{node.kind}</span>
        </Link>
      </div>
      {isOpen && childrenList?.length ? (
        <div>
          {childrenList.map((c: NavNode) => (
            <SidebarItem
              key={c.id}
              node={c}
              openStates={openStates}
              onToggle={onToggle}
              onEnsureChildren={onEnsureChildren}
              childrenMap={childrenMap}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}