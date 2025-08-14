import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { seedRepos } from "@mudul/core";
import type { Node } from "@mudul/core";
import { useSalesCall } from "../hooks/useSalesCall";
import { SummaryCard } from "../widgets/SummaryCard";

const repos = seedRepos();

export function NodePage() {
  const { org, "*": splat } = useParams();
  const [node, setNode] = useState<Node | null>(null);
  const [children, setChildren] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        if (!org) {
          setError("Organization is required");
          return;
        }

        // Parse path segments
        const slugs = splat ? splat.split("/").filter(Boolean) : [];
        
        // Resolve node
        const foundNode = await repos.nodes.byPath(org, slugs);
        if (!foundNode) {
          setError(`Node not found for path: /${org}/${slugs.join("/")}`);
          return;
        }

        setNode(foundNode);

        // Always load children for navigation
        const nodeChildren = await repos.nodes.children(org, foundNode.id);
        setChildren(nodeChildren);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [org, splat]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600 text-lg">Error: {error}</div>
      </div>
    );
  }

  if (!node) {
    return (
      <div className="p-4">
        <div className="text-lg">Node not found</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{node.name}</h1>
      
      {node.dashboardId && (
        <div className="mb-6">
          <DashboardPlaceholder node={node} />
        </div>
      )}
      
      <NodeDirectory 
        org={org!} 
        slugs={splat ? splat.split("/").filter(Boolean) : []} 
        nodes={children} 
      />
    </div>
  );
}

function DashboardPlaceholder({ node }: { node: Node }) {
  const sessionId = String(node.dataRef?.id ?? "");
  const { data, error, loading } = useSalesCall(sessionId);

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="font-semibold">Dashboard</div>
      {loading && <div className="text-slate-500">Loading analysis…</div>}
      {error && <div className="text-red-600">Error: {error}</div>}
      {!loading && !error && <SummaryCard text={data?.summary} />}
    </div>
  );
}

function NodeDirectory({
  org,
  slugs,
  nodes
}: {
  org: string;
  slugs: string[];
  nodes: Node[];
}) {
  if (!nodes.length) return <div className="text-slate-500">No children</div>;

  const base = `/${org}/${slugs.join("/")}`;
  const sep = slugs.length ? "/" : "";

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Contents</h2>
      <ul className="space-y-2">
        {nodes.map((child) => (
          <li key={child.id} className="border rounded p-3 hover:bg-gray-50">
            <Link
              to={`${base}${sep}${child.slug}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {child.name}
            </Link>
            <div className="text-sm text-gray-600 mt-1">
              {child.kind} • {child.slug}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              <Link
                to={`${base}${sep}${child.slug}`}
                className="text-blue-500 hover:text-blue-700"
              >
                Open
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}