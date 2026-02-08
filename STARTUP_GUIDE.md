# Journal Forum - Startup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### 1. Install Dependencies

#### Backend Dependencies:
```bash
cd backend
npm install
```

**Key packages installed:**
- express
- lowdb (for JSON database)
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)
- multer (file uploads)
- nanoid (unique IDs)

#### Frontend Dependencies:
```bash
npm install
```

**Key packages installed:**
- react
- react-router-dom
- axios (HTTP client)
- vite (dev server)

---

### 2. Start the Servers

#### Option A: Start Both Servers Separately

**Terminal 1 - Backend Server:**
```bash
cd backend
node server.js
```

You should see:
```
JSON file database connected successfully
Database location: D:\claude\journal-forum\backend\database.json
Starting migration of reviews to comments...
Migration completed: X reviews migrated to comments
Server running in development mode on port 3001
```

**Terminal 2 - Frontend Dev Server:**
```bash
npm run dev
```

You should see:
```
VITE v4.5.14  ready in XXX ms
➜  Local:   http://localhost:3000/
```

#### Option B: Using Background Processes

**Windows:**
```bash
# Start backend
cd backend && start /B node server.js

# Start frontend
start npm run dev
```

**Linux/Mac:**
```bash
# Start backend
cd backend && node server.js &

# Start frontend
npm run dev
```

---

### 3. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

**Backend API:** `http://localhost:3001`
**Backend Health Check:** `http://localhost:3001/health`

---

## 📋 Initial Setup

### Create Admin Account

1. Register a new account through the UI
2. Access the database file: `backend/database.json`
3. Find your user in the `users` array
4. Change the `role` field from `"user"` to `"admin"`
5. Save the file and refresh the browser

Example:
```json
{
  "users": [
    {
      "id": 1,
      "email": "admin@example.com",
      "role": "admin"  // <- Change this from "user" to "admin"
    }
  ]
}
```

---

## 🧪 Testing the Features

### 1. Comment System
1. Browse journals on the home page
2. Click on a journal to view details
3. Scroll down to see comments section
4. **Login required:** Click "登录/注册" to create an account
5. Post a top-level comment with a rating (1-5 stars)
6. Reply to any comment (up to 3 levels deep)
7. Edit your own comments
8. Delete your own comments (they become "[该评论已被删除]")

### 2. User Profile
1. After logging in, click your email in the header
2. Click "个人中心" to view your dashboard
3. View your profile stats (comments, favorites, followers, following)
4. Upload an avatar (max 2MB)
5. Edit your profile (name, bio, location, institution, website)
6. Change your password

### 3. Favorites
1. Browse journals on home page
2. Notice the "☆ 收藏" button on each journal card
3. Click to favorite a journal (button changes to "★ 已收藏")
4. View your favorites in the dashboard

### 4. Follow System
1. Click on any username to view their profile
2. Click "关注" button to follow them
3. Button changes to "已关注"
4. View your following list in your profile stats

### 5. Personal Dashboard
1. Click "个人中心" in the header
2. View your activity overview (stats cards)
3. Switch to "我的评论" tab to see all your comments
4. Switch to "我的收藏" tab to see all your favorites
5. Click on any journal title to navigate to it

---

## 🐛 Troubleshooting

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solution:**
```bash
# Windows - Kill process on port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac - Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Axios Import Error

**Error:** `Failed to resolve import "axios"`

**Solution:**
```bash
npm install axios
```

### Backend Not Connecting

1. Check if backend is running: `curl http://localhost:3001/health`
2. Check backend logs for errors
3. Verify `backend/database.json` exists
4. Check `.env` file has correct PORT setting

### Frontend Not Loading

1. Clear browser cache
2. Check browser console for errors
3. Verify axios is installed: `npm list axios`
4. Restart Vite dev server: `npm run dev`

---

## 📁 Project Structure

```
journal-forum/
├── backend/                    # Backend API server
│   ├── config/                 # Database configuration
│   ├── controllers/            # Route handlers
│   │   ├── commentControllerLowdb.js
│   │   ├── userControllerLowdb.js
│   │   ├── favoriteControllerLowdb.js
│   │   └── followControllerLowdb.js
│   ├── middleware/             # Auth middleware
│   ├── routes/                 # API routes
│   ├── migrations/             # Database migrations
│   ├── uploads/avatars/        # User avatars
│   ├── database.json           # JSON database
│   └── server.js               # Express server
│
├── src/                        # Frontend source
│   ├── components/             # Shared components
│   ├── contexts/               # React contexts
│   ├── features/               # Feature modules
│   │   ├── comments/           # Comment system
│   │   ├── profile/            # User profiles
│   │   ├── favorite/           # Favorite system
│   │   ├── follow/             # Follow system
│   │   └── dashboard/          # Personal dashboard
│   ├── services/               # API client services
│   │   ├── commentService.ts
│   │   ├── userService.ts
│   │   ├── favoriteService.ts
│   │   └── followService.ts
│   └── types/                  # TypeScript types
│
└── docs/                       # Documentation
    ├── IMPLEMENTATION_SUMMARY.md
    ├── API_ROUTES.md
    └── STARTUP_GUIDE.md (this file)
```

---

## 🔑 Default Admin Credentials

After manual setup in database.json, you can use:
- Email: (whatever you registered with)
- Password: (whatever you set)
- Role: `admin` (set manually in database.json)

---

## 🌐 API Endpoints

See `API_ROUTES.md` for complete API documentation.

**Quick Reference:**
- Comments: `/api/comments/*`
- Users: `/api/users/*`
- Favorites: `/api/favorites/*`
- Follows: `/api/follows/*`
- Admin: `/api/admin/*`

---

## ✅ Success Indicators

When everything is running correctly, you should see:

1. ✅ Backend console shows "Server running on port 3001"
2. ✅ Frontend accessible at http://localhost:3000
3. ✅ Can register/login successfully
4. ✅ Can view and interact with journals
5. ✅ Can post comments and replies
6. ✅ Can favorite journals
7. ✅ Can view user profiles
8. ✅ Dashboard displays correctly

---

## 📞 Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review `IMPLEMENTATION_SUMMARY.md` for feature details
3. Check `API_ROUTES.md` for API documentation
4. Examine browser console for frontend errors
5. Check terminal output for backend errors

---

## 🎉 Enjoy Your Journal Forum!

All features are now fully implemented and ready to use:
- ✅ Nested comments with ratings
- ✅ User profiles with avatars
- ✅ Favorite journals
- ✅ Follow users
- ✅ Personal dashboard

Happy coding! 🚀
