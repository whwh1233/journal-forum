/**
 * 初始徽章数据
 *
 * 徽章分类：
 * - activity: 活动徽章（通过用户行为自动获得）
 * - identity: 身份徽章（特殊身份标识）
 * - honor: 荣誉徽章（手动授予的特殊荣誉）
 */

const initialBadges = [
  // ========== 评论徽章（科举体系）==========
  {
    id: 1,
    code: 'comment_5',
    name: '童生',
    description: '发表 5 条评论，初入学门',
    icon: 'BookOpen',
    color: '#8B7355',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'commentCount', threshold: 5 },
    priority: 10,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    code: 'comment_15',
    name: '秀才',
    description: '发表 15 条评论，学有小成',
    icon: 'BookOpen',
    color: '#6B8E23',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'commentCount', threshold: 15 },
    priority: 20,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    code: 'comment_30',
    name: '举人',
    description: '发表 30 条评论，乡试中榜',
    icon: 'BookOpen',
    color: '#4169E1',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'commentCount', threshold: 30 },
    priority: 30,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 4,
    code: 'comment_50',
    name: '进士',
    description: '发表 50 条评论，金榜题名',
    icon: 'BookOpen',
    color: '#FFD700',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'commentCount', threshold: 50 },
    priority: 40,
    isActive: true,
    createdAt: new Date().toISOString()
  },

  // ========== 收藏徽章（藏书家体系）==========
  {
    id: 5,
    code: 'favorite_5',
    name: '书童',
    description: '收藏 5 本期刊，初涉书海',
    icon: 'Bookmark',
    color: '#8B7355',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'favoriteCount', threshold: 5 },
    priority: 10,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 6,
    code: 'favorite_15',
    name: '藏书郎',
    description: '收藏 15 本期刊，博览群书',
    icon: 'Bookmark',
    color: '#6B8E23',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'favoriteCount', threshold: 15 },
    priority: 20,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 7,
    code: 'favorite_30',
    name: '典籍使',
    description: '收藏 30 本期刊，掌管典籍',
    icon: 'Bookmark',
    color: '#4169E1',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'favoriteCount', threshold: 30 },
    priority: 30,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 8,
    code: 'favorite_50',
    name: '文渊阁士',
    description: '收藏 50 本期刊，学富五车',
    icon: 'Bookmark',
    color: '#FFD700',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'favoriteCount', threshold: 50 },
    priority: 40,
    isActive: true,
    createdAt: new Date().toISOString()
  },

  // ========== 粉丝徽章（学术职称体系）==========
  {
    id: 9,
    code: 'follower_5',
    name: '助教',
    description: '拥有 5 位粉丝，初为人师',
    icon: 'Users',
    color: '#8B7355',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'followerCount', threshold: 5 },
    priority: 10,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 10,
    code: 'follower_15',
    name: '讲师',
    description: '拥有 15 位粉丝，桃李渐多',
    icon: 'Users',
    color: '#6B8E23',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'followerCount', threshold: 15 },
    priority: 20,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 11,
    code: 'follower_30',
    name: '副教授',
    description: '拥有 30 位粉丝，声名鹊起',
    icon: 'Users',
    color: '#4169E1',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'followerCount', threshold: 30 },
    priority: 30,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 12,
    code: 'follower_50',
    name: '教授',
    description: '拥有 50 位粉丝，德高望重',
    icon: 'Users',
    color: '#FFD700',
    category: 'activity',
    type: 'auto',
    triggerCondition: { metric: 'followerCount', threshold: 50 },
    priority: 40,
    isActive: true,
    createdAt: new Date().toISOString()
  },

  // ========== 身份徽章 ==========
  {
    id: 13,
    code: 'pioneer',
    name: '拓荒学者',
    description: '平台早期用户，见证成长',
    icon: 'Compass',
    color: '#9370DB',
    category: 'identity',
    type: 'auto',
    triggerCondition: { metric: 'earlyUser', threshold: 1 },
    priority: 100,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 14,
    code: 'admin',
    name: '学监',
    description: '平台管理员，维护学风',
    icon: 'Shield',
    color: '#DC143C',
    category: 'identity',
    type: 'auto',
    triggerCondition: { metric: 'isAdmin', threshold: 1 },
    priority: 200,
    isActive: true,
    createdAt: new Date().toISOString()
  },

  // ========== 荣誉徽章（手动授予）==========
  {
    id: 15,
    code: 'honor_hanlin',
    name: '翰林待诏',
    description: '学识渊博，待诏金銮',
    icon: 'Award',
    color: '#FF6347',
    category: 'honor',
    type: 'manual',
    priority: 300,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 16,
    code: 'honor_taixue',
    name: '太学博士',
    description: '经学大师，传道授业',
    icon: 'GraduationCap',
    color: '#8A2BE2',
    category: 'honor',
    type: 'manual',
    priority: 310,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 17,
    code: 'honor_ledao',
    name: '乐道先生',
    description: '乐于分享，传播知识',
    icon: 'Heart',
    color: '#FF69B4',
    category: 'honor',
    type: 'manual',
    priority: 320,
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

module.exports = { initialBadges };
