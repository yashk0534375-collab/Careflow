import React, { useState } from 'react';
import { Medicine } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface MedicineReminderProps {
  medicines: Medicine[];
  onUpdate: (medicines: Medicine[]) => void;
}

export default function MedicineReminder({ medicines, onUpdate }: MedicineReminderProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newMed, setNewMed] = useState<Partial<Medicine>>({
    name: '',
    dosage: '',
    time: '08:00',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    taken: false,
    category: 'prescribed',
    mealTiming: 'After Breakfast'
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMed.name || !newMed.dosage) return;
    
    const med: Medicine = {
      id: Math.random().toString(36).substr(2, 9),
      name: newMed.name!.toUpperCase(),
      dosage: newMed.dosage!.toUpperCase(),
      time: newMed.time!,
      days: newMed.days!,
      taken: false,
      category: newMed.category as any,
      mealTiming: newMed.mealTiming
    };
    
    onUpdate([...medicines, med]);
    setShowAdd(false);
    setNewMed({ name: '', dosage: '', time: '08:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], taken: false, category: 'prescribed', mealTiming: 'After Breakfast' });
  };

  const toggleTaken = (id: string) => {
    onUpdate(medicines.map(m => m.id === id ? { ...m, taken: !m.taken } : m));
  };

  const removeMed = (id: string) => {
    onUpdate(medicines.filter(m => m.id !== id));
  };

  const openAddModal = (category: 'prescribed' | 'supplement' | 'suggestion') => {
    setNewMed(prev => ({ ...prev, category }));
    setShowAdd(true);
  };

  const renderMedicineCards = (items: Medicine[], category: 'prescribed' | 'supplement' | 'suggestion') => {
    if (items.length === 0) {
      return (
        <button 
          onClick={() => openAddModal(category)}
          className="w-full py-16 text-center border border-[#3a3a3f] hover:border-white transition-colors flex flex-col items-center justify-center gap-4 group h-full cursor-pointer bg-transparent"
        >
          <p className="eyebrow text-[#5a5a5f] group-hover:text-white transition-colors">NO ACTIVE PROTOCOLS</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white opacity-0 group-hover:opacity-100 transition-opacity">[ INITIALIZE ]</p>
        </button>
      );
    }
    return (
      <div className="flex flex-col gap-6 w-full">
        {items.map((med) => (
          <div key={med.id} className={`card ${med.taken ? 'border-white' : ''}`}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="display-lg text-2xl">{med.name}</h3>
                <p className="eyebrow mt-1">DOSAGE: {med.dosage}</p>
                {med.mealTiming && <p className="eyebrow mt-1 text-[#f0f0fa]">TIMING: {med.mealTiming.toUpperCase()}</p>}
              </div>
              <button onClick={() => removeMed(med.id)} className="text-[#5a5a5f] hover:text-white text-[10px] font-bold uppercase tracking-wider">
                [ ABORT ]
              </button>
            </div>

            <div className="border border-[#3a3a3f] p-4 flex justify-between items-center mb-6">
              <span className="eyebrow text-white">T-MINUS: {med.time}</span>
              <span className="text-[10px] font-bold tracking-wider" style={{ color: med.taken ? '#ffffff' : '#5a5a5f' }}>
                {med.taken ? 'ADMINISTERED' : 'PENDING'}
              </span>
            </div>

            <button
              onClick={() => toggleTaken(med.id)}
              className={`w-full py-3 text-[11px] font-bold uppercase tracking-wider transition-colors border ${
                med.taken
                  ? 'bg-white text-black border-white'
                  : 'bg-transparent text-white border-[#3a3a3f] hover:border-white'
              }`}
            >
              {med.taken ? 'PROTOCOL CONFIRMED' : 'CONFIRM ADMINISTRATION'}
            </button>
          </div>
        ))}
        <button 
          onClick={() => openAddModal(category)}
          className="w-full py-4 text-center border border-dashed border-[#3a3a3f] hover:border-white transition-colors text-[#5a5a5f] hover:text-white text-[10px] font-bold uppercase tracking-wider cursor-pointer bg-transparent mt-2"
        >
          [ ADD NEW ]
        </button>
      </div>
    );
  };

  const prescribed = medicines.filter(m => !m.category || m.category === 'prescribed');
  const supplements = medicines.filter(m => m.category === 'supplement');
  const suggestions = medicines.filter(m => m.category === 'suggestion');

  return (
    <div className="space-y-12">
      <header className="border-b border-[#3a3a3f] pb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="display-xxl mb-4">PHARMACOLOGICAL PROTOCOLS</h1>
          <p className="caption-text text-[#f0f0fa] max-w-2xl uppercase">
            MAINTAIN STRICT ADHERENCE TO PRESCRIBED REGIMENS. TIMING IS CRITICAL.
          </p>
        </div>
        <button onClick={() => openAddModal('prescribed')} className="btn-ghost whitespace-nowrap">
          ADD PROTOCOL
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* PRESCRIBED MEDICINE */}
        <div className="flex flex-col">
          <h2 className="display-lg text-xl mb-6 text-white border-b border-[#3a3a3f] pb-3 uppercase text-center w-full">Prescribed</h2>
          <div className="flex-1 flex flex-col">
            {renderMedicineCards(prescribed, 'prescribed')}
          </div>
        </div>

        {/* SUPPLEMENTS */}
        <div className="flex flex-col">
          <h2 className="display-lg text-xl mb-6 text-white border-b border-[#3a3a3f] pb-3 uppercase text-center w-full">Supplements</h2>
          <div className="flex-1 flex flex-col">
            {renderMedicineCards(supplements, 'supplement')}
          </div>
        </div>

        {/* EXTRA HEALTH SUGGESTIONS */}
        <div className="flex flex-col">
          <h2 className="display-lg text-xl mb-6 text-white border-b border-[#3a3a3f] pb-3 uppercase text-center w-full">Suggestions</h2>
          <div className="flex-1 flex flex-col">
            {renderMedicineCards(suggestions, 'suggestion')}
          </div>
        </div>
      </div>

      <div className="border border-[#3a3a3f] p-8 flex flex-col sm:flex-row justify-between items-center gap-6 mt-8">
        <div>
          <h4 className="display-xl text-3xl mb-2">SUPPLY REPLENISHMENT</h4>
          <p className="caption-text text-[#f0f0fa] uppercase">AUTHORIZE EXTERNAL PROCUREMENT VIA TATA 1MG.</p>
        </div>
        <a 
          href="https://www.1mg.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-ghost whitespace-nowrap"
        >
          EXECUTE ORDER
        </a>
      </div>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-[#0a0a0a] border border-[#3a3a3f] max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#3a3a3f] flex items-center justify-between sticky top-0 bg-[#0a0a0a] z-10">
                <h3 className="display-lg text-2xl">NEW PROTOCOL</h3>
                <button type="button" onClick={() => setShowAdd(false)} className="text-[#5a5a5f] hover:text-white text-[10px] font-bold uppercase tracking-wider">
                  [ ABORT ]
                </button>
              </div>
              
              <form onSubmit={handleAdd} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="eyebrow block">CATEGORY</label>
                  <select 
                    value={newMed.category}
                    onChange={(e) => setNewMed({ ...newMed, category: e.target.value as any })}
                    className="w-full bg-transparent border border-[#3a3a3f] p-3 text-white focus:border-white outline-none font-sans text-sm"
                  >
                    <option value="prescribed" className="bg-[#0a0a0a]">PRESCRIBED MEDICINE</option>
                    <option value="supplement" className="bg-[#0a0a0a]">SUPPLEMENT (VITAMINS, GYM)</option>
                    <option value="suggestion" className="bg-[#0a0a0a]">HEALTH SUGGESTION</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="eyebrow block">NOMENCLATURE</label>
                  <input 
                    required
                    type="text"
                    value={newMed.name}
                    onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                    className="w-full"
                    placeholder="E.G. IBUPROFEN"
                  />
                </div>
                <div className="space-y-2">
                  <label className="eyebrow block">DOSAGE</label>
                  <input 
                    required
                    type="text"
                    value={newMed.dosage}
                    onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                    className="w-full"
                    placeholder="E.G. 500MG"
                  />
                </div>
                <div className="space-y-2">
                  <label className="eyebrow block">TIMING (WHEN TO TAKE)</label>
                  <select 
                    value={newMed.mealTiming}
                    onChange={(e) => setNewMed({ ...newMed, mealTiming: e.target.value })}
                    className="w-full bg-transparent border border-[#3a3a3f] p-3 text-white focus:border-white outline-none font-sans text-sm"
                  >
                    <option value="Before Breakfast" className="bg-[#0a0a0a]">BEFORE BREAKFAST</option>
                    <option value="After Breakfast" className="bg-[#0a0a0a]">AFTER BREAKFAST</option>
                    <option value="Before Lunch" className="bg-[#0a0a0a]">BEFORE LUNCH</option>
                    <option value="After Lunch" className="bg-[#0a0a0a]">AFTER LUNCH</option>
                    <option value="Before Dinner" className="bg-[#0a0a0a]">BEFORE DINNER</option>
                    <option value="After Dinner" className="bg-[#0a0a0a]">AFTER DINNER</option>
                    <option value="Empty Stomach" className="bg-[#0a0a0a]">EMPTY STOMACH</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="eyebrow block">T-MINUS (EXACT TIME)</label>
                  <input 
                    required
                    type="time"
                    value={newMed.time}
                    onChange={(e) => setNewMed({ ...newMed, time: e.target.value })}
                    className="w-full"
                  />
                </div>
                <button type="submit" className="btn-ghost w-full">
                  SAVE PROTOCOL
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
