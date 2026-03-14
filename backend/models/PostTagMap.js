const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostTagMap = sequelize.define('PostTagMap', {
  postId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'post_id'
  },
  tagId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'tag_id'
  }
}, {
  tableName: 'online_post_tag_map',
  updatedAt: false
});

module.exports = PostTagMap;
