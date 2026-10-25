import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const Drawer: React.FC<Props> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="drawer-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="drawer-content">
        <div className="drawer-header">
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close drawer">
            <X size={20} />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </div>
  );
};
