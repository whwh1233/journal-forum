/**
 * 投稿记录测试数据生成脚本
 * 用法: node backend/scripts/seedSubmissions.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { connectDB } = require('../config/database');
const { User, Manuscript, Submission, SubmissionStatusHistory } = require('../models');

const seedSubmissions = async () => {
    try {
        await connectDB();

        // 获取第一个用户
        const user = await User.findOne();
        if (!user) {
            console.error('没有找到用户，请先注册一个用户');
            process.exit(1);
        }
        console.log(`为用户 ${user.name || user.email} (ID: ${user.id}) 创建测试投稿数据...`);

        // ==================== 稿件 1：已录用的论文 ====================
        const m1 = await Manuscript.create({
            userId: user.id,
            title: '基于深度学习的医学影像分割方法研究',
            currentStatus: 'accepted'
        });

        // 第一次投稿（被拒）
        const s1_1 = await Submission.create({
            userId: user.id,
            manuscriptId: m1.id,
            journalName: 'Nature Medicine',
            submissionDate: '2025-06-15',
            status: 'rejected'
        });

        await SubmissionStatusHistory.bulkCreate([
            { submissionId: s1_1.id, status: 'submitted', date: '2025-06-15', note: '初次投稿 Nature Medicine' },
            { submissionId: s1_1.id, status: 'with_editor', date: '2025-06-20', note: '编辑初审中' },
            { submissionId: s1_1.id, status: 'under_review', date: '2025-07-05', note: '送出外审，共3位审稿人' },
            { submissionId: s1_1.id, status: 'rejected', date: '2025-08-10', note: '审稿人认为创新性不足，建议投更专业的AI期刊' },
        ]);

        // 第二次投稿（录用）
        const s1_2 = await Submission.create({
            userId: user.id,
            manuscriptId: m1.id,
            journalName: 'IEEE Transactions on Medical Imaging',
            submissionDate: '2025-08-25',
            status: 'accepted'
        });

        await SubmissionStatusHistory.bulkCreate([
            { submissionId: s1_2.id, status: 'submitted', date: '2025-08-25', note: '转投 IEEE TMI，按审稿意见修改了创新点描述' },
            { submissionId: s1_2.id, status: 'under_review', date: '2025-09-10', note: '进入外审阶段' },
            { submissionId: s1_2.id, status: 'major_revision', date: '2025-10-20', note: '大修，需要补充消融实验和对比方法' },
            { submissionId: s1_2.id, status: 'revision_submitted', date: '2025-11-15', note: '提交修改稿，增加了3组消融实验' },
            { submissionId: s1_2.id, status: 'minor_revision', date: '2025-12-05', note: '小修，需调整图表格式' },
            { submissionId: s1_2.id, status: 'revision_submitted', date: '2025-12-10', note: '提交最终修改稿' },
            { submissionId: s1_2.id, status: 'accepted', date: '2025-12-28', note: '🎉 正式录用！预计2026年3月出版' },
        ]);

        // ==================== 稿件 2：正在审稿中 ====================
        const m2 = await Manuscript.create({
            userId: user.id,
            title: '大语言模型在学术写作辅助中的应用与伦理研究',
            currentStatus: 'under_review'
        });

        const s2 = await Submission.create({
            userId: user.id,
            manuscriptId: m2.id,
            journalName: 'Science',
            submissionDate: '2026-01-10',
            status: 'under_review'
        });

        await SubmissionStatusHistory.bulkCreate([
            { submissionId: s2.id, status: 'submitted', date: '2026-01-10', note: '投稿 Science，尝试冲击顶会' },
            { submissionId: s2.id, status: 'with_editor', date: '2026-01-15', note: '通过编辑初审' },
            { submissionId: s2.id, status: 'under_review', date: '2026-02-01', note: '分配了2位审稿人，等待审稿结果' },
        ]);

        // ==================== 稿件 3：刚投出去的新稿件 ====================
        const m3 = await Manuscript.create({
            userId: user.id,
            title: '基于知识图谱的科研协作网络分析',
            currentStatus: 'submitted'
        });

        const s3 = await Submission.create({
            userId: user.id,
            manuscriptId: m3.id,
            journalName: 'Nature Computational Science',
            submissionDate: '2026-03-01',
            status: 'submitted'
        });

        await SubmissionStatusHistory.bulkCreate([
            { submissionId: s3.id, status: 'submitted', date: '2026-03-01', note: '刚刚投出，希望顺利！🙏' },
        ]);

        console.log('✅ 测试数据创建完成！');
        console.log(`   - 稿件 1: "${m1.title}" (已录用，经历了一次拒稿转投)`);
        console.log(`   - 稿件 2: "${m2.title}" (正在审稿中)`);
        console.log(`   - 稿件 3: "${m3.title}" (刚投出)`);

        process.exit(0);
    } catch (error) {
        console.error('创建测试数据失败:', error);
        process.exit(1);
    }
};

seedSubmissions();
