import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import './BackButton.css';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
  onClick?: () => void;
}

const BackButton: React.FC<BackButtonProps> = ({
  to,
  label = '返回',
  className = '',
  onClick,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      className={`back-button ${className}`}
      onClick={handleClick}
      type="button"
      aria-label={label}
    >
      <ChevronLeft className="back-button-icon" size={20} />
      <span className="back-button-label">{label}</span>
    </button>
  );
};

export default BackButton;
