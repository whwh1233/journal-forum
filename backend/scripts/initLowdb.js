const { connectDB, getDB } = require('../config/databaseLowdb');

// 示例期刊数据
const sampleJournals = [
  {
    id: 1,
    title: "计算机科学学报",
    issn: "1000-1234",
    category: "computer-science",
    rating: 4.5,
    description: "《计算机科学学报》是中国计算机学会主办的学术期刊，主要刊登计算机科学领域的前沿研究成果，包括人工智能、机器学习、大数据分析等方向。",
    reviews: [
      { author: "张教授", rating: 5, content: "该期刊在人工智能领域具有很高的学术影响力，审稿严谨，发表的文章质量很高。", createdAt: new Date().toISOString() },
      { author: "李博士", rating: 4, content: "投稿周期相对较长，但编辑和审稿人的专业水平很高，对文章质量提升有很大帮助。", createdAt: new Date().toISOString() }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "生物医学研究",
    issn: "2000-5678",
    category: "biology",
    rating: 4.2,
    description: "《生物医学研究》专注于分子生物学、细胞生物学和遗传学等领域的原创性研究，是生物医学领域的重要学术平台。",
    reviews: [
      { author: "王研究员", rating: 4, content: "期刊的国际影响力不断提升，审稿流程规范，发表周期合理。", createdAt: new Date().toISOString() },
      { author: "陈博士", rating: 4, content: "实验数据要求严格，但对提升研究质量很有帮助。", createdAt: new Date().toISOString() }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    title: "物理学进展",
    issn: "3000-9012",
    category: "physics",
    rating: 4.8,
    description: "《物理学进展》涵盖理论物理、实验物理、凝聚态物理等多个分支，致力于推动物理学基础研究和应用研究的发展。",
    reviews: [
      { author: "刘院士", rating: 5, content: "国内物理学领域的顶级期刊，发表了许多重要的原创性成果。", createdAt: new Date().toISOString() },
      { author: "赵教授", rating: 5, content: "国际化程度高，与国际知名物理学期刊保持良好合作关系。", createdAt: new Date().toISOString() }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 4,
    title: "化学学报",
    issn: "4000-3456",
    category: "chemistry",
    rating: 4.0,
    description: "《化学学报》是中国化学会主办的综合性化学学术期刊，涵盖有机化学、无机化学、分析化学、物理化学等各个分支。",
    reviews: [
      { author: "孙教授", rating: 4, content: "期刊历史悠久，在化学界享有很高的声誉，审稿标准严格。", createdAt: new Date().toISOString() },
      { author: "周博士", rating: 4, content: "发表的文章质量稳定，是化学领域研究人员的重要参考。", createdAt: new Date().toISOString() }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 5,
    title: "数学年刊",
    issn: "5000-7890",
    category: "mathematics",
    rating: 4.6,
    description: "《数学年刊》专注于纯数学和应用数学的前沿研究，包括代数、几何、分析、概率统计等方向，是数学界的重要学术期刊。",
    reviews: [
      { author: "吴教授", rating: 5, content: "数学领域的权威期刊，发表了许多具有重要影响的理论成果。", createdAt: new Date().toISOString() },
      { author: "郑博士", rating: 4, content: "审稿过程非常严格，但对数学理论的严谨性要求很高。", createdAt: new Date().toISOString() }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 6,
    title: "临床医学杂志",
    issn: "6000-2345",
    category: "medicine",
    rating: 4.3,
    description: "《临床医学杂志》专注于临床医学研究，包括内科、外科、妇产科、儿科等各个专科，致力于推动临床医学的发展和进步。",
    reviews: [
      { author: "林主任医师", rating: 4, content: "期刊内容贴近临床实际，对临床医生有很好的指导意义。", createdAt: new Date().toISOString() },
      { author: "黄教授", rating: 5, content: "临床研究设计严谨，数据分析规范，是临床医学研究的重要平台。", createdAt: new Date().toISOString() }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 7,
    title: "人工智能与机器学习",
    issn: "7000-6789",
    category: "computer-science",
    rating: 4.7,
    description: "《人工智能与机器学习》专注于AI和ML领域的最新研究进展，包括深度学习、强化学习、自然语言处理等方向。",
    reviews: [
      { author: "杨教授", rating: 5, content: "该期刊紧跟AI技术前沿，发表了许多创新性的研究成果。", createdAt: new Date().toISOString() },
      { author: "徐博士", rating: 4, content: "国际影响力强，与顶级AI会议保持良好合作关系。", createdAt: new Date().toISOString() }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 8,
    title: "环境科学学报",
    issn: "8000-1234",
    category: "biology",
    rating: 4.1,
    description: "《环境科学学报》关注环境科学与工程领域的研究，包括环境污染控制、生态修复、可持续发展等方向。",
    reviews: [
      { author: "郭研究员", rating: 4, content: "期刊关注环境问题的实际解决方案，具有很强的应用价值。", createdAt: new Date().toISOString() },
      { author: "何博士", rating: 4, content: "跨学科特色明显，促进了环境科学与其他学科的交叉融合。", createdAt: new Date().toISOString() }
    ],
    createdAt: new Date().toISOString()
  }
];

// 初始化数据库
const initDatabase = async () => {
  try {
    // 连接数据库
    await connectDB();
    const db = getDB();

    // 清空现有数据并插入示例数据
    db.data.journals = sampleJournals;
    db.data.users = [];

    // 保存到文件
    await db.write();

    console.log(`${sampleJournals.length} sample journals inserted successfully`);
    console.log('Database initialization completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

// 执行初始化
initDatabase();
