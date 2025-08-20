import { 
  type NewClientFormData, 
  type LogCallFormData, 
  type NewActionItemFormData,
  type CreatedClient,
  type CreatedCall,
  type CreatedActionItem
} from '../api/schemas/forms';

const API_BASE = '/api';

// Simple auth token management (placeholder)
function getAuthToken(): string {
  // In a real app, get this from auth context/localStorage
  return localStorage.getItem('accessToken') || '';
}

function createAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`,
  };
}

export interface ApiError {
  error: string;
  message: string;
  details?: any;
}

class CrudApiService {
  async createClient(data: NewClientFormData): Promise<CreatedClient> {
    const response = await fetch(`${API_BASE}/org/clients`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Failed to create client');
    }

    return response.json();
  }

  async createCall(clientId: string, data: LogCallFormData): Promise<CreatedCall> {
    const response = await fetch(`${API_BASE}/clients/${clientId}/calls`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Failed to log call');
    }

    return response.json();
  }

  async createActionItem(clientId: string, data: NewActionItemFormData): Promise<CreatedActionItem> {
    const response = await fetch(`${API_BASE}/clients/${clientId}/action-items`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'Failed to create action item');
    }

    return response.json();
  }
}

export const crudApiService = new CrudApiService();

// Optimistic update helpers
export function generateTempId(): string {
  return `tmp_${crypto.randomUUID()}`;
}

export interface OptimisticClient {
  id: string;
  name: string;
  notes?: string;
  isOptimistic?: boolean;
  lastCallDate: string | null;
  totalCalls: number;
  avgSentiment: number;
  bookingLikelihood: number;
}

export interface OptimisticCall {
  id: string;
  name: string;
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  bookingLikelihood: number;
  isOptimistic?: boolean;
}

export interface OptimisticActionItem {
  id: string;
  text: string;
  due: string | null;
  status: 'open' | 'done';
  ownerName: string | null;
  isOptimistic?: boolean;
}

export function createOptimisticClient(data: NewClientFormData): OptimisticClient {
  return {
    id: generateTempId(),
    name: data.name,
    notes: data.notes,
    isOptimistic: true,
    lastCallDate: null,
    totalCalls: 0,
    avgSentiment: 0,
    bookingLikelihood: 0,
  };
}

export function createOptimisticCall(data: LogCallFormData): OptimisticCall {
  const sentimentMap = { pos: 'positive', neu: 'neutral', neg: 'negative' } as const;
  
  return {
    id: generateTempId(),
    name: `Call ${new Date(data.ts).toLocaleDateString()}`,
    date: data.ts,
    sentiment: sentimentMap[data.sentiment],
    score: data.score,
    bookingLikelihood: data.bookingLikelihood,
    isOptimistic: true,
  };
}

export function createOptimisticActionItem(data: NewActionItemFormData): OptimisticActionItem {
  return {
    id: generateTempId(),
    text: data.text,
    due: data.dueDate || null,
    status: 'open',
    ownerName: data.owner || null,
    isOptimistic: true,
  };
}