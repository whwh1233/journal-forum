import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { updateUserProfile, uploadAvatar, updatePassword } from '../../../services/userService';
import './ProfileEditPage.css';

const ProfileEditPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    institution: '',
    website: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过 2MB');
      return;
    }

    setUploading(true);
    try {
      await uploadAvatar(file);
      alert('头像上传成功');
      window.location.reload();
    } catch (error: any) {
      alert(error.response?.data?.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile(formData);
      alert('资料更新成功');
      navigate(`/profile/${user?.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || '更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
    try {
      await updatePassword(passwordData.currentPassword, passwordData.newPassword);
      alert('密码修改成功');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      alert(error.response?.data?.message || '修改失败');
    }
  };

  if (!user) {
    return (
      <div className="container">
        <div className="profile-edit-error">请先登录</div>
      </div>
    );
  }

  return (
    <div className="profile-edit-page container">
      <h1>编辑资料</h1>

      <div className="edit-section">
        <h2>头像</h2>
        <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploading} />
        {uploading && <p>上传中...</p>}
      </div>

      <form onSubmit={handleProfileSubmit} className="edit-section">
        <h2>基本信息</h2>
        <div className="form-group">
          <label>昵称</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>个人简介</label>
          <textarea
            value={formData.bio}
            onChange={e => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
          />
        </div>
        <div className="form-group">
          <label>所在地</label>
          <input
            type="text"
            value={formData.location}
            onChange={e => setFormData({ ...formData, location: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>机构</label>
          <input
            type="text"
            value={formData.institution}
            onChange={e => setFormData({ ...formData, institution: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>网站</label>
          <input
            type="url"
            value={formData.website}
            onChange={e => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://"
          />
        </div>
        <button type="submit" disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="edit-section">
        <h2>修改密码</h2>
        <div className="form-group">
          <label>当前密码</label>
          <input
            type="password"
            value={passwordData.currentPassword}
            onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>新密码</label>
          <input
            type="password"
            value={passwordData.newPassword}
            onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>确认新密码</label>
          <input
            type="password"
            value={passwordData.confirmPassword}
            onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            required
          />
        </div>
        <button type="submit">修改密码</button>
      </form>
    </div>
  );
};

export default ProfileEditPage;
