import React, { useEffect, useState, useCallback } from 'react';
import { adminService } from '../../../services/adminService';
import { AdminUser, PaginationInfo } from '../../../types';
import { usePageTitle } from '@/contexts/PageContext';
import './UserManagement.css';

const UserManagement: React.FC = () => {
  usePageTitle('用户管理');

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers(searchQuery, currentPage);
      setUsers(data.users);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleToggleStatus = async (user: AdminUser) => {
    if (user.role === 'admin') {
      return;
    }

    try {
      const newStatus = user.status === 'active' ? 'disabled' : 'active';
      await adminService.updateUserStatus(user.id, newStatus);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新用户状态失败');
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (user.role === 'admin') {
      return;
    }

    if (!window.confirm(`确定要删除用户 "${user.email}" 吗？此操作将同时删除该用户的所有评论。`)) {
      return;
    }

    try {
      await adminService.deleteUser(user.id);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除用户失败');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="user-management">
      <div className="page-wrapper">
        <div className="search-bar">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            className="search-input"
            placeholder="搜索用户邮箱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-button">
            搜索
          </button>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>邮箱</th>
                  <th>角色</th>
                  <th>状态</th>
                  <th>评论数</th>
                  <th>注册时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-message">
                      暂无用户数据
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td className="email-cell">{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role === 'admin' ? '管理员' : '普通用户'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.status}`}>
                          {user.status === 'active' ? '正常' : '已禁用'}
                        </span>
                      </td>
                      <td>{user.commentCount}</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td className="actions-cell">
                        {user.role !== 'admin' && (
                          <>
                            <button
                              className={`action-btn ${user.status === 'active' ? 'disable' : 'enable'}`}
                              onClick={() => handleToggleStatus(user)}
                            >
                              {user.status === 'active' ? '禁用' : '启用'}
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={() => handleDeleteUser(user)}
                            >
                              删除
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                上一页
              </button>
              <span className="pagination-info">
                第 {pagination.currentPage} / {pagination.totalPages} 页
              </span>
              <button
                className="pagination-btn"
                disabled={currentPage === pagination.totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
};

export default UserManagement;
