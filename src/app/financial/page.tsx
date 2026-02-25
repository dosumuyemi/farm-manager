'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface FinancialRecord {
  id: string;
  amount: number;
  sender: string;
  receiver: string;
  purpose: string;
  description: string;
  type: string;
  date: string;
}

type DateFilter = 'week' | 'month' | 'year';

const ANIMAL_HOUSES = [
  { id: 'chicken-house-1', name: 'Chicken House 1', type: 'chicken' },
  { id: 'chicken-house-2', name: 'Chicken House 2', type: 'chicken' },
  { id: 'pig-pen', name: 'Pig Pen', type: 'pig' },
  { id: 'goat-pen', name: 'Goat Pen', type: 'goat' },
];

export default function FinancialPage() {
  const router = useRouter();
  const [selectedHouse, setSelectedHouse] = useState<string>(ANIMAL_HOUSES[0].id);
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [selectedHouse, dateFilter]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (dateFilter) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }
    
    return {
      start: startDate.toISOString(),
      end: now.toISOString()
    };
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const res = await fetch(`/api/expenses?farmId=${selectedHouse}&startDate=${start}&endDate=${end}`);
      const data = await res.json();
      setRecords(data);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { start, end } = getDateRange();
      const res = await fetch(`/api/expenses/export?farmId=${selectedHouse}&startDate=${start}&endDate=${end}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-${dateFilter}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting:', error);
    } finally {
      setExporting(false);
    }
  };

  const incomeRecords = records.filter(r => r.type === 'income');
  const expenseRecords = records.filter(r => r.type === 'expense');
  const totalIncome = incomeRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = expenseRecords.reduce((sum, r) => sum + r.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const groupedByDate = (recordList: FinancialRecord[]) => {
    const grouped: { [key: string]: FinancialRecord[] } = {};
    recordList.forEach(record => {
      const dateKey = formatDate(record.date);
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(record);
    });
    return grouped;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => router.push('/')} className="text-gray-600">←</button>
          <h1 className="text-2xl font-bold">Financial Records</h1>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Animal House</label>
          <select
            value={selectedHouse}
            onChange={(e) => setSelectedHouse(e.target.value)}
            className="w-full p-2 border rounded-lg mb-3"
          >
            {ANIMAL_HOUSES.map((house) => (
              <option key={house.id} value={house.id}>{house.name}</option>
            ))}
          </select>

          <div className="flex gap-2">
            {(['week', 'month', 'year'] as DateFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  dateFilter === filter 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full mt-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <p className="text-xs text-green-600">Income</p>
            <p className="font-bold text-green-700">₦{totalIncome.toLocaleString()}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <p className="text-xs text-red-600">Expense</p>
            <p className="font-bold text-red-700">₦{totalExpense.toLocaleString()}</p>
          </div>
          <div className={`p-3 rounded-lg text-center ${netProfit >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
            <p className={`text-xs ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Net</p>
            <p className={`font-bold ${netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              ₦{netProfit.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Records List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-4">
            {/* Income Section */}
            {incomeRecords.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="bg-green-50 px-4 py-2 rounded-t-lg">
                  <h2 className="font-bold text-green-700">Income ({incomeRecords.length})</h2>
                </div>
                <div className="p-4">
                  {Object.entries(groupedByDate(incomeRecords)).map(([date, items]) => (
                    <div key={date} className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">{date}</p>
                      {items.map((record) => (
                        <div key={record.id} className="flex justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium">{record.purpose || record.description}</p>
                            <p className="text-xs text-gray-500">From: {record.sender || '-'}</p>
                          </div>
                          <p className="font-bold text-green-600">₦{record.amount.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expense Section */}
            {expenseRecords.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="bg-red-50 px-4 py-2 rounded-t-lg">
                  <h2 className="font-bold text-red-700">Expenses ({expenseRecords.length})</h2>
                </div>
                <div className="p-4">
                  {Object.entries(groupedByDate(expenseRecords)).map(([date, items]) => (
                    <div key={date} className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">{date}</p>
                      {items.map((record) => (
                        <div key={record.id} className="flex justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium">{record.purpose}</p>
                            <p className="text-xs text-gray-500">{record.sender} → {record.receiver}</p>
                          </div>
                          <p className="font-bold text-red-600">₦{record.amount.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {records.length === 0 && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-400">No records found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
