import React, { useRef } from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import { useLocation } from 'react-router-dom';
import './PageTransition.css';

interface PageTransitionProps {
  children: React.ReactNode;
  variant?: 'default' | 'subtle';
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  variant = 'default'
}) => {
  const location = useLocation();
  const nodeRef = useRef<HTMLDivElement>(null);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const variantClass = variant === 'subtle' ? 'page-transition--subtle' : '';

  return (
    <div className={`page-transition-wrapper ${variantClass}`}>
      <SwitchTransition mode="out-in">
        <CSSTransition
          key={location.pathname}
          nodeRef={nodeRef}
          timeout={prefersReducedMotion ? 0 : { enter: 300, exit: 200 }}
          classNames="page"
          unmountOnExit
        >
          <div ref={nodeRef} className="page-content">
            {children}
          </div>
        </CSSTransition>
      </SwitchTransition>
    </div>
  );
};

export default PageTransition;
