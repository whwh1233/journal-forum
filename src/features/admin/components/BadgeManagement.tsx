import React, { useState, useEffect } from 'react';
import { adminGetAllBadges, grantBadge } from '../../../services/badgeService';
import { adminService } from '../../../services/adminService';
import { Badge, AdminUser } from '../../../types';
import { usePageTitle } from '@/contexts/PageContext';
import { Sparkles, Award, List, CheckCircle, AlertCircle, Info } from 'lucide-react';
import './BadgeManagement.css';

const BadgeManagement: React.FC = () => {
    usePageTitle('荣誉管理');

    const [badges, setBadges] = useState<Badge[]>([]);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 简易发徽章表单状态
    const [selectedBadgeId, setSelectedBadgeId] = useState<number | ''>('');
    const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
    const [actionMessage, setActionMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [badgesData, usersData] = await Promise.all([
                adminGetAllBadges(),
                adminService.getUsers(undefined, 1, 100) // 获取前100个用户供选择
            ]);
            setBadges(badgesData);
            setUsers(usersData.users);
            setError('');
        } catch (err: any) {
            setError('获取数据失败');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGrantBadge = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBadgeId || !selectedUserId) return;

        try {
            setActionMessage({ text: '正在验证并颁发...', type: 'info' });
            await grantBadge(Number(selectedBadgeId), Number(selectedUserId));
            setActionMessage({ text: '荣誉徽章颁发成功！', type: 'success' });

            // 刷新数据以更新徽章的持有者数量
            fetchData();

            // 3秒后清除成功消息
            setTimeout(() => setActionMessage({ text: '', type: '' }), 3000);
        } catch (err: any) {
            setActionMessage({
                text: err.response?.data?.message || '颁发失败，请检查用户是否已拥有该徽章',
                type: 'error'
            });
        }
    };

    if (loading) {
        return (
            <div className="badge-management">
                <div className="page-wrapper">
                    <div className="loading-indicator">
                        <div className="loading-spinner"></div>
                        <p>正在载入全局荣誉数据...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="badge-management">
                <div className="page-wrapper">
                    <div className="admin-error">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="badge-management">
            <div className="page-wrapper">

                <div className="admin-header">
                    <h2><Sparkles size={24} color="var(--indigo-500)" /> 徽章与荣誉总控台</h2>
                    <p>在这里，您可以鸟瞰全站荣誉体系，并向为社区做出杰出贡献的用户手动颁发最高规格的特别徽章。</p>
                </div>

                <div className="grant-badge-card">
                    <h3><Award size={22} color="var(--purple-500)" /> 签发特别荣誉</h3>
                    <form onSubmit={handleGrantBadge} className="grant-form">
                        <div className="form-group">
                            <label>🎖️ 授予荣誉徽章</label>
                            <select
                                value={selectedBadgeId}
                                onChange={(e) => setSelectedBadgeId(e.target.value === '' ? '' : Number(e.target.value))}
                                required
                            >
                                <option value="">-- 请选择要颁发的特殊荣誉 --</option>
                                {badges
                                    .filter(b => b.type === 'manual')
                                    .map(badge => (
                                        <option key={badge.id} value={badge.id}>
                                            {badge.name} ({badge.category})
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>👤 接受荣誉的用户</label>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value === '' ? '' : Number(e.target.value))}
                                required
                            >
                                <option value="">-- 请检索并选择目标用户 --</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                        {user.name || user.email} (ID: {user.id})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button type="submit" className="btn-grant" disabled={!selectedBadgeId || !selectedUserId}>
                            <Sparkles size={18} /> 立即签发
                        </button>
                    </form>

                    {actionMessage.text && (
                        <div className={`action-message ${actionMessage.type}`}>
                            {actionMessage.type === 'success' && <CheckCircle size={20} />}
                            {actionMessage.type === 'error' && <AlertCircle size={20} />}
                            {actionMessage.type === 'info' && <Info size={20} />}
                            {actionMessage.text}
                        </div>
                    )}
                </div>

                <div className="badges-list-card">
                    <h3><List size={20} className="text-gray-500" /> 全站体系数据总览</h3>
                    <div className="badges-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>标识 ID</th>
                                    <th>徽章身份卡</th>
                                    <th>触发类型</th>
                                    <th>硬性条件</th>
                                    <th>全站持有数</th>
                                    <th>系统状态</th>
                                </tr>
                            </thead>
                            <tbody>
                                {badges.map(badge => (
                                    <tr key={badge.id}>
                                        <td className="text-gray-500 font-medium">#{badge.id}</td>
                                        <td>
                                            <div className="badge-name-cell">
                                                <div
                                                    className="badge-icon-wrapper"
                                                    style={{ background: badge.color }}
                                                    title={badge.name}
                                                >
                                                    {badge.icon}
                                                </div>
                                                <div>
                                                    <strong>{badge.name}</strong>
                                                    <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]" title={badge.description}>
                                                        {badge.description}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`type-badge ${badge.type}`}>
                                                {badge.type === 'auto' ? '⚡ 自动触发' : '🎯 手动颁发'}
                                            </span>
                                        </td>
                                        <td>
                                            {badge.triggerCondition ? (
                                                <span className="metric-condition">
                                                    {badge.triggerCondition.metric} ≥ {badge.triggerCondition.threshold}
                                                </span>
                                            ) : (
                                                <span className="empty-condition">无条件限制</span>
                                            )}
                                        </td>
                                        <td className="font-semibold">{badge.holderCount || 0} 位</td>
                                        <td>
                                            <span className={`status-badge ${badge.isActive ? 'active' : 'disabled'}`}>
                                                {badge.isActive ? '✅ 启用中' : '❌ 已停用'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BadgeManagement;
