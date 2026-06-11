import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../page';
import { useStore } from '@/store/useStore';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock('@/components/Animated3DBackground', () => () => <div data-testid="background" />);
jest.mock('@/components/FutureWorldVisual', () => () => <div data-testid="future-visual" />);
jest.mock('@/components/QuestCard', () => ({ quest }: { quest: { title: string } }) => <div>{quest.title}</div>);
jest.mock('@/components/ConsequenceCard', () => ({ card }: { card: { choice: string } }) => <div>{card.choice}</div>);
jest.mock('@/components/CoachModal', () => () => <div data-testid="coach-modal" />);

describe('Dashboard smoke test', () => {
  beforeEach(() => {
    pushMock.mockClear();
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ quests: [] }),
    } as Response);

    useStore.setState({
      profile: {
        location: 'Seattle, WA',
        lifestyleBaseline: {
          diet: 'Vegan',
          commute: 'Public Transit',
          energy: '100% Renewable',
        },
      },
      stats: { healthScore: 72, currentStreak: 4, lastLogin: null },
      worldState: {
        narrative: 'A hopeful future city.',
        imageUrl: null,
        cssState: 'thriving',
      },
      consequences: [],
      preferences: { highContrast: false, eli10Mode: false },
      futureMessages: [],
      achievements: [],
    });
  });

  it('renders the dashboard', async () => {
    render(<Dashboard />);

    expect(screen.getByText('Your Future City')).toBeInTheDocument();
    expect(screen.getByTestId('future-visual')).toBeInTheDocument();

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(pushMock).not.toHaveBeenCalled();
  });
});
