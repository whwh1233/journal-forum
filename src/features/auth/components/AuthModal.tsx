import React, { useState } from 'react';
import Modal from '@/components/common/Modal';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  const handleSwitchToRegister = () => {
    setIsLoginMode(false);
  };

  const handleSwitchToLogin = () => {
    setIsLoginMode(true);
  };

  const handleAuthSuccess = () => {
    onAuthSuccess();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isLoginMode ? "用户登录" : "用户注册"} size="sm">
      {isLoginMode ? (
        <LoginForm
          onSwitchToRegister={handleSwitchToRegister}
          onSuccess={handleAuthSuccess}
        />
      ) : (
        <RegisterForm
          onSwitchToLogin={handleSwitchToLogin}
          onSuccess={handleAuthSuccess}
        />
      )}
    </Modal>
  );
};

export default AuthModal;