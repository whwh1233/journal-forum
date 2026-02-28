import React, { useState, useEffect } from 'react';
import { getAllBadges } from '../../../services/badgeService';
import { useAuth } from '../../../hooks/useAuth';
import { Badge as BadgeType } from '../../../types';
import Badge from '../components/Badge';
import { Trophy, Info, Award, Compass, Star, Activity, User, Briefcase, Zap } from 'lucide-react';
import './BadgeGalleryPage.css';

const ICON_MAP: Record<string, React.ReactNode> = {
    BookOpen: <Briefcase />,
    Bookmark: <Star />,
    Users: <User />,
    Compass: <Compass />,
    Shield: <Award />,
    Award: <Trophy />,
    GraduationCap: <Award />,
    Heart: <Activity />,
    Zap: <Zap />
};

const BadgeGalleryPage: React.FC = () => {
    const [badges, setBadges] = useState<BadgeType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'activity' | 'identity' | 'honor'>('activity');
    const { user } = useAuth();
    const [userBadgeIds, setUserBadgeIds] = useState<number[]>([]);

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                setLoading(true);
                const allBadges = await getAllBadges();
                setBadges(allBadges);

                // If user is logged in, we ideally want to fetch which badges they own
                // Since we don't have a direct "getAllMyBadges" that only returns IDs,
                // we might rely on the badges endpoint or user endpoint.
                // For the gallery, we can just show all badges without lock status if not logged in,
                // or if logged in, we fetch their profile badges to compare.
            } catch (err) {
                setError('无法加载徽章数据');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchBadges();
    }, []);

    const categorizedBadges = {
        activity: badges.filter(b => b.category === 'activity'),
        identity: badges.filter(b => b.category === 'identity'),
        honor: badges.filter(b => b.category === 'honor'),
    };

    if (loading) {
        return <div className="badge-gallery-loading">加载中...</div>;
    }

    if (error) {
        return <div className="badge-gallery-error">{error}</div>;
    }

    return (
        <div className="badge-gallery-page">
            <div className="gallery-header">
                <div className="header-icon">
                    <Trophy size={48} color="var(--primary-color)" />
                </div>
                <h1>徽章陈列馆</h1>
                <p>探索平台所有的荣誉与头衔，了解如何获取它们。</p>
            </div>

            <div className="gallery-tabs">
                <button
                    className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
                    onClick={() => setActiveTab('activity')}
                >
                    活跃徽章
                </button>
                <button
                    className={`tab-btn ${activeTab === 'identity' ? 'active' : ''}`}
                    onClick={() => setActiveTab('identity')}
                >
                    身份徽章
                </button>
                <button
                    className={`tab-btn ${activeTab === 'honor' ? 'active' : ''}`}
                    onClick={() => setActiveTab('honor')}
                >
                    荣誉徽章
                </button>
            </div>

            <div className="gallery-content">
                <div className="badge-grid">
                    {categorizedBadges[activeTab].map(badge => (
                        <div key={badge.id} className="gallery-card">
                            <div className="card-badge">
                                <Badge badge={badge} size="lg" />
                            </div>
                            <div className="card-info">
                                <h3 style={{ color: badge.color }}>{badge.name}</h3>
                                <p className="description">{badge.description}</p>
                                <div className="trigger-info">
                                    <Info size={14} />
                                    <span>
                                        {badge.type === 'auto'
                                            ? '达成条件后自动获得'
                                            : '由管理员手动授予'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {categorizedBadges[activeTab].length === 0 && (
                    <div className="empty-state">
                        暂无该类别的徽章
                    </div>
                )}
            </div>
        </div>
    );
};

export default BadgeGalleryPage;
