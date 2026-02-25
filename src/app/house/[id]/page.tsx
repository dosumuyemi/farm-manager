'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface AnimalHouse {
  id: string;
  name: string;
  animalType: string;
  category: string;
  quantity: number;
  ageWeeks: number;
  averageWeight?: number;
  weightHistory?: { date: string; weight: number }[];
}

interface Cell {
  id: string;
  houseId: string;
  name: string;
  row: string;
  position: number;
  capacity: number;
  currentCount: number;
  status: 'active' | 'empty' | 'maintenance';
  createdAt: string;
}

interface Note {
  id: string;
  houseId: string | null;
  houseName?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

const DEFAULT_HOUSES: AnimalHouse[] = [
  { id: 'layer-house-1', name: 'Layer house 1', animalType: 'Chicken', category: 'Layers', quantity: 500, ageWeeks: 32 },
  { id: 'layer-house-2', name: 'Layer house 2', animalType: 'Chicken', category: 'Layers', quantity: 300, ageWeeks: 16 },
  { id: 'broiler-house-1', name: 'Broiler house 1', animalType: 'Chicken', category: 'Broilers', quantity: 200, ageWeeks: 6, averageWeight: 2.5 },
  { id: 'broiler-house-2', name: 'Broiler house 2', animalType: 'Chicken', category: 'Broilers', quantity: 200, ageWeeks: 6, averageWeight: 2.3 },
  { id: 'pig-house-1', name: 'Pig house 1', animalType: 'Pig', category: 'Pig', quantity: 25, ageWeeks: 12 },
  { id: 'pig-house-2', name: 'Pig house 2', animalType: 'Pig', category: 'Pig', quantity: 20, ageWeeks: 8 },
  { id: 'pig-house-3', name: 'Pig house 3', animalType: 'Pig', category: 'Pig', quantity: 15, ageWeeks: 4 },
];

const DEFAULT_CELLS = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];

type EntryType = 'expense' | 'income' | 'egg' | 'weight';

export default function HousePage() {
  const router = useRouter();
  const params = useParams();
  const houseId = params.id as string;
  
  const house = DEFAULT_HOUSES.find(h => h.id === houseId);
  const isLayerHouse = house?.category === 'Layers';
  const isBroilerHouse = house?.category === 'Broilers';
  const isPigHouse = house?.category === 'Pig';

  const [entryType, setEntryType] = useState<EntryType>('expense');
  const [loading, setLoading] = useState(false);
  
  const [expenses, setExpenses] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [eggs, setEggs] = useState<any[]>([]);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [weightHistory, setWeightHistory] = useState<{ date: string; weight: number }[]>([]);

  const [cells, setCells] = useState<Cell[]>([]);
  const [showCellModal, setShowCellModal] = useState(false);
  const [editingCell, setEditingCell] = useState<Cell | null>(null);
  const [cellName, setCellName] = useState('');
  const [cellCapacity, setCellCapacity] = useState('50');
  const [cellCurrentCount, setCellCurrentCount] = useState('0');
  const [cellStatus, setCellStatus] = useState<'active' | 'empty' | 'maintenance'>('active');

  const [notes, setNotes] = useState<Note[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    if (houseId) {
      fetchData();
      loadCells();
      loadNotes();
    }
  }, [houseId]);

  const fetchData = async () => {
    const [expRes, incRes, eggRes] = await Promise.all([
      fetch(`/api/expenses?farmId=${houseId}`),
      fetch(`/api/expenses?farmId=${houseId}&type=income`),
      fetch(`/api/eggs?farmId=${houseId}`),
    ]);
    const expData = await expRes.json();
    const incData = await incRes.json();
    const eggData = await eggRes.json();
    
    setExpenses(expData);
    setIncomes(incData.filter((r: any) => r.type === 'income'));
    setEggs(eggData);
    
    if (house) {
      const stored = localStorage.getItem(`weight_${houseId}`);
      if (stored) {
        setWeightHistory(JSON.parse(stored));
      } else if (house.weightHistory) {
        setWeightHistory(house.weightHistory);
      }
    }
  };

  const loadCells = () => {
    const stored = localStorage.getItem(`farm_cells_${houseId}`);
    if (stored) {
      setCells(JSON.parse(stored));
    } else {
      const newCells: Cell[] = DEFAULT_CELLS.map((name, index) => ({
        id: `cell-${houseId}-${index}`,
        houseId,
        name,
        row: name.charAt(0),
        position: parseInt(name.charAt(1)),
        capacity: 50,
        currentCount: 0,
        status: 'empty' as const,
        createdAt: new Date().toISOString(),
      }));
      setCells(newCells);
      localStorage.setItem(`farm_cells_${houseId}`, JSON.stringify(newCells));
    }
  };

  const saveCells = (newCells: Cell[]) => {
    setCells(newCells);
    localStorage.setItem(`farm_cells_${houseId}`, JSON.stringify(newCells));
  };

  const loadNotes = () => {
    const stored = localStorage.getItem('farm_notes');
    if (stored) {
      const allNotes: Note[] = JSON.parse(stored);
      setNotes(allNotes.filter(n => n.houseId === houseId));
    }
  };

  const getAllNotes = (): Note[] => {
    const stored = localStorage.getItem('farm_notes');
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  };

  const saveNotesToStorage = (allNotes: Note[]) => {
    localStorage.setItem('farm_notes', JSON.stringify(allNotes));
  };

  const getThisMonthExpenses = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return expenses.filter(e => e.date >= monthStart).reduce((sum, e) => sum + e.amount, 0);
  };

  const getThisMonthIncome = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return incomes.filter(i => i.date >= monthStart).reduce((sum, i) => sum + i.amount, 0);
  };

  const getTodayEggs = () => {
    const today = new Date().toISOString().split('T')[0];
    return eggs.filter(e => e.date.startsWith(today)).reduce((sum, e) => sum + e.quantity, 0);
  };

  const handleSaveWeight = () => {
    if (!newWeight || !house) return;
    const weight = parseFloat(newWeight);
    const today = new Date().toISOString().split('T')[0];
    
    const updatedHistory = [...weightHistory, { date: today, weight }];
    setWeightHistory(updatedHistory);
    localStorage.setItem(`weight_${houseId}`, JSON.stringify(updatedHistory));
    
    setNewWeight('');
    setShowWeightModal(false);
  };

  const getCurrentWeight = () => {
    if (weightHistory.length > 0) {
      return weightHistory[weightHistory.length - 1].weight;
    }
    return house?.averageWeight || 0;
  };

  const openAddCellModal = () => {
    setCellName('');
    setCellCapacity('50');
    setCellCurrentCount('0');
    setCellStatus('empty');
    setEditingCell(null);
    setShowCellModal(true);
  };

  const openEditCellModal = (cell: Cell) => {
    setCellName(cell.name);
    setCellCapacity(cell.capacity.toString());
    setCellCurrentCount(cell.currentCount.toString());
    setCellStatus(cell.status);
    setEditingCell(cell);
    setShowCellModal(true);
  };

  const handleSaveCell = () => {
    if (!cellName || !cellCapacity) return;
    
    if (editingCell) {
      const updatedCells = cells.map(c =>
        c.id === editingCell.id
          ? {
              ...c,
              name: cellName,
              capacity: parseInt(cellCapacity),
              currentCount: parseInt(cellCurrentCount),
              status: cellStatus,
            }
          : c
      );
      saveCells(updatedCells);
    } else {
      const row = cellName.charAt(0);
      const position = parseInt(cellName.charAt(1));
      const newCell: Cell = {
        id: `cell-${houseId}-${Date.now()}`,
        houseId,
        name: cellName,
        row,
        position,
        capacity: parseInt(cellCapacity),
        currentCount: parseInt(cellCurrentCount),
        status: cellStatus,
        createdAt: new Date().toISOString(),
      };
      saveCells([...cells, newCell]);
    }
    
    setShowCellModal(false);
  };

  const handleDeleteCell = (cellId: string) => {
    if (confirm('Delete this cell?')) {
      saveCells(cells.filter(c => c.id !== cellId));
    }
  };

  const getCellStatusColor = (cell: Cell) => {
    if (cell.status === 'maintenance') return 'bg-yellow-100 border-yellow-400';
    if (cell.currentCount === 0) return 'bg-gray-100 border-gray-300';
    if (cell.currentCount >= cell.capacity) return 'bg-red-100 border-red-400';
    return 'bg-green-100 border-green-400';
  };

  const getCellStatusBadge = (cell: Cell) => {
    if (cell.status === 'maintenance') return 'bg-yellow-500';
    if (cell.currentCount === 0) return 'bg-gray-400';
    if (cell.currentCount >= cell.capacity) return 'bg-red-500';
    return 'bg-green-500';
  };

  // Note handlers
  const openAddNoteModal = () => {
    setNoteContent('');
    setEditingNote(null);
    setShowNoteModal(true);
  };

  const openEditNoteModal = (note: Note) => {
    setNoteContent(note.content);
    setEditingNote(note);
    setShowNoteModal(true);
  };

  const handleSaveNote = () => {
    if (!noteContent.trim()) return;
    
    const allNotes = getAllNotes();
    
    if (editingNote) {
      const updatedNotes = allNotes.map(n =>
        n.id === editingNote.id
          ? { ...n, content: noteContent, updatedAt: new Date().toISOString() }
          : n
      );
      saveNotesToStorage(updatedNotes);
      setNotes(updatedNotes.filter(n => n.houseId === houseId));
    } else {
      const newNote: Note = {
        id: `note-${Date.now()}`,
        content: noteContent,
        houseId,
        houseName: house?.name,
        createdAt: new Date().toISOString(),
      };
      const updatedNotes = [...allNotes, newNote];
      saveNotesToStorage(updatedNotes);
      setNotes([...notes, newNote]);
    }
    
    setShowNoteModal(false);
    setNoteContent('');
    setEditingNote(null);
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Delete this note?')) {
      const allNotes = getAllNotes();
      const updatedNotes = allNotes.filter(n => n.id !== noteId);
      saveNotesToStorage(updatedNotes);
      setNotes(notes.filter(n => n.id !== noteId));
    }
  };

  // Form states
  const [amount, setAmount] = useState('');
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [cageNo, setCageNo] = useState('');
  const [quantity, setQuantity] = useState('');
  const [cracks, setCracks] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (entryType === 'egg') {
        await fetch('/api/eggs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ farmId: houseId, cageNo, quantity, cracks: cracks || 0 }),
        });
        setCageNo(''); setQuantity(''); setCracks('');
      } else if (entryType === 'weight') {
        const weight = parseFloat(newWeight);
        const today = new Date().toISOString().split('T')[0];
        const updatedHistory = [...weightHistory, { date: today, weight }];
        setWeightHistory(updatedHistory);
        localStorage.setItem(`weight_${houseId}`, JSON.stringify(updatedHistory));
        setNewWeight('');
      } else {
        await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            farmId: houseId, 
            amount, 
            sender: entryType === 'expense' ? sender : '',
            receiver: entryType === 'expense' ? receiver : '',
            purpose: entryType === 'expense' ? purpose : description,
            type: entryType 
          }),
        });
        setAmount(''); setSender(''); setReceiver(''); setPurpose(''); setDescription('');
      }
      fetchData();
      alert('Entry saved!');
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!house) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => router.push('/')} className="text-gray-600">←</button>
            <h1 className="text-2xl font-bold">House Not Found</h1>
          </div>
        </div>
      </div>
    );
  }

  const sortedCells = [...cells].sort((a, b) => {
    if (a.row !== b.row) return a.row.localeCompare(b.row);
    return a.position - b.position;
  });

  const rows = ['A', 'B', 'C'];
  const cellsByRow = rows.map(row => sortedCells.filter(c => c.row === row));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => router.push('/')} className="text-gray-600 text-xl">←</button>
          <h1 className="text-2xl font-bold">{house.name}</h1>
        </div>

        {/* House Info Card */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Type of Animal</p>
              <p className="font-medium">{house.animalType} ({house.category})</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">No. of Animals</p>
              <p className="font-medium">{house.quantity}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Age</p>
              <p className="font-medium">{house.ageWeeks} weeks</p>
            </div>
            {isBroilerHouse && (
              <div>
                <p className="text-xs text-gray-500">Avg Weight</p>
                <p className="font-medium">{getCurrentWeight()} kg</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {isLayerHouse && (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600">Today&apos;s Eggs</p>
              <p className="text-2xl font-bold">{getTodayEggs()}</p>
            </div>
          )}
          
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600">This Month Income</p>
            <p className="text-lg font-bold">₦{getThisMonthIncome().toLocaleString()}</p>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-600">This Month Expenses</p>
            <p className="text-lg font-bold">₦{getThisMonthExpenses().toLocaleString()}</p>
          </div>

          {isBroilerHouse && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Weight</p>
              <p className="text-lg font-bold">{getCurrentWeight()} kg</p>
              <button 
                onClick={() => setShowWeightModal(true)}
                className="text-xs text-blue-500 underline mt-1"
              >
                Update
              </button>
            </div>
          )}
        </div>

        {/* Cells Section */}
        <div className="bg-white rounded-lg shadow mb-4">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-bold">CELLS ({cells.length})</h2>
            <button 
              onClick={openAddCellModal}
              className="text-green-600 font-medium text-sm"
            >
              + Add Cell
            </button>
          </div>
          
          <div className="p-4">
            {cellsByRow.map((rowCells, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-3 gap-2 mb-2">
                {rowCells.map((cell) => {
                  const percentage = cell.capacity > 0 ? (cell.currentCount / cell.capacity) * 100 : 0;
                  return (
                    <div 
                      key={cell.id}
                      onClick={() => openEditCellModal(cell)}
                      className={`p-2 rounded-lg border-2 cursor-pointer ${getCellStatusColor(cell)}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm">{cell.name}</span>
                        <span className={`w-2 h-2 rounded-full ${getCellStatusBadge(cell)}`}></span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                        <div 
                          className={`h-2 rounded-full ${percentage >= 100 ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600">{cell.currentCount}/{cell.capacity}</p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Entry Form */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="font-bold mb-3">Add Entry</h2>
          
          {/* Entry Type Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setEntryType('expense')}
              className={`flex-1 py-2 rounded-lg font-medium text-sm ${entryType === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Expense
            </button>
            <button
              onClick={() => setEntryType('income')}
              className={`flex-1 py-2 rounded-lg font-medium text-sm ${entryType === 'income' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Income
            </button>
            {(isLayerHouse) && (
              <button
                onClick={() => setEntryType('egg')}
                className={`flex-1 py-2 rounded-lg font-medium text-sm ${entryType === 'egg' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Eggs
              </button>
            )}
            {isBroilerHouse && (
              <button
                onClick={() => setEntryType('weight')}
                className={`flex-1 py-2 rounded-lg font-medium text-sm ${entryType === 'weight' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Weight
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {entryType === 'expense' && (
              <>
                <input type="number" placeholder="Amount (₦)" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-3 border rounded-lg text-sm" required />
                <input type="text" placeholder="Sender" value={sender} onChange={(e) => setSender(e.target.value)} className="w-full p-3 border rounded-lg text-sm" required />
                <input type="text" placeholder="Receiver" value={receiver} onChange={(e) => setReceiver(e.target.value)} className="w-full p-3 border rounded-lg text-sm" required />
                <input type="text" placeholder="Purpose (e.g., Feed, Medicine)" value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full p-3 border rounded-lg text-sm" required />
              </>
            )}

            {entryType === 'income' && (
              <>
                <input type="number" placeholder="Amount (₦)" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-3 border rounded-lg text-sm" required />
                <input type="text" placeholder="Received From" value={sender} onChange={(e) => setSender(e.target.value)} className="w-full p-3 border rounded-lg text-sm" required />
                <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 border rounded-lg text-sm" required />
              </>
            )}

            {entryType === 'egg' && isLayerHouse && (
              <>
                <input type="text" placeholder="Cell (e.g., A1, B2)" value={cageNo} onChange={(e) => setCageNo(e.target.value.toUpperCase())} className="w-full p-3 border rounded-lg text-sm" required />
                <input type="number" placeholder="Eggs Collected" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full p-3 border rounded-lg text-sm" required />
                <input type="number" placeholder="Cracks/Broken (optional)" value={cracks} onChange={(e) => setCracks(e.target.value)} className="w-full p-3 border rounded-lg text-sm" />
              </>
            )}

            {entryType === 'weight' && isBroilerHouse && (
              <>
                <input 
                  type="number" 
                  step="0.1"
                  placeholder="Average Weight (kg)" 
                  value={newWeight} 
                  onChange={(e) => setNewWeight(e.target.value)} 
                  className="w-full p-3 border rounded-lg text-sm" 
                  required 
                />
              </>
            )}

            <button type="submit" disabled={loading} className="w-full py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Entry'}
            </button>
          </form>
        </div>

        {/* Notes Section for House */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-bold">NOTES</h2>
            <button 
              onClick={openAddNoteModal}
              className="text-green-600 font-medium text-sm"
            >
              + Add Note
            </button>
          </div>
          
          <div className="p-4">
            {notes.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No notes for this house</p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="py-3 border-b last:border-0">
                  <p className="text-sm">{note.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => openEditNoteModal(note)} className="text-blue-600 text-sm">Edit</button>
                    <button onClick={() => handleDeleteNote(note.id)} className="text-red-600 text-sm">Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Cell Modal */}
      {showCellModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingCell ? 'Edit Cell' : 'Add Cell'}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cell Name</label>
                <input 
                  type="text" 
                  value={cellName} 
                  onChange={(e) => setCellName(e.target.value.toUpperCase())} 
                  placeholder="e.g., A1, B2"
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input 
                  type="number" 
                  value={cellCapacity} 
                  onChange={(e) => setCellCapacity(e.target.value)} 
                  placeholder="Max animals"
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Count</label>
                <input 
                  type="number" 
                  value={cellCurrentCount} 
                  onChange={(e) => setCellCurrentCount(e.target.value)} 
                  placeholder="Current animals"
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  value={cellStatus} 
                  onChange={(e) => setCellStatus(e.target.value as 'active' | 'empty' | 'maintenance')} 
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="active">Active</option>
                  <option value="empty">Empty</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => { 
                  if (editingCell && confirm('Delete this cell?')) {
                    handleDeleteCell(editingCell.id);
                  }
                  setShowCellModal(false); 
                }} 
                className="py-3 bg-red-100 text-red-600 rounded-lg font-medium px-4"
              >
                {editingCell ? 'Delete' : ''}
              </button>
              <button 
                onClick={() => setShowCellModal(false)} 
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveCell} 
                disabled={!cellName || !cellCapacity}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {editingCell ? 'Update' : 'Add'} Cell
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingNote ? 'Edit Note' : 'Add Note'}</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea 
                value={noteContent} 
                onChange={(e) => setNoteContent(e.target.value)} 
                placeholder="Write your note here..."
                rows={4}
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => { setShowNoteModal(false); setNoteContent(''); setEditingNote(null); }} 
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveNote} 
                disabled={!noteContent.trim()}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {editingNote ? 'Update' : 'Add'} Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weight Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Update Average Weight</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Average Weight (kg)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={newWeight} 
                  onChange={(e) => setNewWeight(e.target.value)} 
                  placeholder="e.g., 2.8"
                  className="w-full p-3 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => { setNewWeight(''); setShowWeightModal(false); }} 
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveWeight} 
                disabled={!newWeight}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                Save Weight
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
