'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

interface Note {
  id: string;
  houseId: string | null;
  houseName?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

interface Task {
  id: string;
  name: string;
  dueDate: string;
  priority: string;
  frequency: string;
  status: string;
}

const DEFAULT_HOUSES: AnimalHouse[] = [
  { id: 'layer-house-1', name: 'Layer house 1', animalType: 'Chicken', category: 'Layers', quantity: 500, ageWeeks: 32 },
  { id: 'layer-house-2', name: 'Layer house 2', animalType: 'Chicken', category: 'Layers', quantity: 300, ageWeeks: 16 },
  { id: 'broiler-house-1', name: 'Broiler house 1', animalType: 'Chicken', category: 'Broilers', quantity: 200, ageWeeks: 6, averageWeight: 2.5, weightHistory: [{ date: '2026-02-18', weight: 2.0 }, { date: '2026-02-25', weight: 2.5 }] },
  { id: 'broiler-house-2', name: 'Broiler house 2', animalType: 'Chicken', category: 'Broilers', quantity: 200, ageWeeks: 6, averageWeight: 2.3, weightHistory: [{ date: '2026-02-18', weight: 1.8 }, { date: '2026-02-25', weight: 2.3 }] },
  { id: 'pig-house-1', name: 'Pig house 1', animalType: 'Pig', category: 'Pig', quantity: 25, ageWeeks: 12 },
  { id: 'pig-house-2', name: 'Pig house 2', animalType: 'Pig', category: 'Pig', quantity: 20, ageWeeks: 8 },
  { id: 'pig-house-3', name: 'Pig house 3', animalType: 'Pig', category: 'Pig', quantity: 15, ageWeeks: 4 },
];

const DEFAULT_CELLS = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];

export default function Dashboard() {
  const router = useRouter();
  
  const [houses, setHouses] = useState<AnimalHouse[]>(DEFAULT_HOUSES);
  const [expandedHouse, setExpandedHouse] = useState<string | null>(null);
  const [weightData, setWeightData] = useState<Record<string, { date: string; weight: number }[]>>({});
  
  const [expenses, setExpenses] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [eggsCollected, setEggsCollected] = useState<any[]>([]);
  const [eggsSold, setEggsSold] = useState(0);
  
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', name: 'Feed chickens', dueDate: '2026-02-25', priority: 'High', frequency: 'Recurring', status: 'Pending' },
    { id: '2', name: 'Clean pig house', dueDate: '2026-02-26', priority: 'Medium', frequency: 'One-off', status: 'Pending' },
  ]);
  
  const [notes, setNotes] = useState<Note[]>([]);
  
  const [showFinancial, setShowFinancial] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // House modals
  const [showAddHouseModal, setShowAddHouseModal] = useState(false);
  const [showEditHouseModal, setShowEditHouseModal] = useState(false);
  const [editingHouse, setEditingHouse] = useState<AnimalHouse | null>(null);
  
  // Note modal
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteHouseId, setNoteHouseId] = useState<string>('');
  
  // House form states
  const [houseName, setHouseName] = useState('');
  const [houseAnimalType, setHouseAnimalType] = useState('Chicken');
  const [houseCategory, setHouseCategory] = useState('Layers');
  const [houseQuantity, setHouseQuantity] = useState('');
  const [houseAgeWeeks, setHouseAgeWeeks] = useState('');
  const [houseAverageWeight, setHouseAverageWeight] = useState('');
  
  const [taskName, setTaskName] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<string>('Medium');
  const [taskFrequency, setTaskFrequency] = useState<string>('One-off');

  const [amount, setAmount] = useState('');
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFromStorage();
    fetchData();
  }, []);

  const loadFromStorage = () => {
    const storedHouses = localStorage.getItem('farm_houses');
    if (storedHouses) {
      setHouses(JSON.parse(storedHouses));
    }
    
    const storedNotes = localStorage.getItem('farm_notes');
    if (storedNotes) {
      setNotes(JSON.parse(storedNotes));
    }
    
    const storedWeightData = localStorage.getItem('farm_weight_data');
    if (storedWeightData) {
      setWeightData(JSON.parse(storedWeightData));
    }
  };

  const saveHouses = (newHouses: AnimalHouse[]) => {
    setHouses(newHouses);
    localStorage.setItem('farm_houses', JSON.stringify(newHouses));
  };

  const saveNotes = (newNotes: Note[]) => {
    setNotes(newNotes);
    localStorage.setItem('farm_notes', JSON.stringify(newNotes));
  };

  const saveWeightData = (newWeightData: Record<string, { date: string; weight: number }[]>) => {
    setWeightData(newWeightData);
    localStorage.setItem('farm_weight_data', JSON.stringify(newWeightData));
  };

  const fetchData = async () => {
    const allExpenses: any[] = [];
    const allIncomes: any[] = [];
    const allEggs: any[] = [];

    for (const house of houses) {
      const [expRes, incRes, eggRes] = await Promise.all([
        fetch(`/api/expenses?farmId=${house.id}`),
        fetch(`/api/expenses?farmId=${house.id}&type=income`),
        fetch(`/api/eggs?farmId=${house.id}`),
      ]);
      const expData = await expRes.json();
      const incData = await incRes.json();
      const eggData = await eggRes.json();
      
      allExpenses.push(...expData);
      allIncomes.push(...incData.filter((r: any) => r.type === 'income'));
      allEggs.push(...eggData);
    }

    setExpenses(allExpenses);
    setIncomes(allIncomes);
    setEggsCollected(allEggs);
  };

  const getTotalAnimals = () => {
    return houses.reduce((sum, house) => sum + house.quantity, 0);
  };

  const getEggsInStock = () => {
    const totalCollected = eggsCollected.reduce((sum, e) => sum + e.quantity, 0);
    return totalCollected - eggsSold;
  };

  const getThisMonthIncome = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return incomes.filter(i => i.date >= monthStart).reduce((sum, i) => sum + i.amount, 0);
  };

  const getThisMonthExpenses = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return expenses.filter(e => e.date >= monthStart).reduce((sum, e) => sum + e.amount, 0);
  };

  const getNetProfit = () => getThisMonthIncome() - getThisMonthExpenses();

  const hasLayerChickens = houses.some(h => h.category === 'Layers');
  const hasBroilerChickens = houses.some(h => h.category === 'Broilers');

  const getCurrentWeight = (houseId: string) => {
    const history = weightData[houseId];
    if (history && history.length > 0) {
      return history[history.length - 1].weight;
    }
    const house = houses.find(h => h.id === houseId);
    return house?.averageWeight || 0;
  };

  // House handlers
  const openAddHouseModal = () => {
    setHouseName('');
    setHouseAnimalType('Chicken');
    setHouseCategory('Layers');
    setHouseQuantity('');
    setHouseAgeWeeks('');
    setHouseAverageWeight('');
    setShowAddHouseModal(true);
  };

  const handleAddHouse = () => {
    if (!houseName || !houseQuantity || !houseAgeWeeks) return;
    
    const newHouseId = `house-${Date.now()}`;
    
    const newHouse: AnimalHouse = {
      id: newHouseId,
      name: houseName,
      animalType: houseAnimalType,
      category: houseCategory,
      quantity: parseInt(houseQuantity),
      ageWeeks: parseInt(houseAgeWeeks),
      averageWeight: houseAverageWeight ? parseFloat(houseAverageWeight) : undefined,
    };
    
    // Auto-create 9 cells for the new house
    const newCells = DEFAULT_CELLS.map((cellName, index) => ({
      id: `cell-${newHouseId}-${index}`,
      houseId: newHouseId,
      name: cellName,
      row: cellName.charAt(0),
      position: parseInt(cellName.charAt(1)),
      capacity: 50,
      currentCount: 0,
      status: 'empty' as const,
      createdAt: new Date().toISOString(),
    }));
    
    localStorage.setItem(`farm_cells_${newHouseId}`, JSON.stringify(newCells));
    saveHouses([...houses, newHouse]);
    setShowAddHouseModal(false);
  };

  const openEditHouseModal = (house: AnimalHouse) => {
    setEditingHouse(house);
    setHouseName(house.name);
    setHouseAnimalType(house.animalType);
    setHouseCategory(house.category);
    setHouseQuantity(house.quantity.toString());
    setHouseAgeWeeks(house.ageWeeks.toString());
    setHouseAverageWeight(house.averageWeight?.toString() || '');
    setShowEditHouseModal(true);
  };

  const handleEditHouse = () => {
    if (!editingHouse || !houseName || !houseQuantity || !houseAgeWeeks) return;
    
    const updatedHouses = houses.map(h => 
      h.id === editingHouse.id 
        ? {
            ...h,
            name: houseName,
            animalType: houseAnimalType,
            category: houseCategory,
            quantity: parseInt(houseQuantity),
            ageWeeks: parseInt(houseAgeWeeks),
            averageWeight: houseAverageWeight ? parseFloat(houseAverageWeight) : undefined,
          }
        : h
    );
    
    saveHouses(updatedHouses);
    setShowEditHouseModal(false);
    setEditingHouse(null);
  };

  const handleDeleteHouse = (houseId: string) => {
    const house = houses.find(h => h.id === houseId);
    if (confirm(`Are you sure you want to remove "${house?.name}"?`)) {
      saveHouses(houses.filter(h => h.id !== houseId));
      setExpandedHouse(null);
    }
  };

  // Note handlers
  const openAddNoteModal = () => {
    setNoteContent('');
    setNoteHouseId('');
    setEditingNote(null);
    setShowNoteModal(true);
  };

  const openEditNoteModal = (note: Note) => {
    setNoteContent(note.content);
    setNoteHouseId(note.houseId || '');
    setEditingNote(note);
    setShowNoteModal(true);
  };

  const handleSaveNote = () => {
    if (!noteContent.trim()) return;
    
    const selectedHouse = houses.find(h => h.id === noteHouseId);
    
    if (editingNote) {
      const updatedNotes = notes.map(n => 
        n.id === editingNote.id 
          ? { ...n, content: noteContent, houseId: noteHouseId || null, houseName: selectedHouse?.name, updatedAt: new Date().toISOString() }
          : n
      );
      saveNotes(updatedNotes);
    } else {
      const newNote: Note = {
        id: `note-${Date.now()}`,
        content: noteContent,
        houseId: noteHouseId || null,
        houseName: selectedHouse?.name,
        createdAt: new Date().toISOString(),
      };
      saveNotes([...notes, newNote]);
    }
    
    setShowNoteModal(false);
    setNoteContent('');
    setNoteHouseId('');
    setEditingNote(null);
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Delete this note?')) {
      saveNotes(notes.filter(n => n.id !== noteId));
    }
  };

  // Task handlers
  const handleSaveTask = () => {
    if (!taskName.trim()) return;

    if (editingTask) {
      setTasks(tasks.map(t => 
        t.id === editingTask.id 
          ? { ...t, name: taskName, dueDate: taskDueDate, priority: taskPriority, frequency: taskFrequency }
          : t
      ));
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        name: taskName,
        dueDate: taskDueDate,
        priority: taskPriority,
        frequency: taskFrequency,
        status: 'Pending',
      };
      setTasks([...tasks, newTask]);
    }
    
    resetTaskForm();
    setShowTaskModal(false);
  };

  const resetTaskForm = () => {
    setTaskName('');
    setTaskDueDate('');
    setTaskPriority('Medium');
    setTaskFrequency('One-off');
    setEditingTask(null);
  };

  const handleEditTask = (task: Task) => {
    setTaskName(task.name);
    setTaskDueDate(task.dueDate);
    setTaskPriority(task.priority);
    setTaskFrequency(task.frequency);
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Delete this task?')) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const handleToggleTaskStatus = (task: Task) => {
    setTasks(tasks.map(t => 
      t.id === task.id 
        ? { ...t, status: t.status === 'Pending' ? 'Completed' : 'Pending' }
        : t
    ));
  };

  // Financial handlers
  const handleSaveIncome = async () => {
    if (!amount) return;
    setLoading(true);
    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          farmId: 'dashboard', 
          amount, 
          sender,
          description,
          type: 'income' 
        }),
      });
      setAmount(''); setSender(''); setDescription('');
      setShowIncomeModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExpense = async () => {
    if (!amount) return;
    setLoading(true);
    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          farmId: 'dashboard', 
          amount, 
          sender,
          receiver,
          purpose,
          type: 'expense' 
        }),
      });
      setAmount(''); setSender(''); setReceiver(''); setPurpose('');
      setShowExpenseModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-2xl font-bold text-center mb-4">Dosumu Farm</h1>

        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <p className="text-sm text-gray-600">Total Animals</p>
          <p className="text-3xl font-bold">{getTotalAnimals()}</p>
        </div>

        <div className="bg-white rounded-lg shadow mb-4">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-bold">Animal Houses</h2>
            <button 
              onClick={openAddHouseModal}
              className="text-green-600 font-medium text-sm"
            >
              + Add House
            </button>
          </div>
          {houses.map((house, index) => (
            <div key={house.id}>
              <button 
                onClick={() => setExpandedHouse(expandedHouse === house.id ? null : house.id)}
                className={`w-full p-4 text-left ${index < houses.length - 1 ? 'border-b' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{house.name}</p>
                    <p className="text-sm text-gray-500">Type: {house.animalType} ({house.category})</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{house.quantity}</p>
                    <p className="text-xs text-gray-400">
                      {house.ageWeeks} weeks
                      {house.category === 'Broilers' && (
                        <> • {getCurrentWeight(house.id)} kg</>
                      )}
                    </p>
                  </div>
                </div>
              </button>
              {expandedHouse === house.id && (
                <div className="p-4 bg-gray-50 border-b">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="font-medium">{house.name}</p>
                    </div>
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
                    {house.category === 'Broilers' && (
                      <div>
                        <p className="text-xs text-gray-500">Average Weight (Kg)</p>
                        <p className="font-medium">{getCurrentWeight(house.id)} kg</p>
                      </div>
                    )}
                    {house.category === 'Layers' && (
                      <div>
                        <p className="text-xs text-gray-500">Eggs in Stock</p>
                        <p className="font-medium">{getEggsInStock()}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); router.push(`/house/${house.id}`); }}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
                    >
                      Open House
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEditHouseModal(house); }}
                      className="py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteHouse(house.id); }}
                      className="py-2 px-4 bg-red-600 text-white rounded-lg text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {hasLayerChickens && (
          <div className="bg-yellow-50 rounded-lg shadow p-4 mb-4">
            <p className="text-sm text-yellow-600">Eggs in Stock</p>
            <p className="text-3xl font-bold">{getEggsInStock()}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow mb-4">
          <button 
            onClick={() => setShowFinancial(!showFinancial)}
            className="w-full p-4 flex justify-between items-center"
          >
            <h2 className="font-bold">FINANCIAL</h2>
            <span>{showFinancial ? '▲' : '▼'}</span>
          </button>
          
          {showFinancial && (
            <div className="p-4 border-t">
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button 
                  onClick={() => setShowIncomeModal(true)}
                  className="py-2 px-3 bg-green-500 text-white rounded-lg text-sm font-medium"
                >
                  + Income
                </button>
                <button 
                  onClick={() => setShowExpenseModal(true)}
                  className="py-2 px-3 bg-red-500 text-white rounded-lg text-sm font-medium"
                >
                  + Expense
                </button>
                <button onClick={() => window.print()} className="py-2 px-3 bg-blue-500 text-white rounded-lg text-sm font-medium">
                  Print
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-green-600">Income</p>
                  <p className="font-bold">₦{getThisMonthIncome().toLocaleString()}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-xs text-red-600">Expense</p>
                  <p className="font-bold">₦{getThisMonthExpenses().toLocaleString()}</p>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${getNetProfit() >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <p className="text-xs">Net</p>
                <p className={`font-bold ${getNetProfit() >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  ₦{getNetProfit().toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow mb-4">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-bold">TASKS</h2>
            <button 
              onClick={() => { resetTaskForm(); setShowTaskModal(true); }}
              className="text-green-600 font-medium text-sm"
            >
              + Add Task
            </button>
          </div>
          
          <div className="p-4">
            {tasks.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No tasks yet</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="flex justify-between items-start py-3 border-b last:border-0">
                  <div className="flex items-start gap-3">
                    <button 
                      onClick={() => handleToggleTaskStatus(task)}
                      className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        task.status === 'Completed' ? 'bg-green-500 border-green-500' : 'border-gray-300'
                      }`}
                    >
                      {task.status === 'Completed' && <span className="text-white text-xs">✓</span>}
                    </button>
                    <div>
                      <p className={`font-medium ${task.status === 'Completed' ? 'line-through text-gray-400' : ''}`}>
                        {task.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Due: {task.dueDate} | {task.priority} | {task.frequency}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditTask(task)} className="text-blue-600 text-sm">Edit</button>
                    <button onClick={() => handleDeleteTask(task.id)} className="text-red-600 text-sm">Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notes Section */}
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
              <p className="text-gray-400 text-sm text-center py-4">No notes yet</p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="py-3 border-b last:border-0">
                  <p className="text-sm">{note.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    From: {note.houseName || 'General'} | {new Date(note.createdAt).toLocaleDateString()}
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

      {/* Add House Modal */}
      {showAddHouseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Animal House</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">House Name</label>
                <input 
                  type="text" 
                  value={houseName} 
                  onChange={(e) => setHouseName(e.target.value)} 
                  placeholder="e.g., Layer house 3"
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Animal Type</label>
                <select 
                  value={houseAnimalType} 
                  onChange={(e) => setHouseAnimalType(e.target.value)} 
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="Chicken">Chicken</option>
                  <option value="Pig">Pig</option>
                  <option value="Goat">Goat</option>
                  <option value="Cattle">Cattle</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  value={houseCategory} 
                  onChange={(e) => setHouseCategory(e.target.value)} 
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="Layers">Layers</option>
                  <option value="Broilers">Broilers</option>
                  <option value="Pig">Pig</option>
                  <option value="Goat">Goat</option>
                  <option value="Cattle">Cattle</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Animals</label>
                <input 
                  type="number" 
                  value={houseQuantity} 
                  onChange={(e) => setHouseQuantity(e.target.value)} 
                  placeholder="e.g., 100"
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age (weeks)</label>
                <input 
                  type="number" 
                  value={houseAgeWeeks} 
                  onChange={(e) => setHouseAgeWeeks(e.target.value)} 
                  placeholder="e.g., 8"
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              
              {houseCategory === 'Broilers' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Average Weight (kg)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={houseAverageWeight} 
                    onChange={(e) => setHouseAverageWeight(e.target.value)} 
                    placeholder="e.g., 2.0"
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowAddHouseModal(false)} 
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddHouse} 
                disabled={!houseName || !houseQuantity || !houseAgeWeeks}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                Add House
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit House Modal */}
      {showEditHouseModal && editingHouse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Animal House</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">House Name</label>
                <input 
                  type="text" 
                  value={houseName} 
                  onChange={(e) => setHouseName(e.target.value)} 
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Animal Type</label>
                <select 
                  value={houseAnimalType} 
                  onChange={(e) => setHouseAnimalType(e.target.value)} 
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="Chicken">Chicken</option>
                  <option value="Pig">Pig</option>
                  <option value="Goat">Goat</option>
                  <option value="Cattle">Cattle</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  value={houseCategory} 
                  onChange={(e) => setHouseCategory(e.target.value)} 
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="Layers">Layers</option>
                  <option value="Broilers">Broilers</option>
                  <option value="Pig">Pig</option>
                  <option value="Goat">Goat</option>
                  <option value="Cattle">Cattle</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Animals</label>
                <input 
                  type="number" 
                  value={houseQuantity} 
                  onChange={(e) => setHouseQuantity(e.target.value)} 
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age (weeks)</label>
                <input 
                  type="number" 
                  value={houseAgeWeeks} 
                  onChange={(e) => setHouseAgeWeeks(e.target.value)} 
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              
              {houseCategory === 'Broilers' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Average Weight (kg)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={houseAverageWeight} 
                    onChange={(e) => setHouseAverageWeight(e.target.value)} 
                    placeholder="e.g., 2.0"
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => { setShowEditHouseModal(false); setEditingHouse(null); }} 
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditHouse} 
                disabled={!houseName || !houseQuantity || !houseAgeWeeks}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                Save Changes
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
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Related House (optional)</label>
                <select 
                  value={noteHouseId} 
                  onChange={(e) => setNoteHouseId(e.target.value)} 
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="">General (no specific house)</option>
                  {houses.map(house => (
                    <option key={house.id} value={house.id}>{house.name}</option>
                  ))}
                </select>
              </div>
              
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
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => { setShowNoteModal(false); setNoteContent(''); setNoteHouseId(''); setEditingNote(null); }} 
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

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingTask ? 'Edit Task' : 'Add Task'}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
                <input 
                  type="text" 
                  value={taskName} 
                  onChange={(e) => setTaskName(e.target.value)} 
                  placeholder="e.g., Feed chickens"
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input 
                  type="date" 
                  value={taskDueDate} 
                  onChange={(e) => setTaskDueDate(e.target.value)} 
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select 
                  value={taskPriority} 
                  onChange={(e) => setTaskPriority(e.target.value as any)} 
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select 
                  value={taskFrequency} 
                  onChange={(e) => setTaskFrequency(e.target.value as any)} 
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="One-off">One-off</option>
                  <option value="Recurring">Recurring</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => { resetTaskForm(); setShowTaskModal(false); }} 
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveTask} 
                className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium"
              >
                {editingTask ? 'Update' : 'Add'} Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Income Modal */}
      {showIncomeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Income</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Received From</label>
                <input 
                  type="text" 
                  value={sender} 
                  onChange={(e) => setSender(e.target.value)} 
                  placeholder="e.g., Egg sales"
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="e.g., Daily egg sales"
                  className="w-full p-3 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => { setAmount(''); setSender(''); setDescription(''); setShowIncomeModal(false); }} 
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveIncome} 
                disabled={loading || !amount}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Add Income'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Expense</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sender</label>
                <input 
                  type="text" 
                  value={sender} 
                  onChange={(e) => setSender(e.target.value)} 
                  placeholder="Who paid"
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receiver</label>
                <input 
                  type="text" 
                  value={receiver} 
                  onChange={(e) => setReceiver(e.target.value)} 
                  placeholder="Who received"
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <input 
                  type="text" 
                  value={purpose} 
                  onChange={(e) => setPurpose(e.target.value)} 
                  placeholder="e.g., Feed, Medicine"
                  className="w-full p-3 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => { setAmount(''); setSender(''); setReceiver(''); setPurpose(''); setShowExpenseModal(false); }} 
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveExpense} 
                disabled={loading || !amount}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
