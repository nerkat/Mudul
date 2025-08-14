import type { Plugin } from "vite";
import { seedRepos } from "@mudul/core";

const repos = seedRepos();

async function toNavNode(n: any, org: string, fullPath?: string): Promise<any> {
  const kids = await repos.nodes.children(org, n.id);
  
  // Build full path by traversing up the tree if not provided
  let path: string;
  if (fullPath) {
    path = fullPath;
  } else if (n.parentId === null) {
    // Root node
    path = `/${org}`;
  } else {
    // Build path by finding all parents
    const pathSegments = [n.slug];
    let current = n;
    while (current.parentId && current.parentId !== "root") {
      const parent = await repos.nodes.byId(current.parentId);
      if (parent && parent.slug) {
        pathSegments.unshift(parent.slug);
      }
      current = parent;
    }
    path = `/${org}` + (pathSegments.length ? `/${pathSegments.join("/")}` : "");
  }

  return {
    id: n.id, 
    name: n.name, 
    slug: n.slug, 
    kind: n.kind,
    hasChildren: (kids?.length ?? 0) > 0,
    parentId: n.parentId, 
    path: path
  };
}

export default function navPlugin(): Plugin {
  return {
    name: "dev-nav-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "GET") return next();
        const url = new URL(req.url!, "http://x");
        const mTree = url.pathname.match(/^\/api\/nav\/([^/]+)\/tree$/);
        const mKids = url.pathname.match(/^\/api\/nav\/([^/]+)\/children$/);

        res.setHeader("content-type", "application/json");

        if (mTree) {
          const org = mTree[1];
          const path = url.searchParams.get("path") || "/";
          // Resolve path -> node chain using existing repos.byPath stepwise
          const slugs = path.split("/").filter(Boolean).slice(1); // remove org segment
          // root for org
          const roots = await repos.nodes.children(org, "root");
          const root = roots.find(r => r.orgId === org && r.parentId === null) ?? roots[0];
          let chain = [root].filter(Boolean);
          let cur = root;
          let currentPath = `/${org}`;
          
          for (const s of slugs) {
            const kids = await repos.nodes.children(org, cur.id);
            const next = kids.find((k: any) => k.slug === s);
            if (!next) break;
            chain.push(next);
            cur = next;
            currentPath += `/${s}`;
          }
          
          const out: any = { chain:[], children:{} };
          let buildPath = `/${org}`;
          
          for (let i = 0; i < chain.length; i++) {
            const node = chain[i];
            if (i > 0 && node.slug) {
              buildPath += `/${node.slug}`;
            }
            out.chain.push(await toNavNode(node, org, buildPath));
          }
          
          // Children for all nodes in chain to build full tree
          for (const node of chain) {
            const kids = await repos.nodes.children(org, node.id);
            if (kids.length > 0) {
              out.children[node.id] = await Promise.all(kids.map((k:any)=>toNavNode(k, org)));
            }
          }
          res.statusCode = 200; 
          return res.end(JSON.stringify(out));
        }

        if (mKids) {
          const org = mKids[1];
          const parentId = url.searchParams.get("parentId")!;
          const kids = await repos.nodes.children(org, parentId);
          const out = await Promise.all(kids.map((k:any)=>toNavNode(k, org)));
          res.statusCode = 200; 
          return res.end(JSON.stringify(out));
        }

        next();
      });
    }
  };
}