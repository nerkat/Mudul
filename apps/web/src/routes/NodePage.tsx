import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { seedRepos } from "@mudul/core";
import type { Node } from "@mudul/core";
import { useSalesCall } from "../hooks/useSalesCall";
import { useViewMode } from "../ctx/ViewModeContext";
import { Paper, Rich } from "../widgets/registry";
import { Card } from "../components/Card";

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
      <Card>
        <div className="text-lg">Loading...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-danger text-lg">Error: {error}</div>
      </Card>
    );
  }

  if (!node) {
    return (
      <Card>
        <div className="text-lg">Node not found</div>
      </Card>
    );
  }

  return (
    <div>
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
  const { mode } = useViewMode();
  const W = mode === "paper" ? Paper : Rich;

  return (
    <Card className="space-y-3" aria-busy={loading}>
      <div className="font-semibold">Dashboard</div>
      {loading && <div className="text-muted">Loading analysis…</div>}
      {error && <div className="text-danger">Error: {error}</div>}
      {!loading && !error && data && (
        <div className="space-y-3">
          <W.Summary data={data} />
          <W.Sentiment data={data} />
          <W.Booking data={data} />
          <W.Objections data={data} />
          <W.ActionItems data={data} />
          <W.KeyMoments data={data} />
          <W.Entities data={data} />
          <W.Compliance data={data} />
        </div>
      )}
    </Card>
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
  if (!nodes.length) return <Card><div className="text-muted">No children</div></Card>;

  const base = `/${org}/${slugs.join("/")}`;
  const sep = slugs.length ? "/" : "";

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">Contents</h2>
      <ul className="space-y-2">
        {nodes.map((child) => (
          <li key={child.id} className="border border-border rounded p-3 hover:bg-surface">
            <Link
              to={`${base}${sep}${child.slug}`}
              className="text-accent hover:opacity-80 font-medium"
            >
              {child.name}
            </Link>
            <div className="text-sm text-muted mt-1">
              {child.kind} • {child.slug}
            </div>
            <div className="text-xs text-muted mt-1">
              <Link
                to={`${base}${sep}${child.slug}`}
                className="text-accent hover:opacity-80"
              >
                Open
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}