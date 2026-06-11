'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Utensils, Car, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';

const steps = [
  { id: 'location', title: 'Where do you live?', icon: MapPin, type: 'text', placeholder: 'e.g., Seattle, WA' },
  { id: 'diet', title: 'What best describes your diet?', icon: Utensils, type: 'select', options: ['Omnivore', 'Vegetarian', 'Vegan', 'Pescatarian'] },
  { id: 'commute', title: 'How do you usually get around?', icon: Car, type: 'select', options: ['Car (Gas)', 'Car (EV)', 'Public Transit', 'Bicycle/Walking'] },
  { id: 'energy', title: 'What is your primary home energy source?', icon: Zap, type: 'select', options: ['Grid (Mixed)', '100% Renewable', 'Natural Gas', 'I am not sure'] },
];

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const setProfile = useStore((state) => state.setProfile);
  const router = useRouter();

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      await finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    setIsGenerating(true);
    
    // Save to global store
    const profile = {
      location: answers['location'] || 'Unknown',
      lifestyleBaseline: {
        diet: answers['diet'] || 'Omnivore',
        commute: answers['commute'] || 'Car (Gas)',
        energy: answers['energy'] || 'Grid (Mixed)',
      }
    };
    setProfile(profile);

    try {
      // Call our API to generate the initial world state using Gemini
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile })
      });
      
      if (!response.ok) throw new Error('Failed to generate world');
      
      const data = await response.json();
      
      // We will handle setting the world state in the dashboard or here
      useStore.getState().setWorldState(data.worldState);
      useStore.getState().processLoginStreak(); // Init streak
      
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
      alert('There was an issue generating your future world. Please try again.');
    }
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 text-center h-full">
        <Loader2 className="w-16 h-16 animate-spin text-green-500" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Simulating Your Future...</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md">
          EcoVerse AI is analyzing your lifestyle and rendering a vision of {answers['location'] || 'your city'} 50 years from now.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800">
      <div className="p-8">
        <div className="mb-8 flex justify-between items-center">
          <div className="flex space-x-2">
            {steps.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-2 w-8 rounded-full transition-colors duration-300 ${idx <= currentStep ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-slate-500">Step {currentStep + 1} of {steps.length}</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
                <Icon className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{currentStepData.title}</h2>
            </div>

            {currentStepData.type === 'text' ? (
              <input
                type="text"
                placeholder={currentStepData.placeholder}
                value={answers[currentStepData.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [currentStepData.id]: e.target.value })}
                className="w-full p-4 text-lg border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-transparent focus:border-green-500 focus:ring-0 outline-none text-slate-800 dark:text-slate-100 transition-colors"
                autoFocus
              />
            ) : (
              <div className="grid gap-3">
                {currentStepData.options?.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setAnswers({ ...answers, [currentStepData.id]: option });
                      // Auto-advance on select if it's not the last step
                      if (currentStep < steps.length - 1) {
                        setTimeout(() => handleNext(), 300);
                      }
                    }}
                    className={`p-4 text-left rounded-xl border-2 transition-all ${
                      answers[currentStepData.id] === option 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-semibold' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!answers[currentStepData.id]}
            className="flex items-center space-x-2 px-6 py-3 bg-slate-900 dark:bg-green-500 text-white dark:text-slate-900 font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 dark:hover:bg-green-400 transition-colors"
          >
            <span>{currentStep === steps.length - 1 ? 'Generate Future' : 'Next'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
