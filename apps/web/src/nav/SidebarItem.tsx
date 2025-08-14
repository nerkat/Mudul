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
    <div className="mb-0.5">
      <div className={`group rounded-md ${active ? "bg-accent/10 border border-accent/20" : ""}`}>
        <div className="flex items-center gap-1 py-1.5" style={{ paddingLeft: `${paddingLeft + 8}px` }}>
          {node.hasChildren ? (
            <button
              onClick={handleExpandClick}
              aria-expanded={isOpen}
              className="w-5 h-5 inline-flex items-center justify-center rounded hover:bg-surface focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
              title={isOpen ? "Collapse" : "Expand"}
            >
              <span className={`inline-block text-sm transition-transform ${isOpen ? "" : "-rotate-90"}`} aria-hidden>
                ▾
              </span>
            </button>
          ) : (
            <span className="w-5 h-5" />
          )}

          <Link
            to={node.path}
            className={`flex-1 truncate px-2 py-1 rounded hover:bg-surface focus:outline-none focus:ring-1 focus:ring-accent transition-colors ${
              active ? "text-accent font-medium" : "text-fg"
            }`}
          >
            <span className="text-sm">{node.name}</span>
            {node.kind && (
              <span className="ml-2 text-xs text-muted">({node.kind})</span>
            )}
          </Link>
        </div>
      </div>
      
      {isOpen && childrenList?.length > 0 && (
        <div className="ml-1">
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
      )}
    </div>
  );
}