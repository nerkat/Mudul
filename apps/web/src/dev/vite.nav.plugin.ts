import type { Plugin } from "vite";
import { seedRepos } from "@mudul/core";

const repos = seedRepos();

async function toNavNode(n: any, org: string): Promise<any> {
  const kids = await repos.nodes.children(org, n.id);
  return {
    id: n.id, 
    name: n.name, 
    slug: n.slug, 
    kind: n.kind,
    hasChildren: (kids?.length ?? 0) > 0,
    parentId: n.parentId, 
    path: `/${org}` + (n.slug ? `/${n.slug}` : "")
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
          for (const s of slugs) {
            const kids = await repos.nodes.children(org, cur.id);
            const next = kids.find((k: any) => k.slug === s);
            if (!next) break;
            chain.push(next);
            cur = next;
          }
          const out: any = { chain:[], children:{} };
          for (const node of chain) {
            out.chain.push(await toNavNode(node, org));
          }
          // Immediate children for last in chain
          const last = chain[chain.length - 1];
          const kids = await repos.nodes.children(org, last.id);
          out.children[last.id] = await Promise.all(kids.map((k:any)=>toNavNode(k, org)));
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