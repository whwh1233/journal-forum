import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { updateUserProfile, uploadAvatar, updatePassword } from '../../../services/userService';
import PageHeader from '../../../components/layout/PageHeader';
import { BadgePicker } from '../../badges';
import { Loader2, Upload, Camera } from 'lucide-react';
import './ProfileEditPage.css';

const ProfileEditPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    institution: user?.institution || '',
    website: user?.website || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('图片大小不能超过 2MB');
      setSuccess(null);
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      await uploadAvatar(file);
      setSuccess('头像上传成功');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      setError(error.response?.data?.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateUserProfile(formData);
      setSuccess('资料更新成功');
      setTimeout(() => {
        setSuccess(null);
        navigate(`/profile/${user?.id}`);
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || '更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    try {
      await updatePassword(passwordData.currentPassword, passwordData.newPassword);
      setSuccess('密码修改成功');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || '修改失败');
    }
  };

  if (!user) {
    return (
      <div className="page-wrapper">
        <div className="profile-edit-error">请先登录</div>
      </div>
    );
  }

  return (
    <div className="profile-edit-page">
      <PageHeader title="账号设置" showBack />

      <div className="page-wrapper">
        {/* 错误/成功提示 */}
        {error && <div className="profile-error">{error}</div>}
        {success && <div className="profile-success">{success}</div>}

        {/* 头像上传区 */}
        <div className="avatar-section">
          <h2 className="avatar-section-title">头像</h2>
          <div className="avatar-preview">
            {user?.avatar ? (
              <img src={`http://localhost:3001${user.avatar}`} alt="用户头像" />
            ) : (
              <div className="avatar-placeholder">
                <Camera size={48} />
              </div>
            )}
          </div>

          <div className="file-upload-wrapper">
            <input
              type="file"
              id="avatar-upload"
              className="file-upload-input"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={uploading}
            />
            <label htmlFor="avatar-upload" className={`file-upload-button ${uploading ? 'disabled' : ''}`}>
              {uploading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>上传中...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>选择图片</span>
                </>
              )}
            </label>
          </div>
          <p className="upload-hint">支持 JPG、PNG 格式，最大 2MB</p>
        </div>

        {/* 置顶徽章选择 */}
        <div className="badge-section">
          <h2 className="form-section-title">置顶徽章</h2>
          <BadgePicker onSave={() => setSuccess('徽章设置已保存')} />
        </div>

        {/* 基本信息表单 */}
        <form onSubmit={handleProfileSubmit} className="profile-form-section">
          <h2 className="form-section-title">基本信息</h2>

          <div className="profile-form-group">
            <label htmlFor="name" className="profile-form-label">昵称</label>
            <input
              type="text"
              id="name"
              className="profile-form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入昵称"
            />
          </div>

          <div className="profile-form-group">
            <label htmlFor="bio" className="profile-form-label">个人简介</label>
            <textarea
              id="bio"
              className="profile-form-textarea"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="介绍一下自己..."
              rows={3}
            />
          </div>

          <div className="profile-form-group">
            <label htmlFor="location" className="profile-form-label">所在地</label>
            <input
              type="text"
              id="location"
              className="profile-form-input"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="请输入所在地"
            />
          </div>

          <div className="profile-form-group">
            <label htmlFor="institution" className="profile-form-label">机构</label>
            <input
              type="text"
              id="institution"
              className="profile-form-input"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              placeholder="请输入所在机构"
            />
          </div>

          <div className="profile-form-group">
            <label htmlFor="website" className="profile-form-label">网站</label>
            <input
              type="url"
              id="website"
              className="profile-form-input"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://"
            />
          </div>

          <button type="submit" className="profile-submit-button" disabled={saving}>
            {saving && <Loader2 className="animate-spin" size={16} />}
            {saving ? '保存中...' : '保存更改'}
          </button>
        </form>

        {/* 修改密码表单 */}
        <form onSubmit={handlePasswordSubmit} className="profile-form-section">
          <h2 className="form-section-title">修改密码</h2>

          <div className="profile-form-group">
            <label htmlFor="currentPassword" className="profile-form-label">当前密码</label>
            <input
              type="password"
              id="currentPassword"
              className="profile-form-input"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              placeholder="请输入当前密码"
              required
            />
          </div>

          <div className="profile-form-group">
            <label htmlFor="newPassword" className="profile-form-label">新密码</label>
            <input
              type="password"
              id="newPassword"
              className="profile-form-input"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              placeholder="请输入新密码"
              required
            />
          </div>

          <div className="profile-form-group">
            <label htmlFor="confirmPassword" className="profile-form-label">确认新密码</label>
            <input
              type="password"
              id="confirmPassword"
              className="profile-form-input"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="请再次输入新密码"
              required
            />
          </div>

          <button type="submit" className="profile-submit-button">
            修改密码
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditPage;
