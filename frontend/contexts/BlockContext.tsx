import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { blockService } from '../services/block.service';

interface BlockContextType {
  blockedUserIds: Set<string>;
  isLoading: boolean;
  blockUser: (userId: string) => Promise<boolean>;
  unblockUser: (userId: string) => Promise<boolean>;
  isUserBlocked: (userId: string) => boolean;
  refreshBlockedUsers: () => Promise<void>;
}

const BlockContext = createContext<BlockContextType | undefined>(undefined);

export function BlockProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Load blocked users when user authenticates
  useEffect(() => {
    if (user) {
      loadBlockedUsers();
    } else {
      // Clear blocked users when logged out
      setBlockedUserIds(new Set());
    }
  }, [user?.id]);

  const loadBlockedUsers = async () => {
    setIsLoading(true);
    try {
      const result = await blockService.fetchBlockedUserIds();
      if (result.success && result.data) {
        setBlockedUserIds(new Set(result.data));
        if (__DEV__) {
          console.log('[BlockContext] Loaded blocked users:', result.data.length);
        }
      } else {
        if (__DEV__) {
          console.warn('[BlockContext] Failed to load blocked users:', result.error);
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[BlockContext] Error loading blocked users:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const blockUser = async (userId: string): Promise<boolean> => {
    try {
      const result = await blockService.blockUser(userId);
      if (result.success) {
        // Optimistically update local state
        setBlockedUserIds(prev => new Set([...prev, userId]));
        if (__DEV__) {
          console.log('[BlockContext] Blocked user:', userId);
        }
        return true;
      } else {
        if (__DEV__) {
          console.warn('[BlockContext] Failed to block user:', result.error);
        }
        return false;
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[BlockContext] Error blocking user:', error);
      }
      return false;
    }
  };

  const unblockUser = async (userId: string): Promise<boolean> => {
    try {
      const result = await blockService.unblockUser(userId);
      if (result.success) {
        // Optimistically update local state
        setBlockedUserIds(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
        if (__DEV__) {
          console.log('[BlockContext] Unblocked user:', userId);
        }
        return true;
      } else {
        if (__DEV__) {
          console.warn('[BlockContext] Failed to unblock user:', result.error);
        }
        return false;
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[BlockContext] Error unblocking user:', error);
      }
      return false;
    }
  };

  const isUserBlocked = (userId: string): boolean => {
    return blockedUserIds.has(userId);
  };

  const refreshBlockedUsers = async () => {
    await loadBlockedUsers();
  };

  const value: BlockContextType = {
    blockedUserIds,
    isLoading,
    blockUser,
    unblockUser,
    isUserBlocked,
    refreshBlockedUsers,
  };

  return <BlockContext.Provider value={value}>{children}</BlockContext.Provider>;
}

export function useBlock() {
  const context = useContext(BlockContext);
  if (context === undefined) {
    throw new Error('useBlock must be used within a BlockProvider');
  }
  return context;
}
