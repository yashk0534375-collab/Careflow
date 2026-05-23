import React, { useState, useEffect, useRef } from 'react';



import { motion, AnimatePresence } from 'framer-motion';

import Shuffle from './components/Shuffle';
import { UserProfile, MealLog, Medicine, WaterLog, Hospital } from './types';
import { apiRequest } from './lib/api';

// Components

import Dashboard from './components/Dashboard';
import HospitalMap from './components/HospitalMap';
import HospitalSearch from './components/HospitalSearch';
import ProfileForm from './components/ProfileForm';
import CalorieTracker from './components/CalorieTracker';
import WaterTracker from './components/WaterTracker';
import MedicineReminder from './components/MedicineReminder';
import Chatbot from './components/Chatbot';
import BMICalculator from './components/BMICalculator';



type Tab = 'dashboard' | 'hospitals' | 'hospital-search' | 'nutrition' | 'water' | 'medicine' | 'profile' | 'bmi';

export default function App() {
  const [showHeader, setShowHeader] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

useEffect(() => {
  let lastY = window.scrollY;
  const handle = () => {
    const curY = window.scrollY;
    if (curY > lastY && curY > 50) {
      setShowHeader(false);
    } else if (curY < lastY) {
      setShowHeader(true);
    }
    lastY = curY;
  };
  window.addEventListener('scroll', handle);
  return () => window.removeEventListener('scroll', handle);
}, []);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('careflow_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [mealLogs, setMealLogs] = useState<MealLog[]>(() => {
    const saved = localStorage.getItem('careflow_meals');
    return saved ? JSON.parse(saved) : [];
  });
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    const saved = localStorage.getItem('careflow_medicines');
    return saved ? JSON.parse(saved) : [];
  });
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>(() => {
    const saved = localStorage.getItem('careflow_water');
    return saved ? JSON.parse(saved) : [];
  });

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          setUserLocation([28.6139, 77.2090]);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      setUserLocation([28.6139, 77.2090]);
    }
  }, []);

  useEffect(() => {
    if (userProfile) localStorage.setItem('careflow_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('careflow_meals', JSON.stringify(mealLogs));
  }, [mealLogs]);

  useEffect(() => {
    localStorage.setItem('careflow_medicines', JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    localStorage.setItem('careflow_water', JSON.stringify(waterLogs));
  }, [waterLogs]);

  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD' },
    { id: 'nutrition', label: 'NUTRITION' },
    { id: 'water', label: 'WATER' },
    { id: 'medicine', label: 'MEDICINE' },
    { id: 'hospitals', label: 'HOSPITALS' },
    { id: 'hospital-search', label: 'SEARCH' },
    { id: 'bmi', label: 'BMI' },
    { id: 'profile', label: 'PROFILE' }
  ];

  if (!userProfile && activeTab !== 'profile') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ProfileForm onSave={(profile) => {
          setUserProfile(profile);
          setActiveTab('dashboard');
        }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Image - The full-bleed hero photo concept */}
      <div className="fixed inset-0 z-[-1]">
        <div className="absolute inset-0 bg-black/60 z-10" /> {/* Photo grade */}
        <img
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
          alt="Earth from space"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Top Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-50 px-8 py-6 flex justify-between items-center text-white transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="pointer-events-auto">
          <div className="cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <Shuffle
              text="CAREFLOW"
              shuffleDirection="right"
              duration={0.35}
              shuffleTimes={1}
              animationMode="evenodd"
              ease="power3.out"
              stagger={0.03}
              threshold={0}
              rootMargin="0px"
              triggerOnce={true}
              triggerOnHover={true}
              respectReducedMotion={true}
            />

          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 pointer-events-auto">
            {navItems.filter(item => item.id !== 'profile').map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`text-[11px] font-bold tracking-[0.2em] uppercase transition-opacity hover:opacity-100 ${activeTab === item.id ? 'opacity-100' : 'opacity-50'}`}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => setActiveTab('profile')}
              className={`text-[11px] font-bold tracking-[0.2em] uppercase transition-opacity hover:opacity-100 ml-4 ${activeTab === 'profile' ? 'opacity-100' : 'opacity-50'}`}
            >
              PROFILE
            </button>
          </nav>

      </header>

      {/* Main Content Area */}
      <main className="flex-1 mt-[100px] p-6 lg:p-12 z-10 max-w-[1200px] mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'dashboard' && (
              <Dashboard
                profile={userProfile!}
                meals={mealLogs}
                water={waterLogs}
                medicines={medicines}
              />
            )}
            {activeTab === 'hospitals' && <HospitalMap initialUserLocation={userLocation} />}
            {activeTab === 'hospital-search' && <HospitalSearch initialUserLocation={userLocation} />}
            {activeTab === 'nutrition' && (
              <CalorieTracker
                logs={mealLogs}
                onAdd={(log) => setMealLogs([...mealLogs, log])}
                onRemove={(id) => setMealLogs(mealLogs.filter(l => l.id !== id))}
              />
            )}
            {activeTab === 'water' && (
              <WaterTracker
                logs={waterLogs}
                onAdd={(amount) => setWaterLogs([...waterLogs, { amount, timestamp: Date.now() }])}
              />
            )}
            {activeTab === 'medicine' && (
              <MedicineReminder
                medicines={medicines}
                onUpdate={setMedicines}
              />
            )}
            {activeTab === 'bmi' && <BMICalculator profile={userProfile!} />}
            {activeTab === 'profile' && (
              <ProfileForm
                initialData={userProfile}
                onSave={setUserProfile}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Site Footer */}
      <footer className="w-full bg-black/80 backdrop-blur text-white p-8 mt-auto z-10 border-t border-[#3a3a3f]">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center text-xs uppercase tracking-[0.96px] text-[#5a5a5f]">
          <span>© {new Date().getFullYear()} CAREFLOW. ALL RIGHTS RESERVED.</span>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">PRIVACY POLICY</a>
            <a href="#" className="hover:text-white transition-colors">TERMS OF SERVICE</a>
          </div>
        </div>
      </footer>

      <Chatbot />
    </div>
  );
}
