import React, { useMemo, useState } from 'react';
import { MealLog, FoodItem } from '../types';
import { HEALTHY_RECIPES, MOCK_FOODS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface CalorieTrackerProps {
  logs: MealLog[];
  onAdd: (log: MealLog) => void;
  onRemove: (id: string) => void;
}

export default function CalorieTracker({ logs, onAdd, onRemove }: CalorieTrackerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState('');
  const [foodFilter, setFoodFilter] = useState<'all' | 'whole-foods' | 'drinks' | 'packaged'>('all');
  const [customFoodFormVisible, setCustomFoodFormVisible] = useState(false);
  const [visibleRecipesCount, setVisibleRecipesCount] = useState(3);
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(3);
  const [mealType, setMealType] = useState('BREAKFAST');
  const [tMinusTime, setTMinusTime] = useState('');
  
  const todayStr = new Date().toLocaleDateString();
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  const [customFoodData, setCustomFoodData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    unit: 'g',
    quantity: '1',
    category: 'INDIAN',
  });

  const filteredFoods = useMemo(() => {
    return MOCK_FOODS.filter((food) => {
      const haystack = `${food.name} ${food.brand || ''} ${food.category} ${food.notes || ''}`.toLowerCase();
      const matchesSearch = haystack.includes(searchQuery.toLowerCase());
      const matchesFilter =
        foodFilter === 'all'
          ? true
          : foodFilter === 'whole-foods'
            ? !food.isPackaged && food.category !== 'Drinks'
            : foodFilter === 'drinks'
              ? food.unit === 'ml'
              : food.isPackaged;

      return matchesSearch && matchesFilter;
    });
  }, [foodFilter, searchQuery]);

  const logsByDate = useMemo(() => {
    const groups: Record<string, MealLog[]> = {};
    logs.forEach(log => {
      const d = new Date(log.timestamp).toLocaleDateString();
      if (!groups[d]) groups[d] = [];
      groups[d].push(log);
    });
    return groups;
  }, [logs]);

  const selectedDateLogs = logsByDate[selectedDateStr] || [];

  const totals = useMemo(
    () =>
      selectedDateLogs.reduce(
        (acc, log) => ({
          calories: acc.calories + (log.calories || 0),
          protein: acc.protein + (log.protein || 0),
          carbs: acc.carbs + (log.carbs || 0),
          fats: acc.fats + (log.fats || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      ),
    [selectedDateLogs]
  );

  const historyDates = useMemo(() => {
    const dates = Object.keys(logsByDate).filter(d => d !== todayStr);
    return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [logsByDate, todayStr]);

  const calorieGoal = 2400;

  const addFoodLog = () => {
    if (!selectedFood) return;

    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) return;

    const scaleFactor = parsedQuantity / selectedFood.baseQuantity;
    
    // Determine timestamp based on selected date
    let logTimestamp = Date.now();
    if (selectedDateStr !== todayStr) {
      logTimestamp = new Date(`${selectedDateStr} 12:00:00`).getTime();
    }

    onAdd({
      id: Math.random().toString(36).slice(2, 11),
      foodId: selectedFood.id,
      name: selectedFood.name,
      brand: selectedFood.brand,
      calories: Number((selectedFood.calories * scaleFactor).toFixed(1)),
      protein: Number((selectedFood.protein * scaleFactor).toFixed(1)),
      carbs: Number((selectedFood.carbs * scaleFactor).toFixed(1)),
      fats: Number((selectedFood.fats * scaleFactor).toFixed(1)),
      quantity: parsedQuantity,
      unit: selectedFood.unit,
      timestamp: logTimestamp,
      mealType,
      tMinusTime,
    });

    setSelectedFood(null);
    setQuantity('');
    setShowSearch(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-12">
      <header className="border-b border-[#3a3a3f] pb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="display-xxl mb-4">NUTRITIONAL TELEMETRY</h1>
          <p className="caption-text text-[#f0f0fa] max-w-2xl">
            LOG CALORIC INTAKE AND MACRONUTRIENT DISTRIBUTION. 
            MAINTAIN OPTIMAL FUEL LEVELS FOR MISSION READINESS.
          </p>
        </div>
        <button onClick={() => setShowSearch(true)} className="btn-ghost whitespace-nowrap">
          Food Intake
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 space-y-6">
          <div className="card text-center">
            <div className="eyebrow mb-6">TOTAL ENERGY CONSUMED</div>
            <div className="display-xl mb-2">{Math.round(totals.calories)}</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#5a5a5f]">
              TARGET: {calorieGoal} KCAL ({Math.round((totals.calories / calorieGoal) * 100)}% REACHED)
            </div>
          </div>

          <div className="card">
            <h3 className="eyebrow mb-6">MACRONUTRIENT PAYLOAD</h3>
            <div className="space-y-6">
              <MacroBar label="PROTEIN" value={totals.protein} goal={150} />
              <MacroBar label="CARBS" value={totals.carbs} goal={250} />
              <MacroBar label="FATS" value={totals.fats} goal={70} />
            </div>
          </div>

          <div className="card">
            <h3 className="eyebrow mb-6 border-b border-[#3a3a3f] pb-4">HISTORICAL LOGS</h3>
            <div className="space-y-4">
              {historyDates.length > 0 ? (
                <>
                  {historyDates.slice(0, visibleHistoryCount).map(dateStr => {
                    const dayLogs = logsByDate[dateStr] || [];
                    const dayCals = dayLogs.reduce((acc, log) => acc + (log.calories || 0), 0);
                    const isSelected = dateStr === selectedDateStr;
                    
                    return (
                      <button 
                        key={dateStr}
                        onClick={() => setSelectedDateStr(dateStr)}
                        className={`w-full text-left p-3 border transition-colors block bg-transparent ${isSelected ? 'border-white bg-white/5' : 'border-[#3a3a3f] hover:border-white/50'}`}
                      >
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
                          <span className={isSelected ? 'text-white' : 'text-[#5a5a5f]'}>
                            {dateStr}
                          </span>
                          <span className={isSelected ? 'text-white' : 'text-[#5a5a5f]'}>
                            {Math.round(dayCals)} / {calorieGoal} KCAL
                          </span>
                        </div>
                        <div className="h-1 w-full bg-[#0a0a0a] overflow-hidden border border-[#3a3a3f]">
                          <div className="h-full bg-white transition-all duration-500" style={{ width: `${Math.min(100, (dayCals / calorieGoal) * 100)}%` }} />
                        </div>
                      </button>
                    )
                  })}

                  {historyDates.length > 3 && (
                    <div className="pt-2 text-center">
                      {visibleHistoryCount < historyDates.length ? (
                        <button onClick={() => setVisibleHistoryCount(prev => Math.min(prev + 3, historyDates.length))} className="text-[11px] font-bold uppercase tracking-wider border border-[#3a3a3f] px-4 py-2 hover:bg-white hover:text-black transition-colors">
                          LOAD MORE
                        </button>
                      ) : (
                        <button onClick={() => setVisibleHistoryCount(3)} className="text-[11px] font-bold uppercase tracking-wider text-[#5a5a5f] hover:text-white">
                          COLLAPSE
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="caption-text text-[#5a5a5f] uppercase tracking-wider text-center py-4">NO PREVIOUS LOGS.</p>
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 card flex flex-col h-full">
          <h3 className="eyebrow mb-6 border-b border-[#3a3a3f] pb-4">
            {selectedDateStr === todayStr ? "TODAY'S LOG" : `${selectedDateStr} LOG`}
          </h3>
          <div className="space-y-0 flex-1">
            {selectedDateLogs.length > 0 ? (
              selectedDateLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-4 border-b border-[#3a3a3f] last:border-0">
                  <div>
                    <p className="font-bold text-sm uppercase">
                      {log.name}{log.brand ? ` // ${log.brand}` : ''}
                    </p>
                    <p className="text-[10px] text-[#5a5a5f] uppercase tracking-wider font-bold mt-1">
                      {log.mealType || 'UNSPECIFIED'} {log.tMinusTime ? `// ${log.tMinusTime}` : ''} // {log.quantity || 1} {log.unit || 'PIECE'}
                    </p>
                    <p className="text-xs text-[#f0f0fa] mt-1 uppercase tracking-wider font-bold">
                      PRO: {(log.protein || 0).toFixed(1)}G | CRB: {(log.carbs || 0).toFixed(1)}G | FAT: {(log.fats || 0).toFixed(1)}G
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <p className="font-bold text-sm">{Math.round(log.calories || 0)} KCAL</p>
                    <button onClick={() => onRemove(log.id)} className="text-[#5a5a5f] hover:text-white text-[10px] uppercase tracking-wider font-bold">
                      [ REMOVE ]
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 flex flex-col items-center justify-center h-full">
                <p className="caption-text text-[#5a5a5f] uppercase tracking-wider mb-4">NO FUEL DATA LOGGED FOR THIS CYCLE.</p>
                <button onClick={() => setShowSearch(true)} className="btn-ghost-sm">ADD FOOD</button>
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-1 card h-fit">
          <h3 className="eyebrow mb-6 border-b border-[#3a3a3f] pb-4">APPROVED PROTOCOLS (RECIPES)</h3>
          <div className="space-y-6">
            {HEALTHY_RECIPES.slice(0, visibleRecipesCount).map((recipe) => (
              <div key={recipe.id} className="border-b border-[#3a3a3f] pb-6 last:border-0 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold uppercase text-sm">{recipe.name}</h4>
                  <div className="text-right text-[10px] font-bold uppercase tracking-wider">
                    <div>{recipe.calories} KCAL</div>
                    <div className="text-[#5a5a5f]">{recipe.protein}G PRO</div>
                  </div>
                </div>
                <div className="text-[10px] text-[#5a5a5f] uppercase tracking-wider font-bold mb-3">T-MINUS: {recipe.prepTime}</div>
                <ul className="text-xs space-y-1 mb-3 text-[#f0f0fa]">
                  {recipe.ingredients.slice(0, 3).map((ingredient) => (
                    <li key={ingredient} className="uppercase">- {ingredient}</li>
                  ))}
                </ul>
                <p className="text-[10px] text-[#5a5a5f] uppercase tracking-wider">{recipe.steps[0]}</p>
              </div>
            ))}
          </div>

          {HEALTHY_RECIPES.length > 3 && (
            <div className="mt-6 pt-4 text-center">
              {visibleRecipesCount < HEALTHY_RECIPES.length ? (
                <button onClick={() => setVisibleRecipesCount(prev => Math.min(prev + 4, HEALTHY_RECIPES.length))} className="text-[11px] font-bold uppercase tracking-wider border border-[#3a3a3f] px-4 py-2 hover:bg-white hover:text-black transition-colors">
                  LOAD MORE
                </button>
              ) : (
                <button onClick={() => setVisibleRecipesCount(3)} className="text-[11px] font-bold uppercase tracking-wider text-[#5a5a5f] hover:text-white">
                  COLLAPSE
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSearch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowSearch(false); setSelectedFood(null); }} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-3xl bg-[#0a0a0a] border border-[#3a3a3f] flex flex-col h-[80vh]">
              <div className="p-6 border-b border-[#3a3a3f] flex items-center justify-between">
                <h3 className="display-lg text-2xl">DATABASE QUERY</h3>
                <button onClick={() => setShowSearch(false)} className="text-[#5a5a5f] hover:text-white text-xs font-bold tracking-wider uppercase">
                  [ CLOSE ]
                </button>
              </div>

              <div className="p-6 border-b border-[#3a3a3f]">
                <input
                  autoFocus
                  type="text"
                  placeholder="ENTER QUERY (E.G. RICE, CHICKEN, DAAL)..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full text-xl py-4 bg-transparent border-none rounded-none focus:ring-0 uppercase placeholder:text-[#3a3a3f] outline-none"
                />
                <div className="flex gap-2 flex-wrap mt-4">
                  {['all', 'whole-foods', 'drinks', 'packaged'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setFoodFilter(filter as any)}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-colors ${foodFilter === filter ? 'bg-white text-black border-white' : 'border-[#3a3a3f] text-[#5a5a5f] hover:text-white hover:border-white'}`}
                    >
                      {filter.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {selectedFood ? (
                  <div className="border border-white p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="display-lg text-2xl mb-2">{selectedFood.name}</h4>
                        <p className="eyebrow">{selectedFood.baseQuantity} {selectedFood.unit} // {selectedFood.category}</p>
                      </div>
                      <button onClick={() => { setSelectedFood(null); setQuantity(''); }} className="text-[#5a5a5f] hover:text-white text-xs font-bold tracking-wider uppercase">
                        [ BACK ]
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-8">
                      <div className="border border-[#3a3a3f] p-3 text-center"><div className="eyebrow">KCAL</div><div className="text-xl font-bold">{selectedFood.calories}</div></div>
                      <div className="border border-[#3a3a3f] p-3 text-center"><div className="eyebrow">PRO</div><div className="text-xl font-bold">{selectedFood.protein}</div></div>
                      <div className="border border-[#3a3a3f] p-3 text-center"><div className="eyebrow">CRB</div><div className="text-xl font-bold">{selectedFood.carbs}</div></div>
                      <div className="border border-[#3a3a3f] p-3 text-center"><div className="eyebrow">FAT</div><div className="text-xl font-bold">{selectedFood.fats}</div></div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end gap-4">
                      <div className="flex-1">
                        <label className="eyebrow block mb-2">INPUT MASS/VOLUME ({selectedFood.unit})</label>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          className="w-full text-xl py-3 border-b border-[#3a3a3f] bg-transparent rounded-none focus:border-white outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="eyebrow block mb-2">MEAL TYPE</label>
                        <select
                          value={mealType}
                          onChange={(e) => setMealType(e.target.value)}
                          className="w-full text-xl py-3 border-b border-[#3a3a3f] bg-transparent text-[#f0f0fa] outline-none"
                        >
                          <option value="BREAKFAST" className="bg-[#0a0a0a]">BREAKFAST</option>
                          <option value="BRUNCH" className="bg-[#0a0a0a]">BRUNCH</option>
                          <option value="LUNCH" className="bg-[#0a0a0a]">LUNCH</option>
                          <option value="SUPPER" className="bg-[#0a0a0a]">SUPPER</option>
                          <option value="DINNER" className="bg-[#0a0a0a]">DINNER</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="eyebrow block mb-2">T-MINUS</label>
                        <input
                          type="text"
                          placeholder="T-00:00"
                          value={tMinusTime}
                          onChange={(e) => setTMinusTime(e.target.value)}
                          className="w-full text-xl py-3 border-b border-[#3a3a3f] bg-transparent rounded-none focus:border-white outline-none uppercase placeholder:text-[#3a3a3f]"
                        />
                      </div>
                      <button onClick={addFoodLog} className="btn-filled whitespace-nowrap h-[56px]">
                        COMMIT TO LOG
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFoods.length === 0 && (
                      <div className="text-center py-12 text-[#5a5a5f] uppercase tracking-wider text-xs font-bold">
                        NO RESULTS. <button onClick={() => setCustomFoodFormVisible(true)} className="text-white underline ml-2">MANUAL OVERRIDE</button>
                      </div>
                    )}
                    {filteredFoods.map((food) => (
                      <button
                        key={food.id}
                        onClick={() => { setSelectedFood(food); setQuantity(String(food.baseQuantity)); }}
                        className="w-full text-left p-4 border border-[#3a3a3f] hover:border-white flex justify-between items-center transition-colors group bg-transparent"
                      >
                        <div>
                          <p className="font-bold uppercase text-sm">{food.name}{food.brand ? ` // ${food.brand}` : ''}</p>
                          <p className="text-[10px] uppercase font-bold tracking-wider text-[#5a5a5f] mt-1">
                            {food.serving} // P:{food.protein} C:{food.carbs} F:{food.fats}
                          </p>
                        </div>
                        <div className="font-bold text-sm group-hover:text-white text-[#5a5a5f] transition-colors">
                          {food.calories} KCAL
                        </div>
                      </button>
                    ))}
                    
                    {customFoodFormVisible && (
                      <div className="mt-8 border border-white p-6">
                        <h4 className="eyebrow mb-6">MANUAL DATA ENTRY</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <input placeholder="NOMENCLATURE" value={customFoodData.name} onChange={e => setCustomFoodData({ ...customFoodData, name: e.target.value })} className="col-span-2 bg-transparent border border-[#3a3a3f] p-3 text-white outline-none" />
                          <input placeholder="ENERGY (KCAL)" type="number" value={customFoodData.calories} onChange={e => setCustomFoodData({ ...customFoodData, calories: e.target.value })} className="bg-transparent border border-[#3a3a3f] p-3 text-white outline-none" />
                          <input placeholder="PROTEIN (G)" type="number" value={customFoodData.protein} onChange={e => setCustomFoodData({ ...customFoodData, protein: e.target.value })} className="bg-transparent border border-[#3a3a3f] p-3 text-white outline-none" />
                          <input placeholder="CARBS (G)" type="number" value={customFoodData.carbs} onChange={e => setCustomFoodData({ ...customFoodData, carbs: e.target.value })} className="bg-transparent border border-[#3a3a3f] p-3 text-white outline-none" />
                          <input placeholder="FATS (G)" type="number" value={customFoodData.fats} onChange={e => setCustomFoodData({ ...customFoodData, fats: e.target.value })} className="bg-transparent border border-[#3a3a3f] p-3 text-white outline-none" />
                          <input placeholder="QUANTITY" type="number" value={customFoodData.quantity} onChange={e => setCustomFoodData({ ...customFoodData, quantity: e.target.value })} className="bg-transparent border border-[#3a3a3f] p-3 text-white outline-none" />
                          <select value={customFoodData.unit} onChange={e => setCustomFoodData({ ...customFoodData, unit: e.target.value })} className="bg-transparent border border-[#3a3a3f] p-3 text-white outline-none">
                            <option value="g" className="bg-[#0a0a0a]">GRAMS (G)</option>
                            <option value="ml" className="bg-[#0a0a0a]">MILLILITERS (ML)</option>
                            <option value="piece" className="bg-[#0a0a0a]">UNIT (PIECE)</option>
                          </select>
                          <select value={mealType} onChange={e => setMealType(e.target.value)} className="bg-transparent border border-[#3a3a3f] p-3 text-white outline-none">
                            <option value="BREAKFAST" className="bg-[#0a0a0a]">BREAKFAST</option>
                            <option value="BRUNCH" className="bg-[#0a0a0a]">BRUNCH</option>
                            <option value="LUNCH" className="bg-[#0a0a0a]">LUNCH</option>
                            <option value="SUPPER" className="bg-[#0a0a0a]">SUPPER</option>
                            <option value="DINNER" className="bg-[#0a0a0a]">DINNER</option>
                          </select>
                          <input placeholder="T-MINUS (E.G. T-04:00)" type="text" value={tMinusTime} onChange={e => setTMinusTime(e.target.value)} className="bg-transparent border border-[#3a3a3f] p-3 text-white outline-none uppercase" />
                        </div>
                        <div className="flex justify-end mt-6 gap-4">
                          <button onClick={() => setCustomFoodFormVisible(false)} className="text-xs font-bold uppercase tracking-wider text-[#5a5a5f] hover:text-white">ABORT</button>
                          <button onClick={() => {
                            const parsedQty = Number(customFoodData.quantity);
                            const scale = parsedQty / (customFoodData.quantity ? parsedQty : 1);
                            
                            let logTimestamp = Date.now();
                            if (selectedDateStr !== todayStr) {
                              logTimestamp = new Date(`${selectedDateStr} 12:00:00`).getTime();
                            }

                            onAdd({
                              id: Math.random().toString(36).slice(2, 11),
                              foodId: 'custom',
                              name: customFoodData.name.toUpperCase(),
                              calories: Number(customFoodData.calories),
                              protein: Number(customFoodData.protein),
                              carbs: Number(customFoodData.carbs),
                              fats: Number(customFoodData.fats),
                              quantity: parsedQty,
                              unit: customFoodData.unit as any,
                              timestamp: logTimestamp,
                              mealType,
                              tMinusTime,
                            });
                            setCustomFoodFormVisible(false);
                            setCustomFoodData({ name: '', calories: '', protein: '', carbs: '', fats: '', unit: 'g', quantity: '1', category: 'INDIAN' });
                          }} className="btn-ghost-sm border-white">EXECUTE</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MacroBar({ label, value, goal }: { label: string; value: number; goal: number }) {
  const percentage = Math.min(Math.round((value / goal) * 100), 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
        <span className="text-[#5a5a5f]">{label}</span>
        <span>{value.toFixed(1)} / {goal}</span>
      </div>
      <div className="h-1 w-full bg-[#3a3a3f] overflow-hidden">
        <div className="h-full bg-white transition-all duration-500" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
