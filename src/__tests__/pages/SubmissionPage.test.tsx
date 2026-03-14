import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../helpers/testUtils';
import SubmissionPage from '@/features/submissions/pages/SubmissionPage';

vi.mock('@/contexts/PageContext', () => ({ usePageTitle: vi.fn() }));
vi.mock('@/features/submissions/SubmissionTracker', () => ({
  default: () => <div data-testid="submission-tracker">SubmissionTracker Component</div>,
}));

describe('SubmissionPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should render without crashing', () => {
    render(<SubmissionPage />);
    expect(screen.getByTestId('submission-tracker')).toBeInTheDocument();
  });

  it('should render SubmissionTracker component', () => {
    render(<SubmissionPage />);
    expect(screen.getByText('SubmissionTracker Component')).toBeInTheDocument();
  });

  it('should have page wrapper structure', () => {
    const { container } = render(<SubmissionPage />);
    expect(container.querySelector('.submission-page-wrapper')).toBeInTheDocument();
    expect(container.querySelector('.page-wrapper')).toBeInTheDocument();
  });

  it('should render tracker inside page wrapper', () => {
    const { container } = render(<SubmissionPage />);
    const wrapper = container.querySelector('.page-wrapper');
    expect(wrapper).toBeInTheDocument();
    const tracker = screen.getByTestId('submission-tracker');
    expect(wrapper!.contains(tracker)).toBe(true);
  });
});
