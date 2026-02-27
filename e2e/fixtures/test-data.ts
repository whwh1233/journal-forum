/**
 * 测试数据 - 基于实际项目结构
 */

/**
 * 测试用户 - 使用数据库中已存在的用户
 */
export const testUsers = {
  // 普通用户
  normalUser: {
    email: '1@qq.com',
    password: '123456', // 需要知道实际密码
  },
  // 管理员用户
  adminUser: {
    email: 'wh@qq.com',
    password: '123456', // 需要知道实际密码
  },
  // 新用户注册
  newUser: {
    email: `test_${Date.now()}@example.com`,
    password: 'Test123456!',
    name: '测试用户',
  },
};

/**
 * 页面路由 - 基于 App.tsx 路由配置
 */
export const routes = {
  // 首页（期刊列表）
  home: '/',
  // 用户仪表盘（需登录）
  dashboard: '/dashboard',
  // 个人资料编辑（需登录）
  profileEdit: '/profile/edit',
  // 管理后台（需管理员）
  admin: {
    dashboard: '/admin',
    users: '/admin/users',
    journals: '/admin/journals',
    comments: '/admin/comments',
  },
};

/**
 * 页面选择器 - 基于实际组件结构
 */
export const selectors = {
  // 侧边导航
  sideNav: {
    container: '.side-nav',
    toggle: '.side-nav-toggle',
    homeLink: 'a[href="/"]',
    dashboardLink: 'a[href="/dashboard"]',
    profileEditLink: 'a[href="/profile/edit"]',
    adminLink: 'a[href="/admin"]',
    loginBtn: '.side-nav-bottom .side-nav-btn:has(.side-nav-icon)',
    logoutBtn: 'button:has-text("退出登录")',
    userAvatar: '.side-nav-avatar',
  },

  // 顶栏
  topBar: {
    container: '.top-bar',
    loginBtn: '.top-bar-login-btn',
    themePicker: '.theme-picker-trigger',
    userDropdown: '.user-dropdown',
  },

  // 认证弹窗
  auth: {
    modal: '.auth-modal',
    loginForm: '.auth-form',
    emailInput: 'input#email',
    passwordInput: 'input#password',
    submitBtn: '.auth-button',
    switchToRegister: '.auth-switch-link',
    errorMsg: '.auth-error',
  },

  // 期刊相关
  journal: {
    card: '.journal-card',
    title: '.journal-title',
    category: '.journal-category',
    rating: '.journal-rating',
    favoriteBtn: '.favorite-btn',
    // 详情面板
    panel: '.journal-panel',
    panelClose: '.journal-panel-close',
    panelTitle: '.journal-panel-title',
  },

  // 搜索和筛选
  search: {
    input: '#journal-search',
    searchBtn: '.search-button',
    categorySelect: '#category-filter',
    ratingSelect: '#rating-filter',
    clearBtn: '.clear-filters-button',
  },

  // 评论相关
  comment: {
    list: '.comment-list',
    item: '.comment-item',
    form: '.comment-form',
    textarea: '.comment-form-textarea',
    submitBtn: '.comment-form-btn-submit',
    ratingStars: '.rating-stars .star',
    loginPrompt: '.comment-form-login-prompt',
  },

  // 仪表盘
  dashboard: {
    container: '.dashboard-page',
    statsCard: '.stats-card',
    recentActivity: '.recent-activity',
  },

  // 主题选择器
  theme: {
    picker: '.theme-picker',
    trigger: '.theme-picker-trigger',
    panel: '.theme-picker-panel',
    option: '.theme-card',
    modeToggle: '.mode-toggle',
  },
};

/**
 * 期刊分类
 */
export const journalCategories = [
  { value: 'computer-science', label: '计算机科学' },
  { value: 'biology', label: '生物学' },
  { value: 'physics', label: '物理学' },
  { value: 'chemistry', label: '化学' },
  { value: 'mathematics', label: '数学' },
  { value: 'medicine', label: '医学' },
  { value: 'engineering', label: '工程学' },
  { value: 'economics', label: '经济学' },
];

/**
 * 搜索测试关键词
 */
export const searchTerms = ['计算机', '生物', '物理', '化学', '数学'];

/**
 * 超时配置
 */
export const timeouts = {
  short: 3000,
  medium: 5000,
  long: 10000,
  demo: 30000, // 演示用的慢速测试
};

/**
 * 演示测试用户（对应 database.test.json）
 */
export const demoUsers = {
  // 管理员
  admin: {
    email: 'admin@test.com',
    password: 'Test123456',
    name: '测试管理员',
  },
  // 已存在的作者（用于关注）
  author: {
    email: 'author@test.com',
    password: 'Test123456',
    name: '期刊作者',
  },
  // 新注册用户（演示时创建）
  newUser: {
    email: 'demo@test.com',
    password: 'Demo123456',
    name: '演示用户',
  },
};

/**
 * 管理后台选择器
 */
export const adminSelectors = {
  // 侧边导航
  nav: {
    dashboard: 'a[href="/admin"]',
    users: 'a[href="/admin/users"]',
    journals: 'a[href="/admin/journals"]',
    comments: 'a[href="/admin/comments"]',
  },
  // 用户管理
  users: {
    container: '.user-management',
    searchInput: '.user-management input[type="text"]',
    searchBtn: '.user-management button[type="submit"]',
    table: '.user-management table',
    row: '.user-management tbody tr',
    statusBtn: '.user-management .status-btn',
    deleteBtn: '.user-management .delete-btn',
  },
  // 期刊管理
  journals: {
    container: '.journal-management',
    table: '.journal-management table',
    row: '.journal-management tbody tr',
    editBtn: '.journal-management .edit-btn',
    deleteBtn: '.journal-management .delete-btn',
  },
  // 评论管理
  comments: {
    container: '.comment-management',
    table: '.comment-management table',
    row: '.comment-management tbody tr',
    deleteBtn: '.comment-management .delete-btn',
  },
};

/**
 * 个人资料选择器
 */
export const profileSelectors = {
  // 个人主页
  page: {
    container: '.profile-page',
    avatar: '.profile-avatar',
    name: '.profile-name',
    bio: '.profile-bio',
    stats: '.profile-stats',
    followBtn: '.follow-btn',
    followersLink: '.followers-link',
    followingLink: '.following-link',
  },
  // 编辑页面
  edit: {
    container: '.profile-edit-page',
    avatarInput: 'input[type="file"]',
    avatarUploadBtn: '.avatar-upload-btn',
    nameInput: 'input[name="name"]',
    bioInput: 'textarea[name="bio"]',
    locationInput: 'input[name="location"]',
    institutionInput: 'input[name="institution"]',
    websiteInput: 'input[name="website"]',
    submitBtn: '.profile-edit-page button[type="submit"]',
    successMsg: '.success-message',
  },
};

/**
 * 仪表盘选择器
 */
export const dashboardSelectors = {
  container: '.dashboard-page',
  statsCards: '.stats-card',
  commentCount: '.stats-card.comments .count',
  favoriteCount: '.stats-card.favorites .count',
  followingCount: '.stats-card.following .count',
  recentComments: '.recent-comments',
  favoritesSection: '.favorites-section',
};

/**
 * 收藏相关选择器
 */
export const favoriteSelectors = {
  btn: '.favorite-btn',
  btnActive: '.favorite-btn.active',
  list: '.favorites-list',
  item: '.favorite-item',
};

/**
 * 关注相关选择器
 */
export const followSelectors = {
  btn: '.follow-btn',
  btnActive: '.follow-btn.following',
  followersList: '.followers-list',
  followingList: '.following-list',
  userCard: '.user-card',
};
