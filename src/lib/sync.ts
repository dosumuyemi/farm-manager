import { supabase, isSupabaseConfigured } from './supabase';

const OFFLINE_QUEUE_KEY = 'farm_sync_queue';

interface SyncQueueItem {
  id: string;
  table: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export const syncService = {
  isOnline: () => typeof navigator !== 'undefined' ? navigator.onLine : true,

  // Queue operations for offline sync
  addToQueue: (table: string, action: 'create' | 'update' | 'delete', data: any) => {
    if (!isSupabaseConfigured) return;
    
    const queue = syncService.getQueue();
    queue.push({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      table,
      action,
      data,
      timestamp: Date.now(),
    });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  },

  getQueue: (): SyncQueueItem[] => {
    if (typeof window === 'undefined') return [];
    const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  },

  clearQueue: () => {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  },

  // Process queued operations
  processQueue: async () => {
    if (!isSupabaseConfigured || !syncService.isOnline()) return;
    
    const queue = syncService.getQueue();
    if (queue.length === 0) return;

    const failedItems: SyncQueueItem[] = [];

    for (const item of queue) {
      try {
        await syncService.syncItem(item);
      } catch (error) {
        console.error('Sync failed for item:', item, error);
        failedItems.push(item);
      }
    }

    // Keep failed items in queue
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failedItems));
  },

  syncItem: async (item: SyncQueueItem) => {
    if (!supabase) throw new Error('Supabase not configured');

    const { table, action, data } = item;

    switch (table) {
      case 'animal_houses':
        if (action === 'create') {
          await supabase.from('animal_houses').insert(data);
        } else if (action === 'update') {
          await supabase.from('animal_houses').update(data).eq('id', data.id);
        } else if (action === 'delete') {
          await supabase.from('animal_houses').delete().eq('id', data.id);
        }
        break;

      case 'cells':
        if (action === 'create') {
          await supabase.from('cells').insert(data);
        } else if (action === 'update') {
          await supabase.from('cells').update(data).eq('id', data.id);
        } else if (action === 'delete') {
          await supabase.from('cells').delete().eq('id', data.id);
        }
        break;

      case 'financial_records':
        if (action === 'create') {
          await supabase.from('financial_records').insert(data);
        }
        break;

      case 'egg_records':
        if (action === 'create') {
          await supabase.from('egg_records').insert(data);
        }
        break;

      case 'weight_records':
        if (action === 'create') {
          await supabase.from('weight_records').insert(data);
        }
        break;

      case 'tasks':
        if (action === 'create') {
          await supabase.from('tasks').insert(data);
        } else if (action === 'update') {
          await supabase.from('tasks').update(data).eq('id', data.id);
        } else if (action === 'delete') {
          await supabase.from('tasks').delete().eq('id', data.id);
        }
        break;

      case 'notes':
        if (action === 'create') {
          await supabase.from('notes').insert(data);
        } else if (action === 'update') {
          await supabase.from('notes').update(data).eq('id', data.id);
        } else if (action === 'delete') {
          await supabase.from('notes').delete().eq('id', data.id);
        }
        break;
    }
  },

  // Fetch all data from Supabase
  fetchFromCloud: async (table: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data, error } = await supabase.from(table).select('*');
    if (error) throw error;
    return data;
  },

  // Initial sync - fetch from cloud and merge with local
  initialSync: async () => {
    if (!isSupabaseConfigured || !syncService.isOnline()) return;

    try {
      // Fetch and merge each table
      const tables = [
        'animal_houses',
        'cells', 
        'financial_records',
        'egg_records',
        'weight_records',
        'tasks',
        'notes'
      ];

      for (const table of tables) {
        const cloudData = await syncService.fetchFromCloud(table);
        if (cloudData && cloudData.length > 0) {
          localStorage.setItem(`farm_cloud_${table}`, JSON.stringify(cloudData));
        }
      }

      // Process any queued items
      await syncService.processQueue();
    } catch (error) {
      console.error('Initial sync failed:', error);
    }
  },

  // Listen for real-time changes
  subscribe: (table: string, callback: (payload: any) => void) => {
    if (!supabase) return () => {};

    const subscription = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(subscription);
      }
    };
  },
};
