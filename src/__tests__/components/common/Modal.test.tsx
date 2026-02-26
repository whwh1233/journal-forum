import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@/__tests__/test-utils';
import userEvent from '@testing-library/user-event';
import Modal from '@/components/common/Modal';

describe('Modal', () => {
  const mockOnClose = vi.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    children: <div>Modal Content</div>,
  };

  beforeEach(() => {
    mockOnClose.mockClear();
    // Reset body overflow
    document.body.style.overflow = 'unset';
  });

  afterEach(() => {
    // Cleanup body overflow
    document.body.style.overflow = 'unset';
  });

  describe('渲染测试', () => {
    it('should render when isOpen is true', () => {
      render(<Modal {...defaultProps} />);

      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
    });

    it('should render title when provided', () => {
      render(<Modal {...defaultProps} title="测试标题" />);

      expect(screen.getByText('测试标题')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: '测试标题' })).toBeInTheDocument();
    });

    it('should not render modal-header when no title and no close button', () => {
      const { container } = render(
        <Modal {...defaultProps} showCloseButton={false} />
      );

      const header = container.querySelector('.modal-header');
      expect(header).not.toBeInTheDocument();
    });

    it('should render close button by default', () => {
      render(<Modal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /关闭/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should render close button when showCloseButton is true', () => {
      render(<Modal {...defaultProps} showCloseButton={true} />);

      const closeButton = screen.getByRole('button', { name: /关闭/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should not render close button when showCloseButton is false', () => {
      render(<Modal {...defaultProps} showCloseButton={false} />);

      const closeButton = screen.queryByRole('button', { name: /关闭/i });
      expect(closeButton).not.toBeInTheDocument();
    });
  });

  describe('交互测试', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} showCloseButton={true} />);

      const closeButton = screen.getByRole('button', { name: /关闭/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked (if closeOnOverlayClick is true)', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} closeOnOverlayClick={true} />);

      const overlay = screen.getByRole('dialog');
      await user.click(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked by default', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} />);

      const overlay = screen.getByRole('dialog');
      await user.click(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when overlay is clicked (if closeOnOverlayClick is false)', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} closeOnOverlayClick={false} />);

      const overlay = screen.getByRole('dialog');
      await user.click(overlay);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should not call onClose when clicking modal content', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} />);

      const content = screen.getByText('Modal Content');
      await user.click(content);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should prevent close when clicking inside modal content area', async () => {
      const user = userEvent.setup();
      const { container } = render(<Modal {...defaultProps} />);

      const modalContent = container.querySelector('.modal-content');
      if (modalContent) {
        await user.click(modalContent);
      }

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('键盘交互', () => {
    it('should call onClose when Escape is pressed by default', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} />);

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape is pressed (if closeOnEsc is true)', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} closeOnEsc={true} />);

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when Escape is pressed (if closeOnEsc is false)', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} closeOnEsc={false} />);

      await user.keyboard('{Escape}');

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should trap focus within modal when using Tab key', async () => {
      const user = userEvent.setup();
      render(
        <Modal {...defaultProps} showCloseButton={true}>
          <button>Button 1</button>
          <button>Button 2</button>
        </Modal>
      );

      const closeButton = screen.getByRole('button', { name: /关闭/i });
      const button1 = screen.getByRole('button', { name: 'Button 1' });
      const button2 = screen.getByRole('button', { name: 'Button 2' });

      // Tab should cycle through buttons
      await user.tab();
      expect(document.activeElement).toBe(closeButton);

      await user.tab();
      expect(document.activeElement).toBe(button1);

      await user.tab();
      expect(document.activeElement).toBe(button2);

      // Tab from last element should wrap to first
      await user.tab();
      await waitFor(() => {
        expect(document.activeElement).toBe(closeButton);
      });
    });

    it('should trap focus when using Shift+Tab', async () => {
      const user = userEvent.setup();
      render(
        <Modal {...defaultProps} showCloseButton={true}>
          <button>Button 1</button>
          <button>Button 2</button>
        </Modal>
      );

      const closeButton = screen.getByRole('button', { name: /关闭/i });
      const button2 = screen.getByRole('button', { name: 'Button 2' });

      // Focus should start on modal content
      await waitFor(() => {
        const modalContent = document.querySelector('.modal-content');
        expect(document.activeElement).toBe(modalContent);
      });

      // Shift+Tab from first focusable element should wrap to last
      await user.tab(); // Focus close button
      await user.tab({ shift: true }); // Shift+Tab should wrap to last element

      await waitFor(() => {
        expect(document.activeElement).toBe(button2);
      });
    });
  });

  describe('可访问性测试', () => {
    it('should have role="dialog"', () => {
      render(<Modal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-modal="true"', () => {
      render(<Modal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby when title is provided', () => {
      render(<Modal {...defaultProps} title="测试标题" />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');

      const title = screen.getByText('测试标题');
      expect(title).toHaveAttribute('id', 'modal-title');
    });

    it('should not have aria-labelledby when title is not provided', () => {
      render(<Modal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).not.toHaveAttribute('aria-labelledby');
    });

    it('should set focus on modal content when opened', async () => {
      render(<Modal {...defaultProps} />);

      await waitFor(() => {
        const modalContent = document.querySelector('.modal-content');
        expect(document.activeElement).toBe(modalContent);
      });
    });

    it('should set tabIndex=-1 on modal content for focus management', () => {
      const { container } = render(<Modal {...defaultProps} />);

      const modalContent = container.querySelector('.modal-content');
      expect(modalContent).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('尺寸变体', () => {
    it('should apply default size "md" when not specified', () => {
      const { container } = render(<Modal {...defaultProps} />);

      const content = container.querySelector('.modal-content--md');
      expect(content).toBeInTheDocument();
    });

    it('should apply correct size class for "sm"', () => {
      const { container } = render(<Modal {...defaultProps} size="sm" />);

      const content = container.querySelector('.modal-content--sm');
      expect(content).toBeInTheDocument();
    });

    it('should apply correct size class for "md"', () => {
      const { container } = render(<Modal {...defaultProps} size="md" />);

      const content = container.querySelector('.modal-content--md');
      expect(content).toBeInTheDocument();
    });

    it('should apply correct size class for "lg"', () => {
      const { container } = render(<Modal {...defaultProps} size="lg" />);

      const content = container.querySelector('.modal-content--lg');
      expect(content).toBeInTheDocument();
    });

    it('should apply correct size class for "full"', () => {
      const { container } = render(<Modal {...defaultProps} size="full" />);

      const content = container.querySelector('.modal-content--full');
      expect(content).toBeInTheDocument();
    });
  });

  describe('body overflow 管理', () => {
    it('should set body overflow to hidden when modal is open', () => {
      render(<Modal {...defaultProps} isOpen={true} />);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body overflow when modal is closed', () => {
      const { rerender } = render(<Modal {...defaultProps} isOpen={true} />);

      expect(document.body.style.overflow).toBe('hidden');

      rerender(<Modal {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe('unset');
    });

    it('should restore body overflow on unmount', () => {
      const { unmount } = render(<Modal {...defaultProps} isOpen={true} />);

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('unset');
    });

    it('should not set body overflow when modal is not open', () => {
      document.body.style.overflow = 'auto';

      render(<Modal {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe('auto');
    });
  });

  describe('focus 管理', () => {
    it('should store and restore focus when modal closes', async () => {
      // Create a button outside modal to have initial focus
      const { rerender } = render(
        <div>
          <button data-testid="outside-button">Outside Button</button>
          <Modal {...defaultProps} isOpen={false} />
        </div>
      );

      const outsideButton = screen.getByTestId('outside-button');
      outsideButton.focus();
      expect(document.activeElement).toBe(outsideButton);

      // Open modal
      rerender(
        <div>
          <button data-testid="outside-button">Outside Button</button>
          <Modal {...defaultProps} isOpen={true} />
        </div>
      );

      // Wait for modal to take focus
      await waitFor(() => {
        const modalContent = document.querySelector('.modal-content');
        expect(document.activeElement).toBe(modalContent);
      });

      // Close modal
      rerender(
        <div>
          <button data-testid="outside-button">Outside Button</button>
          <Modal {...defaultProps} isOpen={false} />
        </div>
      );

      // Focus should be restored to the button
      await waitFor(() => {
        expect(document.activeElement).toBe(outsideButton);
      });
    });
  });

  describe('复杂内容渲染', () => {
    it('should render complex children with multiple elements', () => {
      render(
        <Modal {...defaultProps}>
          <div>
            <h3>Complex Content</h3>
            <p>Paragraph text</p>
            <button>Action Button</button>
            <input type="text" placeholder="Input field" />
          </div>
        </Modal>
      );

      expect(screen.getByText('Complex Content')).toBeInTheDocument();
      expect(screen.getByText('Paragraph text')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Input field')).toBeInTheDocument();
    });

    it('should render modal with both title and close button', () => {
      const { container } = render(
        <Modal {...defaultProps} title="测试标题" showCloseButton={true}>
          <div>Content</div>
        </Modal>
      );

      expect(screen.getByText('测试标题')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /关闭/i })).toBeInTheDocument();

      const header = container.querySelector('.modal-header');
      expect(header).toBeInTheDocument();
    });
  });

  describe('边界场景测试', () => {
    it('should handle rapid open/close toggling', async () => {
      const { rerender } = render(<Modal {...defaultProps} isOpen={false} />);

      // Rapidly toggle open/close
      rerender(<Modal {...defaultProps} isOpen={true} />);
      rerender(<Modal {...defaultProps} isOpen={false} />);
      rerender(<Modal {...defaultProps} isOpen={true} />);

      await waitFor(() => {
        expect(screen.getByText('Modal Content')).toBeInTheDocument();
      });
    });

    it('should handle onClose being called multiple times', async () => {
      const user = userEvent.setup();
      render(<Modal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /关闭/i });

      await user.click(closeButton);
      await user.click(closeButton);

      // onClose should be called twice
      expect(mockOnClose).toHaveBeenCalledTimes(2);
    });

    it('should handle empty children', () => {
      render(<Modal {...defaultProps} children={null} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should handle modal with only close button (no title)', () => {
      const { container } = render(
        <Modal {...defaultProps} showCloseButton={true}>
          <div>Content</div>
        </Modal>
      );

      const header = container.querySelector('.modal-header');
      expect(header).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /关闭/i })).toBeInTheDocument();
    });
  });

  describe('CSS 类名测试', () => {
    it('should apply modal-overlay class', () => {
      const { container } = render(<Modal {...defaultProps} />);

      const overlay = container.querySelector('.modal-overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('should apply modal-content class', () => {
      const { container } = render(<Modal {...defaultProps} />);

      const content = container.querySelector('.modal-content');
      expect(content).toBeInTheDocument();
    });

    it('should apply modal-body class', () => {
      const { container } = render(<Modal {...defaultProps} />);

      const body = container.querySelector('.modal-body');
      expect(body).toBeInTheDocument();
    });

    it('should apply modal-header class when title or close button present', () => {
      const { container } = render(<Modal {...defaultProps} title="Test" />);

      const header = container.querySelector('.modal-header');
      expect(header).toBeInTheDocument();
    });

    it('should apply modal-title class when title is provided', () => {
      const { container } = render(<Modal {...defaultProps} title="Test" />);

      const title = container.querySelector('.modal-title');
      expect(title).toBeInTheDocument();
      expect(title?.tagName).toBe('H2');
    });

    it('should apply modal-close class to close button', () => {
      const { container } = render(<Modal {...defaultProps} showCloseButton={true} />);

      const closeButton = container.querySelector('.modal-close');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton?.tagName).toBe('BUTTON');
    });
  });
});
