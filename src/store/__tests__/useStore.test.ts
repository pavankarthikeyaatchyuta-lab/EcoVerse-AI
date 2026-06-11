import { useStore } from '../useStore';

describe('useStore Logic', () => {
  beforeEach(() => {
    useStore.setState({
      profile: null,
      stats: { healthScore: 50, currentStreak: 0, lastLogin: null },
      worldState: null,
      consequences: [],
      futureMessages: [],
      achievements: []
    });
  });

  it('updates health score correctly within bounds 0-100', () => {
    const store = useStore.getState();
    
    // Add 10
    store.updateHealthScore(10);
    expect(useStore.getState().stats.healthScore).toBe(60);
    expect(useStore.getState().worldState?.cssState).toBe('neutral');

    // Push past 100
    useStore.getState().updateHealthScore(50);
    expect(useStore.getState().stats.healthScore).toBe(100);
    expect(useStore.getState().worldState?.cssState).toBe('thriving');

    // Push below 0
    useStore.getState().updateHealthScore(-150);
    expect(useStore.getState().stats.healthScore).toBe(0);
    expect(useStore.getState().worldState?.cssState).toBe('polluted');
  });

  it('processes daily login streak correctly', () => {
    const store = useStore.getState();
    
    // First login
    store.processLoginStreak();
    expect(useStore.getState().stats.currentStreak).toBe(1);

    // Set last login to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    useStore.setState(prev => ({
      stats: { ...prev.stats, lastLogin: yesterday.getTime() }
    }));

    useStore.getState().processLoginStreak();
    expect(useStore.getState().stats.currentStreak).toBe(2);

    // Set last login to 3 days ago (break streak)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    useStore.setState(prev => ({
      stats: { ...prev.stats, lastLogin: threeDaysAgo.getTime() }
    }));

    useStore.getState().processLoginStreak();
    expect(useStore.getState().stats.currentStreak).toBe(1);
  });
});
