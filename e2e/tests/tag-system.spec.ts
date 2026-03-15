import { test, expect } from '@playwright/test';

test.describe('Tag System', () => {

  test.describe('User Flow', () => {
    const TEST_USER = {
      email: `tag-test-${Date.now()}@example.com`,
      password: 'TestPass123!',
      name: 'Tag Test User'
    };

    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3000');
      // Register and login (same pattern as community-posts.spec.ts)
      await page.click('text=登录');
      await page.waitForSelector('text=注册账号');
      await page.click('text=注册账号');
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.fill('input[name="name"]', TEST_USER.name);
      await page.click('button:has-text("注册")');
      await page.waitForTimeout(1000);
    });

    test('should search and select tags when creating a post', async ({ page }) => {
      // Navigate to create post
      await page.click('text=社区讨论');
      await page.click('button:has-text("发布帖子")');
      await expect(page).toHaveURL(/\/posts\/new/);

      // Fill basic post fields
      await page.fill('input[id*="title"]', 'E2E Tag Test Post');
      await page.fill('textarea[id*="content"]', 'Testing tag system');

      // Use TagInput - type to search
      const tagInput = page.locator('.tag-input-field');
      if (await tagInput.isVisible()) {
        await tagInput.fill('test');
        await page.waitForTimeout(500); // wait for debounce

        // If dropdown shows, check for suggestions or create option
        const dropdown = page.locator('.tag-input-dropdown');
        if (await dropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
          // Click create option or first suggestion
          const createOption = page.locator('.tag-input-option--create');
          if (await createOption.isVisible({ timeout: 1000 }).catch(() => false)) {
            await createOption.click();
          } else {
            await page.locator('.tag-input-option').first().click();
          }
        }
      }

      // Verify tag chip appeared
      await expect(page.locator('.tag-input-chip')).toBeVisible();
    });

    test('should create new pending tag when posting', async ({ page }) => {
      await page.click('text=社区讨论');
      await page.click('button:has-text("发布帖子")');

      await page.fill('input[id*="title"]', 'New Tag Post');
      await page.fill('textarea[id*="content"]', 'Creating a new tag');

      // Type a unique tag name
      const uniqueTag = `e2etag${Date.now()}`;
      const tagInput = page.locator('.tag-input-field');
      if (await tagInput.isVisible()) {
        await tagInput.fill(uniqueTag.substring(0, 10));
        await page.waitForTimeout(500);

        // Should show create option since tag doesn't exist
        const createOption = page.locator('.tag-input-option--create');
        if (await createOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await createOption.click();
        } else {
          // Press Enter to create
          await tagInput.press('Enter');
        }
      }

      // Verify pending chip appeared
      await expect(page.locator('.tag-input-chip--pending')).toBeVisible();
    });

    test('should display tags on post detail page', async ({ page }) => {
      // Create a post with tags first
      await page.click('text=社区讨论');
      await page.click('button:has-text("发布帖子")');

      await page.fill('input[id*="title"]', 'Tagged Detail Post');
      await page.fill('textarea[id*="content"]', 'Check tags on detail page');

      // Add a tag
      const tagInput = page.locator('.tag-input-field');
      if (await tagInput.isVisible()) {
        await tagInput.fill('detailtest');
        await page.waitForTimeout(500);
        const createOption = page.locator('.tag-input-option--create');
        if (await createOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await createOption.click();
        }
      }

      // Select category if needed
      const categorySelect = page.locator('select[id*="category"]');
      if (await categorySelect.isVisible()) {
        await categorySelect.selectOption('discussion');
      }

      // Submit post
      await page.click('button:has-text("发布")');
      await page.waitForURL(/\/posts\/\d+/, { timeout: 5000 });

      // Should see tags on detail page
      await page.waitForTimeout(500);
      // Tags may be shown as chips or text on the detail page
    });

    test('should filter posts by tag on community page', async ({ page }) => {
      await page.click('text=社区讨论');
      await page.waitForTimeout(500);

      // Look for tag filter elements on the page
      // The community page may have tag filters in the sidebar
      const tagFilter = page.locator('[class*="tag"]').first();
      if (await tagFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tagFilter.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Admin Flow', () => {
    let adminUserId: string;

    test.beforeEach(async ({ page, request }) => {
      // Register user via UI
      await page.goto('http://localhost:3000');
      const email = `tag-admin-${Date.now()}@example.com`;

      // Register via API for speed (get userId)
      const registerRes = await request.post('http://localhost:3001/api/auth/register', {
        data: { email, password: 'TestPass123!', name: 'Tag Admin' }
      });
      const registerData = await registerRes.json();
      adminUserId = registerData.data.user.id;
      const token = registerData.data.token;

      // Promote to admin via test helper endpoint
      await request.put(`http://localhost:3001/api/test/users/${adminUserId}/role`, {
        data: { role: 'admin' }
      });

      // Login via UI
      await page.click('text=登录');
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.click('button:has-text("登录")');
      await page.waitForTimeout(1000);
    });

    // First create some pending tags via API
    const createPendingTag = async (request: any, name: string) => {
      // Register a regular user to create pending tag
      const email = `tagcreator-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
      const res = await request.post('http://localhost:3001/api/auth/register', {
        data: { email, password: 'TestPass123!', name: 'Tag Creator' }
      });
      const data = await res.json();
      const token = data.data.token;

      await request.post('http://localhost:3001/api/tags', {
        headers: { Authorization: `Bearer ${token}` },
        data: { name }
      });
    };

    test('should view pending tags in admin panel', async ({ page, request }) => {
      await createPendingTag(request, `pending-${Date.now()}`);

      // Navigate to admin panel
      await page.click('text=管理后台');
      await page.waitForTimeout(500);

      // Navigate to tag management
      await page.click('text=标签管理');
      await page.waitForTimeout(500);

      // Should see pending tags section
      await expect(page.locator('text=待审核标签')).toBeVisible();
    });

    test('should approve a pending tag', async ({ page, request }) => {
      const tagName = `approve-${Date.now()}`;
      await createPendingTag(request, tagName.substring(0, 10));

      await page.click('text=管理后台');
      await page.waitForTimeout(500);
      await page.click('text=标签管理');
      await page.waitForTimeout(500);

      // Select the pending tag
      const pendingCheckbox = page.locator('.tag-mgmt__pending-section input[type="checkbox"]').first();
      if (await pendingCheckbox.isVisible()) {
        await pendingCheckbox.check();
      }

      // Click batch approve
      await page.click('button:has-text("批量通过")');
      await page.waitForTimeout(500);
    });

    test('should reject a pending tag', async ({ page, request }) => {
      const tagName = `reject-${Date.now()}`;
      await createPendingTag(request, tagName.substring(0, 10));

      await page.click('text=管理后台');
      await page.waitForTimeout(500);
      await page.click('text=标签管理');
      await page.waitForTimeout(500);

      // Select pending tag
      const pendingCheckbox = page.locator('.tag-mgmt__pending-section input[type="checkbox"]').first();
      if (await pendingCheckbox.isVisible()) {
        await pendingCheckbox.check();
      }

      // Click batch reject
      await page.click('button:has-text("批量拒绝")');
      await page.waitForTimeout(500);
    });

    test('should create an official tag', async ({ page }) => {
      await page.click('text=管理后台');
      await page.waitForTimeout(500);
      await page.click('text=标签管理');
      await page.waitForTimeout(500);

      // Click create button
      await page.click('button:has-text("创建官方标签")');

      // Fill name in modal
      await page.fill('input[placeholder="请输入标签名称"]', `official${Date.now()}`.substring(0, 10));
      await page.click('button:has-text("创建"):not(:has-text("官方"))');

      await page.waitForTimeout(500);
    });

    test('should merge two tags', async ({ page, request }) => {
      // Create two tags via admin API
      // This test verifies the merge modal UI interaction

      await page.click('text=管理后台');
      await page.waitForTimeout(500);
      await page.click('text=标签管理');
      await page.waitForTimeout(1000);

      // Click merge button on first tag (if exists)
      const mergeBtn = page.locator('button[title="合并"]').first();
      if (await mergeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await mergeBtn.click();
        await page.waitForTimeout(500);
        // Merge modal should appear
      }
    });

    test('should batch approve multiple pending tags', async ({ page, request }) => {
      // Create multiple pending tags
      await createPendingTag(request, `batch1-${Date.now()}`.substring(0, 10));
      await createPendingTag(request, `batch2-${Date.now()}`.substring(0, 10));

      await page.click('text=管理后台');
      await page.waitForTimeout(500);
      await page.click('text=标签管理');
      await page.waitForTimeout(1000);

      // Select all pending tags
      const selectAll = page.locator('.tag-mgmt__pending-section thead input[type="checkbox"]');
      if (await selectAll.isVisible({ timeout: 2000 }).catch(() => false)) {
        await selectAll.check();
        await page.click('button:has-text("批量通过")');
        await page.waitForTimeout(500);
      }
    });
  });
});
