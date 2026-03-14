const { sequelize } = require('../config/database');
const User = require('./User');
const Journal = require('./Journal');
const JournalLevel = require('./JournalLevel');
const JournalRatingCache = require('./JournalRatingCache');
const Category = require('./Category');
const JournalCategoryMap = require('./JournalCategoryMap');
const Comment = require('./Comment');
const CommentLike = require('./CommentLike');
const Favorite = require('./Favorite');
const Follow = require('./Follow');
const Badge = require('./Badge');
const UserBadge = require('./UserBadge');
const DatabaseAuditLog = require('./DatabaseAuditLog');
const Post = require('./Post');
const PostLike = require('./PostLike');
const PostFavorite = require('./PostFavorite');
const PostFollow = require('./PostFollow');
const PostComment = require('./PostComment');
const PostCommentLike = require('./PostCommentLike');
const PostReport = require('./PostReport');
const Manuscript = require('./Manuscript');
const Submission = require('./Submission');
const SubmissionStatusHistory = require('./SubmissionStatusHistory');
const Announcement = require('./Announcement');
const UserAnnouncementRead = require('./UserAnnouncementRead');
const Notification = require('./Notification');
const PostCategory = require('./PostCategory');
const Tag = require('./Tag');
const PostTagMap = require('./PostTagMap');
const SystemConfig = require('./SystemConfig');// ==================== 关联定义 ====================

// ==================== 关联定义 ====================

// Announcement 关联
User.hasMany(Announcement, { foreignKey: 'creatorId', as: 'createdAnnouncements' });
Announcement.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

// User N:M Announcement (through UserAnnouncementRead)
User.belongsToMany(Announcement, { through: UserAnnouncementRead, foreignKey: 'userId', as: 'readAnnouncements' });
Announcement.belongsToMany(User, { through: UserAnnouncementRead, foreignKey: 'announcementId', as: 'readers' });
UserAnnouncementRead.belongsTo(User, { foreignKey: 'userId' });
UserAnnouncementRead.belongsTo(Announcement, { foreignKey: 'announcementId' });
User.hasMany(UserAnnouncementRead, { foreignKey: 'userId' });
Announcement.hasMany(UserAnnouncementRead, { foreignKey: 'announcementId' });

// User 1:N Comment
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Journal 1:N JournalLevel
Journal.hasMany(JournalLevel, { foreignKey: 'journalId', as: 'levels' });
JournalLevel.belongsTo(Journal, { foreignKey: 'journalId' });

// Journal 1:1 JournalRatingCache
Journal.hasOne(JournalRatingCache, { foreignKey: 'journalId', as: 'ratingCache' });
JournalRatingCache.belongsTo(Journal, { foreignKey: 'journalId' });

// Category 自关联（父子类）
Category.hasMany(Category, { foreignKey: 'parentId', as: 'children' });
Category.belongsTo(Category, { foreignKey: 'parentId', as: 'parent' });

// Journal N:M Category (through JournalCategoryMap)
Journal.belongsToMany(Category, {
  through: JournalCategoryMap,
  foreignKey: 'journalId',
  otherKey: 'categoryId',
  as: 'categories'
});
Category.belongsToMany(Journal, {
  through: JournalCategoryMap,
  foreignKey: 'categoryId',
  otherKey: 'journalId',
  as: 'journals'
});
JournalCategoryMap.belongsTo(Journal, { foreignKey: 'journalId' });
JournalCategoryMap.belongsTo(Category, { foreignKey: 'categoryId' });

// Journal 1:N Comment
Journal.hasMany(Comment, { foreignKey: 'journalId', as: 'comments' });
Comment.belongsTo(Journal, { foreignKey: 'journalId', as: 'journal' });

// Comment 自关联（嵌套评论）
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });

// Comment 1:N CommentLike
Comment.hasMany(CommentLike, { foreignKey: 'commentId', as: 'likes' });
CommentLike.belongsTo(Comment, { foreignKey: 'commentId' });
User.hasMany(CommentLike, { foreignKey: 'userId' });
CommentLike.belongsTo(User, { foreignKey: 'userId' });

// User N:M Journal (through Favorite)
User.hasMany(Favorite, { foreignKey: 'userId', as: 'favorites' });
Favorite.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Journal.hasMany(Favorite, { foreignKey: 'journalId', as: 'favorites' });
Favorite.belongsTo(Journal, { foreignKey: 'journalId', as: 'journal' });

// User N:M User (through Follow)
User.hasMany(Follow, { foreignKey: 'followerId', as: 'following' });
User.hasMany(Follow, { foreignKey: 'followingId', as: 'followers' });
Follow.belongsTo(User, { foreignKey: 'followerId', as: 'follower' });
Follow.belongsTo(User, { foreignKey: 'followingId', as: 'followedUser' });

// Badge 1:N UserBadge
Badge.hasMany(UserBadge, { foreignKey: 'badgeId', as: 'userBadges' });
UserBadge.belongsTo(Badge, { foreignKey: 'badgeId', as: 'badge' });
User.hasMany(UserBadge, { foreignKey: 'userId', as: 'userBadges' });
UserBadge.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Post 关联
Post.belongsTo(User, {
    foreignKey: 'userId',
    as: 'author',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});
Post.belongsTo(Journal, {
    foreignKey: 'journalId',
    as: 'journal',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
});
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Journal.hasMany(Post, { foreignKey: 'journalId', as: 'relatedPosts' });

// PostCategory 关联
Post.belongsTo(PostCategory, { foreignKey: 'categoryId', as: 'postCategory' });
PostCategory.hasMany(Post, { foreignKey: 'categoryId', as: 'posts' });

// Tag 关联
Tag.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Tag, { foreignKey: 'createdBy', as: 'createdTags' });

// Post N:M Tag (through PostTagMap)
Post.belongsToMany(Tag, {
  through: PostTagMap,
  foreignKey: 'postId',
  otherKey: 'tagId',
  as: 'tags_assoc'
});
Tag.belongsToMany(Post, {
  through: PostTagMap,
  foreignKey: 'tagId',
  otherKey: 'postId',
  as: 'posts'
});
PostTagMap.belongsTo(Post, { foreignKey: 'postId' });
PostTagMap.belongsTo(Tag, { foreignKey: 'tagId' });

// PostLike 关联
PostLike.belongsTo(Post, { foreignKey: 'postId', onDelete: 'CASCADE' });
PostLike.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
Post.hasMany(PostLike, { foreignKey: 'postId', as: 'likes' });

// PostFavorite 关联
PostFavorite.belongsTo(Post, { foreignKey: 'postId', onDelete: 'CASCADE' });
PostFavorite.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
Post.hasMany(PostFavorite, { foreignKey: 'postId', as: 'favorites' });

// PostFollow 关联
PostFollow.belongsTo(Post, { foreignKey: 'postId', onDelete: 'CASCADE' });
PostFollow.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
Post.hasMany(PostFollow, { foreignKey: 'postId', as: 'follows' });

// PostComment 关联
PostComment.belongsTo(Post, { foreignKey: 'postId', onDelete: 'CASCADE' });
PostComment.belongsTo(User, { foreignKey: 'userId' });
PostComment.belongsTo(PostComment, { foreignKey: 'parentId', as: 'parent' });
Post.hasMany(PostComment, { foreignKey: 'postId', as: 'comments' });
PostComment.hasMany(PostComment, { foreignKey: 'parentId', as: 'replies' });

// PostCommentLike 关联
PostCommentLike.belongsTo(PostComment, { foreignKey: 'commentId', onDelete: 'CASCADE' });
PostCommentLike.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
PostComment.hasMany(PostCommentLike, { foreignKey: 'commentId', as: 'likes' });

// PostReport 关联
PostReport.belongsTo(Post, { foreignKey: 'postId', onDelete: 'CASCADE' });
PostReport.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });
Post.hasMany(PostReport, { foreignKey: 'postId', as: 'reports' });

// Manuscript 投稿记录关联
User.hasMany(Manuscript, { foreignKey: 'userId', as: 'manuscripts' });
Manuscript.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Manuscript 1:N Submission
Manuscript.hasMany(Submission, { foreignKey: 'manuscriptId', as: 'submissions', onDelete: 'CASCADE' });
Submission.belongsTo(Manuscript, { foreignKey: 'manuscriptId', as: 'manuscript' });

// Submission -> User / Journal
User.hasMany(Submission, { foreignKey: 'userId', as: 'submissions' });
Submission.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Journal.hasMany(Submission, { foreignKey: 'journalId', as: 'submissions' });
Submission.belongsTo(Journal, { foreignKey: 'journalId', as: 'journal' });

// Submission 1:N SubmissionStatusHistory
Submission.hasMany(SubmissionStatusHistory, { foreignKey: 'submissionId', as: 'statusHistory', onDelete: 'CASCADE' });
SubmissionStatusHistory.belongsTo(Submission, { foreignKey: 'submissionId', as: 'submission' });

// Notification 关联
User.hasMany(Notification, { foreignKey: 'recipientId', as: 'receivedNotifications' });
User.hasMany(Notification, { foreignKey: 'senderId', as: 'sentNotifications' });
Notification.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });
Notification.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// ==================== 同步函数 ====================

/**
 * 同步所有模型到数据库
 * @param {Object} options - Sequelize sync options
 * @param {boolean} options.force - 是否强制重建表（危险！会删除数据）
 * @param {boolean} options.alter - 是否自动修改表结构
 */
const syncDatabase = async (options = {}) => {
    try {
        await sequelize.sync(options);
        console.log('All models synchronized successfully');
    } catch (error) {
        console.error('Failed to sync database:', error.message);
        throw error;
    }
};

module.exports = {
    sequelize,
    User,
    Journal,
    JournalLevel,
    JournalRatingCache,
    Category,
    JournalCategoryMap,
    Comment,
    CommentLike,
    Favorite,
    Follow,
    Badge,
    UserBadge,
    DatabaseAuditLog,
    Post,
    PostLike,
    PostFavorite,
    PostFollow,
    PostComment,
    PostCommentLike,
    PostReport,
    Manuscript,
    Submission,
    SubmissionStatusHistory,
    Announcement,
    UserAnnouncementRead,
    Notification,
    PostCategory,
    Tag,
    PostTagMap,
    SystemConfig,
    syncDatabase
};
