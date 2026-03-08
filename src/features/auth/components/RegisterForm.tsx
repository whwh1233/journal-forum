import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import './RegisterForm.css';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(email, password, confirmPassword);
      onSuccess();
    } catch (err) {
      // 错误处理已在useAuth中处理
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2 className="auth-form-title">用户注册</h2>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">邮箱地址</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError(); }}
            required
            disabled={submitting}
            className="auth-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">密码</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError(); }}
            required
            disabled={submitting}
            className="auth-input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">确认密码</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
            required
            disabled={submitting}
            className="auth-input"
          />
        </div>
        <button type="submit" disabled={submitting} className="auth-button">
          {submitting && <Loader2 className="animate-spin" size={16} style={{ marginRight: '8px' }} />}
          {submitting ? '注册中...' : '注册'}
        </button>
      </form>
      <p className="auth-switch-text">
        已有账户？{' '}
        <button onClick={() => { clearError(); onSwitchToLogin(); }} className="auth-switch-link" disabled={submitting}>
          立即登录
        </button>
      </p>
    </div>
  );
};

export default RegisterForm;