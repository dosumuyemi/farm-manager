'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AnimalPen {
  id: string;
  name: string;
  animalType: string;
  quantity: number;
}

const ANIMAL_HOUSES = [
  { id: 'chicken-house-1', name: 'Chicken House 1', type: 'chicken' },
  { id: 'chicken-house-2', name: 'Chicken House 2', type: 'chicken' },
  { id: 'pig-pen', name: 'Pig Pen', type: 'pig' },
  { id: 'goat-pen', name: 'Goat Pen', type: 'goat' },
];

const ANIMAL_TYPES = ['Chicken', 'Goat', 'Cow', 'Pig', 'Duck', 'Turkey', 'Other'];

type EntryType = 'expense' | 'income';

export default function EntryPage() {
  const router = useRouter();
  const [entryType, setEntryType] = useState<EntryType>('expense');
  const [selectedHouse, setSelectedHouse] = useState<string>(ANIMAL_HOUSES[0].id);
  const [loading, setLoading] = useState(false);
  
  const [showPenModal, setShowPenModal] = useState(false);
  const [showPensList, setShowPensList] = useState(false);
  const [animalPens, setAnimalPens] = useState<AnimalPen[]>([
    { id: '1', name: 'Layer Birds', animalType: 'Chicken', quantity: 500 },
    { id: '2', name: 'Growers', animalType: 'Chicken', quantity: 200 },
    { id: '3', name: 'Pig Sows', animalType: 'Pig', quantity: 25 },
  ]);
  
  const [penName, setPenName] = useState('');
  const [animalType, setAnimalType] = useState('Chicken');
  const [penQuantity, setPenQuantity] = useState('');
  const [editingPenId, setEditingPenId] = useState<string | null>(null);

  const [amount, setAmount] = useState('');
  const [sender, setSender] = useState('');
  const [receiver, setReceiver] = useState('');
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');

  const handleSavePen = () => {
    if (!penName.trim() || !penQuantity) return;

    if (editingPenId) {
      setAnimalPens(animalPens.map(pen => 
        pen.id === editingPenId 
          ? { ...pen, name: penName, animalType, quantity: parseInt(penQuantity) }
          : pen
      ));
    } else {
      const newPen: AnimalPen = {
        id: Date.now().toString(),
        name: penName,
        animalType,
        quantity: parseInt(penQuantity),
      };
      setAnimalPens([...animalPens, newPen]);
    }
    
    resetPenForm();
    setShowPenModal(false);
  };

  const resetPenForm = () => {
    setPenName('');
    setAnimalType('Chicken');
    setPenQuantity('');
    setEditingPenId(null);
  };

  const handleEditPen = (pen: AnimalPen) => {
    setPenName(pen.name);
    setAnimalType(pen.animalType);
    setPenQuantity(pen.quantity.toString());
    setEditingPenId(pen.id);
    setShowPenModal(true);
  };

  const handleDeletePen = (id: string) => {
    if (confirm('Delete this house?')) {
      setAnimalPens(animalPens.filter(pen => pen.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          farmId: selectedHouse, 
          amount, 
          sender: entryType === 'expense' ? sender : '',
          receiver: entryType === 'expense' ? receiver : '',
          purpose: entryType === 'expense' ? purpose : description,
          type: entryType 
        }),
      });
      setAmount(''); setSender(''); setReceiver(''); setPurpose(''); setDescription('');
      alert('Entry saved!');
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => router.push('/')} className="text-gray-600">←</button>
          <h1 className="text-2xl font-bold">Add Entry</h1>
        </div>

        {/* Animal House Selector */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Animal House</label>
          <select
            value={selectedHouse}
            onChange={(e) => setSelectedHouse(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            {ANIMAL_HOUSES.map((house) => (
              <option key={house.id} value={house.id}>{house.name}</option>
            ))}
          </select>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => { resetPenForm(); setShowPenModal(true); }}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
            >
              + Add House
            </button>
            <button
              onClick={() => setShowPensList(!showPensList)}
              className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
            >
              {showPensList ? 'Hide Houses' : 'View Houses'}
            </button>
          </div>
        </div>

        {/* Animal Houses List */}
        {showPensList && (
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="font-bold mb-3">Animal Houses</h2>
            {animalPens.map((pen) => (
              <div key={pen.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">{pen.name}</p>
                  <p className="text-sm text-gray-500">{pen.animalType} - {pen.quantity}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditPen(pen)} className="text-blue-600 text-sm">Edit</button>
                  <button onClick={() => handleDeletePen(pen.id)} className="text-red-600 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Entry Type Toggle */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setEntryType('expense')}
              className={`flex-1 py-2 rounded-lg font-medium ${entryType === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Expense
            </button>
            <button
              onClick={() => setEntryType('income')}
              className={`flex-1 py-2 rounded-lg font-medium ${entryType === 'income' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Income
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {entryType === 'expense' && (
              <>
                <input type="number" placeholder="Amount (₦)" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-3 border rounded-lg" required />
                <input type="text" placeholder="Sender" value={sender} onChange={(e) => setSender(e.target.value)} className="w-full p-3 border rounded-lg" required />
                <input type="text" placeholder="Receiver" value={receiver} onChange={(e) => setReceiver(e.target.value)} className="w-full p-3 border rounded-lg" required />
                <input type="text" placeholder="Purpose (e.g., Feed, Medicine)" value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full p-3 border rounded-lg" required />
              </>
            )}

            {entryType === 'income' && (
              <>
                <input type="number" placeholder="Amount (₦)" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-3 border rounded-lg" required />
                <input type="text" placeholder="Received From" value={sender} onChange={(e) => setSender(e.target.value)} className="w-full p-3 border rounded-lg" required />
                <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 border rounded-lg" required />
              </>
            )}

            <button type="submit" disabled={loading} className="w-full py-3 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Entry'}
            </button>
          </form>
        </div>
      </div>

      {/* Add/Edit House Modal */}
      {showPenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingPenId ? 'Edit House' : 'Add Animal House'}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">House Name</label>
                <input type="text" value={penName} onChange={(e) => setPenName(e.target.value)} placeholder="e.g., Layer Birds" className="w-full p-3 border rounded-lg" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Animal Type</label>
                <select value={animalType} onChange={(e) => setAnimalType(e.target.value)} className="w-full p-3 border rounded-lg">
                  {ANIMAL_TYPES.map((type) => (<option key={type} value={type}>{type}</option>))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" value={penQuantity} onChange={(e) => setPenQuantity(e.target.value)} placeholder="Number of animals" className="w-full p-3 border rounded-lg" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { resetPenForm(); setShowPenModal(false); }} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium">Cancel</button>
              <button onClick={handleSavePen} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium">{editingPenId ? 'Update' : 'Add'} House</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
