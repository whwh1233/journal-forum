import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MarkdownContent from '@/components/MarkdownEditor/MarkdownContent';

// Capture the components prop so we can test the custom img renderer
let capturedComponents: any = {};

vi.mock('react-markdown', () => ({
  default: ({ children, components }: { children: string; components?: any }) => {
    capturedComponents = components || {};
    const ImgRenderer = components?.img;
    return (
      <div data-testid="markdown-content">
        <span data-testid="markdown-text">{children}</span>
        {ImgRenderer && (
          <ImgRenderer
            src="https://example.com/test.png"
            alt="test"
            data-testid="rendered-img"
          />
        )}
      </div>
    );
  },
}));

vi.mock('remark-gfm', () => ({ default: () => {} }));
vi.mock('rehype-highlight', () => ({ default: () => {} }));
vi.mock('rehype-sanitize', () => ({ default: () => {} }));

describe('MarkdownContent', () => {
  beforeEach(() => {
    capturedComponents = {};
    vi.clearAllMocks();
  });

  // ── Rendering ────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders the content text', () => {
      render(<MarkdownContent content="Hello world" />);
      expect(screen.getByTestId('markdown-text')).toHaveTextContent('Hello world');
    });

    it('applies the default markdown-content class to the wrapper div', () => {
      const { container } = render(<MarkdownContent content="text" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('markdown-content');
    });

    it('appends a custom className to the wrapper div', () => {
      const { container } = render(
        <MarkdownContent content="text" className="my-custom-class" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('markdown-content');
      expect(wrapper).toHaveClass('my-custom-class');
    });

    it('renders without error when content is an empty string', () => {
      const { container } = render(<MarkdownContent content="" />);
      expect(container).toBeInTheDocument();
    });

    it('does not show lightbox initially', () => {
      render(<MarkdownContent content="text" />);
      expect(document.querySelector('.markdown-lightbox')).not.toBeInTheDocument();
    });
  });

  // ── Custom img renderer ───────────────────────────────────────────────────

  describe('Custom img renderer', () => {
    it('renders the image with lazy loading', () => {
      render(<MarkdownContent content="text" />);
      const img = screen.getByAltText('test');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('renders the image with the provided src', () => {
      render(<MarkdownContent content="text" />);
      const img = screen.getByAltText('test');
      expect(img).toHaveAttribute('src', 'https://example.com/test.png');
    });

    it('uses a default alt of "image" when alt is falsy', () => {
      const { rerender } = render(<MarkdownContent content="text" />);

      // Render the ImgRenderer directly with no alt to verify the fallback
      const ImgRenderer = capturedComponents.img;
      expect(ImgRenderer).toBeDefined();

      const { getByAltText } = render(<ImgRenderer src="https://example.com/x.png" alt="" />);
      expect(getByAltText('image')).toBeInTheDocument();

      rerender(<MarkdownContent content="text" />);
    });

    it('renders the image with cursor:pointer style', () => {
      render(<MarkdownContent content="text" />);
      const img = screen.getByAltText('test');
      expect(img).toHaveStyle({ cursor: 'pointer' });
    });

    it('renders the image with maxWidth:100% style', () => {
      render(<MarkdownContent content="text" />);
      const img = screen.getByAltText('test');
      expect(img).toHaveStyle({ maxWidth: '100%' });
    });
  });

  // ── Lightbox ──────────────────────────────────────────────────────────────

  describe('Lightbox', () => {
    it('opens the lightbox when the image is clicked', () => {
      render(<MarkdownContent content="text" />);
      const img = screen.getByAltText('test');
      fireEvent.click(img);
      const lightbox = document.querySelector('.markdown-lightbox');
      expect(lightbox).toBeInTheDocument();
    });

    it('shows the enlarged image in the lightbox with correct src', () => {
      render(<MarkdownContent content="text" />);
      const img = screen.getByAltText('test');
      fireEvent.click(img);
      const enlarged = screen.getByAltText('enlarged');
      expect(enlarged).toHaveAttribute('src', 'https://example.com/test.png');
    });

    it('closes the lightbox when the overlay is clicked', () => {
      render(<MarkdownContent content="text" />);
      const img = screen.getByAltText('test');
      fireEvent.click(img);
      expect(document.querySelector('.markdown-lightbox')).toBeInTheDocument();

      const overlay = document.querySelector('.markdown-lightbox') as HTMLElement;
      fireEvent.click(overlay);
      expect(document.querySelector('.markdown-lightbox')).not.toBeInTheDocument();
    });

    it('does not open lightbox when src is falsy', () => {
      // Render the ImgRenderer directly with no src
      render(<MarkdownContent content="text" />);
      const ImgRenderer = capturedComponents.img;
      expect(ImgRenderer).toBeDefined();

      const { getByAltText } = render(<ImgRenderer src="" alt="no-src" />);
      const img = getByAltText('no-src');
      fireEvent.click(img);
      // The parent MarkdownContent's lightbox should not appear since we
      // rendered ImgRenderer in isolation; just assert no lightbox from this render.
      expect(document.querySelector('.markdown-lightbox')).not.toBeInTheDocument();
    });
  });

  // ── Image error handling ──────────────────────────────────────────────────

  describe('Image error handling', () => {
    it('hides the image on error', () => {
      render(<MarkdownContent content="text" />);
      const img = screen.getByAltText('test');
      fireEvent.error(img);
      expect(img.style.display).toBe('none');
    });

    it('inserts an error span after the image on error', () => {
      render(<MarkdownContent content="text" />);
      const img = screen.getByAltText('test');
      fireEvent.error(img);
      // The sibling element should contain the error message
      const errorSpan = img.nextElementSibling;
      expect(errorSpan).not.toBeNull();
      expect(errorSpan?.className).toBe('markdown-img-error');
      expect(errorSpan?.textContent).toBe('图片加载失败');
    });
  });
});
