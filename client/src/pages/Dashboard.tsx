import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  Eye,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { StatsSummary, Complaint } from '../types/index';
import { fetchStats, trackComplaint } from '../services/api';
import { TrackingModal } from '../components/TrackingModal';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Tracking Modal State
  const [trackingInput, setTrackingInput] = useState<string>('');
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState<boolean>(false);
  const [trackingComplaint, setTrackingComplaint] = useState<Complaint | null>(null);
  const [trackingLoading, setTrackingLoading] = useState<boolean>(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoadingStats(true);
        // [AJAX USAGE] Fetch stats summary via async AJAX call
        const data = await fetchStats();
        setStats(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Could not load statistics.';
        setStatsError(msg);
      } finally {
        setLoadingStats(false);
      }
    }
    loadStats();
  }, []);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;

    setIsTrackingModalOpen(true);
    setTrackingLoading(true);
    setTrackingError(null);
    setTrackingComplaint(null);

    try {
      // [AJAX USAGE] Fetch specific complaint by tracking ID asynchronously
      const result = await trackComplaint(trackingInput.trim());
      setTrackingComplaint(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Complaint not found.';
      setTrackingError(msg);
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div>
      {/* Hero & Track Search Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '2.5rem 2rem',
          marginBottom: '2rem',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <h1
          style={{
            fontSize: '2.25rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '0.75rem',
            color: 'var(--text-main)',
          }}
        >
          Track & Resolve Grievances Effortlessly
        </h1>
        <p
          style={{
            fontSize: '1.05rem',
            color: 'var(--text-muted)',
            maxWidth: '620px',
            margin: '0 auto 2rem',
          }}
        >
          A transparent, universal complaint management portal. File grievances, track status
          updates with a unique ID, or review resolution milestones.
        </p>

        {/* Track your complaint input box */}
        <form
          onSubmit={handleTrackSubmit}
          style={{
            maxWidth: '560px',
            margin: '0 auto',
            display: 'flex',
            gap: '0.5rem',
            backgroundColor: 'var(--bg-surface)',
            padding: '0.4rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Enter Tracking ID (e.g., CMP-2026-0001)..."
              value={trackingInput}
              onChange={(e) => setTrackingInput(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                padding: '0.7rem 0.75rem 0.7rem 2.4rem',
                fontSize: '0.95rem',
                backgroundColor: 'transparent',
                color: 'var(--text-main)',
                outline: 'none',
              }}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.7rem 1.4rem' }}>
            Track Now
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          Sample tracking IDs to try:{' '}
          <button
            type="button"
            onClick={() => setTrackingInput('CMP-2026-0001')}
            style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
          >
            CMP-2026-0001
          </button>
          {' '}&bull;{' '}
          <button
            type="button"
            onClick={() => setTrackingInput('CMP-2026-0003')}
            style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
          >
            CMP-2026-0003
          </button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
            System Overview
          </h2>
          {loadingStats && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Updating stats...</span>}
        </div>

        {statsError && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
            }}
          >
            {statsError}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
          }}
        >
          {/* Total Complaints */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={22} />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Total Filed
              </p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats ? stats.total : 0}</h3>
            </div>
          </div>

          {/* Submitted */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--info-bg)',
                color: 'var(--info)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={22} />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Submitted
              </p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {stats ? stats.byStatus.Submitted : 0}
              </h3>
            </div>
          </div>

          {/* In Review */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--warning-bg)',
                color: 'var(--warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Eye size={22} />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                In Review
              </p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {stats ? stats.byStatus['In Review'] : 0}
              </h3>
            </div>
          </div>

          {/* In Progress */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                color: '#9333ea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertCircle size={22} />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                In Progress
              </p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {stats ? stats.byStatus['In Progress'] : 0}
              </h3>
            </div>
          </div>

          {/* Resolved */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--success-bg)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Resolved
              </p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {stats ? stats.byStatus.Resolved : 0}
              </h3>
            </div>
          </div>

          {/* Rejected */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--danger-bg)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <XCircle size={22} />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Rejected
              </p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {stats ? stats.byStatus.Rejected : 0}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Category Chart Section & Fast Actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Recharts Chart: Complaints by Category */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <TrendingUp size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Complaints by Category
            </h3>
          </div>

          <div style={{ width: '100%', height: 300 }}>
            {stats && stats.byCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.byCategory}
                  margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="category"
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Complaints" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                No complaint category data available.
              </div>
            )}
          </div>
        </div>

        {/* Quick Launch Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            className="card"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface-alt) 100%)',
            }}
          >
            <div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  backgroundColor: 'var(--primary-light)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '0.5rem',
                }}
              >
                Need to report an issue?
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                File a New Complaint
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Fill in our standardized grievance form with relevant categories and priority
                levels. Receive your unique tracking code instantly.
              </p>
            </div>
            <div style={{ marginTop: '1.25rem' }}>
              <button className="btn btn-primary" onClick={() => navigate('/file')}>
                Submit Grievance <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div
            className="card"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--info)',
                  backgroundColor: 'var(--info-bg)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '0.5rem',
                }}
              >
                Browse & Filter
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                Explore All Complaints
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Search through active issues with debounced live search, export/import via XML,
                and manage workflow resolutions as an administrator.
              </p>
            </div>
            <div style={{ marginTop: '1.25rem' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/complaints')}>
                View Directory <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tracking Modal */}
      <TrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        complaint={trackingComplaint}
        loading={trackingLoading}
        error={trackingError}
      />
    </div>
  );
};
