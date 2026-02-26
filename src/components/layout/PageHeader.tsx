import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  backTo?: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, showBack, backTo, actions }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="page-header-bar">
      <div className="page-header-bar-left">
        {showBack && (
          <button className="page-header-bar-back" onClick={handleBack} aria-label="返回">
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
        )}
        <h1 className="page-header-bar-title">{title}</h1>
      </div>
      {actions && <div className="page-header-bar-actions">{actions}</div>}
    </div>
  );
};

export default PageHeader;
