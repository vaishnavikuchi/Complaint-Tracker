import React from 'react';
import { Modal } from './Modal';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { Timeline } from './Timeline';
import type { Complaint } from '../types/index';
import { Calendar, Mail, User, MapPin } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  complaint: Complaint | null;
  loading: boolean;
  error: string | null;
}

export const TrackingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  complaint,
  loading,
  error,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={complaint ? `Complaint ${complaint.trackingId}` : 'Track Complaint'}
      maxWidth="620px"
      footer={
        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      }
    >
      {loading && (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid var(--border-color)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: 'var(--text-muted)' }}>Searching for complaint record...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {error && !loading && (
        <div
          style={{
            padding: '1.25rem',
            backgroundColor: 'var(--danger-bg)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
          }}
        >
          <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Search Failed</h4>
          <p style={{ fontSize: '0.9rem' }}>{error}</p>
        </div>
      )}

      {complaint && !loading && (
        <div>
          {/* Header Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface-alt)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span className="tracking-badge">{complaint.trackingId}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PriorityBadge priority={complaint.priority} />
                <StatusBadge status={complaint.status} />
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              {complaint.subject}
            </h3>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {complaint.description}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-color)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={14} />
                <span>{complaint.fullName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={14} />
                <span>{complaint.email}</span>
              </div>
              {complaint.referenceOrLocation && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={14} />
                  <span>{complaint.referenceOrLocation}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={14} />
                <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Timeline Section */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              Status & History Timeline
            </h4>
            <Timeline events={complaint.timeline} />
          </div>
        </div>
      )}
    </Modal>
  );
};
