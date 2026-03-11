// Authentication and authorization types

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface Organization {
  id: string;
  name: string;
  iconUrl?: string;
  planTier: string;
  createdAt: string;
}

export interface Membership {
  userId: string;
  orgId: string;
  role: 'owner' | 'viewer';
  createdAt: string;
  invitedBy?: string;
}

export interface AuthSession {
  user: User;
  organization: Organization;
  membership: Membership;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
}

export interface GoogleLoginRequest {
  credential: string;
  rememberMe?: boolean;
}

export interface AuthError {
  code: string;
  message: string;
  details?: string[];
  correlationId?: string;
}

export interface AuthResponse {
  session: AuthSession;
  isFirstLogin: boolean;
}

// Permission capabilities
export type Permission = 'view_dashboards' | 'edit_dashboards' | 'create_calls' | 'run_ai_analysis';

export const ROLE_PERMISSIONS: Record<Membership['role'], Permission[]> = {
  owner: ['view_dashboards', 'edit_dashboards', 'create_calls', 'run_ai_analysis'],
  viewer: ['view_dashboards']
};

// Helper function to check permissions
export function hasPermission(role: Membership['role'], permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}