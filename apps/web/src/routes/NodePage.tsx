import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { seedRepos } from "@mudul/core";
import type { Node } from "@mudul/core";

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

        // Load children if no dashboard
        if (!foundNode.dashboardId) {
          const nodeChildren = await repos.nodes.children(foundNode.id, org);
          setChildren(nodeChildren);
        }
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
      
      {node.dashboardId ? (
        <DashboardPlaceholder node={node} />
      ) : (
        <ChildrenList children={children} org={org!} />
      )}
    </div>
  );
}

function DashboardPlaceholder({ node }: { node: Node }) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    async function loadDashboardData() {
      if (node.dashboardId) {
        const dash = await repos.dashboards.get(node.dashboardId);
        setDashboard(dash);
      }
      
      if (node.dataRef?.type === "session" && node.dataRef.id) {
        const sess = await repos.sessions.get(node.dataRef.id);
        setSession(sess);
      }
    }

    loadDashboardData();
  }, [node]);

  const sessionId = node.dataRef?.type === "session" ? node.dataRef.id : null;
  const apiPath = sessionId ? `/api/sessions/${sessionId}/analysis` : null;

  return (
    <div className="border rounded-lg p-6 bg-gray-50">
      <h2 className="text-xl font-semibold mb-4">Dashboard Placeholder</h2>
      
      <div className="space-y-3">
        <div>
          <span className="font-medium">Template ID:</span>{" "}
          <code className="bg-gray-200 px-2 py-1 rounded text-sm">
            {dashboard?.templateId || "loading..."}
          </code>
        </div>
        
        {sessionId && (
          <div>
            <span className="font-medium">Bound Session ID:</span>{" "}
            <code className="bg-gray-200 px-2 py-1 rounded text-sm">
              {sessionId}
            </code>
          </div>
        )}
        
        {apiPath && (
          <div>
            <span className="font-medium">Future API Path:</span>{" "}
            <code className="bg-blue-100 px-2 py-1 rounded text-sm">
              {apiPath}
            </code>
          </div>
        )}

        {session && (
          <div className="mt-4 p-3 bg-white rounded border">
            <h3 className="font-medium mb-2">Session Details:</h3>
            <div className="text-sm space-y-1">
              <div>Type: {session.type}</div>
              <div>Started: {new Date(session.startedAt).toLocaleString()}</div>
              {session.durationSec && (
                <div>Duration: {Math.floor(session.durationSec / 60)}m {session.durationSec % 60}s</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChildrenList({ children, org }: { children: Node[]; org: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Contents</h2>
      
      {children.length === 0 ? (
        <div className="text-gray-500">No items found</div>
      ) : (
        <ul className="space-y-2">
          {children.map((n) => (
            <li key={n.id} className="border rounded p-3 hover:bg-gray-50">
              <a 
                href={`/${org}/${buildPathForDemo(n.id)}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {n.name}
              </a>
              <div className="text-sm text-gray-600 mt-1">
                {n.kind} • {n.slug}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Demo path map for seed (replace with real path resolution later)
function buildPathForDemo(id: string): string {
  const map: Record<string, string> = {
    "root": "",
    "p1": "sales",
    "l1": "sales/acme-co", 
    "c1": "sales/acme-co/2025-08-10"
  };
  return map[id] || `unknown/${id}`;
}