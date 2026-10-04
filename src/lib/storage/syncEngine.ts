import { localDb } from './indexedDb';
import { Conversation, Message, DocumentFile, SyncOperation } from '../../types';

export class SyncEngine {
  private isOnlineStatus: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: ((isOnline: boolean) => void)[] = [];
  private isSyncing: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnlineChange(true));
      window.addEventListener('offline', () => this.handleOnlineChange(false));
    }
  }

  isOnline(): boolean {
    return this.isOnlineStatus;
  }

  onOnlineChange(cb: (isOnline: boolean) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private handleOnlineChange(online: boolean) {
    this.isOnlineStatus = online;
    this.listeners.forEach((l) => l(online));
    if (online) {
      this.flushSyncQueue();
    }
  }

  // Trigger sync of queued offline operations
  async flushSyncQueue(): Promise<{ successCount: number; failedCount: number }> {
    if (this.isSyncing || !this.isOnlineStatus) {
      return { successCount: 0, failedCount: 0 };
    }

    this.isSyncing = true;
    let successCount = 0;
    let failedCount = 0;

    try {
      const pendingOps = await localDb.getPendingSyncOperations();
      if (pendingOps.length === 0) {
        this.isSyncing = false;
        return { successCount: 0, failedCount: 0 };
      }

      // Send to server sync batch endpoint
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations: pendingOps }),
      });

      if (res.ok) {
        const syncedIds = pendingOps.map((op) => op.id);
        await localDb.markOperationsSynced(syncedIds);
        successCount = pendingOps.length;
      } else {
        failedCount = pendingOps.length;
      }
    } catch {
      failedCount = 1;
    } finally {
      this.isSyncing = false;
    }

    return { successCount, failedCount };
  }

  // Record an offline-safe change
  async recordChange(type: SyncOperation['type'], entityId: string, payload: any): Promise<void> {
    await localDb.addSyncOperation({
      type,
      entityId,
      payload,
    });

    if (this.isOnlineStatus) {
      this.flushSyncQueue();
    }
  }
}

export const syncEngine = new SyncEngine();
