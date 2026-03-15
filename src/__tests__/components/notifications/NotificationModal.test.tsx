import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createMockNotification } from '@/__tests__/helpers/testFactories';

vi.mock('lucide-react', () => ({
  X: (props: any) => <span data-testid="x-icon" {...props}>X</span>,
  ExternalLink: (props: any) => <span data-testid="external-link" {...props}>→</span>,
}));

import { NotificationModal } from '@/features/notifications/components/NotificationModal';

describe('NotificationModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('渲染通知标题和正文内容', () => {
    const notification = createMockNotification({
      content: { title: '重要通知', body: '这是通知的详细内容' },
    });
    render(<NotificationModal notification={notification} onClose={mockOnClose} />);
    expect(screen.getByText('重要通知')).toBeInTheDocument();
    expect(screen.getByText('这是通知的详细内容')).toBeInTheDocument();
  });

  it('存在 journalTitle 和 commentContent 时显示额外字段', () => {
    const notification = createMockNotification({
      content: {
        title: '评论通知',
        body: '有人回复了你',
        journalTitle: '自然科学期刊',
        commentContent: '这是原始评论内容',
      },
    });
    render(<NotificationModal notification={notification} onClose={mockOnClose} />);
    expect(screen.getByText('期刊:')).toBeInTheDocument();
    expect(screen.getByText('自然科学期刊')).toBeInTheDocument();
    expect(screen.getByText('评论内容:')).toBeInTheDocument();
    expect(screen.getByText('这是原始评论内容')).toBeInTheDocument();
  });

  it('entityType 为 journal 时显示跳转链接', () => {
    const notification = createMockNotification({
      entityType: 'journal',
      entityId: 'journal-123',
      content: { title: '期刊通知', body: '期刊有新评论' },
    });
    render(<NotificationModal notification={notification} onClose={mockOnClose} />);
    const link = screen.getByRole('link', { name: /查看原文/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/journals/journal-123');
  });

  it('entityType 为 null 时不显示跳转链接', () => {
    const notification = createMockNotification({
      entityType: null,
      entityId: null,
      content: { title: '系统通知', body: '系统消息' },
    });
    render(<NotificationModal notification={notification} onClose={mockOnClose} />);
    expect(screen.queryByRole('link', { name: /查看原文/ })).not.toBeInTheDocument();
  });

  it('按下 Escape 键时关闭弹窗', () => {
    const notification = createMockNotification();
    render(<NotificationModal notification={notification} onClose={mockOnClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('点击遮罩层时关闭弹窗', () => {
    const notification = createMockNotification();
    const { container } = render(
      <NotificationModal notification={notification} onClose={mockOnClose} />
    );
    const overlay = container.querySelector('.notification-modal__overlay');
    expect(overlay).toBeInTheDocument();
    fireEvent.click(overlay!);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('点击弹窗内容区域时不关闭弹窗', () => {
    const notification = createMockNotification();
    const { container } = render(
      <NotificationModal notification={notification} onClose={mockOnClose} />
    );
    const modal = container.querySelector('.notification-modal');
    expect(modal).toBeInTheDocument();
    fireEvent.click(modal!);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('点击关闭按钮时关闭弹窗', () => {
    const notification = createMockNotification();
    render(<NotificationModal notification={notification} onClose={mockOnClose} />);
    const closeBtn = screen.getByRole('button', { name: '关闭' });
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('显示格式化的时间戳', () => {
    const fixedDate = new Date('2026-03-15T10:30:00').toISOString();
    const notification = createMockNotification({ createdAt: fixedDate });
    render(<NotificationModal notification={notification} onClose={mockOnClose} />);
    // toLocaleString('zh-CN') format varies by environment; just check something date-like is present
    const metaEl = document.querySelector('.notification-modal__meta span');
    expect(metaEl).toBeInTheDocument();
    expect(metaEl!.textContent).toMatch(/2026/);
  });
});
