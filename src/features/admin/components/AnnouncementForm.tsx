import React, { useState, useEffect } from 'react';
import { usePageTitle } from '@/contexts/PageContext';
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Edit3,
  Info,
  AlertTriangle,
  Megaphone,
  CheckCircle,
  XCircle,
  Loader,
  Users,
  User,
  Globe,
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import {
  adminCreateAnnouncement,
  adminUpdateAnnouncement,
  adminPublishAnnouncement,
} from '@/features/announcements/services/announcementService';
import { adminService } from '@/services/adminService';
import type {
  Announcement,
  AnnouncementType,
  TargetType,
  ColorScheme,
  CreateAnnouncementData,
} from '@/features/announcements/types/announcement';
import './AnnouncementManagement.css';

interface AnnouncementFormProps {
  announcement: Announcement | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({
  announcement,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!announcement;
  usePageTitle(isEditing ? '编辑公告' : '新建公告');

  // 表单状态
  const [title, setTitle] = useState(announcement?.title || '');
  const [content, setContent] = useState(announcement?.content || '');
  const [type, setType] = useState<AnnouncementType>(announcement?.type || 'normal');
  const [targetType, setTargetType] = useState<TargetType>(announcement?.targetType || 'all');
  const [targetRoles, setTargetRoles] = useState<string[]>(announcement?.targetRoles || []);
  const [targetUserIds] = useState<string[]>(announcement?.targetUserIds || []);
  const [colorScheme, setColorScheme] = useState<ColorScheme>(announcement?.colorScheme || 'info');
  const [isPinned, setIsPinned] = useState(announcement?.isPinned || false);
  const [priority, setPriority] = useState(announcement?.priority || 0);
  const [startTime, setStartTime] = useState(
    announcement?.startTime ? announcement.startTime.slice(0, 16) : ''
  );
  const [endTime, setEndTime] = useState(
    announcement?.endTime ? announcement.endTime.slice(0, 16) : ''
  );

  // UI 状态
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  // 用户搜索（用于指定用户模式）
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; email: string }[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<{ id: string; name: string }[]>([]);

  // 加载选中的用户
  useEffect(() => {
    if (targetUserIds.length > 0 && selectedUsers.length === 0) {
      // 初始化时加载用户信息（简化处理）
      setSelectedUsers(targetUserIds.map((id) => ({ id, name: `用户 ${id.slice(0, 8)}` })));
    }
  }, [targetUserIds, selectedUsers.length]);

  // 用户搜索
  useEffect(() => {
    if (targetType !== 'user' || !userSearch.trim()) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      try {
        const data = await adminService.getUsers(userSearch, 1, 10);
        setSearchResults(
          data.users.map((u: any) => ({ id: u.id, name: u.name || u.email, email: u.email }))
        );
      } catch (err) {
        console.error('Search users failed:', err);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [userSearch, targetType]);

  // 渲染预览内容
  const renderPreview = () => {
    const rawHtml = marked.parse(content, { async: false }) as string;
    const cleanHtml = DOMPurify.sanitize(rawHtml);
    return { __html: cleanHtml };
  };

  // 保存草稿
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError('标题和内容不能为空');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const data: CreateAnnouncementData = {
        title: title.trim(),
        content: content.trim(),
        type,
        targetType,
        colorScheme,
        isPinned,
        priority,
      };

      if (targetType === 'role') {
        data.targetRoles = targetRoles;
      }
      if (targetType === 'user') {
        data.targetUserIds = selectedUsers.map((u) => u.id);
      }
      if (startTime) {
        data.startTime = new Date(startTime).toISOString();
      }
      if (endTime) {
        data.endTime = new Date(endTime).toISOString();
      }

      if (isEditing && announcement) {
        await adminUpdateAnnouncement(announcement.id, data);
      } else {
        await adminCreateAnnouncement(data);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 保存并发布
  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      setError('标题和内容不能为空');
      return;
    }

    try {
      setPublishing(true);
      setError('');

      const data: CreateAnnouncementData = {
        title: title.trim(),
        content: content.trim(),
        type,
        targetType,
        colorScheme,
        isPinned,
        priority,
      };

      if (targetType === 'role') {
        data.targetRoles = targetRoles;
      }
      if (targetType === 'user') {
        data.targetUserIds = selectedUsers.map((u) => u.id);
      }
      if (startTime) {
        data.startTime = new Date(startTime).toISOString();
      }
      if (endTime) {
        data.endTime = new Date(endTime).toISOString();
      }

      let announcementId: string;
      if (isEditing && announcement) {
        await adminUpdateAnnouncement(announcement.id, data);
        announcementId = announcement.id;
      } else {
        const created = await adminCreateAnnouncement(data);
        announcementId = created.id;
      }

      await adminPublishAnnouncement(announcementId);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || '发布失败');
    } finally {
      setPublishing(false);
    }
  };

  // 添加用户
  const addUser = (user: { id: string; name: string }) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setUserSearch('');
    setSearchResults([]);
  };

  // 移除用户
  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  // 切换角色
  const toggleRole = (role: string) => {
    if (targetRoles.includes(role)) {
      setTargetRoles(targetRoles.filter((r) => r !== role));
    } else {
      setTargetRoles([...targetRoles, role]);
    }
  };

  const canPublish = !isEditing || announcement?.status === 'draft';

  return (
    <div className="announcement-form">
      <div className="page-wrapper">
        {/* 头部 */}
        <div className="announcement-form__header">
          <button className="announcement-form__back" onClick={onCancel}>
            <ArrowLeft size={20} />
            返回
          </button>
          <h2>{isEditing ? '编辑公告' : '新建公告'}</h2>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="announcement-form__error">
            <XCircle size={16} />
            {error}
          </div>
        )}

        <div className="announcement-form__body">
          {/* 左侧：表单 */}
          <div className="announcement-form__main">
            {/* 标题 */}
            <div className="announcement-form__field">
              <label>公告标题</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入公告标题"
                maxLength={100}
              />
            </div>

            {/* 类型 */}
            <div className="announcement-form__field">
              <label>公告类型</label>
              <div className="announcement-form__type-group">
                <button
                  className={`announcement-form__type-btn ${type === 'normal' ? 'active' : ''}`}
                  onClick={() => setType('normal')}
                >
                  <Info size={16} />
                  普通公告
                </button>
                <button
                  className={`announcement-form__type-btn ${type === 'urgent' ? 'active' : ''}`}
                  onClick={() => setType('urgent')}
                >
                  <AlertTriangle size={16} />
                  紧急通知
                </button>
                <button
                  className={`announcement-form__type-btn ${type === 'banner' ? 'active' : ''}`}
                  onClick={() => setType('banner')}
                >
                  <Megaphone size={16} />
                  横幅公告
                </button>
              </div>
            </div>

            {/* 颜色 */}
            <div className="announcement-form__field">
              <label>颜色方案</label>
              <div className="announcement-form__colors">
                {(['info', 'success', 'warning', 'danger'] as ColorScheme[]).map((color) => (
                  <button
                    key={color}
                    className={`announcement-form__color announcement-form__color--${color} ${
                      colorScheme === color ? 'active' : ''
                    }`}
                    onClick={() => setColorScheme(color)}
                    title={color}
                  >
                    {colorScheme === color && <CheckCircle size={16} />}
                  </button>
                ))}
              </div>
            </div>

            {/* 内容 */}
            <div className="announcement-form__field">
              <div className="announcement-form__content-header">
                <label>公告内容</label>
                <div className="announcement-form__content-tabs">
                  <button
                    className={!previewMode ? 'active' : ''}
                    onClick={() => setPreviewMode(false)}
                  >
                    <Edit3 size={14} />
                    编辑
                  </button>
                  <button
                    className={previewMode ? 'active' : ''}
                    onClick={() => setPreviewMode(true)}
                  >
                    <Eye size={14} />
                    预览
                  </button>
                </div>
              </div>
              {previewMode ? (
                <div
                  className="announcement-form__preview"
                  dangerouslySetInnerHTML={renderPreview()}
                />
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="支持 Markdown 格式"
                  rows={10}
                />
              )}
            </div>

            {/* 目标受众 */}
            <div className="announcement-form__field">
              <label>目标受众</label>
              <div className="announcement-form__target-group">
                <button
                  className={`announcement-form__target-btn ${targetType === 'all' ? 'active' : ''}`}
                  onClick={() => setTargetType('all')}
                >
                  <Globe size={16} />
                  全站用户
                </button>
                <button
                  className={`announcement-form__target-btn ${targetType === 'role' ? 'active' : ''}`}
                  onClick={() => setTargetType('role')}
                >
                  <Users size={16} />
                  按角色
                </button>
                <button
                  className={`announcement-form__target-btn ${targetType === 'user' ? 'active' : ''}`}
                  onClick={() => setTargetType('user')}
                >
                  <User size={16} />
                  指定用户
                </button>
              </div>

              {/* 角色选择 */}
              {targetType === 'role' && (
                <div className="announcement-form__roles">
                  {['user', 'admin', 'superadmin'].map((role) => (
                    <label key={role} className="announcement-form__checkbox">
                      <input
                        type="checkbox"
                        checked={targetRoles.includes(role)}
                        onChange={() => toggleRole(role)}
                      />
                      {role === 'user' ? '普通用户' : role === 'admin' ? '管理员' : '超级管理员'}
                    </label>
                  ))}
                </div>
              )}

              {/* 用户选择 */}
              {targetType === 'user' && (
                <div className="announcement-form__users">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="搜索用户（姓名或邮箱）"
                  />
                  {searchResults.length > 0 && (
                    <div className="announcement-form__user-results">
                      {searchResults.map((user) => (
                        <button key={user.id} onClick={() => addUser(user)}>
                          {user.name} ({user.email})
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedUsers.length > 0 && (
                    <div className="announcement-form__selected-users">
                      {selectedUsers.map((user) => (
                        <span key={user.id} className="announcement-form__user-tag">
                          {user.name}
                          <button onClick={() => removeUser(user.id)}>&times;</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 定时发布 */}
            <div className="announcement-form__field announcement-form__time-row">
              <div>
                <label>开始时间（可选）</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label>结束时间（可选）</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* 其他选项 */}
            <div className="announcement-form__field announcement-form__options-row">
              <label className="announcement-form__checkbox">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                />
                置顶显示
              </label>
              <div className="announcement-form__priority">
                <label>优先级</label>
                <input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="announcement-form__footer">
          <button className="announcement-form__cancel" onClick={onCancel}>
            取消
          </button>
          <button
            className="announcement-form__save"
            onClick={handleSave}
            disabled={saving || publishing}
          >
            {saving ? <Loader size={16} className="spinning" /> : <Save size={16} />}
            保存草稿
          </button>
          {canPublish && (
            <button
              className="announcement-form__publish"
              onClick={handlePublish}
              disabled={saving || publishing}
            >
              {publishing ? <Loader size={16} className="spinning" /> : <Send size={16} />}
              立即发布
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementForm;
