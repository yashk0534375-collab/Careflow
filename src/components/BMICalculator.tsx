import React from 'react';
import { UserProfile } from '../types';

interface BMICalculatorProps {
  profile: UserProfile;
}

export default function BMICalculator({ profile }: BMICalculatorProps) {
  const bmi = (profile.weight / ((profile.height / 100) ** 2)).toFixed(1);
  const bmiValue = parseFloat(bmi);

  let category = 'NOMINAL';
  let description = 'BIOMETRICS ARE WITHIN OPTIMAL PARAMETERS. CONTINUE CURRENT TRAJECTORY.';
  let tips = [
    'MAINTAIN CURRENT PHYSICAL CONDITIONING REGIMEN.',
    'SUSTAIN NUTRITIONAL PAYLOAD DISTRIBUTION.',
    'ENSURE ADEQUATE RECOVERY CYCLES.'
  ];

  if (bmiValue < 18.5) {
    category = 'DEFICIT';
    description = 'BIOMETRICS INDICATE MASS DEFICIT. NUTRITIONAL ADJUSTMENT RECOMMENDED.';
    tips = [
      'INCREASE CALORIC INTAKE FREQUENCY.',
      'PRIORITIZE HIGH-DENSITY NUTRIENT SOURCES.',
      'INITIATE HYPERTROPHY-FOCUSED CONDITIONING.'
    ];
  } else if (bmiValue >= 25 && bmiValue < 30) {
    category = 'ELEVATED';
    description = 'BIOMETRICS SHOW ELEVATED MASS. MINOR TRAJECTORY CORRECTIONS ADVISED.';
    tips = [
      'INCREASE CARDIOVASCULAR EXPENDITURE.',
      'CALIBRATE NUTRITIONAL INTAKE VOLUME.',
      'REDUCE PROCESSED COMBUSTIBLES.'
    ];
  } else if (bmiValue >= 30) {
    category = 'CRITICAL';
    description = 'CRITICAL MASS DETECTED. IMMEDIATE PROTOCOL REVISION REQUIRED.';
    tips = [
      'ESTABLISH STRICT CALORIC DEFICIT.',
      'TRANSITION TO WHOLE-FOOD FUEL SOURCES.',
      'COMMENCE SUPERVISED CONDITIONING PROTOCOL.'
    ];
  }

  return (
    <div className="space-y-12">
      <header className="border-b border-[#3a3a3f] pb-8">
        <h1 className="display-xxl mb-4">BIOMETRIC ANALYSIS</h1>
        <p className="caption-text text-[#f0f0fa] max-w-2xl uppercase">
          EVALUATION OF MASS-TO-HEIGHT RATIO. 
          USE THIS DATA TO CALIBRATE NUTRITIONAL AND PHYSICAL PROTOCOLS.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="card text-center py-12">
            <div className="eyebrow mb-8">INDEX VALUE</div>
            <div className="display-xxl text-[100px] leading-none mb-8">{bmi}</div>
            <div className="border border-white inline-block px-4 py-2 text-[11px] font-bold tracking-wider">
              STATUS: {category}
            </div>
          </div>

          <div className="card">
            <h3 className="eyebrow mb-6 border-b border-[#3a3a3f] pb-4">CURRENT PARAMETERS</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-bold uppercase">
                <span className="text-[#5a5a5f]">MASS</span>
                <span>{profile.weight} KG</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold uppercase">
                <span className="text-[#5a5a5f]">HEIGHT</span>
                <span>{profile.height} CM</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="eyebrow mb-6 border-b border-[#3a3a3f] pb-4">SYSTEM DIAGNOSTIC</h3>
            <p className="display-lg text-3xl leading-tight uppercase">{description}</p>
          </div>

          <div className="card">
            <h3 className="eyebrow mb-6 border-b border-[#3a3a3f] pb-4">RECOMMENDED DIRECTIVES</h3>
            <div className="space-y-4">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-4 p-4 border border-[#3a3a3f]">
                  <div className="text-[#5a5a5f] font-bold mt-0.5">[{i + 1}]</div>
                  <p className="text-sm font-bold uppercase tracking-wide">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-[#3a3a3f] p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="text-[10px] font-bold text-white border border-white px-2 py-1 uppercase tracking-widest shrink-0">
              WARNING
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#f0f0fa] leading-relaxed font-bold">
                BMI ALGORITHM DOES NOT ACCOUNT FOR MUSCLE DENSITY OR STRUCTURAL DIFFERENCES. 
                USE AS A BASELINE METRIC ONLY. CONSULT MEDICAL COMMAND FOR PRECISE EVALUATION.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
