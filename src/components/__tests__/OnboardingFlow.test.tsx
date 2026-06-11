import { render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import OnboardingFlow from '../OnboardingFlow';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: PropsWithChildren) => <>{children}</>,
  useReducedMotion: () => true,
}));

describe('OnboardingFlow smoke test', () => {
  it('renders the onboarding flow', () => {
    render(<OnboardingFlow />);

    expect(screen.getByText('Where do you live?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });
});
