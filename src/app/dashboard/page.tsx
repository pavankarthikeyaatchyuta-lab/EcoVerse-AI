'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { MessageSquare, Leaf, Trophy, Activity, Moon, Sun, Baby } from 'lucide-react';
import CoachModal from '@/components/CoachModal';
import QuestCard from '@/components/QuestCard';
import ConsequenceCard from '@/components/ConsequenceCard';
import FutureWorldVisual from '@/components/FutureWorldVisual';

export default function Dashboard() {
  const { profile, stats, worldState, consequences, preferences, toggleHighContrast, toggleEli10Mode } = useStore();
  const router = useRouter();
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [quests, setQuests] = useState<any[]>([]);
  const [isLoadingQuests, setIsLoadingQuests] = useState(true);

  // Calculate today's carbon reflection
  const todayReduction = consequences.reduce((acc, curr) => acc + curr.impactReductionPercentage, 0);
  const reflectionMessage = todayReduction > 0 
    ? `Today your choices reduced enough emissions to offset ${todayReduction * 2} minutes of standard driving.`
    : "Log an action with your AI Carbon Coach to see your daily reflection.";

  useEffect(() => {
    if (!profile) {
      router.push('/');
      return;
    }

    const fetchQuests = async () => {
      try {
        const res = await fetch('/api/quests/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile, stats })
        });
        const data = await res.json();
        if (data.quests) setQuests(data.quests);
      } catch (err) {
        console.error('Failed to fetch quests', err);
      } finally {
        setIsLoadingQuests(false);
      }
    };

    fetchQuests();
  }, [profile, router, stats]);

  if (!profile) return null;

  return (
    <div className={`min-h-screen p-4 md:p-8 transition-colors ${preferences.highContrast ? 'bg-black text-white' : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50'}`}>
      <header className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Your Future City</h1>
          <p className="opacity-70">{stats.currentStreak} Day Streak</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Accessibility Controls */}
          <div className="flex bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button 
              onClick={toggleEli10Mode}
              className={`flex items-center px-3 py-2 text-sm font-medium transition-colors ${preferences.eli10Mode ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              aria-pressed={preferences.eli10Mode}
              aria-label="Toggle Explain Like I'm 10 Mode"
            >
              <Baby className="w-4 h-4 mr-1" />
              ELI10
            </button>
            <div className="w-px bg-slate-200 dark:bg-slate-800"></div>
            <button 
              onClick={toggleHighContrast}
              className={`flex items-center px-3 py-2 text-sm font-medium transition-colors ${preferences.highContrast ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              aria-pressed={preferences.highContrast}
              aria-label="Toggle High Contrast Mode"
            >
              {preferences.highContrast ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full font-bold shadow-sm ${preferences.highContrast ? 'bg-white text-black border border-white' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>
            <Activity className="w-5 h-5" />
            <span>Health Index: {stats.healthScore}/100</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Today's Carbon Reflection Banner */}
          <div className={`p-4 rounded-xl flex items-center space-x-3 shadow-sm border ${preferences.highContrast ? 'border-white' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'}`}>
            <Activity className={`w-6 h-6 flex-shrink-0 ${preferences.highContrast ? 'text-white' : 'text-blue-500'}`} />
            <div>
              <p className="text-sm font-bold opacity-70 uppercase tracking-wider mb-1">Today's Reflection</p>
              <p className="font-medium">{reflectionMessage}</p>
            </div>
          </div>

          <div className={`rounded-2xl p-6 shadow-sm border ${preferences.highContrast ? 'bg-black border-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
            <FutureWorldVisual />
            {worldState && (
              <div className={`mt-6 p-4 rounded-xl ${preferences.highContrast ? 'border border-white' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                <p className="leading-relaxed italic">
                  "{worldState.narrative}"
                </p>
              </div>
            )}
          </div>

          {consequences.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <Leaf className={`w-6 h-6 ${preferences.highContrast ? 'text-white' : 'text-green-500'}`} />
                <span>Recent Actions Impact</span>
              </h2>
              <div className="grid gap-4">
                {consequences.slice(0, 3).map(card => (
                  <ConsequenceCard key={card.id} card={card} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="flex items-center space-x-3 mb-6">
            <Trophy className={`w-6 h-6 ${preferences.highContrast ? 'text-white' : 'text-yellow-500'}`} />
            <h2 className="text-xl font-bold">Daily Quests</h2>
          </div>
          
          {isLoadingQuests ? (
             <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`h-24 rounded-2xl ${preferences.highContrast ? 'border border-white' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                ))}
             </div>
          ) : (
            <div className="grid gap-4">
              {quests.map((quest, idx) => (
                <QuestCard key={idx} quest={quest} />
              ))}
              {quests.length === 0 && (
                <p className="opacity-70">No active quests right now. Talk to your coach!</p>
              )}
            </div>
          )}
        </div>
      </main>

      <button 
        onClick={() => setIsCoachOpen(true)}
        aria-label="Open AI Carbon Coach Chat"
        className={`fixed bottom-8 right-8 p-4 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center z-40 ${preferences.highContrast ? 'bg-white text-black border-4 border-black' : 'bg-green-500 hover:bg-green-600 text-white'}`}
      >
        <MessageSquare className="w-6 h-6" />
        <span className="ml-2 font-bold pr-2">Ask Coach</span>
      </button>

      {isCoachOpen && <CoachModal onClose={() => setIsCoachOpen(false)} />}
    </div>
  );
}
