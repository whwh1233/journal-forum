import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import './LoginForm.css';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      onSuccess();
    } catch (err) {
      // 错误处理已在useAuth中处理
    }
  };

  return (
    <div className="auth-form-container">
      <h2 className="auth-form-title">用户登录</h2>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">邮箱地址</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="auth-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">密码</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="auth-input"
          />
        </div>
        <button type="submit" disabled={loading} className="auth-button">
          {loading && <Loader2 className="animate-spin" size={16} style={{ marginRight: '8px' }} />}
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
      <p className="auth-switch-text">
        还没有账户？{' '}
        <button onClick={onSwitchToRegister} className="auth-switch-link" disabled={loading}>
          立即注册
        </button>
      </p>
    </div>
  );
};

export default LoginForm;