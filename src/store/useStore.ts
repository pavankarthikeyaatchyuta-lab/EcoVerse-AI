import { create } from 'zustand';

export interface UserProfile {
  location: string;
  lifestyleBaseline: {
    diet: string;
    commute: string;
    energy: string;
  };
}

export interface WorldState {
  narrative: string;
  imageUrl: string | null;
  cssState: 'polluted' | 'neutral' | 'thriving';
}

export interface ConsequenceCard {
  id: string;
  choice: string;
  impact: string;
  equivalent: string[];
  alternative: string;
  impactReductionPercentage: number;
}

export interface FutureMessage {
  id: string;
  message: string;
  createdAt: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: number;
}

export interface Quest {
  title: string;
  description: string;
  xpReward: number;
}

interface AppState {
  profile: UserProfile | null;
  stats: { healthScore: number; currentStreak: number; lastLogin: number | null };
  worldState: WorldState | null;
  preferences: { highContrast: boolean; eli10Mode: boolean };
  consequences: ConsequenceCard[];
  futureMessages: FutureMessage[];
  achievements: Achievement[];
  
  setProfile: (profile: UserProfile) => void;
  setWorldState: (worldState: WorldState) => void;
  updateHealthScore: (healthDelta: number) => void;
  addConsequence: (card: Omit<ConsequenceCard, 'id'>) => void;
  addFutureMessage: (msg: Omit<FutureMessage, 'id' | 'createdAt'>) => void;
  unlockAchievement: (achievement: Omit<Achievement, 'unlockedAt'>) => void;
  processLoginStreak: () => void;
  toggleHighContrast: () => void;
  toggleEli10Mode: () => void;
}

export const useStore = create<AppState>((set) => ({
  profile: null,
  stats: { healthScore: 50, currentStreak: 0, lastLogin: null },
  worldState: null,
  preferences: { highContrast: false, eli10Mode: false },
  consequences: [],
  futureMessages: [],
  achievements: [],
  
  setProfile: (profile) => set({ profile }),
  setWorldState: (worldState) => set({ worldState }),
  
  updateHealthScore: (healthDelta) => set((state) => {
    const newHealth = Math.max(0, Math.min(100, state.stats.healthScore + healthDelta));
    const cssState = newHealth >= 70 ? 'thriving' : newHealth < 40 ? 'polluted' : 'neutral';
    
    return { 
      stats: { ...state.stats, healthScore: newHealth },
      worldState: state.worldState ? { ...state.worldState, cssState } : { narrative: 'A world in flux...', imageUrl: null, cssState }
    };
  }),

  addConsequence: (card) => set((state) => ({
    consequences: [{ id: Date.now().toString(), ...card }, ...state.consequences]
  })),

  addFutureMessage: (msg) => set((state) => ({
    futureMessages: [{ id: Date.now().toString(), createdAt: Date.now(), ...msg }, ...state.futureMessages]
  })),

  unlockAchievement: (achievement) => set((state) => {
    if (state.achievements.find(a => a.id === achievement.id)) return state; // Already unlocked
    return {
      achievements: [{ ...achievement, unlockedAt: Date.now() }, ...state.achievements]
    };
  }),

  processLoginStreak: () => set((state) => {
    const now = new Date();
    const lastLogin = state.stats.lastLogin ? new Date(state.stats.lastLogin) : null;
    
    let newStreak = state.stats.currentStreak;
    if (!lastLogin) {
      newStreak = 1; // First login
    } else {
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysDiff = Math.floor((now.getTime() - lastLogin.getTime()) / msPerDay);
      
      if (daysDiff === 1) {
        newStreak += 1; // Consecutive day
      } else if (daysDiff > 1) {
        newStreak = 1; // Streak broken
      }
    }
    
    return { stats: { ...state.stats, currentStreak: newStreak, lastLogin: now.getTime() } };
  }),

  toggleHighContrast: () => set((state) => {
    const newVal = !state.preferences.highContrast;
    if (newVal) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    return { preferences: { ...state.preferences, highContrast: newVal } };
  }),

  toggleEli10Mode: () => set((state) => ({ 
    preferences: { ...state.preferences, eli10Mode: !state.preferences.eli10Mode } 
  })),
}));
