import React, { useMemo, useState } from 'react';
import { UserProfile, MealLog, WaterLog, Medicine } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface DashboardProps {
  profile: UserProfile;
  meals: MealLog[];
  water: WaterLog[];
  medicines: Medicine[];
}

export default function Dashboard({ profile, meals, water, medicines }: DashboardProps) {
  // Calculate BMI
  const bmi = (profile.weight / ((profile.height / 100) ** 2)).toFixed(1);
  const bmiValue = parseFloat(bmi);
  let bmiCategory = 'NOMINAL';
  if (bmiValue < 18.5) bmiCategory = 'DEFICIT';
  else if (bmiValue >= 25 && bmiValue < 30) bmiCategory = 'ELEVATED';
  else if (bmiValue >= 30) bmiCategory = 'CRITICAL';

  // Calculate Calorie Goal (Mifflin-St Jeor Equation)
  const bmr = profile.gender === 'male' 
    ? (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + 5
    : (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) - 161;
  
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    'very-active': 1.9
  };
  
  const tdee = Math.round(bmr * activityMultipliers[profile.activityLevel]);
  const calorieGoal = profile.goal === 'weight-loss' ? tdee - 500 : profile.goal === 'muscle-gain' ? tdee + 300 : tdee;
  const proteinGoal = Math.round(2 * profile.weight);

  const [trendMode, setTrendMode] = useState<'calories' | 'protein'>('calories');

  // Compute daily totals for the last 7 days
  const dailyData = useMemo(() => {
    const dayMap: Record<string, { cal: number; protein: number }> = {};
    meals.forEach((meal) => {
      const date = new Date(meal.timestamp);
      const day = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      if (!dayMap[day]) {
        dayMap[day] = { cal: 0, protein: 0 };
      }
      dayMap[day].cal += meal.calories || 0;
      dayMap[day].protein += meal.protein || 0;
    });
    const order = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    return order.map((d) => ({
      day: d,
      cal: dayMap[d]?.cal ?? 0,
      protein: dayMap[d]?.protein ?? 0,
    }));
  }, [meals]);

  const calorieTrendData = dailyData.map((d) => ({ day: d.day, val: Math.round(d.cal), isProtein: false }));
  const proteinTrendData = dailyData.map((d) => ({ day: d.day, val: Math.round(d.protein), isProtein: true }));

  const currentGoal = trendMode === 'calories' ? calorieGoal : proteinGoal;
  const currentUnit = trendMode === 'calories' ? 'KCAL' : 'G';
  const currentChartData = trendMode === 'calories' ? calorieTrendData : proteinTrendData;
  
  const todayStr = new Date().toLocaleDateString();
  const todaysMeals = meals.filter(m => new Date(m.timestamp).toLocaleDateString() === todayStr);
  const todaysWater = water.filter(w => new Date(w.timestamp).toLocaleDateString() === todayStr);

  const todayCalories = todaysMeals.reduce((acc, meal) => acc + (meal.calories || 0), 0);
  const todayProtein = todaysMeals.reduce((acc, meal) => acc + (meal.protein || 0), 0);
  const todayWater = todaysWater.reduce((acc, log) => acc + log.amount, 0);
  const waterGoal = Math.round(profile.weight * 35); // 35ml per kg

  const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

  return (
    <div className="space-y-12">
      <header className="border-b border-[#3a3a3f] pb-3">
        <div className="flex items-baseline justify-between mb-4">
          <h1 className="display-xxl">STATUS: {bmiCategory}</h1>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5a5a5f]">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <p className="caption-text text-[#f0f0fa] max-w-2xl">
          COMMANDER {profile.name.toUpperCase()}--&gt;BIOMETRIC TELEMETRY IS ACTIVE<br />
          MONITORING CALORIC BURN &bull; HYDRATION LEVELS &bull; PHARMACOLOGICAL PROTOCOLS
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="BODY MASS INDEX" 
          value={bmi} 
          subValue={`STATUS: ${bmiCategory}`}
        />
        <StatCard 
          title="HYDRATION LEVEL" 
          value={`${Math.round((todayWater / waterGoal) * 100)}%`} 
          subValue={waterGoal > todayWater 
            ? `DEFICIT: ${(waterGoal - todayWater) / 1000}L`
            : "OPTIMAL"
          }
          progress={(todayWater / waterGoal) * 100}
        />

        <div className="card flex flex-col justify-center">
          <div className="eyebrow mb-6">NUTRITIONAL INTAKE</div>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider mb-2">
                <span className="text-[#5a5a5f]">ENERGY</span>
                <span>{Math.round(todayCalories)} / {calorieGoal} KCAL</span>
              </div>
              <div className="h-1 w-full bg-[#3a3a3f]">
                <div className="h-full bg-white transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, (todayCalories / calorieGoal) * 100))}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider mb-2">
                <span className="text-[#5a5a5f]">PROTEIN</span>
                <span>{Math.round(todayProtein)} / {proteinGoal} G</span>
              </div>
              <div className="h-1 w-full bg-[#3a3a3f]">
                <div className="h-full bg-white transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, (todayProtein / proteinGoal) * 100))}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Calorie / Protein Trend Chart */}
        <div className="card lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="eyebrow">TELEMETRY TREND (7 DAYS)</h3>
              <p className="caption-text text-[#5a5a5f] mt-1">TARGET: {currentGoal} {currentUnit}</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setTrendMode('calories')}
                className={`border px-4 py-2 text-[11px] font-bold uppercase tracking-wider ${trendMode === 'calories' ? 'bg-white text-black border-white' : 'border-[#3a3a3f] text-white hover:border-white'}`}
              >
                ENERGY (KCAL)
              </button>
              <button
                onClick={() => setTrendMode('protein')}
                className={`border px-4 py-2 text-[11px] font-bold uppercase tracking-wider ${trendMode === 'protein' ? 'bg-white text-black border-white' : 'border-[#3a3a3f] text-white hover:border-white'}`}
              >
                PROTEIN (G)
              </button>
            </div>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentChartData}>
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-black border border-[#3a3a3f] p-3 text-white text-xs uppercase tracking-wider font-bold">
                          <p className="text-[#5a5a5f] mb-1">{payload[0].payload.day}</p>
                          <p className="text-white text-lg">
                            {payload[0].value} {payload[0].payload.isProtein ? 'G' : 'KCAL'}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="val" radius={[0, 0, 0, 0]}>
                  {currentChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.day === todayDay ? '#ef4444' : '#e0e0e8'} 
                    />
                  ))}
                </Bar>
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#5a5a5f', fontWeight: 700 }} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Medicine Schedule */}
        <div className="card lg:col-span-1">
          <div className="mb-6 border-b border-[#3a3a3f] pb-4">
            <h3 className="eyebrow">PHARMACOLOGICAL PROTOCOLS</h3>
          </div>
          <div className="space-y-4">
            {medicines.length > 0 ? (
              medicines.map(med => (
                <div key={med.id} className="border border-[#3a3a3f] p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold uppercase">{med.name}</p>
                    <p className="text-xs text-[#5a5a5f] uppercase tracking-wider mt-1">{med.dosage}{med.mealTiming ? ` • ${med.mealTiming}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{med.time}</p>
                    <p className="text-[10px] uppercase font-bold mt-1" style={{ color: med.taken ? '#4ade80' : '#f87171' }}>
                      {med.taken ? 'ADMINISTERED' : 'PENDING'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="caption-text text-[#5a5a5f]">NO PROTOCOLS SCHEDULED.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subValue, progress }: { title: string, value: string | number, subValue: string, progress?: number }) {
  return (
    <div className="card flex flex-col justify-between">
      <div>
        <div className="eyebrow mb-4">{title}</div>
        <div className="display-xl mb-4">{value}</div>
      </div>
      <div>
        {progress !== undefined && (
          <div className="h-1 w-full bg-[#3a3a3f] mb-3">
            <div className="h-full bg-white transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
          </div>
        )}
        <div className="text-[11px] uppercase tracking-wider font-bold text-[#5a5a5f]">{subValue}</div>
      </div>
    </div>
  );
}
