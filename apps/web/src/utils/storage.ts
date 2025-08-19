// Scoped localStorage utilities for per-user/org data isolation

const STORAGE_PREFIX = 'mudul:v1';

/**
 * Create a scoped storage key with format: mudul:v1:{orgId}:{userId}:{key}
 */
export function createScopedKey(orgId: string, userId: string, key: string): string {
  return `${STORAGE_PREFIX}:${orgId}:${userId}:${key}`;
}

/**
 * Create a global auth key (not scoped to org/user)
 */
export function createAuthKey(key: string): string {
  return `${STORAGE_PREFIX}:auth:${key}`;
}

/**
 * Get item from scoped localStorage
 */
export function getScopedItem(orgId: string, userId: string, key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(createScopedKey(orgId, userId, key));
}

/**
 * Set item in scoped localStorage
 */
export function setScopedItem(orgId: string, userId: string, key: string, value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(createScopedKey(orgId, userId, key), value);
}

/**
 * Remove item from scoped localStorage
 */
export function removeScopedItem(orgId: string, userId: string, key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(createScopedKey(orgId, userId, key));
}

/**
 * Get auth-related item (not scoped to org/user)
 */
export function getAuthItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(createAuthKey(key));
}

/**
 * Set auth-related item (not scoped to org/user)
 */
export function setAuthItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(createAuthKey(key), value);
}

/**
 * Remove auth-related item
 */
export function removeAuthItem(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(createAuthKey(key));
}

/**
 * Clear all data for a specific user/org combination
 */
export function clearScopedData(orgId: string, userId: string): void {
  if (typeof window === 'undefined') return;
  
  const prefix = createScopedKey(orgId, userId, '');
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

/**
 * Clear all auth data
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  const prefix = `${STORAGE_PREFIX}:auth:`;
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
}