import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');
const CACHE_TTL = 1000; // 1 second cache

interface Farm {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface FinancialRecord {
  id: string;
  farmId: string;
  date: string;
  amount: number;
  sender: string;
  receiver: string;
  purpose: string;
  description: string;
  type: string;
  createdAt: string;
}

interface EggRecord {
  id: string;
  farmId: string;
  date: string;
  cageNo: string;
  quantity: number;
  cracks: number;
  temperature?: number;
  humidity?: number;
  notes?: string;
  createdAt: string;
}

interface Database {
  farms: Farm[];
  expenses: FinancialRecord[];
  eggs: EggRecord[];
}

interface CacheEntry {
  data: Database;
  timestamp: number;
}

let dbCache: CacheEntry | null = null;

function readDB(): Database {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { farms: [], expenses: [], eggs: [] };
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch {
    return { farms: [], expenses: [], eggs: [] };
  }
}

function getCachedDB(): Database {
  const now = Date.now();
  if (dbCache && now - dbCache.timestamp < CACHE_TTL) {
    return dbCache.data;
  }
  const data = readDB();
  dbCache = { data, timestamp: now };
  return data;
}

function invalidateCache() {
  dbCache = null;
}

function writeDB(data: Database) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  invalidateCache();
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const db = {
  farms: {
    create: (name: string): Farm => {
      const data = getCachedDB();
      const farm: Farm = {
        id: generateId(),
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.farms.push(farm);
      writeDB(data);
      return farm;
    },
    findMany: (): Farm[] => {
      return getCachedDB().farms;
    },
    findById: (id: string): Farm | undefined => {
      return getCachedDB().farms.find(f => f.id === id);
    },
  },
  expenses: {
    create: (record: Omit<FinancialRecord, 'id' | 'createdAt'>): FinancialRecord => {
      const data = getCachedDB();
      const expense: FinancialRecord = {
        ...record,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      data.expenses.push(expense);
      writeDB(data);
      return expense;
    },
    findMany: (filters?: { farmId?: string; type?: string; month?: string; year?: string; startDate?: string; endDate?: string }): FinancialRecord[] => {
      let records = getCachedDB().expenses;
      
      if (filters?.farmId) {
        records = records.filter(e => e.farmId === filters.farmId);
      }
      if (filters?.type && filters.type !== 'income') {
        records = records.filter(e => e.type === filters.type);
      }
      if (filters?.startDate) {
        records = records.filter(e => e.date >= filters.startDate!);
      }
      if (filters?.endDate) {
        records = records.filter(e => e.date <= filters.endDate!);
      }
      if (filters?.month && filters?.year) {
        const month = parseInt(filters.month);
        const year = parseInt(filters.year);
        records = records.filter(e => {
          const d = new Date(e.date);
          return d.getMonth() + 1 === month && d.getFullYear() === year;
        });
      }
      return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
  },
  eggs: {
    create: (record: Omit<EggRecord, 'id' | 'createdAt'>): EggRecord => {
      const data = getCachedDB();
      const egg: EggRecord = {
        ...record,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      data.eggs.push(egg);
      writeDB(data);
      return egg;
    },
    findMany: (filters?: { farmId?: string; cageNo?: string; month?: string; year?: string }): EggRecord[] => {
      let records = getCachedDB().eggs;
      
      if (filters?.farmId) {
        records = records.filter(e => e.farmId === filters.farmId);
      }
      if (filters?.cageNo) {
        records = records.filter(e => e.cageNo === filters.cageNo);
      }
      if (filters?.month && filters?.year) {
        const month = parseInt(filters.month);
        const year = parseInt(filters.year);
        records = records.filter(e => {
          const d = new Date(e.date);
          return d.getMonth() + 1 === month && d.getFullYear() === year;
        });
      }
      return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
  },
};
