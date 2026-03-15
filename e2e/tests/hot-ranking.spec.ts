import { test, expect } from '@playwright/test';

test.describe('Hot Ranking System', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const email = `hot-ranking-test-${Date.now()}@example.com`;
    const response = await request.post('http://localhost:3001/api/auth/register', {
      data: {
        email,
        password: 'TestPass123!',
        name: 'HotRankingTestUser'
      }
    });

    if (response.ok()) {
      const data = await response.json();
      authToken = data.token;
    }
  });

  test('post sort defaults to hot', async ({ page }) => {
    await page.goto('http://localhost:3000/community');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Find the sort select
    const sortSelect = page.locator('select.community-sort-select');
    await expect(sortSelect).toBeVisible();

    // Verify default value is 'hot'
    const value = await sortSelect.inputValue();
    expect(value).toBe('hot');
  });

  test('post sort switches to allTime', async ({ page }) => {
    await page.goto('http://localhost:3000/community');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Find the sort select and change to 'allTime'
    const sortSelect = page.locator('select.community-sort-select');
    await expect(sortSelect).toBeVisible();

    await sortSelect.selectOption('allTime');
    await page.waitForTimeout(500);

    // Verify value is now 'allTime'
    const value = await sortSelect.inputValue();
    expect(value).toBe('allTime');
  });

  test('journal hot sort button works', async ({ page }) => {
    // Journals/SearchAndFilter is on the home page
    await page.goto('http://localhost:3000/');

    // Wait for content to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Find and click the "近期热门" button
    const hotButton = page.locator('button:has-text("近期热门")');
    await expect(hotButton).toBeVisible();

    await hotButton.click();
    await page.waitForTimeout(500);

    // Verify button has 'has-value' class indicating it is selected
    await expect(hotButton).toHaveClass(/has-value/);
  });

  test('journal sort toggles between hot and allTime', async ({ page }) => {
    // Journals/SearchAndFilter is on the home page
    await page.goto('http://localhost:3000/');

    // Wait for content to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const allTimeButton = page.locator('button:has-text("历史最热")');
    const hotButton = page.locator('button:has-text("近期热门")');

    await expect(allTimeButton).toBeVisible();
    await expect(hotButton).toBeVisible();

    // Click "历史最热" and verify it becomes selected
    await allTimeButton.click();
    await page.waitForTimeout(500);
    await expect(allTimeButton).toHaveClass(/has-value/);

    // Click "近期热门" and verify it becomes selected, "历史最热" is not
    await hotButton.click();
    await page.waitForTimeout(500);
    await expect(hotButton).toHaveClass(/has-value/);
    await expect(allTimeButton).not.toHaveClass(/has-value/);
  });

  test('pinned posts appear first', async ({ page }) => {
    await page.goto('http://localhost:3000/community');

    // Wait for post list to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Check if there are any pinned posts
    const pinnedBadge = page.locator('.pinned-badge').first();
    const pinnedAttr = page.locator('[data-pinned="true"]').first();
    const pinnedPost = page.locator('[data-pinned]').first();

    const hasPinnedBadge = await pinnedBadge.isVisible();
    const hasPinnedAttr = await pinnedAttr.isVisible();
    const hasPinnedPost = await pinnedPost.isVisible();

    if (hasPinnedBadge) {
      // Verify the pinned post appears near the top of the list
      const postCards = page.locator('.post-card');
      const firstCard = postCards.first();
      const pinnedInFirst = await firstCard.locator('.pinned-badge').isVisible();
      const pinnedInSecond = await postCards.nth(1).locator('.pinned-badge').isVisible();
      // Pinned posts should be in the first couple of items
      expect(pinnedInFirst || pinnedInSecond).toBeTruthy();
    } else if (hasPinnedAttr || hasPinnedPost) {
      // Verify pinned post is near the top
      const postCards = page.locator('.post-card');
      const firstCard = postCards.first();
      const secondCard = postCards.nth(1);

      const firstPinned = await firstCard.getAttribute('data-pinned');
      const secondPinned = await secondCard.getAttribute('data-pinned');
      expect(firstPinned === 'true' || secondPinned === 'true').toBeTruthy();
    } else {
      // No pinned posts exist — skip gracefully
      test.skip();
    }
  });
});
