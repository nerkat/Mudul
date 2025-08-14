import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { seedRepos } from '@mudul/core';
import type { Node } from '@mudul/core';

const repos = seedRepos();

interface TreeNodeProps {
  node: Node;
  orgId: string;
  level: number;
  currentPath: string;
  expandedNodes: Set<string>;
  onToggleExpanded: (nodeId: string) => void;
}

function TreeNode({ node, orgId, level, currentPath, expandedNodes, onToggleExpanded }: TreeNodeProps) {
  const [children, setChildren] = useState<Node[]>([]);
  const [loading, setLoading] = useState(false);
  
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.kind !== 'call_session'; // Calls don't have children
  const nodePath = buildNodePath(orgId, node);
  const isActive = currentPath === nodePath;
  const isInActivePath = currentPath.startsWith(nodePath + '/') || isActive;

  // Load children when expanded
  useEffect(() => {
    if (isExpanded && hasChildren && children.length === 0) {
      setLoading(true);
      repos.nodes.children(orgId, node.id).then((childNodes) => {
        // Filter out any nodes that would create infinite recursion
        const filteredChildren = childNodes.filter(child => 
          child.id !== node.id && // Don't include self
          child.parentId === node.id // Only direct children
        );
        setChildren(filteredChildren);
        setLoading(false);
      });
    }
  }, [isExpanded, node.id, orgId, hasChildren, children.length]);

  const handleToggle = () => {
    if (hasChildren) {
      onToggleExpanded(node.id);
    }
  };

  const getNodeIcon = (kind: string) => {
    switch (kind) {
      case 'group':
        return '🏢';
      case 'sales_pipeline':
        return '📊';
      case 'lead':
        return '👤';
      case 'call_session':
        return '📞';
      default:
        return '📁';
    }
  };

  return (
    <li>
      <div className={`flex items-center ${hasChildren ? 'hs-accordion' : ''} ${isExpanded ? 'active' : ''}`}>
        <Link 
          to={nodePath}
          className={`min-h-[36px] w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm rounded-lg hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 ${
            isActive 
              ? 'bg-gray-100 text-gray-800 dark:bg-neutral-700 dark:text-white' 
              : 'text-gray-800 dark:text-neutral-200'
          } hs-overlay-minified:justify-center`}
          style={{ paddingLeft: `${0.625 + level * 1.5}rem` }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.preventDefault();
                handleToggle();
              }}
              className="hs-accordion-toggle flex justify-center items-center w-4 h-4 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded"
              aria-expanded={isExpanded}
            >
              <svg 
                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          )}
          {!hasChildren && <div className="w-4 h-4"></div>}
          
          <span className="text-lg mr-2 hs-overlay-minified:hidden">{getNodeIcon(node.kind)}</span>
          
          <span className="hs-overlay-minified:hidden">{node.name}</span>
          
          {node.kind === 'call_session' && node.dashboardId && (
            <span className="w-2 h-2 bg-green-500 rounded-full hs-overlay-minified:hidden" title="Has dashboard"></span>
          )}
        </Link>
      </div>

      {isExpanded && hasChildren && (
        <div className="hs-accordion-content">
          {loading ? (
            <div className="py-2 px-8 text-xs text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          ) : (
            <ul className="space-y-1">
              {children.map((child) => (
                <TreeNode
                  key={child.id}
                  node={child}
                  orgId={orgId}
                  level={level + 1}
                  currentPath={currentPath}
                  expandedNodes={expandedNodes}
                  onToggleExpanded={onToggleExpanded}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

function buildNodePath(orgId: string, node: Node): string {
  // For root node, just return org path
  if (node.parentId === null) {
    return `/${orgId}`;
  }
  
  // Build path by walking up the tree - for now, simplified approach
  // In a full implementation, we'd cache paths or build them more efficiently
  
  // This is a simplified approach - we'll build paths based on the known structure
  if (node.kind === 'sales_pipeline') {
    return `/${orgId}/${node.slug}`;
  } else if (node.kind === 'lead') {
    // Find parent pipeline slug - simplified for our known structure
    return `/${orgId}/sales/${node.slug}`;
  } else if (node.kind === 'call_session') {
    // Find lead slug - simplified for our known structure  
    return `/${orgId}/sales/${getLeadSlugForCall(node.id)}/${node.slug}`;
  }
  
  return `/${orgId}`;
}

// Helper function to get lead slug for a call - simplified for our seed data
function getLeadSlugForCall(callId: string): string {
  const callToLeadMap: Record<string, string> = {
    'c1': 'acme-co',
    'c2': 'acme-co', 
    'c3': 'globex',
    'c4': 'globex',
    'c5': 'initech'
  };
  return callToLeadMap[callId] || 'acme-co';
}

interface TreeNavProps {
  className?: string;
}

export function TreeNav({ className = "" }: TreeNavProps) {
  const location = useLocation();
  const [rootNode, setRootNode] = useState<Node | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  
  const orgId = 'acme'; // For now, hardcoded to acme

  useEffect(() => {
    // Load root node
    repos.nodes.byPath(orgId, []).then(setRootNode);
  }, [orgId]);

  useEffect(() => {
    // Auto-expand nodes in current path
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 1) {
      setExpandedNodes(prev => new Set([...prev, 'root', 'p1'])); // Auto-expand org and sales pipeline
    }
  }, [location.pathname]);

  const handleToggleExpanded = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  if (!rootNode) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      <TreeNode
        node={rootNode}
        orgId={orgId}
        level={0}
        currentPath={location.pathname}
        expandedNodes={expandedNodes}
        onToggleExpanded={handleToggleExpanded}
      />
    </ul>
  );
}