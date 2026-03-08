-- 期刊分类筛选功能 - 数据库表创建脚本
-- 执行方式: mysql -u root -p journal_forum < createCategoryTables.sql

-- 1. 分类字典表
CREATE TABLE IF NOT EXISTS `online_categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
  `level` INT NOT NULL DEFAULT 1 COMMENT '层级：1=大类, 2=子类',
  `parent_id` INT DEFAULT NULL COMMENT '父类ID，二级分类指向一级分类',
  PRIMARY KEY (`id`),
  KEY `idx_parent` (`parent_id`),
  KEY `idx_level` (`level`),
  CONSTRAINT `fk_category_parent` FOREIGN KEY (`parent_id`)
    REFERENCES `online_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='期刊分类字典表';

-- 2. 期刊-分类映射表
CREATE TABLE IF NOT EXISTS `online_journal_category_map` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `journal_id` VARCHAR(50) NOT NULL COMMENT '期刊ID',
  `category_id` INT NOT NULL COMMENT '分类ID（二级分类）',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_journal_category` (`journal_id`, `category_id`),
  KEY `idx_journal` (`journal_id`),
  KEY `idx_category` (`category_id`),
  CONSTRAINT `fk_map_category` FOREIGN KEY (`category_id`)
    REFERENCES `online_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='期刊-分类映射表';

-- 注意: online_journal_category_map.journal_id 暂不添加外键约束
-- 因为期刊数据可能从外部导入，ID 格式灵活
