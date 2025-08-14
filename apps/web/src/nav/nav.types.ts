export type NavNode = {
  id: string;
  name: string;
  slug: string;
  kind: string;
  hasChildren: boolean;
  parentId: string | null;
  path: string; // e.g. "/acme/sales/acme-co"
};