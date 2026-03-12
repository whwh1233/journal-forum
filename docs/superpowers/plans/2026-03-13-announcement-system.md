# Announcement System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete announcement system with banner, bell dropdown, urgent modal, and admin management panel.

**Architecture:** Backend extends existing Sequelize models + new controller/routes; frontend adds AnnouncementContext for state management with 5-min polling, four UI components (Banner, Bell, Modal, Admin), integrated into AppLayout and TopBar.

**Tech Stack:** Node.js/Express/Sequelize (backend), React 18/TypeScript/Vite (frontend), Vitest (frontend tests), Jest/supertest (backend tests)

**Spec:** `docs/superpowers/specs/2026-03-11-announcement-system-design.md`

---

## File Map

### Backend (Create/Modify)

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `backend/models/Announcement.js` | Add type, status, priority, targetType, targetRoles, targetUserIds, colorScheme, customColor, isPinned; remove isActive |
| Modify | `backend/models/UserAnnouncementRead.js` | Add dismissed field |
| Modify | `backend/models/index.js` | Verify associations (already configured) |
| Create | `backend/controllers/announcementController.js` | All announcement business logic |
| Create | `backend/routes/announcementRoutes.js` | User-facing route definitions |
| Modify | `backend/routes/adminRoutes.js` | Add admin announcement routes |
| Modify | `backend/server.js` | Register user-facing announcement routes |
| Modify | `backend/controllers/adminController.js` | Extend user search to include name field |

### Frontend (Create/Modify)

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/features/announcements/types/announcement.ts` | TypeScript interfaces |
| Create | `src/features/announcements/services/announcementService.ts` | API client |
| Create | `src/contexts/AnnouncementContext.tsx` | Global state + polling |
| Create | `src/features/announcements/components/AnnouncementBanner.tsx` | Top banner carousel |
| Create | `src/features/announcements/components/AnnouncementBanner.css` | Banner styles |
| Create | `src/features/announcements/components/AnnouncementBell.tsx` | Bell icon + dropdown panel |
| Create | `src/features/announcements/components/AnnouncementBell.css` | Bell/dropdown styles |
| Create | `src/features/announcements/components/AnnouncementItem.tsx` | Single item in dropdown |
| Create | `src/features/announcements/components/AnnouncementItem.css` | Item styles |
| Create | `src/features/announcements/components/AnnouncementModal.tsx` | Urgent/detail modal |
| Create | `src/features/announcements/components/AnnouncementModal.css` | Modal styles |
| Create | `src/features/admin/components/AnnouncementManagement.tsx` | Admin list view + action handlers |
| Create | `src/features/admin/components/AnnouncementForm.tsx` | Admin create/edit form (split for maintainability) |
| Create | `src/features/admin/components/AnnouncementManagement.css` | Admin styles |
| Modify | `src/components/layout/TopBar.tsx` | Add AnnouncementBell |
| Modify | `src/components/layout/AppLayout.tsx` | Add AnnouncementBanner |
| Modify | `src/App.tsx` | Add AnnouncementProvider + admin route |

### Tests (Create)

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `backend/__tests__/integration/announcement.test.js` | Backend API integration tests |
| Create | `src/__tests__/components/AnnouncementBanner.test.tsx` | Banner component tests |
| Create | `src/__tests__/components/AnnouncementBell.test.tsx` | Bell component tests |
| Create | `src/__tests__/components/AnnouncementModal.test.tsx` | Modal component tests |

---

## Chunk 1: Backend — Models & Controller & Routes

### Task 1: Extend Announcement Model

**Files:**
- Modify: `backend/models/Announcement.js`

- [ ] **Step 1: Read the current model**

Read `backend/models/Announcement.js` to understand the current field definitions.

- [ ] **Step 2: Update the model — remove isActive, add new fields**

Replace the model definition. Key changes:
- Remove `isActive` (BOOLEAN)
- Add `type`: ENUM('normal','urgent','banner'), default 'normal'
- Add `status`: ENUM('draft','scheduled','active','expired','archived'), default 'draft'
- Add `priority`: INTEGER, default 0
- Add `targetType`: ENUM('all','role','user'), default 'all'
- Add `targetRoles`: JSON, allowNull true
- Add `targetUserIds`: JSON, allowNull true
- Add `colorScheme`: STRING(50), default 'info'
- Add `customColor`: STRING(7), allowNull true
- Add `isPinned`: BOOLEAN, default false

Each field must include `field: 'snake_case_name'` mapping and `comment` description, following the existing pattern.

- [ ] **Step 3: Verify model syncs without error**

Run: `cd backend && node -e "const {sequelize} = require('./config/database'); const Announcement = require('./models/Announcement'); sequelize.sync({alter:true}).then(() => { console.log('OK'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); })"`

Expected: "OK" — table altered with new columns.

- [ ] **Step 4: Commit**

```bash
git add backend/models/Announcement.js
git commit -m "feat(models): extend Announcement with type, status, targeting, and color fields"
```

### Task 2: Extend UserAnnouncementRead Model

**Files:**
- Modify: `backend/models/UserAnnouncementRead.js`

- [ ] **Step 1: Read the current model**

Read `backend/models/UserAnnouncementRead.js`.

- [ ] **Step 2: Add dismissed field**

Add `dismissed` field: `DataTypes.BOOLEAN`, default `false`, field mapping `'dismissed'`, comment `'紧急弹窗是否已确认关闭'`.

- [ ] **Step 3: Verify model syncs**

Run: `cd backend && node -e "const {sequelize} = require('./config/database'); require('./models'); sequelize.sync({alter:true}).then(() => { console.log('OK'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); })"`

Expected: "OK"

- [ ] **Step 4: Commit**

```bash
git add backend/models/UserAnnouncementRead.js
git commit -m "feat(models): add dismissed field to UserAnnouncementRead"
```

### Task 3: Create Announcement Controller

**Files:**
- Create: `backend/controllers/announcementController.js`

- [ ] **Step 1: Create controller with helper function for lazy status updates**

The controller needs a `syncStaleStatuses` helper that:
1. Updates `status='scheduled'` records where `startTime <= NOW()` to `status='active'`
2. Updates `status='active'` records where `endTime IS NOT NULL AND endTime <= NOW()` to `status='expired'`

This runs at the start of list/detail queries (check-on-read pattern per spec).

- [ ] **Step 2: Implement user-facing endpoints**

Implement these functions following the existing controller pattern (`try-catch`, `{ success, data, message }` response format):

1. **`getBanners`** — No auth. Query: `type='banner'`, `status='active'`, `(startTime IS NULL OR startTime <= NOW())`, `(endTime IS NULL OR endTime > NOW())`, `targetType='all'`. Order by `priority DESC, createdAt DESC`. Return array.

2. **`getAnnouncements`** — Auth required. Calls `syncStaleStatuses()` first. Query active announcements visible to this user (filter by targetType: 'all' shows all, 'role' checks user role in targetRoles JSON, 'user' checks user id in targetUserIds JSON). Left join UserAnnouncementRead for current user to include `isRead`, `readAt`, and `dismissed` fields. Paginate with `page` and `limit` query params (defaults: page=1, limit=20). Pin items first (`isPinned DESC`), then `priority DESC`, then `createdAt DESC`.

3. **`getUnreadCount`** — Auth required. Count announcements visible to user that have no matching UserAnnouncementRead record. Return `{ count }`.

4. **`getAnnouncementById`** — Auth required. Find by ID, check visibility for user. Auto-create UserAnnouncementRead if not exists (mark as read). Return announcement with full content.

5. **`markAsRead`** — Auth required. Upsert UserAnnouncementRead for given announcement ID + user ID. Set `readAt = new Date()`. Accept optional `dismissed` boolean in request body — if `true`, also set `dismissed = true` (used by urgent modal dismiss).

6. **`markAllAsRead`** — Auth required. Find all unread visible announcements for user, bulk create UserAnnouncementRead records.

- [ ] **Step 3: Implement admin endpoints**

1. **`adminGetAnnouncements`** — Admin auth. Calls `syncStaleStatuses()`. List all announcements with filtering (`status`, `type` query params), sorting (`sortBy`, `order`), pagination. Include creator name via User association. Include read count via `COUNT(UserAnnouncementRead)`.

2. **`adminGetAnnouncementById`** — Admin auth. Single announcement with full detail + read statistics (total reads, read percentage based on target audience size).

3. **`adminCreateAnnouncement`** — Admin auth. Validate required fields (title, content, type). Set `creatorId = req.user.id`. If `startTime` is set in future → `status = 'scheduled'`; if not set or in past → `status = 'draft'` (default). Return 201.

4. **`adminUpdateAnnouncement`** — Admin auth. Find by ID, update allowed fields. Cannot edit if status is 'archived'.

5. **`adminPublishAnnouncement`** — Admin auth. Only from `status='draft'`. If `startTime` is future → set `status='scheduled'`; otherwise → set `status='active'`.

6. **`adminArchiveAnnouncement`** — Admin auth. Only from `status='active'`. Set `status='archived'`.

7. **`adminDeleteAnnouncement`** — Admin auth. Only if status is 'draft', 'expired', or 'archived'. Hard delete with cascade (UserAnnouncementRead records).

- [ ] **Step 4: Commit**

```bash
git add backend/controllers/announcementController.js
git commit -m "feat(controller): implement announcement controller with user and admin endpoints"
```

### Task 4: Create Announcement Routes & Register in Server

**Files:**
- Create: `backend/routes/announcementRoutes.js`
- Modify: `backend/routes/adminRoutes.js`
- Modify: `backend/server.js`

- [ ] **Step 1: Create user-facing route file**

```javascript
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getBanners, getAnnouncements, getUnreadCount, getAnnouncementById,
  markAsRead, markAllAsRead
} = require('../controllers/announcementController');

// Public
router.get('/banners', getBanners);

// Authenticated user — static routes BEFORE parameterized
router.get('/', protect, getAnnouncements);
router.get('/unread-count', protect, getUnreadCount);
router.post('/read-all', protect, markAllAsRead);
router.get('/:id', protect, getAnnouncementById);
router.post('/:id/read', protect, markAsRead);

module.exports = router;
```

- [ ] **Step 2: Add admin routes to existing adminRoutes.js**

Read `backend/routes/adminRoutes.js` to find the end of the route definitions. Add announcement admin routes following the existing pattern:

```javascript
const {
  adminGetAnnouncements, adminGetAnnouncementById, adminCreateAnnouncement,
  adminUpdateAnnouncement, adminPublishAnnouncement, adminArchiveAnnouncement,
  adminDeleteAnnouncement
} = require('../controllers/announcementController');

// Announcement management
router.get('/announcements', adminGetAnnouncements);
router.post('/announcements', adminCreateAnnouncement);
router.get('/announcements/:id', adminGetAnnouncementById);
router.put('/announcements/:id', adminUpdateAnnouncement);
router.put('/announcements/:id/publish', adminPublishAnnouncement);
router.put('/announcements/:id/archive', adminArchiveAnnouncement);
router.delete('/announcements/:id', adminDeleteAnnouncement);
```

This gives admin routes the URL prefix `/api/admin/announcements/*` (since adminRoutes.js is mounted at `/api/admin`).

- [ ] **Step 3: Register user-facing routes in server.js**

Add `const announcementRoutes = require('./routes/announcementRoutes');` with other route imports. Add `app.use('/api/announcements', announcementRoutes);` in the API routes section (before error handlers).

- [ ] **Step 4: Verify server starts without errors**

Run: `cd backend && node -e "const app = require('./server'); console.log('Server loaded OK'); process.exit(0);"`

Expected: "Server loaded OK" (no import/dependency errors)

- [ ] **Step 5: Commit**

```bash
git add backend/routes/announcementRoutes.js backend/server.js
git commit -m "feat(routes): add announcement routes and register in server"
```

### Task 5: Extend Admin User Search

**Files:**
- Modify: `backend/controllers/adminController.js`

- [ ] **Step 1: Read adminController.js to find the getUsers function**

Find the section where `search` query param is handled. Currently it only searches `email`.

- [ ] **Step 2: Extend search to include name field**

Change the search condition from:
```javascript
where.email = { [Op.like]: `%${search}%` };
```
To:
```javascript
where[Op.or] = [
  { email: { [Op.like]: `%${search}%` } },
  { name: { [Op.like]: `%${search}%` } }
];
```

- [ ] **Step 3: Commit**

```bash
git add backend/controllers/adminController.js
git commit -m "feat(admin): extend user search to include name field"
```

### Task 6: Backend Integration Tests

**Files:**
- Create: `backend/__tests__/integration/announcement.test.js`

- [ ] **Step 1: Write test setup and teardown**

Follow the post.test.js pattern: `require('supertest')`, import app and models, `beforeAll` authenticate DB, `beforeEach` clean announcement data and create test user + admin user (register two users, manually set one to `role='admin'`).

- [ ] **Step 2: Write user-facing API tests**

Test cases:
1. `GET /api/announcements/banners` — returns active banner announcements, no auth needed
2. `GET /api/announcements` — returns paginated list for authenticated user, 401 without auth
3. `GET /api/announcements/unread-count` — returns correct count
4. `GET /api/announcements/:id` — returns detail and auto-marks as read
5. `POST /api/announcements/:id/read` — marks as read
6. `POST /api/announcements/read-all` — marks all as read
7. Targeting: user with role 'user' should NOT see announcements with `targetType='role'` and `targetRoles=['admin']`
8. Targeting: user should see announcements with `targetType='user'` containing their userId

- [ ] **Step 3: Write admin API tests**

Test cases:
1. `POST /api/admin/announcements` — creates announcement (admin), 403 for non-admin
2. `GET /api/admin/announcements` — lists all with filters
3. `PUT /api/admin/announcements/:id` — edits announcement
4. `PUT /api/admin/announcements/:id/publish` — publishes draft
5. `PUT /api/admin/announcements/:id/archive` — archives active
6. `DELETE /api/admin/announcements/:id` — deletes draft, rejects deleting active
7. Lifecycle: create draft → publish → verify appears in user list → archive → verify disappears

- [ ] **Step 4: Run tests**

Run: `cd backend && npx jest __tests__/integration/announcement.test.js --verbose`

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add backend/__tests__/integration/announcement.test.js
git commit -m "test(backend): add announcement API integration tests"
```

---

## Chunk 2: Frontend — Types, Service, Context

### Task 7: Create TypeScript Types

**Files:**
- Create: `src/features/announcements/types/announcement.ts`

- [ ] **Step 1: Define all types**

```typescript
export type AnnouncementType = 'normal' | 'urgent' | 'banner';
export type AnnouncementStatus = 'draft' | 'scheduled' | 'active' | 'expired' | 'archived';
export type TargetType = 'all' | 'role' | 'user';
export type ColorScheme = 'info' | 'success' | 'warning' | 'danger';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  status: AnnouncementStatus;
  priority: number;
  targetType: TargetType;
  targetRoles: string[] | null;
  targetUserIds: string[] | null;
  colorScheme: ColorScheme;
  customColor: string | null;
  isPinned: boolean;
  startTime: string | null;
  endTime: string | null;
  creatorId: string;
  creatorName?: string;
  createdAt: string;
  updatedAt: string;
  isRead?: boolean;
  readAt?: string | null;
  dismissed?: boolean;
}

export interface AnnouncementListResponse {
  announcements: Announcement[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface AdminAnnouncementListResponse {
  announcements: (Announcement & { readCount: number; readPercentage: number })[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CreateAnnouncementData {
  title: string;
  content: string;
  type: AnnouncementType;
  targetType: TargetType;
  targetRoles?: string[];
  targetUserIds?: string[];
  colorScheme?: ColorScheme;
  customColor?: string;
  isPinned?: boolean;
  priority?: number;
  startTime?: string;
  endTime?: string;
}

export interface UpdateAnnouncementData extends Partial<CreateAnnouncementData> {}

export interface AdminAnnouncementFilters {
  status?: AnnouncementStatus;
  type?: AnnouncementType;
  sortBy?: 'createdAt' | 'startTime' | 'priority';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/announcements/types/announcement.ts
git commit -m "feat(types): add announcement TypeScript type definitions"
```

### Task 8: Create Announcement Service

**Files:**
- Create: `src/features/announcements/services/announcementService.ts`

- [ ] **Step 1: Implement API service**

Follow the existing axios pattern from badgeService. Functions:

1. `getBanners(): Promise<Announcement[]>` — GET /api/announcements/banners (no auth)
2. `getAnnouncements(page, limit): Promise<AnnouncementListResponse>` — GET /api/announcements (auth)
3. `getUnreadCount(): Promise<number>` — GET /api/announcements/unread-count (auth)
4. `getAnnouncementById(id): Promise<Announcement>` — GET /api/announcements/:id (auth)
5. `markAsRead(id): Promise<void>` — POST /api/announcements/:id/read (auth)
6. `markAllAsRead(): Promise<void>` — POST /api/announcements/read-all (auth)
7. `adminGetAnnouncements(filters): Promise<AdminAnnouncementListResponse>` — GET /api/admin/announcements (admin)
8. `adminGetAnnouncementById(id): Promise<Announcement>` — GET /api/admin/announcements/:id (admin)
9. `adminCreateAnnouncement(data): Promise<Announcement>` — POST /api/admin/announcements (admin)
10. `adminUpdateAnnouncement(id, data): Promise<Announcement>` — PUT /api/admin/announcements/:id (admin)
11. `adminPublishAnnouncement(id): Promise<Announcement>` — PUT /api/admin/announcements/:id/publish (admin)
12. `adminArchiveAnnouncement(id): Promise<Announcement>` — PUT /api/admin/announcements/:id/archive (admin)
13. `adminDeleteAnnouncement(id): Promise<void>` — DELETE /api/admin/announcements/:id (admin)

Use `getAuthHeaders()` helper for token. Use axios, unwrap `response.data.data`.

- [ ] **Step 2: Commit**

```bash
git add src/features/announcements/services/announcementService.ts
git commit -m "feat(service): add announcement API service"
```

### Task 9: Create AnnouncementContext

**Files:**
- Create: `src/contexts/AnnouncementContext.tsx`

- [ ] **Step 1: Implement context provider**

Follow BadgeContext pattern. Interface `AnnouncementContextType`:
- `banners: Announcement[]` — active banner announcements
- `announcements: Announcement[]` — all visible announcements for bell dropdown
- `unreadCount: number` — badge number
- `loading: boolean`
- `refreshBanners: () => Promise<void>`
- `refreshAnnouncements: () => Promise<void>`
- `markAsRead: (id: string) => Promise<void>`
- `markAllAsRead: () => Promise<void>`
- `dismissUrgent: (id: string) => Promise<void>` — marks urgent as read+dismissed

Provider logic:
1. On mount: fetch banners (always), fetch announcements + unreadCount (if authenticated)
2. Polling: `setInterval` every 5 minutes for banners + unreadCount, gated by `document.visibilityState === 'visible'`
3. Clear interval on unmount
4. On auth state change: if logged out, clear announcements + unreadCount; if logged in, refresh all
5. `markAsRead`: call API, optimistically update local state (set isRead=true, decrement unreadCount)
6. `markAllAsRead`: call API, set all as read, set unreadCount=0
7. `dismissUrgent`: call `markAsRead(id)` API with `{ dismissed: true }` in request body, update local state (set dismissed=true + isRead=true)

- [ ] **Step 2: Commit**

```bash
git add src/contexts/AnnouncementContext.tsx
git commit -m "feat(context): add AnnouncementContext with polling and state management"
```

### Task 10: Register Provider in App

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Read App.tsx to find provider nesting order**

- [ ] **Step 2: Add AnnouncementProvider**

Import `AnnouncementProvider` from `@/contexts/AnnouncementContext`. Wrap it around the router content, inside `AuthProvider` (since it depends on auth state) but outside route definitions.

- [ ] **Step 3: Add admin route for announcement management**

Add route in the admin section using a full path (matching existing pattern):
```tsx
<Route path="/admin/announcements" element={<AdminRoute><AnnouncementManagement /></AdminRoute>} />
```

Import `AnnouncementManagement` lazily or directly.

- [ ] **Step 4: Verify app compiles**

Run: `cd D:\claude\journal-forum && npx tsc --noEmit 2>&1 | head -20`

Expected: No type errors (or only pre-existing ones).

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(app): register AnnouncementProvider and admin route"
```

---

## Chunk 3: Frontend — User-Facing UI Components

### Task 11: AnnouncementBanner (Carousel)

**Files:**
- Create: `src/features/announcements/components/AnnouncementBanner.tsx`
- Create: `src/features/announcements/components/AnnouncementBanner.css`

- [ ] **Step 1: Implement banner component**

Props: none (reads from AnnouncementContext).

Logic:
1. Get `banners` from `useAnnouncement()` context
2. Filter out sessionStorage-dismissed banners: check `sessionStorage.getItem('dismissed-banner-{id}')`
3. State: `currentIndex` for carousel position
4. Auto-advance: `setInterval(5000)` to increment index, clear on unmount
5. Pause on hover: `onMouseEnter` clears interval, `onMouseLeave` restarts
6. Close handler: `sessionStorage.setItem('dismissed-banner-{id}', 'true')`, remove from local filtered list
7. Click handler: open AnnouncementModal for that announcement's detail

Render:
- Outer div with `role="alert"` + `aria-live="polite"` + `aria-roledescription="carousel"`
- Single visible banner at `currentIndex % filteredBanners.length`
- Color determined by `colorScheme` or `customColor`: map to CSS variables
- Left side: icon (per colorScheme) + type label + title text
- Right side: dot indicators + close button (X with `aria-label="关闭公告"`)

If no banners after filtering, render null.

- [ ] **Step 2: Write CSS**

Use only CSS variables from project design system. Key classes:
- `.announcement-banner` — full width, flex, padding `var(--space-2) var(--space-5)`
- `.announcement-banner--info/success/warning/danger` — background + border-bottom colors using `--color-*-light` and `--color-*`
- `.announcement-banner__icon` — 28px circle with accent color background
- `.announcement-banner__label` — `font-size: var(--text-xs)`, font-weight 600, accent color
- `.announcement-banner__title` — `font-size: var(--text-sm)`, truncate with ellipsis
- `.announcement-banner__dots` — flex gap `var(--space-1)`, 7px circles
- `.announcement-banner__close` — transparent button, `color: var(--color-text-muted)`
- Slide transition with `var(--duration-normal)` + `var(--ease-out)`

- [ ] **Step 3: Integrate into AppLayout**

Modify `src/components/layout/AppLayout.tsx`: Import AnnouncementBanner. Place it inside `app-layout-main`, BEFORE `<TopBar />`. The banner spans the content area width (beside SideNav), matching the TopBar width — this is the natural "full width" within the main content zone.

- [ ] **Step 4: Commit**

```bash
git add src/features/announcements/components/AnnouncementBanner.tsx src/features/announcements/components/AnnouncementBanner.css src/components/layout/AppLayout.tsx
git commit -m "feat(ui): add AnnouncementBanner carousel in AppLayout"
```

### Task 12: AnnouncementItem (Dropdown List Item)

**Files:**
- Create: `src/features/announcements/components/AnnouncementItem.tsx`
- Create: `src/features/announcements/components/AnnouncementItem.css`

- [ ] **Step 1: Implement item component**

Props:
```typescript
interface AnnouncementItemProps {
  announcement: Announcement;
  onClick: (announcement: Announcement) => void;
}
```

Render:
- Outer div, clickable, different background for unread (`isRead === false`) vs read
- Left: blue dot indicator (unread) or empty space (read)
- Content: optional pinned badge (📌) + type tag (colored per colorScheme) + title (bold if unread, regular if read) + content preview (2-line clamp) + timestamp + creator name
- Use a simple relative-time utility function (write inline, ~20 lines) to format "2 小时前", "3 天前" etc. The project does not use date-fns; avoid adding a dependency for this.

- [ ] **Step 2: Write CSS**

- `.announcement-item` — padding `var(--space-3) var(--space-4)`, cursor pointer, border-bottom
- `.announcement-item--unread` — background `var(--color-info-light)` with lower opacity
- `.announcement-item__dot` — 8px circle, `var(--color-info)` for unread
- `.announcement-item__tag` — `font-size: var(--text-xs)`, padding, border-radius `var(--radius-sm)`
- `.announcement-item__title` — `font-size: var(--text-sm)`, font-weight 600 (unread) / 500 (read)
- `.announcement-item__preview` — `font-size: var(--text-xs)`, 2-line clamp, `color: var(--color-text-muted)`
- `.announcement-item__meta` — `font-size: var(--text-xs)`, `color: var(--color-text-muted)`

- [ ] **Step 3: Commit**

```bash
git add src/features/announcements/components/AnnouncementItem.tsx src/features/announcements/components/AnnouncementItem.css
git commit -m "feat(ui): add AnnouncementItem component for dropdown list"
```

### Task 13: AnnouncementBell (Icon + Dropdown)

**Files:**
- Create: `src/features/announcements/components/AnnouncementBell.tsx`
- Create: `src/features/announcements/components/AnnouncementBell.css`

- [ ] **Step 1: Implement bell component**

Props: none (reads from context).

Logic:
1. Get `announcements`, `unreadCount`, `markAsRead`, `markAllAsRead` from context
2. State: `isOpen` boolean for dropdown visibility
3. Ref: dropdown panel ref for click-outside detection
4. Effect: click-outside listener — if click target is not inside panel ref, close
5. Effect: Escape key listener — close panel
6. `handleItemClick`: call `markAsRead(id)`, set selected announcement, open modal
7. `handleMarkAllRead`: call `markAllAsRead()`

Render:
- Button with Bell icon (Lucide `Bell`, size from `--icon-base`), `aria-label="公告通知"`, `aria-expanded={isOpen}`, `aria-haspopup="true"`
- If `unreadCount > 0`: red badge overlay with count (cap at 99+)
- If `isOpen`: dropdown panel positioned absolutely below bell
  - Header: "公告通知" + unread count badge + "全部已读" button
  - Scrollable list of `<AnnouncementItem>` components
  - Empty state if no announcements

- [ ] **Step 2: Write CSS**

- `.announcement-bell` — position relative (for dropdown positioning)
- `.announcement-bell__button` — background transparent, border none, cursor pointer, position relative
- `.announcement-bell__badge` — position absolute, top -6px, right -8px, `background: var(--color-error)`, color white, min-width 16px, font-size `var(--text-xs)`, border-radius 8px
- `.announcement-bell__dropdown` — position absolute, top 100%, right 0, width 360px, `background: var(--color-background)`, `border-radius: var(--radius-lg)`, `box-shadow: var(--shadow-xl)`, `border: 1px solid var(--color-border)`, z-index `var(--z-dropdown)`
- `.announcement-bell__header` — flex, justify-content space-between, padding `var(--space-3) var(--space-4)`, border-bottom
- `.announcement-bell__list` — max-height 350px, overflow-y auto

- [ ] **Step 3: Integrate into TopBar**

Modify `src/components/layout/TopBar.tsx`: Import AnnouncementBell. Place it in `top-bar-right` div BEFORE `<ThemePicker />`. Only render if `isAuthenticated`.

- [ ] **Step 4: Commit**

```bash
git add src/features/announcements/components/AnnouncementBell.tsx src/features/announcements/components/AnnouncementBell.css src/components/layout/TopBar.tsx
git commit -m "feat(ui): add AnnouncementBell with dropdown panel in TopBar"
```

### Task 14: AnnouncementModal (Urgent + Detail)

**Files:**
- Create: `src/features/announcements/components/AnnouncementModal.tsx`
- Create: `src/features/announcements/components/AnnouncementModal.css`

- [ ] **Step 1: Implement modal component**

Two modes controlled by props:

```typescript
interface AnnouncementModalProps {
  announcement: Announcement | null;
  mode: 'urgent' | 'detail';
  onClose: () => void;
}
```

**Urgent mode** (auto-triggered for unread urgent announcements):
- Cannot close by clicking overlay
- "我知道了" button is the only way to close
- On close: calls `dismissUrgent(id)` from context
- Focus trap: tab cycles within modal
- `role="alertdialog"`, `aria-modal="true"`

**Detail mode** (opened from bell dropdown or banner click):
- Can close by clicking overlay or pressing Escape
- Shows "关闭" button instead
- `role="dialog"`, `aria-modal="true"`

Render structure:
- Overlay div (semi-transparent)
- Modal card: top color stripe (4px, color from colorScheme/customColor) → centered icon → type label → title → Markdown-rendered content (use DOMPurify for XSS protection, consistent with existing post system) → timestamp + creator → action button

- [ ] **Step 2: Add urgent auto-trigger logic**

In AnnouncementContext or a wrapper component: when `announcements` updates, find items where `type === 'urgent'` and `isRead === false` and `dismissed !== true`. Queue them and auto-open the first one in modal. On dismiss, show next in queue.

This logic can live inside a `useEffect` in the AnnouncementBanner parent or in a dedicated `AnnouncementUrgentHandler` component rendered in AppLayout.

- [ ] **Step 3: Write CSS**

- `.announcement-modal__overlay` — fixed inset 0, `background: rgba(0,0,0,0.5)`, z-index `var(--z-modal)`, flex center
- `.announcement-modal` — `background: var(--color-background)`, `border-radius: var(--radius-xl)`, `box-shadow: var(--shadow-xl)`, max-width 480px, width 90%
- `.announcement-modal__stripe` — height 4px, border-radius top
- `.announcement-modal__icon` — 52px circle, centered, background from colorScheme light variant
- `.announcement-modal__type` — `font-size: var(--text-xs)`, uppercase, letter-spacing 1px
- `.announcement-modal__title` — `font-size: var(--text-md)`, font-weight 700
- `.announcement-modal__content` — `font-size: var(--text-sm)`, Markdown prose styling
- `.announcement-modal__button` — full width, `height: var(--size-md)`, `background: var(--color-accent)`, `border-radius: var(--radius-lg)`

- [ ] **Step 4: Commit**

```bash
git add src/features/announcements/components/AnnouncementModal.tsx src/features/announcements/components/AnnouncementModal.css
git commit -m "feat(ui): add AnnouncementModal for urgent alerts and detail view"
```

### Task 15: Frontend Component Tests

**Files:**
- Create: `src/__tests__/components/AnnouncementBanner.test.tsx`
- Create: `src/__tests__/components/AnnouncementBell.test.tsx`
- Create: `src/__tests__/components/AnnouncementModal.test.tsx`

- [ ] **Step 1: Write AnnouncementBanner tests**

Mock AnnouncementContext. Test cases:
1. Renders nothing when no banners
2. Renders banner with title and color scheme
3. Shows dot indicators for multiple banners
4. Hides banner after close click (sessionStorage)
5. Click banner opens detail callback

- [ ] **Step 2: Write AnnouncementBell tests**

Mock AnnouncementContext. Test cases:
1. Shows bell icon
2. Shows unread badge with count
3. Opens dropdown on click
4. Renders announcement items in dropdown
5. Marks all as read when button clicked
6. Closes dropdown on outside click

- [ ] **Step 3: Write AnnouncementModal tests**

Test cases:
1. Renders urgent modal with "我知道了" button
2. Renders detail modal with "关闭" button
3. Urgent mode: overlay click does NOT close
4. Detail mode: overlay click closes
5. Displays Markdown content
6. Calls onClose when button clicked

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/__tests__/components/Announcement --reporter=verbose`

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/components/AnnouncementBanner.test.tsx src/__tests__/components/AnnouncementBell.test.tsx src/__tests__/components/AnnouncementModal.test.tsx
git commit -m "test(frontend): add announcement component tests"
```

---

## Chunk 4: Frontend — Admin Management Panel

### Task 16: AnnouncementManagement (List View) + AnnouncementForm (Create/Edit)

**Files:**
- Create: `src/features/admin/components/AnnouncementManagement.tsx`
- Create: `src/features/admin/components/AnnouncementForm.tsx`
- Create: `src/features/admin/components/AnnouncementManagement.css`
- Modify: `src/components/layout/SideNav.tsx`

- [ ] **Step 1: Implement AnnouncementManagement.tsx (list view)**

Follow BadgeManagement pattern. Use `usePageTitle('公告管理')`.

State:
- `announcements` list, `loading`, `error`
- `statusFilter` (all/draft/scheduled/active/expired/archived)
- `pagination` (page, limit, total, pages)
- `showForm` boolean + `editingAnnouncement` (null for create, object for edit)

List view:
- Header: "公告管理" + count + "新建公告" button (Lucide `Plus` icon)
- Filter tabs: pill buttons for each status, active tab highlighted
- Table with columns: title+creator, type tag, status tag, target audience, read rate progress bar, publish time, action buttons
- Action buttons per status: draft→编辑/发布/删除, active→编辑/下线, expired→编辑/删除, archived→编辑/删除
- Pagination at bottom

Action handlers (defined here, passed to Form as callbacks):
- `handleCreate`: POST admin create, refresh list, close form
- `handleUpdate`: PUT admin update, refresh list, close form
- `handlePublish`: PUT admin publish, refresh list
- `handleArchive`: PUT admin archive, refresh list
- `handleDelete`: confirm dialog, DELETE admin delete, refresh list

When `showForm` is true, render `<AnnouncementForm>` with props:
- `announcement`: the editing announcement object (null for create)
- `onSave`: calls handleCreate or handleUpdate
- `onCancel`: closes form
- `onPublish`: calls handleCreate then handlePublish (for "create + publish" flow)

- [ ] **Step 2: Implement AnnouncementForm.tsx (create/edit form)**

Props:
```typescript
interface AnnouncementFormProps {
  announcement: Announcement | null;  // null = create mode, object = edit mode
  onSave: (data: CreateAnnouncementData | UpdateAnnouncementData) => Promise<void>;
  onCancel: () => void;
  onPublish: (data: CreateAnnouncementData) => Promise<void>;
}
```

Form fields:
- Title input
- Type button group (普通/紧急/横幅)
- Color scheme: 4 preset circles + custom color input (HTML `<input type="color">`)
- Target audience button group (全站/按角色/指定用户)
  - Role mode: checkboxes for user/admin/superadmin
  - User mode: text input with search (call adminService.getUsers with search param), selected users as removable tags
- Content: textarea with Markdown support (plain textarea + preview toggle)
- Start time / End time: `<input type="datetime-local">`
- Checkboxes: isPinned, priority input
- Buttons: "保存草稿" (calls onSave) + "发布公告" (calls onPublish)

In edit mode, pre-fill all fields from `announcement` prop. "发布公告" button only shows if status is 'draft'.

- [ ] **Step 3: Write CSS**

Follow existing admin panel styling patterns. Use design system variables throughout. Key classes:
- `.announcement-mgmt` — page wrapper
- `.announcement-mgmt__header` — flex between title and button
- `.announcement-mgmt__filters` — flex gap for filter pills
- `.announcement-mgmt__table` — full width, border-collapse, design system colors
- `.announcement-mgmt__progress` — height 6px progress bar
- `.announcement-form` — max-width 640px card with sections
- `.announcement-form__type-group` — flex button group
- `.announcement-form__color-swatches` — flex for color circles
- `.announcement-form__target` — audience selector section
- `.announcement-form__actions` — bottom button row

- [ ] **Step 4: Add admin navigation entry**

Modify `src/components/layout/SideNav.tsx`: Add announcement management link to admin navigation items. Use Lucide `Megaphone` icon. Path: `/admin/announcements`.

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/components/AnnouncementManagement.tsx src/features/admin/components/AnnouncementForm.tsx src/features/admin/components/AnnouncementManagement.css src/components/layout/SideNav.tsx
git commit -m "feat(admin): add AnnouncementManagement list and AnnouncementForm"
```

### Task 17: Final Integration & Smoke Test

- [ ] **Step 1: Verify all backend tests pass**

Run: `cd backend && npx jest __tests__/integration/announcement.test.js --verbose`

- [ ] **Step 2: Verify all frontend tests pass**

Run: `npx vitest run src/__tests__/components/Announcement --reporter=verbose`

- [ ] **Step 3: Manual smoke test**

Start both servers. Test:
1. As admin: create a banner announcement → verify it shows at top of page
2. As admin: create an urgent announcement → verify modal pops up for users
3. As user: see banner, close it, verify it's gone in current tab
4. As user: click bell, see announcements, click one to see detail modal
5. As user: mark all as read, verify badge disappears
6. As admin: archive an announcement → verify it disappears from user view

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete announcement system implementation"
```
