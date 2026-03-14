import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import JournalCard from '../../features/journals/components/JournalCard';

vi.mock('@/features/favorite/components/FavoriteButton', () => ({
  default: () => <button data-testid="fav-btn">Fav</button>,
}));

const mockJournal = {
  journalId: '1',
  name: 'Test Journal',
  issn: '1234-5678',
  levels: ['计算机科学'],
  ratingCache: { journalId: '1', rating: 4.5, ratingCount: 10 },
  impactFactor: 3.14,
  category: '计算机',
};

const mockOnClick = vi.fn();

const renderComponent = (journal = mockJournal) => {
  return render(
    <BrowserRouter>
      <JournalCard journal={journal as any} onClick={mockOnClick} />
    </BrowserRouter>
  );
};

describe('JournalCard', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders journal name', () => {
    renderComponent();
    expect(screen.getByText('Test Journal')).toBeInTheDocument();
  });

  it('renders ISSN', () => {
    renderComponent();
    expect(screen.getByText('1234-5678')).toBeInTheDocument();
  });

  it('displays rating', () => {
    renderComponent();
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('displays impact factor', () => {
    renderComponent();
    expect(screen.getByText('3.14')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    renderComponent();
    const card = screen.getByRole('button', { name: /查看期刊.*Test Journal/ });
    fireEvent.click(card);
    expect(mockOnClick).toHaveBeenCalled();
  });

  it('handles journal with zero rating', () => {
    const noRating = { ...mockJournal, ratingCache: { journalId: '1', rating: 0, ratingCount: 0 } };
    renderComponent(noRating);
    expect(screen.getByText('0.0')).toBeInTheDocument();
  });

  it('displays levels as tags', () => {
    renderComponent();
    expect(screen.getByText('计算机科学')).toBeInTheDocument();
  });

  it('displays category', () => {
    renderComponent();
    expect(screen.getByText('计算机')).toBeInTheDocument();
  });
});