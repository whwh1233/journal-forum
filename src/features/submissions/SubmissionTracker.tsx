import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getUserManuscripts, createManuscript, deleteManuscript, addSubmission, deleteSubmission, addStatusHistory } from '../../services/submissionService';
import type { Manuscript, SubmissionRecord, SubmissionStatusHistory } from '../../types';
import { SUBMISSION_STATUS_OPTIONS, getStatusLabel, getStatusColor } from '../../types';
import JournalPicker from '../../components/common/JournalPicker';
import JournalInfoCard from '../../components/common/JournalInfoCard';
import type { JournalSearchResult } from '../../services/journalSearchService';
import { getJournalById } from '../../services/journalSearchService';
import { toggleFavorite } from '../../services/favoriteService';
import './SubmissionTracker.css';

// ==================== 主组件 ====================
const SubmissionTracker: React.FC = () => {
    const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [searchParams, setSearchParams] = useSearchParams();

    // 弹窗状态
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddSubmissionModal, setShowAddSubmissionModal] = useState<number | null>(null); // manuscriptId
    const [showAddStatusModal, setShowAddStatusModal] = useState<number | null>(null); // submissionId
    const [prefilledJournal, setPrefilledJournal] = useState<JournalSearchResult | null>(null);

    const loadData = useCallback(async () => {
        try {
            const data = await getUserManuscripts();
            setManuscripts(data);
        } catch (error) {
            console.error('Error loading manuscripts:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // 处理 URL 参数（从期刊详情页跳转过来）
    useEffect(() => {
        const journalIdParam = searchParams.get('journalId');
        if (journalIdParam) {
            getJournalById(journalIdParam)
                .then(journal => {
                    setPrefilledJournal(journal);
                    setShowCreateModal(true);
                })
                .catch(err => {
                    console.error('Error loading journal:', err);
                    // 清除无效的 URL 参数
                    setSearchParams({}, { replace: true });
                });
        }
    }, [searchParams, setSearchParams]);

    const toggleExpand = (id: number) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleDeleteManuscript = async (id: number) => {
        if (!window.confirm('确定要删除这篇稿件及其所有投稿记录吗？')) return;
        try {
            await deleteManuscript(id);
            await loadData();
        } catch (error) {
            console.error('Error deleting manuscript:', error);
        }
    };

    const handleDeleteSubmission = async (submissionId: number) => {
        if (!window.confirm('确定要删除这条投稿记录吗？')) return;
        try {
            await deleteSubmission(submissionId);
            await loadData();
        } catch (error) {
            console.error('Error deleting submission:', error);
        }
    };

    const handleCreateManuscript = async (data: any) => {
        try {
            const result = await createManuscript(data);
            setShowCreateModal(false);
            setPrefilledJournal(null); // 清除预填充数据
            setSearchParams({}, { replace: true }); // 清除 URL 参数
            await loadData();
            // 自动展开新创建的稿件
            setExpandedIds(prev => new Set(prev).add(result.id));
        } catch (error) {
            console.error('Error creating manuscript:', error);
        }
    };

    const handleAddSubmission = async (manuscriptId: number, data: any) => {
        try {
            await addSubmission(manuscriptId, data);
            setShowAddSubmissionModal(null);
            await loadData();
        } catch (error) {
            console.error('Error adding submission:', error);
        }
    };

    const handleAddStatus = async (submissionId: number, data: any) => {
        try {
            await addStatusHistory(submissionId, data);
            setShowAddStatusModal(null);
            await loadData();
        } catch (error) {
            console.error('Error adding status:', error);
        }
    };

    // 收藏切换（乐观 UI 更新）
    const handleFavoriteToggle = async (journalId: number) => {
        // 1. 找到当前收藏状态
        let currentFavorited = false;
        manuscripts.forEach(m => {
            m.submissions?.forEach(s => {
                if (s.journal?.id === journalId) {
                    currentFavorited = s.journal.isFavorited || false;
                }
            });
        });

        // 2. 乐观更新 UI
        setManuscripts(prev => prev.map(m => ({
            ...m,
            submissions: m.submissions?.map(s =>
                s.journal?.id === journalId
                    ? { ...s, journal: { ...s.journal, isFavorited: !currentFavorited } }
                    : s
            )
        })));

        try {
            // 3. 调用 API
            await toggleFavorite(journalId);
        } catch (err) {
            // 4. 失败回滚
            console.error('Error toggling favorite:', err);
            setManuscripts(prev => prev.map(m => ({
                ...m,
                submissions: m.submissions?.map(s =>
                    s.journal?.id === journalId
                        ? { ...s, journal: { ...s.journal, isFavorited: currentFavorited } }
                        : s
                )
            })));
        }
    };

    if (loading) {
        return (
            <div className="submission-section">
                <div className="manuscript-list-empty">加载中...</div>
            </div>
        );
    }

    return (
        <div className="submission-section">
            <div className="submission-section-header">
                <h2>
                    <span className="section-icon">📋</span>
                    我的投稿记录
                </h2>
                <button className="btn-add-manuscript" onClick={() => setShowCreateModal(true)}>
                    ＋ 新增稿件
                </button>
            </div>

            {manuscripts.length === 0 ? (
                <div className="manuscript-list-empty">
                    <div className="empty-icon">📝</div>
                    <p>还没有投稿记录，点击「新增稿件」开始记录你的投稿之旅吧！</p>
                </div>
            ) : (
                manuscripts.map(m => (
                    <ManuscriptCard
                        key={m.id}
                        manuscript={m}
                        expanded={expandedIds.has(m.id)}
                        onToggle={() => toggleExpand(m.id)}
                        onDelete={() => handleDeleteManuscript(m.id)}
                        onAddSubmission={() => setShowAddSubmissionModal(m.id)}
                        onDeleteSubmission={handleDeleteSubmission}
                        onAddStatus={(submissionId) => setShowAddStatusModal(submissionId)}
                        onFavoriteToggle={handleFavoriteToggle}
                    />
                ))
            )}

            {/* 弹窗 */}
            {showCreateModal && (
                <CreateManuscriptModal
                    onClose={() => {
                        setShowCreateModal(false);
                        setPrefilledJournal(null);
                        setSearchParams({}, { replace: true });
                    }}
                    onSubmit={handleCreateManuscript}
                    prefilledJournal={prefilledJournal}
                />
            )}

            {showAddSubmissionModal !== null && (
                <AddSubmissionModal
                    manuscriptId={showAddSubmissionModal}
                    onClose={() => setShowAddSubmissionModal(null)}
                    onSubmit={(data) => handleAddSubmission(showAddSubmissionModal, data)}
                />
            )}

            {showAddStatusModal !== null && (
                <AddStatusModal
                    submissionId={showAddStatusModal}
                    onClose={() => setShowAddStatusModal(null)}
                    onSubmit={(data) => handleAddStatus(showAddStatusModal, data)}
                />
            )}
        </div>
    );
};

// ==================== 稿件卡片 ====================
interface ManuscriptCardProps {
    manuscript: Manuscript;
    expanded: boolean;
    onToggle: () => void;
    onDelete: () => void;
    onAddSubmission: () => void;
    onDeleteSubmission: (id: number) => void;
    onAddStatus: (submissionId: number) => void;
    onFavoriteToggle: (journalId: number) => void;
}

const ManuscriptCard: React.FC<ManuscriptCardProps> = ({
    manuscript, expanded, onToggle, onDelete, onAddSubmission, onDeleteSubmission, onAddStatus, onFavoriteToggle
}) => {
    const submissionCount = manuscript.submissions?.length || 0;
    const statusColor = getStatusColor(manuscript.currentStatus);

    return (
        <div className="manuscript-card">
            <div className="manuscript-card-header" onClick={onToggle}>
                <div className="manuscript-card-left">
                    <span className={`manuscript-expand-icon ${expanded ? 'expanded' : ''}`}>▶</span>
                    <span className="manuscript-title">{manuscript.title}</span>
                </div>
                <div className="manuscript-card-right">
                    <span className="manuscript-status-badge" style={{ background: statusColor }}>
                        {getStatusLabel(manuscript.currentStatus)}
                    </span>
                    <span className="manuscript-submission-count">
                        {submissionCount} 次投稿
                    </span>
                    <div className="manuscript-actions" onClick={(e) => e.stopPropagation()}>
                        <button title="删除稿件" className="btn-delete" onClick={onDelete}>🗑️</button>
                    </div>
                </div>
            </div>

            {expanded && (
                <div className="manuscript-body">
                    <div className="manuscript-body-actions">
                        <button className="btn-add-submission" onClick={onAddSubmission}>
                            ＋ 转投其他期刊
                        </button>
                    </div>

                    {manuscript.submissions && manuscript.submissions.length > 0 ? (
                        manuscript.submissions.map(sub => (
                            <SubmissionItem
                                key={sub.id}
                                submission={sub}
                                onDelete={() => onDeleteSubmission(sub.id)}
                                onAddStatus={() => onAddStatus(sub.id)}
                                onFavoriteToggle={onFavoriteToggle}
                            />
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-4)' }}>
                            暂无投稿记录，点击"转投其他期刊"添加第一个投稿
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ==================== 单次投稿 ====================
interface SubmissionItemProps {
    submission: SubmissionRecord;
    onDelete: () => void;
    onAddStatus: () => void;
    onFavoriteToggle: (journalId: number) => void;
}

const SubmissionItem: React.FC<SubmissionItemProps> = ({ submission, onDelete, onAddStatus, onFavoriteToggle }) => {
    const journalDisplayName = submission.journal?.title || submission.journalName || '未知期刊';
    const statusColor = getStatusColor(submission.status);

    return (
        <div className="submission-item">
            <div className="submission-item-header">
                <div className="submission-journal-info">
                    <span className="submission-journal-name">📰 {journalDisplayName}</span>
                    <span className="manuscript-status-badge" style={{ background: statusColor, fontSize: '0.72rem' }}>
                        {getStatusLabel(submission.status)}
                    </span>
                </div>
                <div className="submission-item-actions">
                    <button title="删除此投稿" onClick={onDelete}>🗑️</button>
                </div>
            </div>

            {/* 期刊信息卡片或关联按钮 */}
            {submission.journal ? (
                <div className="submission-journal-card">
                    <JournalInfoCard
                        journal={submission.journal}
                        onFavoriteToggle={() => onFavoriteToggle(submission.journal!.id)}
                    />
                </div>
            ) : submission.journalName ? (
                <div className="unlinked-journal">
                    <span>📌 期刊：{submission.journalName}</span>
                    <button className="btn-link-journal">🔗 关联到期刊库</button>
                </div>
            ) : null}

            {/* 时间轴 */}
            <div className="submission-timeline">
                {submission.statusHistory && submission.statusHistory.length > 0 ? (
                    submission.statusHistory.map((h, idx) => (
                        <TimelineItem
                            key={h.id}
                            history={h}
                            isLatest={idx === submission.statusHistory!.length - 1}
                        />
                    ))
                ) : (
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>暂无状态记录</div>
                )}
            </div>

            <button className="timeline-add-btn" onClick={onAddStatus}>
                ＋ 添加状态更新
            </button>
        </div>
    );
};

// ==================== 时间轴单项 ====================
interface TimelineItemProps {
    history: SubmissionStatusHistory;
    isLatest: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ history, isLatest }) => {
    const statusColor = getStatusColor(history.status);

    return (
        <div className="timeline-item">
            <div className={`timeline-dot ${isLatest ? 'latest' : ''}`} style={{ color: statusColor }} />
            <div className="timeline-content">
                <div className="timeline-info">
                    <div className="timeline-status" style={{ color: statusColor }}>
                        {getStatusLabel(history.status)}
                    </div>
                    <div className="timeline-date">{history.date}</div>
                    {history.note && (
                        <div className="timeline-note">{history.note}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ==================== 新增稿件弹窗 ====================
interface CreateManuscriptModalProps {
    onClose: () => void;
    onSubmit: (data: any) => void;
    prefilledJournal?: JournalSearchResult | null;
}

const CreateManuscriptModal: React.FC<CreateManuscriptModalProps> = ({ onClose, onSubmit, prefilledJournal }) => {
    const [title, setTitle] = useState('');
    const [selectedJournal, setSelectedJournal] = useState<JournalSearchResult | null>(null);
    const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState('submitted');
    const [customStatus, setCustomStatus] = useState('');
    const [note, setNote] = useState('');
    const [useCustomStatus, setUseCustomStatus] = useState(false);

    // 处理预填充期刊
    useEffect(() => {
        if (prefilledJournal) {
            setSelectedJournal(prefilledJournal);
        }
    }, [prefilledJournal]);

    const handleSubmit = () => {
        if (!title.trim()) return;
        onSubmit({
            title: title.trim(),
            journalId: selectedJournal?.id,
            journalName: selectedJournal?.title || undefined,
            submissionDate,
            status: useCustomStatus ? customStatus.trim() : status,
            note: note.trim() || undefined
        });
    };

    return (
        <div className="submission-modal-overlay" onClick={onClose}>
            <div className="submission-modal" onClick={e => e.stopPropagation()}>
                <div className="submission-modal-header">
                    <h3>📝 新增稿件</h3>
                    <button className="submission-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="submission-modal-body">
                    <div className="submission-form-group">
                        <label>稿件标题 *</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="输入你的论文标题" />
                    </div>
                    <div className="submission-form-group">
                        <label>投稿期刊</label>
                        <JournalPicker
                            value={selectedJournal}
                            onChange={setSelectedJournal}
                            placeholder="搜索期刊名称或 ISSN"
                        />
                    </div>
                    <div className="submission-form-group">
                        <label>投稿日期</label>
                        <input type="date" value={submissionDate} onChange={e => setSubmissionDate(e.target.value)} />
                    </div>
                    <div className="submission-form-group">
                        <label>当前状态</label>
                        <div className="status-input-row">
                            {useCustomStatus ? (
                                <input type="text" value={customStatus} onChange={e => setCustomStatus(e.target.value)} placeholder="输入自定义状态" />
                            ) : (
                                <select value={status} onChange={e => setStatus(e.target.value)}>
                                    {SUBMISSION_STATUS_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            )}
                            <button
                                type="button"
                                className="btn-modal-cancel"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                onClick={() => setUseCustomStatus(!useCustomStatus)}
                            >
                                {useCustomStatus ? '选择预设' : '自定义'}
                            </button>
                        </div>
                    </div>
                    <div className="submission-form-group">
                        <label>备注</label>
                        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="可选，记录一些备忘信息" rows={2} />
                    </div>
                </div>
                <div className="submission-modal-footer">
                    <button className="btn-modal-cancel" onClick={onClose}>取消</button>
                    <button className="btn-modal-submit" onClick={handleSubmit} disabled={!title.trim()}>
                        创建稿件
                    </button>
                </div>
            </div>
        </div>
    );
};

// ==================== 添加投稿弹窗（转投） ====================
interface AddSubmissionModalProps {
    manuscriptId: number;
    onClose: () => void;
    onSubmit: (data: any) => void;
}

const AddSubmissionModal: React.FC<AddSubmissionModalProps> = ({ onClose, onSubmit }) => {
    const [selectedJournal, setSelectedJournal] = useState<JournalSearchResult | null>(null);
    const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState('submitted');
    const [customStatus, setCustomStatus] = useState('');
    const [note, setNote] = useState('');
    const [useCustomStatus, setUseCustomStatus] = useState(false);

    const handleSubmit = () => {
        onSubmit({
            journalId: selectedJournal?.id,
            journalName: selectedJournal?.title || undefined,
            submissionDate,
            status: useCustomStatus ? customStatus.trim() : status,
            note: note.trim() || undefined
        });
    };

    return (
        <div className="submission-modal-overlay" onClick={onClose}>
            <div className="submission-modal" onClick={e => e.stopPropagation()}>
                <div className="submission-modal-header">
                    <h3>📰 转投其他期刊</h3>
                    <button className="submission-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="submission-modal-body">
                    <div className="submission-form-group">
                        <label>目标期刊</label>
                        <JournalPicker
                            value={selectedJournal}
                            onChange={setSelectedJournal}
                            placeholder="搜索期刊名称或 ISSN"
                        />
                    </div>
                    <div className="submission-form-group">
                        <label>投稿日期</label>
                        <input type="date" value={submissionDate} onChange={e => setSubmissionDate(e.target.value)} />
                    </div>
                    <div className="submission-form-group">
                        <label>初始状态</label>
                        <div className="status-input-row">
                            {useCustomStatus ? (
                                <input type="text" value={customStatus} onChange={e => setCustomStatus(e.target.value)} placeholder="输入自定义状态" />
                            ) : (
                                <select value={status} onChange={e => setStatus(e.target.value)}>
                                    {SUBMISSION_STATUS_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            )}
                            <button
                                type="button"
                                className="btn-modal-cancel"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                onClick={() => setUseCustomStatus(!useCustomStatus)}
                            >
                                {useCustomStatus ? '选择预设' : '自定义'}
                            </button>
                        </div>
                    </div>
                    <div className="submission-form-group">
                        <label>备注</label>
                        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="可选" rows={2} />
                    </div>
                </div>
                <div className="submission-modal-footer">
                    <button className="btn-modal-cancel" onClick={onClose}>取消</button>
                    <button className="btn-modal-submit" onClick={handleSubmit}>添加投稿</button>
                </div>
            </div>
        </div>
    );
};

// ==================== 添加状态更新弹窗 ====================
interface AddStatusModalProps {
    submissionId: number;
    onClose: () => void;
    onSubmit: (data: any) => void;
}

const AddStatusModal: React.FC<AddStatusModalProps> = ({ onClose, onSubmit }) => {
    const [status, setStatus] = useState('');
    const [customStatus, setCustomStatus] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');
    const [useCustomStatus, setUseCustomStatus] = useState(false);

    const handleSubmit = () => {
        const finalStatus = useCustomStatus ? customStatus.trim() : status;
        if (!finalStatus || !date) return;
        onSubmit({ status: finalStatus, date, note: note.trim() || undefined });
    };

    const isValid = (useCustomStatus ? customStatus.trim() : status) && date;

    return (
        <div className="submission-modal-overlay" onClick={onClose}>
            <div className="submission-modal" onClick={e => e.stopPropagation()}>
                <div className="submission-modal-header">
                    <h3>⏱️ 添加状态更新</h3>
                    <button className="submission-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="submission-modal-body">
                    <div className="submission-form-group">
                        <label>新状态 *</label>
                        <div className="status-input-row">
                            {useCustomStatus ? (
                                <input type="text" value={customStatus} onChange={e => setCustomStatus(e.target.value)} placeholder="输入自定义状态" />
                            ) : (
                                <select value={status} onChange={e => setStatus(e.target.value)}>
                                    <option value="">请选择状态</option>
                                    {SUBMISSION_STATUS_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            )}
                            <button
                                type="button"
                                className="btn-modal-cancel"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                onClick={() => setUseCustomStatus(!useCustomStatus)}
                            >
                                {useCustomStatus ? '选择预设' : '自定义'}
                            </button>
                        </div>
                    </div>
                    <div className="submission-form-group">
                        <label>日期 *</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div className="submission-form-group">
                        <label>备注</label>
                        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="可选，例如审稿意见、修改建议等" rows={3} />
                    </div>
                </div>
                <div className="submission-modal-footer">
                    <button className="btn-modal-cancel" onClick={onClose}>取消</button>
                    <button className="btn-modal-submit" onClick={handleSubmit} disabled={!isValid}>添加状态</button>
                </div>
            </div>
        </div>
    );
};

export default SubmissionTracker;
