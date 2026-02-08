# Journal Forum API Routes Reference

## 🔐 Authentication

All routes marked with `(auth)` require a valid JWT token in the `Authorization: Bearer <token>` header.

---

## 📝 Comments API

### Get Comments by Journal
```
GET /api/comments/journal/:journalId?sort=newest|oldest|rating
```
Returns nested comment tree for a journal.

**Query Parameters:**
- `sort` (optional): `newest` (default), `oldest`, or `rating`

**Response:**
```json
[
  {
    "id": "1-1707123456789-abc123",
    "userId": 1,
    "userName": "张三",
    "journalId": 1,
    "parentId": null,
    "content": "Great journal!",
    "rating": 5,
    "createdAt": "2026-02-08T00:00:00.000Z",
    "isDeleted": false,
    "replies": [...]
  }
]
```

### Create Comment/Reply
```
POST /api/comments (auth)
```

**Request Body:**
```json
{
  "journalId": 1,
  "parentId": null,  // or comment ID for replies
  "content": "Comment text",
  "rating": 5  // required for top-level, omit for replies
}
```

### Update Comment
```
PUT /api/comments/:commentId (auth)
```

**Request Body:**
```json
{
  "content": "Updated comment text"
}
```

**Permissions:** Author only

### Delete Comment
```
DELETE /api/comments/:commentId (auth)
```

**Permissions:** Author or admin

---

## 👤 User Profile API

### Get User Profile
```
GET /api/users/:userId
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "张三",
  "avatar": "/uploads/avatars/user-1-123456.jpg",
  "bio": "个人简介",
  "location": "北京",
  "institution": "清华大学",
  "website": "https://example.com",
  "role": "user",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "stats": {
    "commentCount": 10,
    "favoriteCount": 5,
    "followingCount": 3,
    "followerCount": 7
  }
}
```

### Update Profile
```
PUT /api/users/profile (auth)
```

**Request Body:**
```json
{
  "name": "张三",
  "bio": "个人简介",
  "location": "北京",
  "institution": "清华大学",
  "website": "https://example.com"
}
```

**Permissions:** Own profile only

### Upload Avatar
```
POST /api/users/avatar (auth)
```

**Request:** `multipart/form-data`
```
avatar: <image file>
```

**Limits:**
- Max size: 2MB
- Allowed types: jpeg, jpg, png, gif

**Response:**
```json
{
  "message": "头像上传成功",
  "avatar": "/uploads/avatars/user-1-123456.jpg"
}
```

### Change Password
```
PUT /api/users/password (auth)
```

**Request Body:**
```json
{
  "currentPassword": "old password",
  "newPassword": "new password"
}
```

**Validation:**
- Current password must match
- New password min length: 6

### Get My Comments
```
GET /api/users/me/comments?page=1&limit=10 (auth)
```

**Response:**
```json
{
  "comments": [
    {
      "id": "1-123-abc",
      "journalId": 1,
      "journalTitle": "期刊名称",
      "content": "评论内容",
      "rating": 5,
      "createdAt": "2026-02-08T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 10
  }
}
```

### Get My Favorites
```
GET /api/users/me/favorites?page=1&limit=10 (auth)
```

**Response:**
```json
{
  "favorites": [
    {
      "id": 1,
      "journal": { ... },
      "createdAt": "2026-02-08T00:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

### Get Activity Stats
```
GET /api/users/me/activity (auth)
```

**Response:**
```json
{
  "stats": {
    "commentCount": 10,
    "favoriteCount": 5,
    "followingCount": 3,
    "followerCount": 7
  },
  "recentActivity": [
    {
      "type": "comment",
      "data": { ... },
      "createdAt": "..."
    },
    {
      "type": "favorite",
      "data": { ... },
      "createdAt": "..."
    }
  ]
}
```

---

## ⭐ Favorites API

### Add Favorite
```
POST /api/favorites (auth)
```

**Request Body:**
```json
{
  "journalId": 5
}
```

**Error:** 400 if already favorited

### Remove Favorite
```
DELETE /api/favorites/:journalId (auth)
```

### Check Favorite Status
```
GET /api/favorites/check/:journalId (auth)
```

**Response:**
```json
{
  "isFavorited": true
}
```

### Get User Favorites
```
GET /api/favorites/user/:userId?page=1&limit=10
```

**Response:**
```json
{
  "favorites": [
    {
      "id": 1,
      "journal": {
        "id": 5,
        "title": "...",
        "description": "..."
      },
      "createdAt": "2026-02-08T00:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

---

## 👥 Follow API

### Follow User
```
POST /api/follows (auth)
```

**Request Body:**
```json
{
  "followingId": 2
}
```

**Error:**
- 400 if trying to follow self
- 400 if already following

### Unfollow User
```
DELETE /api/follows/:followingId (auth)
```

### Check Follow Status
```
GET /api/follows/check/:followingId (auth)
```

**Response:**
```json
{
  "isFollowing": true
}
```

### Get Followers
```
GET /api/follows/followers/:userId?page=1&limit=20
```

**Response:**
```json
{
  "followers": [
    {
      "id": 1,
      "user": {
        "id": 2,
        "email": "...",
        "name": "...",
        "avatar": "..."
      },
      "createdAt": "2026-02-08T00:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

### Get Following
```
GET /api/follows/following/:userId?page=1&limit=20
```

**Response:**
```json
{
  "following": [
    {
      "id": 1,
      "user": {
        "id": 3,
        "email": "...",
        "name": "...",
        "avatar": "..."
      },
      "createdAt": "2026-02-08T00:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

---

## 🔄 Frontend Routes

### Public Routes:
- `/` - Home page with journal list
- `/profile/:userId` - View user profile

### Protected Routes (require login):
- `/profile/edit` - Edit own profile
- `/dashboard` - Personal dashboard

### Admin Routes:
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/journals` - Journal management
- `/admin/comments` - Comment management

---

## 📊 Static Files

Avatar uploads are served at:
```
GET /uploads/avatars/:filename
```

Example: `http://localhost:3001/uploads/avatars/user-1-123456789.jpg`

---

## ⚠️ Error Responses

All API errors return JSON:
```json
{
  "message": "Error description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `500` - Server error
