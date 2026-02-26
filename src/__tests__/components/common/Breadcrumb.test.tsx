import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@/__tests__/test-utils';
import Breadcrumb, { BreadcrumbItem } from '@/components/common/Breadcrumb';

describe('Breadcrumb', () => {
  const items: BreadcrumbItem[] = [
    { label: '首页', path: '/' },
    { label: '期刊列表', path: '/journals' },
    { label: '期刊详情' },
  ];

  describe('渲染测试', () => {
    it('should render all breadcrumb items', () => {
      render(<Breadcrumb items={items} />);

      expect(screen.getByText('首页')).toBeInTheDocument();
      expect(screen.getByText('期刊列表')).toBeInTheDocument();
      expect(screen.getByText('期刊详情')).toBeInTheDocument();
    });

    it('should render links for items with path', () => {
      render(<Breadcrumb items={items} />);

      const homeLink = screen.getByRole('link', { name: '首页' });
      expect(homeLink).toHaveAttribute('href', '/');

      const journalsLink = screen.getByRole('link', { name: '期刊列表' });
      expect(journalsLink).toHaveAttribute('href', '/journals');
    });

    it('should not render link for last item', () => {
      render(<Breadcrumb items={items} />);

      const lastItem = screen.getByText('期刊详情');
      expect(lastItem.tagName).toBe('SPAN');
      expect(lastItem).not.toHaveAttribute('href');
    });

    it('should render separators between items', () => {
      const { container } = render(<Breadcrumb items={items} />);

      const separators = container.querySelectorAll('.breadcrumb-separator');
      expect(separators).toHaveLength(2); // 3 items = 2 separators
    });

    it('should hide separators from screen readers', () => {
      const { container } = render(<Breadcrumb items={items} />);

      const separators = container.querySelectorAll('.breadcrumb-separator');
      separators.forEach(separator => {
        expect(separator).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should apply custom className', () => {
      const { container } = render(<Breadcrumb items={items} className="custom-breadcrumb" />);
      const nav = container.querySelector('.breadcrumb.custom-breadcrumb');
      expect(nav).toBeInTheDocument();
    });

    it('should render items in ordered list', () => {
      const { container } = render(<Breadcrumb items={items} />);
      const ol = container.querySelector('ol.breadcrumb-list');
      expect(ol).toBeInTheDocument();

      const listItems = ol?.querySelectorAll('li.breadcrumb-item');
      expect(listItems).toHaveLength(3);
    });
  });

  describe('可访问性测试', () => {
    it('should have navigation role', () => {
      render(<Breadcrumb items={items} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should have aria-label for navigation', () => {
      render(<Breadcrumb items={items} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', '面包屑导航');
    });

    it('should mark last item with aria-current="page"', () => {
      render(<Breadcrumb items={items} />);

      const lastItem = screen.getByText('期刊详情');
      expect(lastItem).toHaveAttribute('aria-current', 'page');
    });

    it('should not mark non-last items with aria-current', () => {
      render(<Breadcrumb items={items} />);

      const firstLink = screen.getByRole('link', { name: '首页' });
      const secondLink = screen.getByRole('link', { name: '期刊列表' });

      expect(firstLink).not.toHaveAttribute('aria-current');
      expect(secondLink).not.toHaveAttribute('aria-current');
    });

    it('should have proper link accessibility for intermediate items', () => {
      render(<Breadcrumb items={items} />);

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
        expect(link.className).toContain('breadcrumb-link');
      });
    });
  });

  describe('边界场景', () => {
    it('should render nothing when items array is empty', () => {
      const { container } = render(<Breadcrumb items={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should handle single item without path', () => {
      const singleItem: BreadcrumbItem[] = [{ label: '当前页' }];
      render(<Breadcrumb items={singleItem} />);

      expect(screen.getByText('当前页')).toBeInTheDocument();
      expect(screen.getByText('当前页')).toHaveAttribute('aria-current', 'page');
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('should handle single item with path', () => {
      const singleItem: BreadcrumbItem[] = [{ label: '首页', path: '/' }];
      render(<Breadcrumb items={singleItem} />);

      // Last item should not be a link even if it has a path
      const lastItem = screen.getByText('首页');
      expect(lastItem.tagName).toBe('SPAN');
      expect(lastItem).toHaveAttribute('aria-current', 'page');
    });

    it('should handle item without path in the middle', () => {
      const itemsWithoutMiddlePath: BreadcrumbItem[] = [
        { label: '首页', path: '/' },
        { label: '分类' }, // No path
        { label: '详情' },
      ];
      render(<Breadcrumb items={itemsWithoutMiddlePath} />);

      // Middle item without path should render as span
      const middleItem = screen.getByText('分类');
      expect(middleItem.tagName).toBe('SPAN');
    });

    it('should handle long breadcrumb trail', () => {
      const longItems: BreadcrumbItem[] = [
        { label: 'Level 1', path: '/1' },
        { label: 'Level 2', path: '/2' },
        { label: 'Level 3', path: '/3' },
        { label: 'Level 4', path: '/4' },
        { label: 'Level 5', path: '/5' },
        { label: 'Current Page' },
      ];
      render(<Breadcrumb items={longItems} />);

      expect(screen.getAllByRole('link')).toHaveLength(5);
      expect(screen.getByText('Current Page')).toHaveAttribute('aria-current', 'page');
    });

    it('should handle special characters in labels', () => {
      const specialItems: BreadcrumbItem[] = [
        { label: 'Home & Start', path: '/' },
        { label: 'Category <Test>', path: '/test' },
        { label: 'Detail "Page"' },
      ];
      render(<Breadcrumb items={specialItems} />);

      expect(screen.getByText('Home & Start')).toBeInTheDocument();
      expect(screen.getByText('Category <Test>')).toBeInTheDocument();
      expect(screen.getByText('Detail "Page"')).toBeInTheDocument();
    });

    it('should handle very long label text', () => {
      const longLabelItems: BreadcrumbItem[] = [
        { label: '首页', path: '/' },
        {
          label: '这是一个非常非常非常长的面包屑标签文本用来测试组件的渲染能力',
          path: '/long'
        },
        { label: '当前页' },
      ];
      render(<Breadcrumb items={longLabelItems} />);

      expect(screen.getByText('这是一个非常非常非常长的面包屑标签文本用来测试组件的渲染能力')).toBeInTheDocument();
    });

    it('should handle empty label gracefully', () => {
      const emptyLabelItems: BreadcrumbItem[] = [
        { label: '首页', path: '/' },
        { label: '', path: '/empty' },
        { label: '当前页' },
      ];
      render(<Breadcrumb items={emptyLabelItems} />);

      // Component should still render, even with empty label
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should handle all items without paths', () => {
      const noPathItems: BreadcrumbItem[] = [
        { label: 'Item 1' },
        { label: 'Item 2' },
        { label: 'Item 3' },
      ];
      render(<Breadcrumb items={noPathItems} />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByText('Item 3')).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('正确性验证', () => {
    it('should have correct number of separators for any item count', () => {
      // Separators only appear for non-last items WITH paths
      const testCases = [
        { items: [{ label: 'A' }], separators: 0 }, // Single item, no separator
        { items: [{ label: 'A', path: '/a' }, { label: 'B' }], separators: 1 }, // First has path
        { items: [{ label: 'A', path: '/a' }, { label: 'B', path: '/b' }, { label: 'C' }], separators: 2 }, // Two with paths
        { items: [{ label: 'A', path: '/a' }, { label: 'B', path: '/b' }, { label: 'C', path: '/c' }, { label: 'D' }], separators: 3 }, // Three with paths
      ];

      testCases.forEach(({ items, separators }) => {
        const { container } = render(<Breadcrumb items={items} />);
        const separatorElements = container.querySelectorAll('.breadcrumb-separator');
        expect(separatorElements).toHaveLength(separators);
      });
    });

    it('should render links only for non-last items with paths', () => {
      const mixedItems: BreadcrumbItem[] = [
        { label: 'Home', path: '/' },           // Should be link
        { label: 'Category' },                   // No path, not link
        { label: 'Subcategory', path: '/sub' }, // Has path but not last, should be link
        { label: 'Current', path: '/current' }, // Last item, not link even with path
      ];
      render(<Breadcrumb items={mixedItems} />);

      expect(screen.getAllByRole('link')).toHaveLength(2);
      expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: 'Subcategory' })).toHaveAttribute('href', '/sub');
    });
  });
});
