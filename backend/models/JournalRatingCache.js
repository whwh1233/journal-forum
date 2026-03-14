const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JournalRatingCache = sequelize.define('JournalRatingCache', {
  journalId: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    field: 'journal_id'
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 0,
    get() {
      const val = this.getDataValue('rating');
      return val === null ? 0 : parseFloat(val);
    }
  },
  ratingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'rating_count'
  },
  reviewSpeed: {
    type: DataTypes.DECIMAL(2, 1),
    field: 'review_speed',
    get() {
      const val = this.getDataValue('reviewSpeed');
      return val === null ? null : parseFloat(val);
    }
  },
  editorAttitude: {
    type: DataTypes.DECIMAL(2, 1),
    field: 'editor_attitude',
    get() {
      const val = this.getDataValue('editorAttitude');
      return val === null ? null : parseFloat(val);
    }
  },
  acceptDifficulty: {
    type: DataTypes.DECIMAL(2, 1),
    field: 'accept_difficulty',
    get() {
      const val = this.getDataValue('acceptDifficulty');
      return val === null ? null : parseFloat(val);
    }
  },
  reviewQuality: {
    type: DataTypes.DECIMAL(2, 1),
    field: 'review_quality',
    get() {
      const val = this.getDataValue('reviewQuality');
      return val === null ? null : parseFloat(val);
    }
  },
  overallExperience: {
    type: DataTypes.DECIMAL(2, 1),
    field: 'overall_experience',
    get() {
      const val = this.getDataValue('overallExperience');
      return val === null ? null : parseFloat(val);
    }
  },
  hotScore: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'hot_score',
    get() {
      const val = this.getDataValue('hotScore');
      return val === null ? 0 : parseFloat(val);
    }
  },
  allTimeScore: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'all_time_score',
    get() {
      const val = this.getDataValue('allTimeScore');
      return val === null ? 0 : parseFloat(val);
    }
  },
  favoriteCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'favorite_count'
  }
}, {
  tableName: 'journal_rating_cache',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at'
});

module.exports = JournalRatingCache;
