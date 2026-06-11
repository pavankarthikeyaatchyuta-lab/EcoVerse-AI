import { render } from '@testing-library/react';
import FutureWorldVisual from '../FutureWorldVisual';
import { useStore } from '@/store/useStore';

describe('FutureWorldVisual', () => {
  it('renders without crashing in a neutral state', () => {
    useStore.setState({ stats: { healthScore: 50, currentStreak: 0, lastLogin: null } });
    const { container } = render(<FutureWorldVisual />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders thriving state when healthScore >= 70', () => {
    useStore.setState({ stats: { healthScore: 80, currentStreak: 0, lastLogin: null } });
    const { container } = render(<FutureWorldVisual />);
    expect(container.firstChild).toHaveClass('from-blue-300'); // Check for thriving sky color
  });

  it('renders polluted state when healthScore < 40', () => {
    useStore.setState({ stats: { healthScore: 20, currentStreak: 0, lastLogin: null } });
    const { container } = render(<FutureWorldVisual />);
    expect(container.firstChild).toHaveClass('from-slate-400'); // Check for polluted sky color
  });
});
