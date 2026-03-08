import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostCard from '@/features/posts/components/PostCard';
import { Post } from '@/features/posts/types/post';

const mockPost: Post = {
  id: 1,
  userId: 'user-123',
  title: 'Test Post Title',
  content: 'This is a test post content with some details.',
  category: 'discussion',
  tags: ['test', 'discussion', 'react'],
  viewCount: 150,
  likeCount: 25,
  commentCount: 8,
  favoriteCount: 5,
  followCount: 3,
  hotScore: 100,
  userLiked: false,
  userFavorited: false,
  userFollowed: false,
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z'
};

const mockPostWithJournal: Post = {
  ...mockPost,
  id: 2,
  journalId: 1,
  journalTitle: 'Nature',
  title: 'Post About Journal'
};

describe('PostCard', () => {
  it('should render post card with basic information', () => {
    render(
      <BrowserRouter>
        <PostCard post={mockPost} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
    expect(screen.getByText(/This is a test post content/)).toBeInTheDocument();
    expect(screen.getByText('学术讨论')).toBeInTheDocument(); // Category label
  });

  it('should display all tags', () => {
    render(
      <BrowserRouter>
        <PostCard post={mockPost} />
      </BrowserRouter>
    );

    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('discussion')).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
  });

  it('should display statistics correctly', () => {
    render(
      <BrowserRouter>
        <PostCard post={mockPost} />
      </BrowserRouter>
    );

    expect(screen.getByText('150')).toBeInTheDocument(); // viewCount
    expect(screen.getByText('25')).toBeInTheDocument(); // likeCount
    expect(screen.getByText('8')).toBeInTheDocument(); // commentCount
  });

  it('should call onClick when card is clicked', () => {
    const handleClick = vi.fn();

    const { container } = render(
      <BrowserRouter>
        <PostCard post={mockPost} onClick={handleClick} />
      </BrowserRouter>
    );

    const card = container.querySelector('.post-card');
    if (card) {
      fireEvent.click(card);
    }

    expect(handleClick).toHaveBeenCalledWith(mockPost.id);
  });

  it('should call onClick when tag is clicked (bubbles up to card)', () => {
    const handleClick = vi.fn();

    render(
      <BrowserRouter>
        <PostCard post={mockPost} onClick={handleClick} />
      </BrowserRouter>
    );

    const tagButton = screen.getByText('test');
    fireEvent.click(tagButton);

    // onClick is called because the click bubbles up to the card element
    expect(handleClick).toHaveBeenCalledWith(mockPost.id);
  });

  it('should apply compact mode styling when compact prop is true', () => {
    const { container } = render(
      <BrowserRouter>
        <PostCard post={mockPost} compact />
      </BrowserRouter>
    );

    const card = container.querySelector('.post-card--compact');
    expect(card).toBeInTheDocument();
  });

  it('should display journal badge when journalId is present', () => {
    render(
      <BrowserRouter>
        <PostCard post={mockPostWithJournal} />
      </BrowserRouter>
    );

    const journalBadge = screen.getByText(/关联期刊/);
    expect(journalBadge).toBeInTheDocument();
  });

  it('should handle different categories with correct styling', () => {
    const categories: Array<{ category: Post['category']; label: string }> = [
      { category: 'experience', label: '投稿经验' },
      { category: 'discussion', label: '学术讨论' },
      { category: 'question', label: '求助问答' },
      { category: 'news', label: '资讯分享' },
      { category: 'review', label: '文献评述' },
      { category: 'other', label: '其他' }
    ];

    categories.forEach(({ category, label }) => {
      const { unmount } = render(
        <BrowserRouter>
          <PostCard post={{ ...mockPost, category }} />
        </BrowserRouter>
      );

      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    });
  });

  it('should truncate long content', () => {
    const longContent = 'A'.repeat(300);
    const postWithLongContent: Post = {
      ...mockPost,
      content: longContent
    };

    render(
      <BrowserRouter>
        <PostCard post={postWithLongContent} />
      </BrowserRouter>
    );

    const contentElement = screen.getByText(/A+/);
    expect(contentElement.textContent?.length).toBeLessThan(longContent.length);
  });

  it('should display time in relative or absolute format', () => {
    render(
      <BrowserRouter>
        <PostCard post={mockPost} />
      </BrowserRouter>
    );

    // Should show time (either relative format with "前" or date format like "2024/01/15")
    // For older dates (> 7 days), it shows absolute date format
    const timeContainer = document.querySelector('.post-card-time');
    expect(timeContainer).toBeInTheDocument();
    expect(timeContainer?.textContent).toMatch(/(\d+.*前|刚刚|昨天|\d{4}\/\d{2}\/\d{2})/);
  });

  it('should handle missing optional fields gracefully', () => {
    const minimalPost: Post = {
      id: 3,
      userId: 'user-456',
      title: 'Minimal Post',
      content: 'Minimal content',
      category: 'other',
      tags: [],
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      favoriteCount: 0,
      followCount: 0,
      hotScore: 0,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    };

    render(
      <BrowserRouter>
        <PostCard post={minimalPost} />
      </BrowserRouter>
    );

    expect(screen.getByText('Minimal Post')).toBeInTheDocument();
    expect(screen.getByText('Minimal content')).toBeInTheDocument();
  });

  it('should show zero counts when no interactions', () => {
    const noInteractionPost: Post = {
      ...mockPost,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0
    };

    render(
      <BrowserRouter>
        <PostCard post={noInteractionPost} />
      </BrowserRouter>
    );

    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
  });

  it('should apply hover effect (tested through CSS class)', () => {
    const { container } = render(
      <BrowserRouter>
        <PostCard post={mockPost} />
      </BrowserRouter>
    );

    const card = container.querySelector('.post-card');
    expect(card).toHaveClass('post-card');
  });

  it('should render with empty tags array', () => {
    const noTagsPost: Post = {
      ...mockPost,
      tags: []
    };

    render(
      <BrowserRouter>
        <PostCard post={noTagsPost} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
  });

  it('should handle very large numbers in statistics', () => {
    const popularPost: Post = {
      ...mockPost,
      viewCount: 999999,
      likeCount: 99999,
      commentCount: 9999
    };

    render(
      <BrowserRouter>
        <PostCard post={popularPost} />
      </BrowserRouter>
    );

    expect(screen.getByText('999999')).toBeInTheDocument();
    expect(screen.getByText('99999')).toBeInTheDocument();
    expect(screen.getByText('9999')).toBeInTheDocument();
  });
});
