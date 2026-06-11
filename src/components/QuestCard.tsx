'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import type { Quest } from '@/store/useStore';
import { CheckCircle2 } from 'lucide-react';

export default function QuestCard({ quest }: { quest: Quest }) {
  const [completed, setCompleted] = useState(false);
  const updateHealthScore = useStore(state => state.updateHealthScore);

  const handleComplete = () => {
    setCompleted(true);
    updateHealthScore(5); // Arbitrary health boost for completing a quest
    // Real implementation would hit /api/quests/complete to persist
  };

  return (
    <div className={`p-5 rounded-2xl border-2 transition-all duration-300 ${completed ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className={`font-bold text-lg ${completed ? 'text-green-700 dark:text-green-300 line-through' : 'text-slate-800 dark:text-white'}`}>
            {quest.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {quest.description}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-3 py-1 rounded-full text-sm">
            +{quest.xpReward} XP
          </span>
          <button 
            onClick={handleComplete}
            disabled={completed}
            className={`p-2 rounded-full transition-colors ${completed ? 'text-green-500 bg-green-100 dark:bg-transparent' : 'text-slate-400 hover:text-green-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <CheckCircle2 className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
