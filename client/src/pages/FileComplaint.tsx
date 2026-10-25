import React, { useState } from 'react';
import type { Category, Priority, CreateComplaintInput, Complaint } from '../types/index';
import { submitComplaint, trackComplaint } from '../services/api';
import { TrackingModal } from '../components/TrackingModal';
import {
  Send,
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
  Search,
  AlertCircle,
} from 'lucide-react';

const CATEGORIES: Category[] = [
  'Product',
  'Service',
  'Billing/Payment',
  'Facilities',
  'Staff Behavior',
  'Delivery/Transport',
  'Safety',
  'Online/Technical',
  'Other',
];

const PRIORITIES: Priority[] = ['Low', 'Medium', 'High'];

export const FileComplaint: React.FC = () => {
  const [formData, setFormData] = useState<CreateComplaintInput>({
    subject: '',
    description: '',
    category: 'Product',
    priority: 'Medium',
    fullName: '',
    email: '',
    phone: '',
    referenceOrLocation: '',
  });

  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Tracking modal integration
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState<boolean>(false);
  const [trackingLoading, setTrackingLoading] = useState<boolean>(false);
  const [trackingComplaint, setTrackingComplaint] = useState<Complaint | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required.';
    } else if (formData.subject.trim().length < 3) {
      errors.subject = 'Subject must be at least 3 characters.';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required.';
    } else if (formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters.';
    }

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full Name is required.';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Full Name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (clientErrors[name]) {
      setClientErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // [AJAX / JSON USAGE] Asynchronous POST request using fetch
      const result = await submitComplaint(formData);
      setCreatedComplaint(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit complaint.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!createdComplaint) return;
    navigator.clipboard.writeText(createdComplaint.trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenTracking = async () => {
    if (!createdComplaint) return;
    setIsTrackingModalOpen(true);
    setTrackingLoading(true);
    setTrackingError(null);
    setTrackingComplaint(null);

    try {
      const result = await trackComplaint(createdComplaint.trackingId);
      setTrackingComplaint(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not load tracking details.';
      setTrackingError(msg);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      subject: '',
      description: '',
      category: 'Product',
      priority: 'Medium',
      fullName: '',
      email: '',
      phone: '',
      referenceOrLocation: '',
    });
    setClientErrors({});
    setServerError(null);
    setCreatedComplaint(null);
    setCopied(false);
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
          File a Complaint
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Please complete all required fields. Your grievance will be logged in our system and
          assigned a unique tracking identifier immediately.
        </p>
      </div>

      {/* Success State: Show Tracking ID with Copy Button */}
      {createdComplaint ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            animation: 'fadeIn 200ms ease-out',
            border: '2px solid var(--success)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Complaint Successfully Lodged!
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
            Your complaint has been registered in the system under the status <strong>Submitted</strong>.
            Keep your tracking ID handy to check updates or follow up.
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '1rem',
              backgroundColor: 'var(--bg-surface-alt)',
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              marginBottom: '2rem',
            }}
          >
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Tracking ID
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                }}
              >
                {createdComplaint.trackingId}
              </span>
            </div>
            <button
              className="btn btn-secondary"
              onClick={handleCopy}
              style={{ padding: '0.6rem 1rem' }}
              title="Copy to clipboard"
            >
              {copied ? <Check size={18} color="var(--success)" /> : <Copy size={18} />}
              <span>{copied ? 'Copied!' : 'Copy ID'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleOpenTracking}>
              <Search size={16} />
              Track this Complaint
            </button>
            <button className="btn btn-secondary" onClick={handleReset}>
              <RotateCcw size={16} />
              File Another Complaint
            </button>
          </div>
        </div>
      ) : (
        /* Form State */
        <div className="card">
          {serverError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'var(--danger-bg)',
                color: 'var(--danger)',
                padding: '0.85rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
              }}
            >
              <AlertCircle size={18} />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Subject */}
            <div className="form-group">
              <label className="form-label" htmlFor="subject">
                Subject / Title <span className="required">*</span>
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                className="form-control"
                placeholder="Brief summary of the issue (e.g. Overcharged on recent invoice)"
                value={formData.subject}
                onChange={handleChange}
                required
              />
              {clientErrors.subject && <p className="form-error">{clientErrors.subject}</p>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="description">
                Detailed Description <span className="required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="form-control"
                placeholder="Explain the incident, what occurred, who was involved, and any relevant circumstances..."
                value={formData.description}
                onChange={handleChange}
                required
              />
              {clientErrors.description && <p className="form-error">{clientErrors.description}</p>}
              <p className="form-hint">Minimum 10 characters required.</p>
            </div>

            {/* Category & Priority Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
              }}
            >
              <div className="form-group">
                <label className="form-label" htmlFor="category">
                  Category <span className="required">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  className="form-control"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="priority">
                  Priority <span className="required">*</span>
                </label>
                <select
                  id="priority"
                  name="priority"
                  className="form-control"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                >
                  {PRIORITIES.map((pri) => (
                    <option key={pri} value={pri}>
                      {pri} Priority
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submitter Contact Section */}
            <div
              style={{
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
                Your Contact Information
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1rem',
                }}
              >
                {/* Full Name */}
                <div className="form-group">
                  <label className="form-label" htmlFor="fullName">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Jane Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                  {clientErrors.fullName && <p className="form-error">{clientErrors.fullName}</p>}
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="form-control"
                    placeholder="jane.doe@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {clientErrors.email && <p className="form-error">{clientErrors.email}</p>}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1rem',
                }}
              >
                {/* Phone */}
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">
                    Phone Number (Optional)
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="form-control"
                    placeholder="+1-555-010-0000"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                {/* Reference Number or Location */}
                <div className="form-group">
                  <label className="form-label" htmlFor="referenceOrLocation">
                    Reference Number or Location (Optional)
                  </label>
                  <input
                    id="referenceOrLocation"
                    name="referenceOrLocation"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Order #1234 or Building 4, Floor 2"
                    value={formData.referenceOrLocation}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Form Submit Footer */}
            <div
              style={{
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ padding: '0.75rem 2rem' }}
              >
                {isSubmitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send size={16} />
                    Submit Complaint
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

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
