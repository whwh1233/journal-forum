const { sequelize } = require('../config/database');
const User = require('./User');
const Journal = require('./Journal');
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

// ==================== 关联定义 ====================

// User 1:N Comment
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

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
    syncDatabase
};
