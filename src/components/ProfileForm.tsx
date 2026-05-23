import React, { useState } from 'react';
import { UserProfile } from '../types';

interface ProfileFormProps {
  initialData?: UserProfile | null;
  onSave: (profile: UserProfile) => void;
}

export default function ProfileForm({ initialData, onSave }: ProfileFormProps) {
  const [formData, setFormData] = useState<UserProfile>(initialData || {
    name: '',
    age: 25,
    gender: 'male',
    height: 170,
    weight: 70,
    goal: 'maintenance',
    activityLevel: 'moderate',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="card w-full max-w-2xl mx-auto border border-[#3a3a3f] bg-[#0a0a0a]">
      <div className="mb-8">
        <h2 className="display-xl mb-2">INITIALIZE PROFILE</h2>
        <p className="caption-text text-[#f0f0fa]">CONFIGURE YOUR BIOMETRIC PARAMETERS TO COMMENCE TRACKING.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="eyebrow block">DESIGNATION / NAME</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full"
              placeholder="ENTER NAME"
            />
          </div>

          <div className="space-y-2">
            <label className="eyebrow block">AGE</label>
            <input
              type="number"
              required
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="eyebrow block">HEIGHT (CM)</label>
            <input
              type="number"
              required
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="eyebrow block">MASS (KG)</label>
            <input
              type="number"
              required
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="eyebrow block">GENDER</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
              className="w-full"
            >
              <option value="male">MALE</option>
              <option value="female">FEMALE</option>
              <option value="other">OTHER</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="eyebrow block">PRIMARY OBJECTIVE</label>
            <select
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value as any })}
              className="w-full"
            >
              <option value="weight-loss">MASS REDUCTION</option>
              <option value="muscle-gain">MUSCLE HYPERTROPHY</option>
              <option value="maintenance">MAINTAIN ORBIT</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="eyebrow block mb-2">ACTIVITY LEVEL</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {(['sedentary', 'light', 'moderate', 'active', 'very-active'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, activityLevel: level })}
                  className={`border border-[#3a3a3f] py-3 px-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    formData.activityLevel === level
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent text-[#f0f0fa] hover:border-white'
                  }`}
                >
                  {level.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[#3a3a3f]">
          <button type="submit" className="btn-ghost w-full">
            {initialData ? 'UPDATE PARAMETERS' : 'COMMENCE SEQUENCE'}
          </button>
        </div>
      </form>
    </div>
  );
}
