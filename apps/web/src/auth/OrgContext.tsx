import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Organization } from './types';
import { useAuth } from './AuthContext';
import { setScopedItem } from '../utils/storage';

interface OrgContextValue {
  // Current organization
  currentOrg: Organization | null;
  
  // Available organizations (for future multi-org support)
  availableOrgs: Organization[];
  
  // Actions
  switchOrg: (orgId: string) => Promise<void>;
  
  // Loading state
  isLoading: boolean;
}

const OrgContext = createContext<OrgContextValue | null>(null);

interface OrgProviderProps {
  children: React.ReactNode;
}

export function OrgProvider({ children }: OrgProviderProps) {
  const { session, user } = useAuth();
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [availableOrgs, setAvailableOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize org state when session changes
  useEffect(() => {
    if (session?.organization && user) {
      setCurrentOrg(session.organization);
      setAvailableOrgs([session.organization]); // For now, only one org
      
      // Store last selected org for this user
      setScopedItem(session.organization.id, user.id, 'selectedOrg', session.organization.id);
    } else {
      setCurrentOrg(null);
      setAvailableOrgs([]);
    }
  }, [session, user]);

  const switchOrg = useCallback(async (orgId: string) => {
    if (!user || !currentOrg) return;
    
    setIsLoading(true);
    try {
      // For now, we only have one org, so this is mostly a placeholder
      // In the future, this would involve:
      // 1. Validating user has access to the org
      // 2. Fetching new session data for the org
      // 3. Updating auth context
      
      const targetOrg = availableOrgs.find(org => org.id === orgId);
      if (targetOrg) {
        setCurrentOrg(targetOrg);
        setScopedItem(targetOrg.id, user.id, 'selectedOrg', orgId);
      }
    } catch (error) {
      console.error('Failed to switch organization:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentOrg, availableOrgs]);

  const value: OrgContextValue = {
    currentOrg,
    availableOrgs,
    switchOrg,
    isLoading
  };

  return (
    <OrgContext.Provider value={value}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg(): OrgContextValue {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
}