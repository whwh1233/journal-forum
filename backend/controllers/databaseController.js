const { sequelize, DatabaseAuditLog } = require('../models');
const { QueryTypes } = require('sequelize');

/**
 * 获取所有表列表及记录数
 */
const getTables = async (req, res) => {
  try {
    const dbName = sequelize.config.database;

    const tables = await sequelize.query(`
      SELECT
        TABLE_NAME as tableName,
        TABLE_ROWS as rowCount,
        DATA_LENGTH as dataLength,
        CREATE_TIME as createdAt,
        UPDATE_TIME as updatedAt,
        TABLE_COMMENT as comment
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = :dbName
      ORDER BY TABLE_NAME
    `, {
      replacements: { dbName },
      type: QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: tables
    });
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({
      success: false,
      message: '获取表列表失败',
      error: error.message
    });
  }
};

/**
 * 获取表结构
 */
const getTableStructure = async (req, res) => {
  try {
    const { tableName } = req.params;
    const dbName = sequelize.config.database;

    // 获取列信息
    const columns = await sequelize.query(`
      SELECT
        COLUMN_NAME as columnName,
        COLUMN_TYPE as columnType,
        IS_NULLABLE as isNullable,
        COLUMN_KEY as columnKey,
        COLUMN_DEFAULT as defaultValue,
        EXTRA as extra,
        COLUMN_COMMENT as comment
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = :dbName AND TABLE_NAME = :tableName
      ORDER BY ORDINAL_POSITION
    `, {
      replacements: { dbName, tableName },
      type: QueryTypes.SELECT
    });

    // 获取索引信息
    const indexes = await sequelize.query(`
      SHOW INDEX FROM \`${tableName}\`
    `, { type: QueryTypes.SELECT });

    res.json({
      success: true,
      data: {
        columns,
        indexes
      }
    });
  } catch (error) {
    console.error('Get table structure error:', error);
    res.status(500).json({
      success: false,
      message: '获取表结构失败',
      error: error.message
    });
  }
};

/**
 * 获取表数据（分页、搜索、排序）
 */
const getTableData = async (req, res) => {
  try {
    const { tableName } = req.params;
    const {
      page = 1,
      pageSize = 20,
      sortField,
      sortOrder = 'ASC',
      search,
      searchField
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // 构建查询
    let whereClause = '';
    const replacements = {};

    if (search && searchField) {
      whereClause = `WHERE \`${searchField}\` LIKE :search`;
      replacements.search = `%${search}%`;
    }

    let orderClause = '';
    if (sortField) {
      const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      orderClause = `ORDER BY \`${sortField}\` ${order}`;
    }

    // 获取总数
    const [countResult] = await sequelize.query(
      `SELECT COUNT(*) as total FROM \`${tableName}\` ${whereClause}`,
      { replacements, type: QueryTypes.SELECT }
    );

    // 获取数据
    const rows = await sequelize.query(
      `SELECT * FROM \`${tableName}\` ${whereClause} ${orderClause} LIMIT :limit OFFSET :offset`,
      {
        replacements: { ...replacements, limit, offset },
        type: QueryTypes.SELECT
      }
    );

    // 获取主键列名
    const dbName = sequelize.config.database;
    const [pkInfo] = await sequelize.query(`
      SELECT COLUMN_NAME as columnName
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = :dbName
        AND TABLE_NAME = :tableName
        AND COLUMN_KEY = 'PRI'
    `, {
      replacements: { dbName, tableName },
      type: QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        rows,
        total: countResult.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        primaryKey: pkInfo?.columnName || 'id'
      }
    });
  } catch (error) {
    console.error('Get table data error:', error);
    res.status(500).json({
      success: false,
      message: '获取表数据失败',
      error: error.message
    });
  }
};

/**
 * 更新单行数据
 */
const updateRow = async (req, res) => {
  try {
    const { tableName, rowId } = req.params;
    const { data, primaryKey = 'id' } = req.body;

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有要更新的数据'
      });
    }

    // 获取旧数据
    const [oldRow] = await sequelize.query(
      `SELECT * FROM \`${tableName}\` WHERE \`${primaryKey}\` = :rowId`,
      { replacements: { rowId }, type: QueryTypes.SELECT }
    );

    if (!oldRow) {
      return res.status(404).json({
        success: false,
        message: '记录不存在'
      });
    }

    // 构建 SET 子句
    const setClauses = [];
    const replacements = { rowId };

    Object.entries(data).forEach(([key, value], index) => {
      setClauses.push(`\`${key}\` = :val${index}`);
      replacements[`val${index}`] = value;
    });

    // 执行更新
    await sequelize.query(
      `UPDATE \`${tableName}\` SET ${setClauses.join(', ')} WHERE \`${primaryKey}\` = :rowId`,
      { replacements, type: QueryTypes.UPDATE }
    );

    // 获取新数据
    const [newRow] = await sequelize.query(
      `SELECT * FROM \`${tableName}\` WHERE \`${primaryKey}\` = :rowId`,
      { replacements: { rowId }, type: QueryTypes.SELECT }
    );

    // 记录审计日志
    await DatabaseAuditLog.create({
      tableName,
      operation: 'UPDATE',
      rowId: String(rowId),
      oldData: oldRow,
      newData: newRow,
      operatorId: req.user.id,
      operatorEmail: req.user.email,
      ipAddress: req.ip || req.connection?.remoteAddress
    });

    res.json({
      success: true,
      message: '更新成功',
      data: newRow
    });
  } catch (error) {
    console.error('Update row error:', error);
    res.status(500).json({
      success: false,
      message: '更新失败',
      error: error.message
    });
  }
};

/**
 * 删除单行数据
 */
const deleteRow = async (req, res) => {
  try {
    const { tableName, rowId } = req.params;
    const { primaryKey = 'id' } = req.body;

    // 获取旧数据
    const [oldRow] = await sequelize.query(
      `SELECT * FROM \`${tableName}\` WHERE \`${primaryKey}\` = :rowId`,
      { replacements: { rowId }, type: QueryTypes.SELECT }
    );

    if (!oldRow) {
      return res.status(404).json({
        success: false,
        message: '记录不存在'
      });
    }

    // 执行删除
    await sequelize.query(
      `DELETE FROM \`${tableName}\` WHERE \`${primaryKey}\` = :rowId`,
      { replacements: { rowId }, type: QueryTypes.DELETE }
    );

    // 记录审计日志
    await DatabaseAuditLog.create({
      tableName,
      operation: 'DELETE',
      rowId: String(rowId),
      oldData: oldRow,
      newData: null,
      operatorId: req.user.id,
      operatorEmail: req.user.email,
      ipAddress: req.ip || req.connection?.remoteAddress
    });

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('Delete row error:', error);
    res.status(500).json({
      success: false,
      message: '删除失败',
      error: error.message
    });
  }
};

/**
 * 获取审计日志
 */
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, pageSize = 50, tableName } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const where = tableName ? { tableName } : {};

    const { count, rows } = await DatabaseAuditLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      data: {
        logs: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: '获取审计日志失败',
      error: error.message
    });
  }
};

module.exports = {
  getTables,
  getTableStructure,
  getTableData,
  updateRow,
  deleteRow,
  getAuditLogs
};
