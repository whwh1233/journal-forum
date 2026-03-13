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
    badges: '/admin/badges',
    announcements: '/admin/announcements',
    database: '/admin/database',
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
    // 新增筛选器相关选择器
    section: '.search-filter-section',
    searchInput: '.sfc-search-input',
    searchClear: '.sfc-search-clear',
    filterBar: '.filter-bar',
    filterGroup: '.filter-group',
    filterLabel: '.filter-label',
    popoverTrigger: '.popover-trigger',
    popoverMenu: '.popover-menu',
    menuItem: '.menu-item',
    sortTrigger: '.sort-trigger-btn',
    sortPanel: '.sort-panel-container',
    sortItemCard: '.sort-item-card',
    clearFiltersBtn: '.clear-filters-btn',
  },

  // 期刊网格和无限滚动
  journalGrid: {
    grid: '.journals-grid',
    loadMoreTrigger: '.load-more-trigger',
    loadingMore: '.loading-more',
    noMore: '.no-more',
    loading: '.loading',
    noResults: '.no-results',
  },

  // 期刊卡片详细选择器
  journalCard: {
    card: '.journal-card',
    cover: '.card-cover-side',
    content: '.card-content-side',
    title: '.card-title',
    levels: '.card-levels',
    levelTag: '.level-tag',
    statsRow: '.card-stats-row',
    statBox: '.journal-stat-box',
    statLabel: '.journal-stat-label',
    statValue: '.journal-stat-value',
    ifValue: '.journal-if-value',
    ratingValue: '.journal-rating-value',
    commentValue: '.journal-comment-value',
    footer: '.card-footer',
    category: '.footer-category',
    issn: '.footer-issn',
    favoriteBtn: '.card-favorite-float',
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
    badges: 'a[href="/admin/badges"]',
    announcements: 'a[href="/admin/announcements"]',
    database: 'a[href="/admin/database"]',
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
  // 徽章管理
  badges: {
    container: '.badge-management',
    header: '.admin-header',
    grantCard: '.grant-badge-card',
    grantForm: '.grant-form',
    badgeSelect: '.grant-form select:first-of-type',
    userSelect: '.grant-form select:last-of-type',
    grantBtn: '.btn-grant',
    listCard: '.badges-list-card',
    table: '.admin-table',
    row: '.admin-table tbody tr',
    badgeIcon: '.badge-icon-wrapper',
    typeBadge: '.type-badge',
    statusBadge: '.status-badge',
    actionMessage: '.action-message',
  },
  // 公告管理
  announcements: {
    container: '.announcement-mgmt',
    header: '.announcement-mgmt__header',
    titleRow: '.announcement-mgmt__title-row',
    createBtn: '.announcement-mgmt__create-btn',
    tabs: '.announcement-mgmt__tabs',
    tab: '.announcement-mgmt__tab',
    tabActive: '.announcement-mgmt__tab--active',
    table: '.announcement-mgmt__table',
    tableWrapper: '.announcement-mgmt__table-wrapper',
    row: '.announcement-mgmt__table tbody tr',
    titleCell: '.announcement-mgmt__title-cell',
    pinBadge: '.announcement-mgmt__pin',
    typeTag: '.announcement-mgmt__type',
    statusTag: '.announcement-mgmt__status',
    progress: '.announcement-mgmt__progress',
    actions: '.announcement-mgmt__actions',
    actionBtn: '.announcement-mgmt__action-btn',
    editBtn: '.announcement-mgmt__action-btn:has(svg)',
    publishBtn: '.announcement-mgmt__action-btn--publish',
    archiveBtn: '.announcement-mgmt__action-btn--archive',
    deleteBtn: '.announcement-mgmt__action-btn--delete',
    pagination: '.announcement-mgmt__pagination',
    confirmOverlay: '.announcement-mgmt__confirm-overlay',
    confirmDialog: '.announcement-mgmt__confirm',
    confirmDelete: '.announcement-mgmt__confirm-delete',
    empty: '.announcement-mgmt__empty',
    error: '.announcement-mgmt__error',
    // 表单相关
    form: '.announcement-form',
    formTitle: '.announcement-form__title input',
    formContent: '.announcement-form__content textarea',
    formType: '.announcement-form__type select',
    formPriority: '.announcement-form__priority input',
    formSubmit: '.announcement-form__submit',
    formCancel: '.announcement-form__cancel',
  },
  // 数据库管理
  database: {
    container: '.database-manager',
    nav: '.db-nav',
    navBtn: '.db-nav-btn',
    navBtnActive: '.db-nav-btn.active',
    navTable: '.db-nav-table',
    viewTabs: '.db-view-tabs',
    viewTabBtn: '.db-view-tabs button',
    content: '.db-content',
    // 表列表
    tablesGrid: '.db-tables-grid',
    tableCard: '.db-table-card',
    tableCardHeader: '.db-table-card-header',
    tableName: '.db-table-name',
    tableStats: '.db-table-card-stats',
    tableStat: '.db-stat',
    // 表结构
    structure: '.db-structure',
    structureSection: '.db-section',
    structureTable: '.db-structure-table-container table',
    // 表数据
    data: '.db-data',
    dataToolbar: '.db-data-toolbar',
    searchGroup: '.db-search-group',
    searchSelect: '.db-search-group .db-select',
    searchInput: '.db-search-group .db-input',
    searchBtn: '.db-btn-search',
    dataTable: '.db-data-table',
    dataTableContainer: '.db-data-table-container',
    rowActions: '.db-row-actions',
    editBtn: '.db-btn-icon.edit',
    deleteBtn: '.db-btn-icon.delete',
    saveBtn: '.db-btn-icon.save',
    cancelBtn: '.db-btn-icon.cancel',
    editInput: '.db-edit-input',
    pagination: '.db-pagination',
    paginationInfo: '.db-pagination-info',
    paginationBtns: '.db-pagination-btns',
    // 审计日志
    logs: '.db-logs',
    logsTable: '.db-logs-table-container table',
    logDetails: '.db-log-details',
    // 确认弹窗
    modal: '.db-modal',
    modalOverlay: '.db-modal-overlay',
    modalHeader: '.db-modal-header',
    modalBody: '.db-modal-body',
    modalFooter: '.db-modal-footer',
    modalCancel: '.db-btn-cancel',
    modalConfirm: '.db-btn-primary, .db-btn-danger',
    // 加载和消息
    loading: '.db-loading-overlay',
    actionMessage: '.action-message',
  },
  // 举报管理
  reports: {
    container: '.report-management',
    header: '.report-header',
    stats: '.report-stats',
    filters: '.report-filters',
    filterSelect: '.filter-select',
    batchActions: '.batch-actions',
    table: '.report-table',
    tableContainer: '.report-table-container',
    row: '.report-table tbody tr',
    checkbox: '.report-table input[type="checkbox"]',
    postInfo: '.post-info',
    postTitle: '.post-title',
    reporterInfo: '.reporter-info',
    reportReason: '.report-reason',
    statusBadge: '.report-status-badge',
    actions: '.report-actions',
    viewBtn: '.action-view',
    approveBtn: '.action-approve',
    rejectBtn: '.action-reject',
    pagination: '.pagination',
    modal: '.modal-content',
    modalOverlay: '.modal-overlay',
    modalHeader: '.modal-header',
    modalBody: '.modal-body',
    modalFooter: '.modal-footer',
    detailSection: '.detail-section',
    empty: '.empty-state',
    loading: '.loading-state',
    error: '.error-state',
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
