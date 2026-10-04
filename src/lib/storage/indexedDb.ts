import { Conversation, Message, DocumentFile, Project, UserPreferences, SyncOperation, DashboardData, ReportData } from '../../types';

const DB_NAME = 'aether_genai_db';
const DB_VERSION = 1;

class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('conversations')) {
          const convStore = db.createObjectStore('conversations', { keyPath: 'id' });
          convStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          convStore.createIndex('projectId', 'projectId', { unique: false });
        }

        if (!db.objectStoreNames.contains('messages')) {
          const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
          msgStore.createIndex('conversationId', 'conversationId', { unique: false });
          msgStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'id' });
          fileStore.createIndex('uploadedAt', 'uploadedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('dashboards')) {
          db.createObjectStore('dashboards', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('reports')) {
          db.createObjectStore('reports', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await this.initDB();
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    try {
      const store = await this.getStore('conversations');
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const convs = (request.result || []) as Conversation[];
          convs.sort((a, b) => b.updatedAt - a.updatedAt);
          resolve(convs);
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  }

  async getAllConversations(): Promise<Conversation[]> {
    return this.getConversations();
  }

  async saveConversation(conv: Conversation): Promise<void> {
    const store = await this.getStore('conversations', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(conv);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteConversation(id: string): Promise<void> {
    const store = await this.getStore('conversations', 'readwrite');
    const msgStore = await this.getStore('messages', 'readwrite');

    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => {
        const index = msgStore.index('conversationId');
        const msgReq = index.getAll(id);
        msgReq.onsuccess = () => {
          const msgs = msgReq.result as Message[];
          msgs.forEach((m) => msgStore.delete(m.id));
          resolve();
        };
        msgReq.onerror = () => resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  // Messages
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const store = await this.getStore('messages');
      const index = store.index('conversationId');
      return new Promise((resolve, reject) => {
        const request = index.getAll(conversationId);
        request.onsuccess = () => {
          const msgs = (request.result || []) as Message[];
          msgs.sort((a, b) => a.timestamp - b.timestamp);
          resolve(msgs);
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  }

  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    return this.getMessages(conversationId);
  }

  async saveMessage(msg: Message): Promise<void> {
    const store = await this.getStore('messages', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(msg);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMessage(id: string): Promise<void> {
    const store = await this.getStore('messages', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Documents & Files
  async getFiles(): Promise<DocumentFile[]> {
    try {
      const store = await this.getStore('files');
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const files = (request.result || []) as DocumentFile[];
          files.sort((a, b) => (b.updatedAt || b.uploadedAt || 0) - (a.updatedAt || a.uploadedAt || 0));
          resolve(files);
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  }

  async getAllDocuments(): Promise<DocumentFile[]> {
    return this.getFiles();
  }

  async saveFile(file: DocumentFile): Promise<void> {
    const store = await this.getStore('files', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(file);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveDocument(file: DocumentFile): Promise<void> {
    return this.saveFile(file);
  }

  async deleteFile(id: string): Promise<void> {
    const store = await this.getStore('files', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteDocument(id: string): Promise<void> {
    return this.deleteFile(id);
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    try {
      const store = await this.getStore('projects');
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve((request.result || []) as Project[]);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  }

  async getAllProjects(): Promise<Project[]> {
    return this.getProjects();
  }

  async saveProject(project: Project): Promise<void> {
    const store = await this.getStore('projects', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(project);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProject(id: string): Promise<void> {
    const store = await this.getStore('projects', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Dashboards & Reports
  async getDashboards(): Promise<DashboardData[]> {
    try {
      const store = await this.getStore('dashboards');
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve((request.result || []) as DashboardData[]);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  }

  async saveDashboard(dashboard: DashboardData): Promise<void> {
    const store = await this.getStore('dashboards', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(dashboard);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getReports(): Promise<ReportData[]> {
    try {
      const store = await this.getStore('reports');
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve((request.result || []) as ReportData[]);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  }

  async saveReport(report: ReportData): Promise<void> {
    const store = await this.getStore('reports', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(report);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Preferences
  async getPreferences(): Promise<UserPreferences | null> {
    try {
      const store = await this.getStore('preferences');
      return new Promise((resolve, reject) => {
        const request = store.get('user_prefs');
        request.onsuccess = () => {
          resolve(request.result?.value || null);
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  }

  async savePreferences(prefs: UserPreferences): Promise<void> {
    const store = await this.getStore('preferences', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put({ key: 'user_prefs', value: prefs });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync Queue for Offline Operations
  async addSyncOperation(op: Omit<SyncOperation, 'id' | 'timestamp' | 'synced'>): Promise<void> {
    const store = await this.getStore('syncQueue', 'readwrite');
    const fullOp: SyncOperation = {
      ...op,
      id: 'sync_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      timestamp: Date.now(),
      synced: false,
    };
    return new Promise((resolve, reject) => {
      const request = store.put(fullOp);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSyncOperations(): Promise<SyncOperation[]> {
    try {
      const store = await this.getStore('syncQueue');
      const index = store.index('synced');
      return new Promise((resolve, reject) => {
        const request = index.getAll(IDBKeyRange.only(false));
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  }

  async markOperationsSynced(ids: string[]): Promise<void> {
    const store = await this.getStore('syncQueue', 'readwrite');
    for (const id of ids) {
      store.delete(id);
    }
  }

  async clearAllData(): Promise<void> {
    const db = await this.initDB();
    const storeNames = ['conversations', 'messages', 'files', 'projects', 'dashboards', 'reports', 'syncQueue'];
    const tx = db.transaction(storeNames, 'readwrite');
    for (const name of storeNames) {
      tx.objectStore(name).clear();
    }
  }

  async clearAll(): Promise<void> {
    return this.clearAllData();
  }
}

export const localDb = new IndexedDBStorage();
