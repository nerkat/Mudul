// Mock data service that uses the existing seed data
import { nodes, calls } from '../../core/seed';

interface OrgSummary {
  totalCalls: number;
  avgSentimentScore: number;
  bookingRate: number;
  openActionItems: number;
}

interface ClientRow {
  id: string;
  name: string;
  lastCallDate: string | null;
  totalCalls: number;
  avgSentiment: number;
  bookingLikelihood: number;
}

interface ClientSummary {
  id: string;
  name: string;
  totalCalls: number;
  avgSentiment: number;
  bookingLikelihood: number;
  topObjections: { type: string; count: number }[];
}

interface CallRow {
  id: string;
  name: string;
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  bookingLikelihood: number;
}

interface ActionItemRow {
  id: string;
  text: string;
  due: string | null;
  status: 'open' | 'done';
  ownerName: string | null;
}

export class MockDataService {
  static getOrgTree(orgId: string) {
    const rootNode = Object.values(nodes).find(node =>
      node.orgId === orgId &&
      node.parentId === null &&
      node.kind === 'group' &&
      !node.archivedAt
    );

    if (!rootNode) {
      throw new Error('ORG_NOT_FOUND');
    }

    const clientNodes = Object.values(nodes)
      .filter(node =>
        node.orgId === orgId &&
        node.kind === 'lead' &&
        !node.archivedAt
      )
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

    const visibleClientIds = new Set(clientNodes.map(node => node.id));
    const callNodes = Object.values(nodes)
      .filter(node =>
        node.orgId === orgId &&
        node.kind === 'call_session' &&
        !node.archivedAt &&
        !!node.parentId &&
        visibleClientIds.has(node.parentId)
      )
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return {
      root: rootNode,
      clients: clientNodes,
      calls: callNodes,
      callData: Object.fromEntries(callNodes.map(node => [node.id, calls[node.id]])),
    };
  }

  /**
   * Get organization summary KPIs
   */
  static getOrgSummary(orgId: string): OrgSummary {
    // Filter calls for this org
    const orgCallIds = Object.values(nodes)
      .filter(node =>
        node.orgId === orgId &&
        node.kind === 'call_session' &&
        !node.archivedAt &&
        !!node.parentId &&
        !nodes[node.parentId]?.archivedAt
      )
      .map(node => node.id);

    const orgCalls = orgCallIds.map(id => calls[id]).filter(Boolean);

    // Calculate metrics
    const totalCalls = orgCalls.length;
    const avgSentimentScore = totalCalls > 0 
      ? orgCalls.reduce((sum, call) => sum + (call.sentiment?.score || 0), 0) / totalCalls
      : 0;

    const highLikelihoodCalls = orgCalls.filter(call => 
      (call.bookingLikelihood || 0) >= 0.7
    ).length;

    const bookingRate = totalCalls > 0 ? highLikelihoodCalls / totalCalls : 0;

    // Count open action items across all calls
    const openActionItems = orgCalls.reduce((count, call) => {
      return count + (call.actionItems?.filter(item => !item.due || new Date(item.due) >= new Date()).length || 0);
    }, 0);

    return {
      totalCalls,
      avgSentimentScore,
      bookingRate,
      openActionItems,
    };
  }

  /**
   * Get clients overview for organization
   */
  static getClientsOverview(orgId: string): { items: ClientRow[] } {
    // Get clients for this org
    const clients = Object.values(nodes).filter(node => 
      node.orgId === orgId && node.kind === 'lead' && !node.archivedAt
    );

    const items: ClientRow[] = clients.map(client => {
      // Get calls for this client
      const clientCallIds = Object.values(nodes)
        .filter(node => node.parentId === client.id && node.kind === 'call_session' && !node.archivedAt)
        .map(node => node.id);

      const clientCalls = clientCallIds.map(id => calls[id]).filter(Boolean);

      // Calculate metrics
      const totalCalls = clientCalls.length;
      const avgSentiment = totalCalls > 0
        ? clientCalls.reduce((sum, call) => sum + (call.sentiment?.score || 0), 0) / totalCalls
        : 0;

      const bookingLikelihood = totalCalls > 0
        ? clientCalls.reduce((sum, call) => sum + (call.bookingLikelihood || 0), 0) / totalCalls
        : 0;

      // Get last call date
      const lastCallDate = clientCalls.length > 0
        ? Math.max(...clientCallIds.map(id => new Date(nodes[id]?.createdAt || 0).getTime()))
        : null;

      return {
        id: client.id,
        name: client.name,
        lastCallDate: lastCallDate ? new Date(lastCallDate).toISOString() : null,
        totalCalls,
        avgSentiment,
        bookingLikelihood,
      };
    });

    return { items };
  }

  /**
   * Get client summary with KPIs and insights
   */
  static getClientSummary(clientId: string, orgId: string): ClientSummary {
    // Verify client exists and belongs to org
    const client = nodes[clientId];
    if (!client || client.orgId !== orgId || client.kind !== 'lead' || client.archivedAt) {
      throw new Error('CLIENT_NOT_FOUND');
    }

    // Get calls for this client
    const clientCallIds = Object.values(nodes)
      .filter(node => node.parentId === clientId && node.kind === 'call_session' && !node.archivedAt)
      .map(node => node.id);

    const clientCalls = clientCallIds.map(id => calls[id]).filter(Boolean);

    // Calculate metrics
    const totalCalls = clientCalls.length;
    const avgSentiment = totalCalls > 0
      ? clientCalls.reduce((sum, call) => sum + (call.sentiment?.score || 0), 0) / totalCalls
      : 0;

    const bookingLikelihood = totalCalls > 0
      ? clientCalls.reduce((sum, call) => sum + (call.bookingLikelihood || 0), 0) / totalCalls
      : 0;

    // Analyze top objections
    const objectionCounts: Record<string, number> = {};
    clientCalls.forEach(call => {
      call.objections?.forEach(obj => {
        objectionCounts[obj.type] = (objectionCounts[obj.type] || 0) + 1;
      });
    });

    const topObjections = Object.entries(objectionCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      id: client.id,
      name: client.name,
      totalCalls,
      avgSentiment,
      bookingLikelihood,
      topObjections,
    };
  }

  /**
   * Get client calls with pagination
   */
  static getClientCalls(clientId: string, orgId: string, limit = 10): { items: CallRow[] } {
    // Verify client exists and belongs to org
    const client = nodes[clientId];
    if (!client || client.orgId !== orgId || client.kind !== 'lead' || client.archivedAt) {
      throw new Error('CLIENT_NOT_FOUND');
    }

    // Get calls for this client
    const clientCallIds = Object.values(nodes)
      .filter(node => node.parentId === clientId && node.kind === 'call_session' && !node.archivedAt)
      .map(node => node.id)
      .sort((a, b) => new Date(nodes[b].createdAt).getTime() - new Date(nodes[a].createdAt).getTime())
      .slice(0, limit);

    const items: CallRow[] = clientCallIds.map(id => {
      const callNode = nodes[id];
      const callData = calls[id];

      return {
        id,
        name: callNode.name,
        date: callNode.createdAt,
        sentiment: (callData?.sentiment?.overall || 'neutral') as 'positive' | 'neutral' | 'negative',
        score: callData?.sentiment?.score || 0,
        bookingLikelihood: callData?.bookingLikelihood || 0,
      };
    });

    return { items };
  }

  /**
   * Get client action items
   */
  static getClientActionItems(
    clientId: string, 
    orgId: string, 
    status?: 'open' | 'done'
  ): { items: ActionItemRow[] } {
    // Verify client exists and belongs to org
    const client = nodes[clientId];
    if (!client || client.orgId !== orgId || client.kind !== 'lead' || client.archivedAt) {
      throw new Error('CLIENT_NOT_FOUND');
    }

    // Get calls for this client and extract action items
    const clientCallIds = Object.values(nodes)
      .filter(node => node.parentId === clientId && node.kind === 'call_session' && !node.archivedAt)
      .map(node => node.id);

    const actionItems: ActionItemRow[] = [];
    clientCallIds.forEach(callId => {
      const callData = calls[callId];
      callData?.actionItems?.forEach((item, index) => {
        const itemStatus = item.due && new Date(item.due) < new Date() ? 'done' : 'open';
        
        // Filter by status if provided
        if (status && itemStatus !== status) return;

        actionItems.push({
          id: `${callId}-action-${index}`,
          text: item.text,
          due: item.due || null,
          status: itemStatus,
          ownerName: item.owner === 'rep' ? 'Sales Rep' : 'Prospect',
        });
      });
    });

    return { items: actionItems };
  }

  static archiveClient(orgId: string, clientId: string) {
    const client = nodes[clientId];
    if (!client || client.orgId !== orgId || client.kind !== 'lead' || client.archivedAt) {
      throw new Error('CLIENT_NOT_FOUND');
    }

    const archivedAt = new Date().toISOString();
    client.archivedAt = archivedAt;
    client.updatedAt = archivedAt;

    Object.values(nodes)
      .filter(node => node.parentId === clientId && node.kind === 'call_session' && !node.archivedAt)
      .forEach((node) => {
        node.archivedAt = archivedAt;
        node.updatedAt = archivedAt;
      });

    return { id: clientId, archivedAt };
  }

  static archiveCall(orgId: string, callId: string) {
    const callNode = nodes[callId];
    if (
      !callNode ||
      callNode.orgId !== orgId ||
      callNode.kind !== 'call_session' ||
      callNode.archivedAt ||
      !callNode.parentId ||
      nodes[callNode.parentId]?.archivedAt
    ) {
      throw new Error('CALL_NOT_FOUND');
    }

    const archivedAt = new Date().toISOString();
    callNode.archivedAt = archivedAt;
    callNode.updatedAt = archivedAt;

    return { id: callId, archivedAt };
  }
}