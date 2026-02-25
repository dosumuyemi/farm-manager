import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

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

function writeDB(data: Database) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const db = {
  farms: {
    create: (name: string): Farm => {
      const data = readDB();
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
      return readDB().farms;
    },
    findById: (id: string): Farm | undefined => {
      return readDB().farms.find(f => f.id === id);
    },
  },
  expenses: {
    create: (record: Omit<FinancialRecord, 'id' | 'createdAt'>): FinancialRecord => {
      const data = readDB();
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
      let records = readDB().expenses;
      
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
      const data = readDB();
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
      let records = readDB().eggs;
      
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
