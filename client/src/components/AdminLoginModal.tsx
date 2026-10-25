import React, { useState } from 'react';
import { Modal } from './Modal';
import { useAuth } from '../context/AuthContext';
import { loginAdmin } from '../services/api';
import { Lock, User, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { setAuth } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // [AJAX / JSON USAGE] Calling auth login endpoint
      const response = await loginAdmin(username, password);
      setAuth(response);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please verify credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Admin Portal Login"
      maxWidth="420px"
      footer={
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="submit"
            form="admin-login-form"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </div>
      }
    >
      <form id="admin-login-form" onSubmit={handleSubmit}>
        <div
          style={{
            backgroundColor: 'var(--primary-light)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            fontSize: '0.8rem',
            color: 'var(--primary)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
          }}
        >
          <strong>Demo Credentials:</strong>
          <br />
          Username: <code>admin</code> | Password: <code>admin123</code>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              fontSize: '0.85rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="admin-username">
            Username
          </label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            >
              <User size={16} />
            </span>
            <input
              id="admin-username"
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.25rem' }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="admin-password">
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            >
              <Lock size={16} />
            </span>
            <input
              id="admin-password"
              type="password"
              className="form-control"
              style={{ paddingLeft: '2.25rem' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
