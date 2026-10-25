import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FilePlus2,
  ListFilter,
  Sun,
  Moon,
  ShieldCheck,
  LogOut,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  onOpenAdminLogin: () => void;
}

export const Navbar: React.FC<Props> = ({ onOpenAdminLogin }) => {
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, adminUser, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <NavLink to="/" className="navbar-brand">
          <div className="brand-icon">
            <ShieldAlert size={20} />
          </div>
          <span>ComplaintTracker</span>
        </NavLink>

        {/* 3 Pages Navigation */}
        <nav className="navbar-links">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            end
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/file"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <FilePlus2 size={18} />
            <span>File a Complaint</span>
          </NavLink>

          <NavLink
            to="/complaints"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            <ListFilter size={18} />
            <span>All Complaints</span>
          </NavLink>
        </nav>

        {/* Actions: Theme Toggle & Admin Indicator */}
        <div className="navbar-actions">
          {/* Dark / Light Toggle */}
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Admin status / Login button */}
          {isAdmin ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--success-bg)',
                  color: 'var(--success)',
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(22, 163, 74, 0.2)',
                }}
              >
                <ShieldCheck size={14} />
                Admin: {adminUser?.username || 'admin'}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={logout}
                title="Log out of Admin session"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : (
            <button
              className="btn btn-secondary btn-sm"
              onClick={onOpenAdminLogin}
              title="Admin access to manage complaints"
            >
              <ShieldCheck size={15} />
              Admin Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
