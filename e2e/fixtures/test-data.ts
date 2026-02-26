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
