import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createMockNotification } from '@/__tests__/helpers/testFactories';

import { NotificationItem } from '@/features/notifications/components/NotificationItem';

describe('NotificationItem', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('渲染通知标题和正文预览', () => {
    const notification = createMockNotification({
      content: { title: '测试标题', body: '测试正文内容' },
    });
    render(<NotificationItem notification={notification} onClick={mockOnClick} />);
    expect(screen.getByText('测试标题')).toBeInTheDocument();
    expect(screen.getByText('测试正文内容')).toBeInTheDocument();
  });

  it('正文超过80字符时截断并加省略号', () => {
    const longBody = 'A'.repeat(100);
    const notification = createMockNotification({
      content: { title: '标题', body: longBody },
    });
    render(<NotificationItem notification={notification} onClick={mockOnClick} />);
    const preview = screen.getByText('A'.repeat(80) + '...');
    expect(preview).toBeInTheDocument();
  });

  it('未读通知显示未读指示器 CSS 类', () => {
    const notification = createMockNotification({ isRead: false });
    const { container } = render(
      <NotificationItem notification={notification} onClick={mockOnClick} />
    );
    expect(container.querySelector('.notification-item--unread')).toBeInTheDocument();
  });

  it('已读通知不显示未读指示器 CSS 类', () => {
    const notification = createMockNotification({ isRead: true });
    const { container } = render(
      <NotificationItem notification={notification} onClick={mockOnClick} />
    );
    expect(container.querySelector('.notification-item--unread')).not.toBeInTheDocument();
  });

  it('点击时调用 onClick', () => {
    const notification = createMockNotification();
    render(<NotificationItem notification={notification} onClick={mockOnClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
    expect(mockOnClick).toHaveBeenCalledWith(notification);
  });

  it('按下 Enter 键时调用 onClick', () => {
    const notification = createMockNotification();
    render(<NotificationItem notification={notification} onClick={mockOnClick} />);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(mockOnClick).toHaveBeenCalledTimes(1);
    expect(mockOnClick).toHaveBeenCalledWith(notification);
  });

  it.each([
    ['comment_reply', '回复'],
    ['like', '点赞'],
    ['new_follower', '关注'],
    ['system', '系统'],
    ['badge_earned', '徽章'],
    ['journal_new_comment', '期刊'],
  ])('类型 %s 显示正确标签 %s', (type, expectedLabel) => {
    const notification = createMockNotification({ type: type as any });
    render(<NotificationItem notification={notification} onClick={mockOnClick} />);
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  it('显示相对时间"刚刚"（刚刚创建的通知）', () => {
    const notification = createMockNotification({
      createdAt: new Date().toISOString(),
    });
    render(<NotificationItem notification={notification} onClick={mockOnClick} />);
    expect(screen.getByText('刚刚')).toBeInTheDocument();
  });
});
