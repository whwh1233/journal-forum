const { Manuscript, Submission, SubmissionStatusHistory, Journal } = require('../models');
const notificationService = require('../services/notificationService');

// ==================== 稿件 (Manuscript) ====================

// 创建稿件（含第一次投稿和初始状态）
const createManuscript = async (req, res) => {
    try {
        const { title, journalId, journalName, submissionDate, status, note } = req.body;

        if (!title) {
            return res.status(400).json({ message: '稿件标题是必填项' });
        }

        // 1. 创建稿件
        const manuscript = await Manuscript.create({
            userId: req.user.id,
            title,
            currentStatus: status || 'submitted'
        });

        // 2. 如果提供了期刊信息，同时创建第一次投稿
        let submission = null;
        if (journalId || journalName) {
            submission = await Submission.create({
                userId: req.user.id,
                manuscriptId: manuscript.id,
                journalId: journalId || null,
                journalName: journalName || null,
                submissionDate: submissionDate || new Date().toISOString().split('T')[0],
                status: status || 'submitted'
            });

            // 3. 创建初始状态历史
            await SubmissionStatusHistory.create({
                submissionId: submission.id,
                status: status || 'submitted',
                date: submissionDate || new Date().toISOString().split('T')[0],
                note: note || null
            });
        }

        // 返回完整数据
        const result = await Manuscript.findByPk(manuscript.id, {
            include: [{
                model: Submission,
                as: 'submissions',
                include: [
                    { model: Journal, as: 'journal' },
                    { model: SubmissionStatusHistory, as: 'statusHistory', order: [['date', 'ASC']] }
                ]
            }]
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating manuscript:', error);
        res.status(500).json({ message: '创建稿件失败' });
    }
};

// 获取当前用户所有稿件
const getUserManuscripts = async (req, res) => {
    try {
        const manuscripts = await Manuscript.findAll({
            where: { userId: req.user.id },
            order: [['created_at', 'DESC']],
            include: [{
                model: Submission,
                as: 'submissions',
                include: [
                    { model: Journal, as: 'journal' },
                    {
                        model: SubmissionStatusHistory,
                        as: 'statusHistory',
                        order: [['date', 'ASC'], ['created_at', 'ASC']]
                    }
                ],
                order: [['submission_date', 'DESC']]
            }]
        });

        // 手动排序嵌套
        manuscripts.forEach(m => {
            const mJson = m.toJSON();
            if (m.submissions) {
                m.submissions.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate));
                m.submissions.forEach(s => {
                    if (s.statusHistory) {
                        s.statusHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
                    }
                });
            }
        });

        res.json(manuscripts);
    } catch (error) {
        console.error('Error getting manuscripts:', error);
        res.status(500).json({ message: '获取投稿记录失败' });
    }
};

// 获取单个稿件详情
const getManuscriptById = async (req, res) => {
    try {
        const manuscript = await Manuscript.findOne({
            where: { id: req.params.id, userId: req.user.id },
            include: [{
                model: Submission,
                as: 'submissions',
                include: [
                    { model: Journal, as: 'journal' },
                    { model: SubmissionStatusHistory, as: 'statusHistory' }
                ]
            }]
        });

        if (!manuscript) {
            return res.status(404).json({ message: '稿件不存在或无权访问' });
        }

        // 排序
        const result = manuscript.toJSON();
        if (result.submissions) {
            result.submissions.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate));
            result.submissions.forEach(s => {
                if (s.statusHistory) {
                    s.statusHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
                }
            });
        }

        res.json(result);
    } catch (error) {
        console.error('Error getting manuscript:', error);
        res.status(500).json({ message: '获取稿件详情失败' });
    }
};

// 更新稿件基础信息
const updateManuscript = async (req, res) => {
    try {
        const manuscript = await Manuscript.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!manuscript) {
            return res.status(404).json({ message: '稿件不存在或无权访问' });
        }

        const { title, currentStatus } = req.body;
        if (title) manuscript.title = title;
        if (currentStatus) manuscript.currentStatus = currentStatus;
        await manuscript.save();

        res.json(manuscript);
    } catch (error) {
        console.error('Error updating manuscript:', error);
        res.status(500).json({ message: '更新稿件失败' });
    }
};

// 删除稿件（级联删除所有投稿和状态历史）
const deleteManuscript = async (req, res) => {
    try {
        const manuscript = await Manuscript.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!manuscript) {
            return res.status(404).json({ message: '稿件不存在或无权访问' });
        }

        // 先删除所有关联的投稿和状态
        const submissions = await Submission.findAll({ where: { manuscriptId: manuscript.id } });
        for (const sub of submissions) {
            await SubmissionStatusHistory.destroy({ where: { submissionId: sub.id } });
        }
        await Submission.destroy({ where: { manuscriptId: manuscript.id } });
        await manuscript.destroy();

        res.json({ message: '稿件已删除' });
    } catch (error) {
        console.error('Error deleting manuscript:', error);
        res.status(500).json({ message: '删除稿件失败' });
    }
};

// ==================== 投稿 (Submission) ====================

// 为已有稿件添加新的投稿（转投/多投）
const addSubmission = async (req, res) => {
    try {
        const { manuscriptId } = req.params;
        const { journalId, journalName, submissionDate, status, note } = req.body;

        // 验证稿件归属
        const manuscript = await Manuscript.findOne({
            where: { id: manuscriptId, userId: req.user.id }
        });

        if (!manuscript) {
            return res.status(404).json({ message: '稿件不存在或无权访问' });
        }

        // 创建新投稿
        const submission = await Submission.create({
            userId: req.user.id,
            manuscriptId: parseInt(manuscriptId),
            journalId: journalId || null,
            journalName: journalName || null,
            submissionDate: submissionDate || new Date().toISOString().split('T')[0],
            status: status || 'submitted'
        });

        // 创建初始状态历史
        await SubmissionStatusHistory.create({
            submissionId: submission.id,
            status: status || 'submitted',
            date: submissionDate || new Date().toISOString().split('T')[0],
            note: note || null
        });

        // 同步更新稿件的当前状态
        manuscript.currentStatus = status || 'submitted';
        await manuscript.save();

        // 返回完整数据
        const result = await Submission.findByPk(submission.id, {
            include: [
                { model: Journal, as: 'journal' },
                { model: SubmissionStatusHistory, as: 'statusHistory' }
            ]
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error adding submission:', error);
        res.status(500).json({ message: '添加投稿记录失败' });
    }
};

// 更新投稿
const updateSubmission = async (req, res) => {
    try {
        const submission = await Submission.findOne({
            where: { id: req.params.submissionId, userId: req.user.id }
        });

        if (!submission) {
            return res.status(404).json({ message: '投稿记录不存在或无权访问' });
        }

        const { journalId, journalName, submissionDate, status } = req.body;
        if (journalId !== undefined) submission.journalId = journalId;
        if (journalName !== undefined) submission.journalName = journalName;
        if (submissionDate) submission.submissionDate = submissionDate;
        if (status) submission.status = status;
        await submission.save();

        res.json(submission);
    } catch (error) {
        console.error('Error updating submission:', error);
        res.status(500).json({ message: '更新投稿记录失败' });
    }
};

// 删除投稿
const deleteSubmission = async (req, res) => {
    try {
        const submission = await Submission.findOne({
            where: { id: req.params.submissionId, userId: req.user.id }
        });

        if (!submission) {
            return res.status(404).json({ message: '投稿记录不存在或无权访问' });
        }

        await SubmissionStatusHistory.destroy({ where: { submissionId: submission.id } });
        await submission.destroy();

        res.json({ message: '投稿记录已删除' });
    } catch (error) {
        console.error('Error deleting submission:', error);
        res.status(500).json({ message: '删除投稿记录失败' });
    }
};

// ==================== 状态历史 (StatusHistory) ====================

// 追加状态时间轴事件
const addStatusHistory = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { status, date, note } = req.body;

        if (!status || !date) {
            return res.status(400).json({ message: '状态和日期是必填项' });
        }

        // 验证投稿归属
        const submission = await Submission.findOne({
            where: { id: submissionId, userId: req.user.id }
        });

        if (!submission) {
            return res.status(404).json({ message: '投稿记录不存在或无权访问' });
        }

        const history = await SubmissionStatusHistory.create({
            submissionId: parseInt(submissionId),
            status,
            date,
            note: note || null
        });

        // 同步更新投稿的当前状态
        submission.status = status;
        await submission.save();

        // 同步更新稿件的整体状态
        const manuscript = await Manuscript.findOne({
            where: { id: submission.manuscriptId, userId: req.user.id }
        });
        if (manuscript) {
            manuscript.currentStatus = status;
            await manuscript.save();
        }

        // Notify: submission_status
        try {
            await notificationService.create({
                recipientId: submission.userId || req.user.id,
                senderId: null,
                type: 'submission_status',
                entityType: 'submission',
                entityId: submissionId,
                content: {
                    title: `投稿状态已更新为「${status}」`,
                    body: note || '',
                    status: status,
                    submissionTitle: manuscript ? manuscript.title : ''
                }
            });
        } catch (err) {
            console.error('Notification (submission_status) failed:', err.message);
        }

        res.status(201).json(history);
    } catch (error) {
        console.error('Error adding status history:', error);
        res.status(500).json({ message: '添加状态记录失败' });
    }
};

// 删除某条状态历史
const deleteStatusHistory = async (req, res) => {
    try {
        const { historyId } = req.params;

        const history = await SubmissionStatusHistory.findByPk(historyId, {
            include: [{ model: Submission, as: 'submission' }]
        });

        if (!history || !history.submission || history.submission.userId !== req.user.id) {
            return res.status(404).json({ message: '状态记录不存在或无权访问' });
        }

        await history.destroy();
        res.json({ message: '状态记录已删除' });
    } catch (error) {
        console.error('Error deleting status history:', error);
        res.status(500).json({ message: '删除状态记录失败' });
    }
};

module.exports = {
    createManuscript,
    getUserManuscripts,
    getManuscriptById,
    updateManuscript,
    deleteManuscript,
    addSubmission,
    updateSubmission,
    deleteSubmission,
    addStatusHistory,
    deleteStatusHistory
};
