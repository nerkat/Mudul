import { useEffect, useState, useCallback } from "react";
import { getTree, getChildren } from "./nav.api";
import type { NavNode } from "./nav.types";

type MapChildren = Record<string, NavNode[]>;

export function useNavTree(org: string, path: string) {
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    try { 
      return JSON.parse(localStorage.getItem("navOpen") || "{}"); 
    } catch { 
      return {}; 
    }
  });
  const [chain, setChain] = useState<NavNode[]>([]);
  const [children, setChildren] = useState<MapChildren>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      try {
        setLoading(true);
        const t = await getTree(org, path);
        
        if (!isMounted) return;
        
        setChain(t.chain);
        setChildren((prev) => ({ ...prev, ...t.children }));
        
        // Update open state for chain nodes without causing re-render loop
        const expand: Record<string, boolean> = {};
        t.chain.forEach((n: NavNode) => { 
          if (n.id) expand[n.id] = true; 
        });
        
        setOpen((prevOpen) => {
          const newOpen = { ...prevOpen, ...expand };
          localStorage.setItem("navOpen", JSON.stringify(newOpen));
          return newOpen;
        });
      } catch (error) {
        console.error("Failed to load nav tree:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();
    
    return () => {
      isMounted = false;
    };
  }, [org, path]); // Remove open from dependencies

  const toggle = useCallback(async (nodeId: string) => {
    setOpen((prevOpen) => {
      const next = { ...prevOpen, [nodeId]: !prevOpen[nodeId] };
      localStorage.setItem("navOpen", JSON.stringify(next));
      return next;
    });
  }, []);

  const ensureChildren = useCallback(async (parentId: string) => {
    setChildren((prevChildren) => {
      if (prevChildren[parentId]) return prevChildren;
      
      // Async load children
      (async () => {
        try {
          const list = await getChildren(org, parentId);
          setChildren((prev) => ({ ...prev, [parentId]: list }));
        } catch (error) {
          console.error("Failed to load children:", error);
        }
      })();
      
      return prevChildren;
    });
  }, [org]);

  return { chain, children, open, toggle, ensureChildren, loading };
}