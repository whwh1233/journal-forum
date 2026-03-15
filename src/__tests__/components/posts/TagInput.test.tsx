import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagInput from '@/features/posts/components/TagInput';
import { tagService } from '@/services/tagService';
import type { TagInfo } from '@/features/posts/types/post';

vi.mock('@/services/tagService', () => ({
  tagService: {
    suggestTags: vi.fn(),
  }
}));

const mockApprovedTag: TagInfo = { id: 1, name: 'SCI', isOfficial: true, status: 'approved', postCount: 50 };
const mockPendingTag: TagInfo = { id: 2, name: 'myTag', isOfficial: false, status: 'pending', postCount: 0, createdBy: 'user1' };
const mockRegularTag: TagInfo = { id: 3, name: 'Nature', isOfficial: false, status: 'approved', postCount: 30 };

const mockSuggestTags = tagService.suggestTags as ReturnType<typeof vi.fn>;

describe('TagInput', () => {
  let onChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    onChange = vi.fn();
    mockSuggestTags.mockReset();
    mockSuggestTags.mockResolvedValue({ tags: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  describe('Rendering', () => {
    it('should render input field with placeholder', () => {
      render(<TagInput selectedTags={[]} onChange={onChange} />);

      const input = screen.getByPlaceholderText('输入标签名搜索或创建...');
      expect(input).toBeInTheDocument();
    });

    it('should display selected tag chips', () => {
      render(<TagInput selectedTags={[mockApprovedTag]} onChange={onChange} />);

      expect(screen.getByText('SCI')).toBeInTheDocument();
      const chip = screen.getByText('SCI').closest('.tag-input-chip');
      expect(chip).toBeInTheDocument();
    });

    it('should show Star icon for official tags', () => {
      const { container } = render(
        <TagInput selectedTags={[mockApprovedTag]} onChange={onChange} />
      );

      // Official tags render a Star icon from lucide-react inside the chip
      const chip = container.querySelector('.tag-input-chip');
      expect(chip).not.toBeNull();
      const starIcon = chip!.querySelector('.tag-input-chip-icon svg');
      expect(starIcon).toBeInTheDocument();
    });

    it('should show Clock icon for pending tags', () => {
      const { container } = render(
        <TagInput selectedTags={[mockPendingTag]} onChange={onChange} />
      );

      const chip = container.querySelector('.tag-input-chip--pending');
      expect(chip).not.toBeNull();
      const clockIcon = chip!.querySelector('.tag-input-chip-icon svg');
      expect(clockIcon).toBeInTheDocument();
    });

    it('should disable input when max tags reached', () => {
      render(
        <TagInput selectedTags={[mockApprovedTag]} onChange={onChange} maxTags={1} />
      );

      const input = screen.getByPlaceholderText(/已达上限/);
      expect(input).toBeDisabled();
    });
  });

  // ---------------------------------------------------------------------------
  // Autocomplete
  // ---------------------------------------------------------------------------
  describe('Autocomplete', () => {
    it('should call suggestTags after 300ms debounce', async () => {
      render(<TagInput selectedTags={[]} onChange={onChange} />);

      const input = screen.getByPlaceholderText('输入标签名搜索或创建...');
      fireEvent.change(input, { target: { value: 'sci' } });

      // Should not have been called yet
      expect(mockSuggestTags).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(mockSuggestTags).toHaveBeenCalledWith('sci');
    });

    it('should trigger suggestTags on focus when input has text', async () => {
      mockSuggestTags.mockResolvedValue({ tags: [mockApprovedTag] });

      render(<TagInput selectedTags={[]} onChange={onChange} />);

      const input = screen.getByPlaceholderText('输入标签名搜索或创建...');

      // Type text and let debounce fire
      fireEvent.change(input, { target: { value: 'sci' } });
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      mockSuggestTags.mockClear();

      // Blur and refocus
      fireEvent.blur(input);
      fireEvent.focus(input);

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockSuggestTags).toHaveBeenCalledWith('sci');
    });

    it('should display suggestion dropdown', async () => {
      mockSuggestTags.mockResolvedValue({ tags: [mockApprovedTag, mockRegularTag] });

      const { container } = render(<TagInput selectedTags={[]} onChange={onChange} />);

      const input = screen.getByPlaceholderText('输入标签名搜索或创建...');
      fireEvent.change(input, { target: { value: 'sc' } });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      const dropdown = container.querySelector('.tag-input-dropdown');
      expect(dropdown).toBeInTheDocument();

      const options = container.querySelectorAll('.tag-input-option');
      expect(options.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('SCI')).toBeInTheDocument();
      expect(screen.getByText('Nature')).toBeInTheDocument();
    });

    it('should not show already-selected tags in suggestions', async () => {
      mockSuggestTags.mockResolvedValue({
        tags: [mockApprovedTag, mockRegularTag]
      });

      const { container } = render(
        <TagInput selectedTags={[mockApprovedTag]} onChange={onChange} />
      );

      const input = screen.getByPlaceholderText('输入标签名搜索或创建...');
      fireEvent.change(input, { target: { value: 'tag' } });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // SCI is already selected, so it should be filtered out from options
      const options = container.querySelectorAll('.tag-input-option:not(.tag-input-option--create)');
      const optionTexts = Array.from(options).map(o => o.textContent);
      const hasSCI = optionTexts.some(t => t?.includes('SCI'));
      expect(hasSCI).toBe(false);
    });

    it('should show official tags first in suggestions', async () => {
      // Return non-official first, official second to verify sorting
      mockSuggestTags.mockResolvedValue({
        tags: [mockRegularTag, mockApprovedTag]
      });

      const { container } = render(<TagInput selectedTags={[]} onChange={onChange} />);

      const input = screen.getByPlaceholderText('输入标签名搜索或创建...');
      fireEvent.change(input, { target: { value: 'tag' } });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      const options = container.querySelectorAll('.tag-input-option:not(.tag-input-option--create)');
      expect(options.length).toBe(2);

      // First option should be the official tag (SCI)
      expect(options[0].textContent).toContain('SCI');
      expect(options[1].textContent).toContain('Nature');
    });

    it('should show create option when no exact match', async () => {
      mockSuggestTags.mockResolvedValue({ tags: [mockApprovedTag] });

      render(<TagInput selectedTags={[]} onChange={onChange} />);

      const input = screen.getByPlaceholderText('输入标签名搜索或创建...');
      fireEvent.change(input, { target: { value: 'newTag' } });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.getByText(/创建「newTag」/)).toBeInTheDocument();
    });

    it('should not show create option when exact match exists', async () => {
      mockSuggestTags.mockResolvedValue({ tags: [mockApprovedTag] });

      render(<TagInput selectedTags={[]} onChange={onChange} />);

      const input = screen.getByPlaceholderText('输入标签名搜索或创建...');
      fireEvent.change(input, { target: { value: 'SCI' } });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(screen.queryByText(/创建「SCI」/)).not.toBeInTheDocument();
    });

    it('should enforce 10 character max on input', () => {
      render(<TagInput selectedTags={[]} onChange={onChange} />);

      const input = screen.getByPlaceholderText('输入标签名搜索或创建...') as HTMLInputElement;

      // The component blocks values longer than 10 chars in handleInputChange
      fireEvent.change(input, { target: { value: 'abcdefghijkl' } });

      // Value should remain empty since 12 chars > 10 is rejected
      expect(input.value).not.toBe('abcdefghijkl');

      // A value of exactly 10 chars should be accepted
      fireEvent.change(input, { target: { value: 'abcdefghij' } });
      expect(input.value).toBe('abcdefghij');
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Navigation
  // ---------------------------------------------------------------------------
  describe('Keyboard Navigation', () => {
    async function openDropdownWithSuggestions(container: HTMLElement) {
      mockSuggestTags.mockResolvedValue({
        tags: [mockApprovedTag, mockRegularTag]
      });

      const input = screen.getByPlaceholderText('输入标签名搜索或创建...');
      fireEvent.change(input, { target: { value: 'tag' } });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      return input;
    }

    it('should highlight next option on ArrowDown', async () => {
      const { container } = render(<TagInput selectedTags={[]} onChange={onChange} />);

      const input = await openDropdownWithSuggestions(container);

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const highlighted = container.querySelector('.tag-input-option--highlighted');
      expect(highlighted).toBeInTheDocument();
      expect(highlighted!.textContent).toContain('SCI');
    });

    it('should highlight prev option on ArrowUp (wrap around)', async () => {
      const { container } = render(<TagInput selectedTags={[]} onChange={onChange} />);

      const input = await openDropdownWithSuggestions(container);

      // ArrowUp from initial -1 should wrap to the last option
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      const highlighted = container.querySelector('.tag-input-option--highlighted');
      expect(highlighted).toBeInTheDocument();

      // Should wrap: with create option present, last is the create option;
      // without exact match for "tag", create option is shown
      // total options = 2 suggestions + 1 create = 3
      // (-1 - 1 + 3) % 3 = 1 => index 1 is the second suggestion (Nature)
      // Wait — initial highlightedIndex is -1, ArrowUp: (-1 - 1 + 3) % 3 = 1
      // Actually the component does (prev - 1 + totalOptions) % totalOptions
      // prev = -1 => (-1 - 1 + 3) % 3 = 1 => index 1 = Nature (the create option is at index 2)
      expect(highlighted!.textContent).toContain('Nature');
    });

    it('should select highlighted option on Enter', async () => {
      const { container } = render(<TagInput selectedTags={[]} onChange={onChange} />);

      const input = await openDropdownWithSuggestions(container);

      // Navigate down to the first option
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith([mockApprovedTag], []);
    });

    it('should create new tag on Enter when create option highlighted', async () => {
      mockSuggestTags.mockResolvedValue({ tags: [] });

      render(<TagInput selectedTags={[]} onChange={onChange} />);

      const input = screen.getByPlaceholderText('输入标签名搜索或创建...');
      fireEvent.change(input, { target: { value: 'brandNew' } });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // With no suggestions and showCreateOption=true, totalOptions=1
      // Navigate to the create option (index 0)
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith([], ['brandNew']);
    });

    it('should close dropdown on Escape', async () => {
      const { container } = render(<TagInput selectedTags={[]} onChange={onChange} />);

      const input = await openDropdownWithSuggestions(container);

      expect(container.querySelector('.tag-input-dropdown')).toBeInTheDocument();

      fireEvent.keyDown(input, { key: 'Escape' });

      expect(container.querySelector('.tag-input-dropdown')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Tag Management
  // ---------------------------------------------------------------------------
  describe('Tag Management', () => {
    it('should add tag when clicking suggestion', async () => {
      mockSuggestTags.mockResolvedValue({ tags: [mockApprovedTag, mockRegularTag] });

      const { container } = render(<TagInput selectedTags={[]} onChange={onChange} />);

      const input = screen.getByPlaceholderText('输入标签名搜索或创建...');
      fireEvent.change(input, { target: { value: 'tag' } });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Click the first suggestion option (SCI, which sorts first as official)
      const options = container.querySelectorAll('.tag-input-option:not(.tag-input-option--create)');
      fireEvent.click(options[0]);

      expect(onChange).toHaveBeenCalledWith([mockApprovedTag], []);
    });

    it('should remove selected tag when clicking X', () => {
      const { container } = render(
        <TagInput selectedTags={[mockApprovedTag, mockRegularTag]} onChange={onChange} />
      );

      const removeButtons = container.querySelectorAll('.tag-input-chip-remove');
      // Remove the first tag (SCI)
      fireEvent.click(removeButtons[0]);

      expect(onChange).toHaveBeenCalledWith([mockRegularTag], []);
    });

    it('should remove new tag when clicking X', async () => {
      mockSuggestTags.mockResolvedValue({ tags: [] });

      const { container } = render(<TagInput selectedTags={[]} onChange={onChange} />);

      // Create a new tag first
      const input = screen.getByPlaceholderText('输入标签名搜索或创建...');
      fireEvent.change(input, { target: { value: 'newOne' } });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Navigate to create option and press Enter
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith([], ['newOne']);

      // Now a new tag chip should be rendered with a remove button
      const removeButtons = container.querySelectorAll('.tag-input-chip-remove');
      expect(removeButtons.length).toBe(1);

      fireEvent.click(removeButtons[0]);

      // After removal, onChange called with empty newTagNames
      expect(onChange).toHaveBeenCalledWith([], []);
    });

    it('should clear input after selecting tag', async () => {
      mockSuggestTags.mockResolvedValue({ tags: [mockApprovedTag] });

      render(<TagInput selectedTags={[]} onChange={onChange} />);

      const input = screen.getByPlaceholderText('输入标签名搜索或创建...') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'SCI' } });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Click the suggestion
      const option = screen.getByText('SCI').closest('.tag-input-option');
      fireEvent.click(option!);

      expect(input.value).toBe('');
    });

    it('should call onChange with correct tags and newTagNames', async () => {
      mockSuggestTags.mockResolvedValue({ tags: [mockRegularTag] });

      const { container } = render(
        <TagInput selectedTags={[mockApprovedTag]} onChange={onChange} />
      );

      const input = screen.getByPlaceholderText('输入标签名搜索或创建...');
      fireEvent.change(input, { target: { value: 'Nat' } });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      // Click Nature suggestion
      const options = container.querySelectorAll('.tag-input-option:not(.tag-input-option--create)');
      fireEvent.click(options[0]);

      // Should include the already selected tag plus the newly added one
      expect(onChange).toHaveBeenCalledWith(
        [mockApprovedTag, mockRegularTag],
        []
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Disabled State
  // ---------------------------------------------------------------------------
  describe('Disabled State', () => {
    it('should not allow typing when disabled', () => {
      render(
        <TagInput selectedTags={[]} onChange={onChange} disabled={true} />
      );

      const input = screen.getByPlaceholderText('输入标签名搜索或创建...');
      expect(input).toBeDisabled();
    });

    it('should not allow removing tags when disabled', () => {
      const { container } = render(
        <TagInput selectedTags={[mockApprovedTag]} onChange={onChange} disabled={true} />
      );

      const removeButtons = container.querySelectorAll('.tag-input-chip-remove');
      expect(removeButtons.length).toBe(1);
      expect(removeButtons[0]).toBeDisabled();
    });
  });
});
