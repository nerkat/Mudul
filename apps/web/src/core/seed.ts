import {
  demoActionItems,
  demoCalls,
  demoClients,
  demoOrganizations,
} from '../../../../packages/core/src/demo-data.js';
import type { NodeBase, SalesCallMinimal, ClientMemory } from './types';

const rootOrg = demoOrganizations[0];

export const nodes: Record<string, NodeBase> = {
  root: {
    id: 'root',
    orgId: rootOrg.id,
    parentId: null,
    kind: 'group',
    name: rootOrg.name,
    slug: '',
    dashboardId: 'org-dashboard',
    createdAt: rootOrg.createdAt,
    updatedAt: rootOrg.createdAt,
  },
};

for (const client of demoClients.filter((item) => item.orgId === rootOrg.id)) {
  nodes[client.id] = {
    id: client.id,
    orgId: client.orgId,
    parentId: 'root',
    kind: 'lead',
    name: client.name,
    slug: client.slug,
    dashboardId: 'client-dashboard',
    createdAt: client.createdAt,
    updatedAt: client.createdAt,
  };
}

for (const call of demoCalls.filter((item) => item.orgId === rootOrg.id)) {
  nodes[call.id] = {
    id: call.id,
    orgId: call.orgId,
    parentId: call.clientId,
    kind: 'call_session',
    name: call.name,
    slug: call.slug,
    dashboardId: 'sales-call-default',
    dataRef: { type: 'session', id: call.sessionId },
    createdAt: call.ts,
    updatedAt: call.ts,
  };
}

export const calls: Record<string, SalesCallMinimal> = Object.fromEntries(
  demoCalls
    .filter((item) => item.orgId === rootOrg.id)
    .map((call) => [
      call.id,
      {
        id: call.id,
        summary: call.summary,
        sentiment: { overall: call.sentiment, score: call.score },
        bookingLikelihood: call.bookingLikelihood,
        objections: call.objections,
        actionItems: demoActionItems
          .filter((item) => item.callId === call.id)
          .map((item) => ({ owner: item.owner, text: item.text, due: item.due })),
        keyMoments: call.keyMoments,
        entities: call.entities,
        complianceFlags: call.complianceFlags,
      } satisfies SalesCallMinimal,
    ])
);

// Client memory store — one entry per client (keyed by client node ID)
export const clientMemories: Record<string, ClientMemory> = {};