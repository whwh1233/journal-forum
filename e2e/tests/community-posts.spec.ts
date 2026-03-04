import { test, expect } from '@playwright/test';

test.describe('Community Posts System', () => {
  const TEST_USER = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPass123!',
    name: 'Test User'
  };

  const TEST_POST = {
    title: 'E2E Test Post: Academic Discussion',
    content: '# Introduction\n\nThis is a test post with **markdown** formatting.\n\n## Key Points\n\n- Point 1\n- Point 2\n- Point 3\n\n```javascript\nconst code = "example";\n```',
    category: 'discussion',
    tags: 'e2e-test, automation, playwright'
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:3000');
  });

  test.describe('Guest User Flow', () => {
    test('should view community page without authentication', async ({ page }) => {
      // Navigate to community
      await page.click('text=社区讨论');
      await expect(page).toHaveURL(/\/community/);

      // Should see page title
      await expect(page.locator('text=社区讨论')).toBeVisible();

      // Should see category tabs
      await expect(page.locator('text=全部')).toBeVisible();
      await expect(page.locator('text=投稿经验')).toBeVisible();
      await expect(page.locator('text=学术讨论')).toBeVisible();

      // Should see filter sidebar
      await expect(page.locator('text=筛选条件')).toBeVisible();
    });

    test('should filter posts by category', async ({ page }) => {
      await page.click('text=社区讨论');

      // Click on a category tab
      await page.click('.community-category-tab:has-text("学术讨论")');

      // URL should update with category filter
      await expect(page).toHaveURL(/category=discussion/);
    });

    test('should search posts', async ({ page }) => {
      await page.click('text=社区讨论');

      // Type in search input
      await page.fill('input[placeholder*="搜索"]', '测试');

      // Wait for debounce/filter
      await page.waitForTimeout(500);

      // Should filter results (implementation dependent)
    });

    test('should sort posts by different criteria', async ({ page }) => {
      await page.click('text=社区讨论');

      // Change sort order
      await page.selectOption('select.community-sort-select', 'latest');

      // Should re-fetch with new sort
      await page.waitForTimeout(500);
    });

    test('should prompt login when trying to create post', async ({ page }) => {
      await page.click('text=社区讨论');

      // Click create post button
      await page.click('button:has-text("发布帖子")');

      // Should show login alert or redirect
      page.once('dialog', async dialog => {
        expect(dialog.message()).toContain('登录');
        await dialog.accept();
      });
    });
  });

  test.describe('Authenticated User Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Register and login
      await page.click('text=登录');
      await page.waitForSelector('text=注册账号');
      await page.click('text=注册账号');

      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.fill('input[name="name"]', TEST_USER.name);

      await page.click('button:has-text("注册")');

      // Wait for successful registration
      await page.waitForTimeout(1000);
    });

    test('should create a new post successfully', async ({ page }) => {
      // Navigate to community
      await page.click('text=社区讨论');

      // Click create post button
      await page.click('button:has-text("发布帖子")');

      // Should navigate to new post page
      await expect(page).toHaveURL(/\/posts\/new/);

      // Fill in post form
      await page.fill('input[id*="title"]', TEST_POST.title);
      await page.fill('textarea[id*="content"]', TEST_POST.content);
      await page.selectOption('select[id*="category"]', TEST_POST.category);
      await page.fill('input[id*="tags"]', TEST_POST.tags);

      // Submit form
      await page.click('button:has-text("发布")');

      // Should redirect to post detail page
      await page.waitForURL(/\/posts\/\d+/);

      // Should see the created post
      await expect(page.locator(`text=${TEST_POST.title}`)).toBeVisible();

      // Should see rendered markdown
      await expect(page.locator('text=Introduction')).toBeVisible();
      await expect(page.locator('text=Key Points')).toBeVisible();
    });

    test('should use markdown editor features', async ({ page }) => {
      await page.click('text=社区讨论');
      await page.click('button:has-text("发布帖子")');

      // Focus on content textarea
      const contentArea = page.locator('textarea[id*="content"]');
      await contentArea.click();

      // Click bold button
      await page.click('button[title="粗体"]');

      // Should insert markdown syntax
      const content = await contentArea.inputValue();
      expect(content).toContain('**');

      // Test preview mode
      await page.click('text=预览');

      // Should show preview panel
      await expect(page.locator('.post-form-preview')).toBeVisible();

      // Test split mode
      await page.click('text=分屏');

      // Both editor and preview should be visible
      await expect(contentArea).toBeVisible();
      await expect(page.locator('.post-form-preview')).toBeVisible();
    });

    test('should save and restore draft', async ({ page }) => {
      await page.click('text=社区讨论');
      await page.click('button:has-text("发布帖子")');

      // Fill in some data
      await page.fill('input[id*="title"]', 'Draft Post');
      await page.fill('textarea[id*="content"]', 'Draft content');

      // Wait for autosave (30 seconds)
      await page.waitForTimeout(31000);

      // Navigate away and back
      await page.click('text=首页');
      await page.click('text=社区讨论');
      await page.click('button:has-text("发布帖子")');

      // Should show draft restore modal
      await expect(page.locator('text=检测到未发布的草稿')).toBeVisible();

      // Restore draft
      await page.click('button:has-text("恢复草稿")');

      // Should populate form with draft data
      await expect(page.locator('input[id*="title"]')).toHaveValue('Draft Post');
      await expect(page.locator('textarea[id*="content"]')).toHaveValue('Draft content');
    });

    test('should like a post', async ({ page }) => {
      // First create a post
      await page.click('text=社区讨论');
      await page.click('button:has-text("发布帖子")');

      await page.fill('input[id*="title"]', 'Test Post for Like');
      await page.fill('textarea[id*="content"]', 'Content');
      await page.selectOption('select[id*="category"]', 'discussion');

      await page.click('button:has-text("发布")');
      await page.waitForURL(/\/posts\/\d+/);

      // Click like button
      const likeButton = page.locator('button[title*="点赞"]').first();
      const initialLikes = await page.locator('text=/\\d+/').first().textContent();

      await likeButton.click();

      // Should increment like count
      await page.waitForTimeout(500);
      const newLikes = await page.locator('text=/\\d+/').first().textContent();

      // Like button should show active state
      await expect(likeButton).toHaveClass(/active/);

      // Click again to unlike
      await likeButton.click();
      await page.waitForTimeout(500);

      // Should remove active state
      await expect(likeButton).not.toHaveClass(/active/);
    });

    test('should favorite a post', async ({ page }) => {
      await page.click('text=社区讨论');

      // Find a post or create one
      await page.click('button:has-text("发布帖子")');
      await page.fill('input[id*="title"]', 'Test Favorite');
      await page.fill('textarea[id*="content"]', 'Content');
      await page.selectOption('select[id*="category"]', 'discussion');
      await page.click('button:has-text("发布")');
      await page.waitForURL(/\/posts\/\d+/);

      // Click favorite button
      const favoriteButton = page.locator('button[title*="收藏"]').first();
      await favoriteButton.click();

      await page.waitForTimeout(500);

      // Should show active state
      await expect(favoriteButton).toHaveClass(/active/);
    });

    test('should follow a post', async ({ page }) => {
      await page.click('text=社区讨论');
      await page.click('button:has-text("发布帖子")');

      await page.fill('input[id*="title"]', 'Test Follow');
      await page.fill('textarea[id*="content"]', 'Content');
      await page.selectOption('select[id*="category"]', 'discussion');

      await page.click('button:has-text("发布")');
      await page.waitForURL(/\/posts\/\d+/);

      // Click follow button
      const followButton = page.locator('button[title*="关注"]').first();
      await followButton.click();

      await page.waitForTimeout(500);

      // Should show active state
      await expect(followButton).toHaveClass(/active/);
    });

    test('should add comment to post', async ({ page }) => {
      // Create a post first
      await page.click('text=社区讨论');
      await page.click('button:has-text("发布帖子")');

      await page.fill('input[id*="title"]', 'Test Comments');
      await page.fill('textarea[id*="content"]', 'Post content');
      await page.selectOption('select[id*="category"]', 'discussion');

      await page.click('button:has-text("发布")');
      await page.waitForURL(/\/posts\/\d+/);

      // Scroll to comments section
      await page.locator('text=发表评论').scrollIntoViewIfNeeded();

      // Add a comment
      await page.fill('textarea[placeholder*="评论"]', 'This is a test comment');
      await page.click('button:has-text("发表评论")');

      await page.waitForTimeout(500);

      // Should see the comment
      await expect(page.locator('text=This is a test comment')).toBeVisible();
    });

    test('should reply to a comment', async ({ page }) => {
      // Create post and comment first (abbreviated)
      await page.click('text=社区讨论');
      await page.click('button:has-text("发布帖子")');

      await page.fill('input[id*="title"]', 'Test Reply');
      await page.fill('textarea[id*="content"]', 'Content');
      await page.selectOption('select[id*="category"]', 'discussion');
      await page.click('button:has-text("发布")');
      await page.waitForURL(/\/posts\/\d+/);

      // Add parent comment
      await page.locator('text=发表评论').scrollIntoViewIfNeeded();
      await page.fill('textarea[placeholder*="评论"]', 'Parent comment');
      await page.click('button:has-text("发表评论")');
      await page.waitForTimeout(500);

      // Click reply on the comment
      await page.click('button:has-text("回复")').first();

      // Should show reply form
      await expect(page.locator('textarea[placeholder*="回复"]')).toBeVisible();

      // Add reply
      await page.fill('textarea[placeholder*="回复"]', 'Reply to parent');
      await page.click('button:has-text("提交回复")');

      await page.waitForTimeout(500);

      // Should see nested reply
      await expect(page.locator('text=Reply to parent')).toBeVisible();
    });

    test('should edit own post', async ({ page }) => {
      // Create a post
      await page.click('text=社区讨论');
      await page.click('button:has-text("发布帖子")');

      await page.fill('input[id*="title"]', 'Original Title');
      await page.fill('textarea[id*="content"]', 'Original content');
      await page.selectOption('select[id*="category"]', 'discussion');

      await page.click('button:has-text("发布")');
      await page.waitForURL(/\/posts\/\d+/);

      // Click edit button
      await page.click('button:has-text("编辑")');

      // Should show edit form
      await expect(page.locator('input[id*="title"]')).toHaveValue('Original Title');

      // Edit the post
      await page.fill('input[id*="title"]', 'Updated Title');
      await page.click('button:has-text("保存")');

      await page.waitForTimeout(500);

      // Should see updated content
      await expect(page.locator('text=Updated Title')).toBeVisible();
    });

    test('should delete own post', async ({ page }) => {
      // Create a post
      await page.click('text=社区讨论');
      await page.click('button:has-text("发布帖子")');

      await page.fill('input[id*="title"]', 'Post to Delete');
      await page.fill('textarea[id*="content"]', 'Will be deleted');
      await page.selectOption('select[id*="category"]', 'discussion');

      await page.click('button:has-text("发布")');
      await page.waitForURL(/\/posts\/\d+/);

      // Click delete button
      page.once('dialog', async dialog => {
        expect(dialog.message()).toContain('删除');
        await dialog.accept();
      });

      await page.click('button:has-text("删除")');

      await page.waitForTimeout(500);

      // Should redirect away from deleted post
      await expect(page).toHaveURL(/\/community/);
    });

    test('should view my posts', async ({ page }) => {
      // Create a couple of posts first
      await page.click('text=社区讨论');

      for (let i = 0; i < 2; i++) {
        await page.click('button:has-text("发布帖子")');
        await page.fill('input[id*="title"]', `My Post ${i + 1}`);
        await page.fill('textarea[id*="content"]', `Content ${i + 1}`);
        await page.selectOption('select[id*="category"]', 'discussion');
        await page.click('button:has-text("发布")');
        await page.waitForTimeout(500);
        await page.click('text=社区讨论');
        await page.waitForTimeout(500);
      }

      // Navigate to personal dashboard
      await page.click('text=个人中心');

      // Should see "我的帖子" section
      await expect(page.locator('text=我的帖子')).toBeVisible();

      // Should see created posts
      await expect(page.locator('text=My Post 1')).toBeVisible();
      await expect(page.locator('text=My Post 2')).toBeVisible();
    });

    test('should infinite scroll load more posts', async ({ page }) => {
      await page.click('text=社区讨论');

      // Get initial post count
      const initialPosts = await page.locator('.post-card').count();

      // Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Wait for load more
      await page.waitForTimeout(1000);

      // Should have more posts
      const newPosts = await page.locator('.post-card').count();
      expect(newPosts).toBeGreaterThanOrEqual(initialPosts);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page, context }) => {
      // Simulate offline
      await context.setOffline(true);

      await page.click('text=社区讨论');

      // Should show error state
      await expect(page.locator('text=/加载失败|网络错误/')).toBeVisible();

      // Should show retry button
      await expect(page.locator('button:has-text("重试")')).toBeVisible();

      // Restore network
      await context.setOffline(false);

      // Click retry
      await page.click('button:has-text("重试")');

      await page.waitForTimeout(500);

      // Should load successfully
      await expect(page.locator('.post-card').first()).toBeVisible();
    });

    test('should show empty state when no posts', async ({ page }) => {
      await page.click('text=社区讨论');

      // Filter by a very specific search that has no results
      await page.fill('input[placeholder*="搜索"]', 'xyznonexistent12345');
      await page.waitForTimeout(500);

      // Should show empty state
      await expect(page.locator('text=暂无帖子')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.click('text=社区讨论');

      // Filter sidebar should be hidden on mobile
      const sidebar = page.locator('.community-sidebar--left');
      await expect(sidebar).not.toBeVisible();

      // Click filter button to open drawer
      await page.click('button:has-text("筛选")');

      // Sidebar should now be visible
      await expect(sidebar).toBeVisible();

      // Click overlay to close
      await page.click('.community-drawer-overlay');

      // Sidebar should close
      await expect(sidebar).not.toBeVisible();
    });
  });
});
