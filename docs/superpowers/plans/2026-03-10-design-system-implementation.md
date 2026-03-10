# Design System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the unified design system (Lexend font, Perfect Fourth typography, 5-level component sizing) to all CSS files in the project.

**Architecture:**
1. Define CSS variables in `global.css` (fonts, typography, icons, components)
2. Update `index.html` to load Lexend from Google Fonts
3. Replace hardcoded values in component CSS files with design system variables

**Tech Stack:** CSS Variables, Google Fonts (Lexend), Lucide React icons

**Spec Document:** `docs/superpowers/specs/2026-03-10-design-system.md`

---

## File Structure

### Core Files (Phase 1)
| File | Action | Responsibility |
|------|--------|----------------|
| `index.html` | Modify | Add Google Fonts link for Lexend |
| `src/styles/global.css` | Modify | Add typography, icon, component CSS variables |

### Layout Components (Phase 2)
| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/layout/TopBar.css` | Modify | Replace hardcoded heights, font sizes, avatar |
| `src/components/layout/SideNav.css` | Modify | Replace nav item heights, icon sizes |
| `src/components/layout/AppLayout.css` | Modify | Replace spacing values |

### Common Components (Phase 3)
| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/common/Modal.css` | Modify | Replace font sizes, spacing, button heights |
| `src/components/common/UserDropdown.css` | Modify | Replace font sizes, avatar, spacing |
| `src/components/common/Toast.css` | Modify | Replace font sizes, spacing |
| `src/components/common/BackButton.css` | Modify | Replace button height, icon size |

### Feature Components (Phase 4)
| File | Action | Responsibility |
|------|--------|----------------|
| `src/features/journals/components/JournalCard.css` | Modify | Replace title, stats, spacing |
| `src/features/journals/components/SearchAndFilter.css` | Modify | Replace input height, button sizes |
| `src/features/posts/components/PostCard.css` | Modify | Replace font sizes, spacing, avatar |
| `src/features/comments/components/CommentItem.css` | Modify | Replace avatar, font sizes |

---

## Chunk 1: Core Setup

### Task 1: Add Google Fonts to index.html

**Files:**
- Modify: `index.html:5-6`

- [ ] **Step 1: Add Google Fonts preconnect and link**

Add after line 5 (after favicon link):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

- [ ] **Step 2: Verify fonts load**

Run: `npm run dev`
Open browser DevTools > Network > Filter "fonts"
Expected: Lexend font files loading from fonts.gstatic.com

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(design-system): add Lexend font from Google Fonts"
```

---

### Task 2: Add CSS Variables to global.css

**Files:**
- Modify: `src/styles/global.css:1-10` (update font imports)
- Modify: `src/styles/global.css:80-95` (add new variables after spacing)

- [ ] **Step 1: Remove old Google Fonts import**

Replace line 2 (the existing @import url for fonts) with a comment:

```css
/* Fonts loaded via index.html - see Google Fonts link */
```

- [ ] **Step 2: Update font variables**

Replace the existing font variables (around lines 7-10 and 80-82) with:

```css
/* Font Family */
--font-sans: 'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
--font-display: var(--font-sans);
--font-numeric: var(--font-sans);
--font-mono: 'JetBrains Mono', monospace;
```

- [ ] **Step 3: Add typography scale variables**

Add after the spacing scale section (after `--space-12`):

```css
/* Typography Scale - Perfect Fourth (1.333) */
--text-2xl: 50px;
--text-xl: 38px;
--text-lg: 28px;
--text-md: 21px;
--text-base: 16px;
--text-sm: 14px;
--text-xs: 12px;

/* Icon Sizes (paired with typography) */
--icon-xl: 40px;
--icon-lg: 32px;
--icon-md: 24px;
--icon-base: 20px;
--icon-sm: 16px;
--icon-xs: 14px;

/* Component Heights */
--size-xs: 24px;
--size-sm: 32px;
--size-md: 40px;
--size-lg: 48px;
--size-xl: 56px;

/* Avatar Sizes */
--avatar-xs: 20px;
--avatar-sm: 28px;
--avatar-md: 36px;
--avatar-lg: 48px;
--avatar-xl: 64px;
```

- [ ] **Step 4: Verify variables are defined**

Run: `npm run dev`
Open browser DevTools > Elements > Select :root > Computed
Expected: All new variables visible (--text-base, --icon-base, --size-md, etc.)

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css
git commit -m "feat(design-system): add typography, icon, and component size variables"
```

---

## Chunk 2: Layout Components

### Task 3: Update TopBar.css

**Files:**
- Modify: `src/components/layout/TopBar.css`

- [ ] **Step 1: Replace hardcoded values**

Replace these values:
- `height: 52px` → `height: var(--size-lg)` (48px, close enough)
- `font-size: 0.9rem` → `font-size: var(--text-sm)`
- `font-size: 0.92rem` → `font-size: var(--text-sm)`
- `font-size: 0.8rem` → `font-size: var(--text-xs)`
- `font-size: 1.25rem` → `font-size: var(--text-md)`
- `height: 38px` → `height: var(--size-md)`
- `height: 36px` → `height: var(--size-sm)`
- `width: 28px; height: 28px` (avatar) → `width: var(--avatar-sm); height: var(--avatar-sm)`

- [ ] **Step 2: Verify visual appearance**

Run: `npm run dev`
Check TopBar renders correctly with new variables

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/TopBar.css
git commit -m "refactor(TopBar): apply design system variables"
```

---

### Task 4: Update SideNav.css

**Files:**
- Modify: `src/components/layout/SideNav.css`

- [ ] **Step 1: Replace font sizes and icon sizes**

Key replacements:
- Font sizes: use `var(--text-sm)` for nav items, `var(--text-xs)` for labels
- Icon sizes in nav items: use `var(--icon-sm)` (16px) or `var(--icon-base)` (20px)
- Spacing: use `var(--space-*)` variables

- [ ] **Step 2: Verify navigation renders correctly**

Run: `npm run dev`
Check SideNav items, icons, and spacing

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/SideNav.css
git commit -m "refactor(SideNav): apply design system variables"
```

---

## Chunk 3: Common Components

### Task 5: Update Modal.css

**Files:**
- Modify: `src/components/common/Modal.css`

- [ ] **Step 1: Replace hardcoded values**

Key replacements:
- Title font size → `var(--text-lg)` or `var(--text-md)`
- Body font size → `var(--text-base)`
- Button heights → `var(--size-md)`
- Spacing → `var(--space-*)` variables

- [ ] **Step 2: Test modal appearance**

Open any modal in the app, verify styling

- [ ] **Step 3: Commit**

```bash
git add src/components/common/Modal.css
git commit -m "refactor(Modal): apply design system variables"
```

---

### Task 6: Update remaining common components

**Files:**
- Modify: `src/components/common/UserDropdown.css`
- Modify: `src/components/common/Toast.css`
- Modify: `src/components/common/BackButton.css`
- Modify: `src/components/common/Breadcrumb.css`

- [ ] **Step 1: Apply variables to each file**

For each file, replace:
- Hardcoded font sizes → `var(--text-*)`
- Hardcoded heights → `var(--size-*)`
- Hardcoded spacing → `var(--space-*)`
- Avatar sizes → `var(--avatar-*)`
- Icon sizes → `var(--icon-*)`

- [ ] **Step 2: Visual verification**

Test each component in the UI

- [ ] **Step 3: Commit**

```bash
git add src/components/common/UserDropdown.css src/components/common/Toast.css src/components/common/BackButton.css src/components/common/Breadcrumb.css
git commit -m "refactor(common): apply design system to dropdown, toast, buttons"
```

---

## Chunk 4: Feature Components

### Task 7: Update JournalCard.css

**Files:**
- Modify: `src/features/journals/components/JournalCard.css`

- [ ] **Step 1: Replace typography values**

Key replacements:
- `.card-title { font-size: 1.5rem }` → `font-size: var(--text-md)` (21px)
- `.journal-stat-label { font-size: 0.9rem }` → `font-size: var(--text-sm)`
- `.journal-stat-value { font-size: 1.5rem }` → `font-size: var(--text-md)`
- `.level-tag { font-size: 0.85rem }` → `font-size: var(--text-sm)`
- `.footer-category { font-size: 0.75rem }` → `font-size: var(--text-xs)`
- Icon sizes `20px` → `var(--icon-base)`

- [ ] **Step 2: Replace spacing values**

Replace hardcoded padding/margin with `var(--space-*)`:
- `padding: 18px 22px` → `padding: var(--space-4) var(--space-5)`
- `margin-bottom: 10px` → `margin-bottom: var(--space-2)`
- `gap: 8px` → `gap: var(--space-2)`

- [ ] **Step 3: Verify card appearance**

Check journal cards on home page

- [ ] **Step 4: Commit**

```bash
git add src/features/journals/components/JournalCard.css
git commit -m "refactor(JournalCard): apply design system variables"
```

---

### Task 8: Update PostCard.css

**Files:**
- Modify: `src/features/posts/components/PostCard.css`

- [ ] **Step 1: Replace typography and sizing**

Key replacements:
- `.post-card-title { font-size: 1.125rem }` → `font-size: var(--text-base)` (or keep for slight emphasis)
- `.post-author-name { font-size: 0.875rem }` → `font-size: var(--text-sm)`
- `.post-category-badge { font-size: 0.75rem }` → `font-size: var(--text-xs)`
- `.post-stat { font-size: 0.8125rem }` → `font-size: var(--text-xs)`
- Avatar `36px` → `var(--avatar-md)`

- [ ] **Step 2: Verify post cards**

Check community page post cards

- [ ] **Step 3: Commit**

```bash
git add src/features/posts/components/PostCard.css
git commit -m "refactor(PostCard): apply design system variables"
```

---

### Task 9: Update SearchAndFilter.css

**Files:**
- Modify: `src/features/journals/components/SearchAndFilter.css`

- [ ] **Step 1: Replace input and button sizes**

Key replacements:
- Input heights → `var(--size-md)` (40px)
- Button heights → `var(--size-md)` or `var(--size-sm)`
- Font sizes → `var(--text-sm)` for inputs
- Icon sizes → `var(--icon-sm)` or `var(--icon-base)`

- [ ] **Step 2: Verify search bar**

Test search and filter on journals page

- [ ] **Step 3: Commit**

```bash
git add src/features/journals/components/SearchAndFilter.css
git commit -m "refactor(SearchAndFilter): apply design system variables"
```

---

### Task 10: Update CommentItem.css

**Files:**
- Modify: `src/features/comments/components/CommentItem.css`

- [ ] **Step 1: Replace values**

Key replacements:
- Avatar sizes → `var(--avatar-sm)` for nested, `var(--avatar-md)` for top-level
- Font sizes → `var(--text-sm)`, `var(--text-xs)` for metadata
- Spacing → `var(--space-*)` variables

- [ ] **Step 2: Verify comments**

Check comment section on journal detail page

- [ ] **Step 3: Commit**

```bash
git add src/features/comments/components/CommentItem.css
git commit -m "refactor(CommentItem): apply design system variables"
```

---

## Chunk 5: Remaining Components

### Task 11: Batch update remaining CSS files

**Files:** All remaining CSS files not yet updated

- [ ] **Step 1: Apply design system to auth components**

Files:
- `src/features/auth/components/AuthModal.css`
- `src/features/auth/components/LoginForm.css`
- `src/features/auth/components/RegisterForm.css`

- [ ] **Step 2: Apply design system to profile components**

Files:
- `src/features/profile/pages/ProfilePage.css`
- `src/features/profile/pages/ProfileEditPage.css`

- [ ] **Step 3: Apply design system to badge components**

Files:
- `src/features/badges/components/Badge.css`
- `src/features/badges/components/BadgeList.css`
- `src/features/badges/components/BadgeWall.css`

- [ ] **Step 4: Apply design system to admin components**

Files:
- `src/features/admin/components/Dashboard.css`
- `src/features/admin/components/UserManagement.css`
- `src/features/admin/components/DatabaseManager.css`

- [ ] **Step 5: Commit all remaining changes**

```bash
git add src/features/
git commit -m "refactor: apply design system to all remaining components"
```

---

## Chunk 6: Verification

### Task 12: Final verification

- [ ] **Step 1: Visual regression check**

Navigate through all major pages:
- Home (journal list)
- Journal detail
- Community (posts)
- Post detail
- Profile
- Admin dashboard

Check for visual consistency.

- [ ] **Step 2: Run existing tests**

```bash
npm test
npm run test:e2e
```

Expected: All tests pass

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: design system implementation complete"
```

---

## Summary

| Phase | Tasks | Files |
|-------|-------|-------|
| Core Setup | 2 | index.html, global.css |
| Layout | 2 | TopBar.css, SideNav.css |
| Common | 2 | Modal.css, UserDropdown.css, Toast.css, etc. |
| Features | 4 | JournalCard, PostCard, SearchAndFilter, CommentItem |
| Remaining | 1 | All other CSS files |
| Verification | 1 | Testing |

**Total Tasks:** 12
**Estimated Commits:** 10-12
