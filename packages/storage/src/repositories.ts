import { PrismaClient } from '@prisma/client';
import type { 
  OrgSummary, 
  ClientRow, 
  ClientSummary, 
  CallRow, 
  ActionItemRow 
} from './types.js';

export class OrgRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get organization summary KPIs
   */
  async getSummary(orgId: string): Promise<OrgSummary> {
    // Get total calls
    const totalCalls = await this.prisma.call.count({
      where: { orgId },
    });

    // Get average sentiment score
    const sentimentAvg = await this.prisma.call.aggregate({
      where: { 
        orgId,
        score: { not: null },
      },
      _avg: { score: true },
    });

    // Calculate booking rate (calls with likelihood > 0.7)
    const highLikelihoodCalls = await this.prisma.call.count({
      where: { 
        orgId,
        bookingLikelihood: { gte: 0.7 },
      },
    });

    // Get open action items count
    const openActionItems = await this.prisma.actionItem.count({
      where: { 
        orgId,
        status: 'OPEN',
      },
    });

    return {
      totalCalls,
      avgSentimentScore: sentimentAvg._avg.score || 0,
      bookingRate: totalCalls > 0 ? highLikelihoodCalls / totalCalls : 0,
      openActionItems,
    };
  }

  /**
   * Get clients overview for organization
   */
  async getClientsOverview(orgId: string): Promise<{ items: ClientRow[] }> {
    const clients = await this.prisma.client.findMany({
      where: { orgId },
      include: {
        calls: {
          orderBy: { ts: 'desc' },
          take: 1,
        },
        _count: {
          select: { calls: true },
        },
      },
    });

    const items: ClientRow[] = await Promise.all(
      clients.map(async (client) => {
        // Get average sentiment for this client
        const sentimentAvg = await this.prisma.call.aggregate({
          where: { 
            clientId: client.id,
            score: { not: null },
          },
          _avg: { score: true },
        });

        // Get average booking likelihood
        const likelihoodAvg = await this.prisma.call.aggregate({
          where: { 
            clientId: client.id,
            bookingLikelihood: { not: null },
          },
          _avg: { bookingLikelihood: true },
        });

        return {
          id: client.id,
          name: client.name,
          lastCallDate: client.calls[0]?.ts.toISOString() || null,
          totalCalls: client._count.calls,
          avgSentiment: sentimentAvg._avg.score || 0,
          bookingLikelihood: likelihoodAvg._avg.bookingLikelihood || 0,
        };
      })
    );

    return { items };
  }
}

export class ClientRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get client summary with KPIs and insights
   */
  async getSummary(clientId: string, orgId: string): Promise<ClientSummary> {
    // Verify client belongs to org
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, orgId },
      include: {
        calls: {
          where: { score: { not: null } },
        },
      },
    });

    if (!client) {
      throw new Error('CLIENT_NOT_FOUND');
    }

    // Calculate metrics
    const totalCalls = client.calls.length;
    const avgSentiment = totalCalls > 0 
      ? client.calls.reduce((sum, call) => sum + (call.score || 0), 0) / totalCalls 
      : 0;
    
    const avgLikelihood = totalCalls > 0
      ? client.calls.reduce((sum, call) => sum + (call.bookingLikelihood || 0), 0) / totalCalls
      : 0;

    // TODO: Implement top objections analysis
    // For now, return empty array
    const topObjections: { type: string; count: number }[] = [];

    return {
      id: client.id,
      name: client.name,
      totalCalls,
      avgSentiment,
      bookingLikelihood: avgLikelihood,
      topObjections,
    };
  }

  /**
   * Get client calls with pagination
   */
  async getCalls(clientId: string, orgId: string, limit = 10): Promise<{ items: CallRow[] }> {
    // Verify client belongs to org
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, orgId },
    });

    if (!client) {
      throw new Error('CLIENT_NOT_FOUND');
    }

    const calls = await this.prisma.call.findMany({
      where: { clientId },
      orderBy: { ts: 'desc' },
      take: limit,
    });

    const items: CallRow[] = calls.map(call => ({
      id: call.id,
      name: call.name || 'Untitled Call',
      date: call.ts.toISOString(),
      sentiment: call.sentiment.toLowerCase() as 'positive' | 'neutral' | 'negative',
      score: call.score || 0,
      bookingLikelihood: call.bookingLikelihood || 0,
    }));

    return { items };
  }

  /**
   * Get client action items
   */
  async getActionItems(
    clientId: string, 
    orgId: string, 
    status?: 'open' | 'done'
  ): Promise<{ items: ActionItemRow[] }> {
    // Verify client belongs to org
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, orgId },
    });

    if (!client) {
      throw new Error('CLIENT_NOT_FOUND');
    }

    const actionItems = await this.prisma.actionItem.findMany({
      where: { 
        clientId,
        ...(status && { status: status.toUpperCase() as 'OPEN' | 'DONE' }),
      },
      include: {
        owner: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const items: ActionItemRow[] = actionItems.map(item => ({
      id: item.id,
      text: item.text,
      due: item.due?.toISOString() || null,
      status: item.status.toLowerCase() as 'open' | 'done',
      ownerName: item.owner?.name || null,
    }));

    return { items };
  }
}