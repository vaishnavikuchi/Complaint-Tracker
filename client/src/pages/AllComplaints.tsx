import React, { useState, useRef } from 'react';
import { useComplaints } from '../hooks/useComplaints';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import {
  downloadXmlExport,
  importComplaintsXml,
  updateComplaintStatus,
  addComplaintComment,
  deleteComplaint,
} from '../services/api';
import type {
  Complaint,
  Category,
  Priority,
  Status,
  ComplaintQueryParams,
} from '../types/index';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { Timeline } from '../components/Timeline';
import { Drawer } from '../components/Drawer';
import { Pagination } from '../components/Pagination';
import {
  Search,
  Download,
  Upload,
  ArrowUpDown,
  Filter,
  ShieldAlert,
  MessageSquare,
  Trash2,
  Calendar,
  User,
  Mail,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  FileCode2,
} from 'lucide-react';

const CATEGORIES: (Category | 'All')[] = [
  'All',
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

const STATUSES: (Status | 'All')[] = [
  'All',
  'Submitted',
  'In Review',
  'In Progress',
  'Resolved',
  'Rejected',
];

const PRIORITIES: (Priority | 'All')[] = ['All', 'Low', 'Medium', 'High'];

const WORKFLOW_STATUSES: Status[] = [
  'Submitted',
  'In Review',
  'In Progress',
  'Resolved',
  'Rejected',
];

interface Props {
  onOpenAdminLogin: () => void;
}

export const AllComplaints: React.FC<Props> = ({ onOpenAdminLogin }) => {
  const { isAdmin, token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Search input state with live debouncing
  const [searchInput, setSearchInput] = useState<string>('');
  // [AJAX USAGE] Debounced query calls the API dynamically as the user types
  const debouncedSearch = useDebounce<string>(searchInput, 300);

  // Filter & pagination state
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'All'>('All');
  const [sortBy, setSortBy] = useState<ComplaintQueryParams['sortBy']>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);

  // Drawer / Selected complaint state
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Admin action state
  const [statusUpdateChoice, setStatusUpdateChoice] = useState<Status>('In Review');
  const [statusRemarks, setStatusRemarks] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  const [commentInput, setCommentInput] = useState<string>('');
  const [isAddingComment, setIsAddingComment] = useState<boolean>(false);

  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // XML Import/Export status feedback
  const [xmlLoading, setXmlLoading] = useState<boolean>(false);
  const [xmlNotification, setXmlNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch complaints with custom hook
  const { complaints, total, totalPages, limit, loading, error, refetch } = useComplaints({
    search: debouncedSearch,
    status: statusFilter,
    category: categoryFilter,
    priority: priorityFilter,
    sortBy,
    sortOrder,
    page,
    limit: 10,
  });

  // Handle row click
  const handleRowClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setStatusUpdateChoice(complaint.status);
    setStatusRemarks('');
    setCommentInput('');
    setActionMessage(null);
    setIsDrawerOpen(true);
  };

  // Toggle sorting
  const handleSortChange = (field: ComplaintQueryParams['sortBy']) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // XML Export
  const handleExportXml = async () => {
    try {
      setXmlLoading(true);
      setXmlNotification(null);
      // [XML / AJAX USAGE] Download XML file via GET /api/complaints/export/xml
      await downloadXmlExport();
      setXmlNotification({
        type: 'success',
        text: 'Complaints XML file downloaded successfully.',
      });
      setTimeout(() => setXmlNotification(null), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'XML export failed.';
      setXmlNotification({ type: 'error', text: msg });
    } finally {
      setXmlLoading(false);
    }
  };

  // XML Import Trigger
  const handleImportXmlFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setXmlLoading(true);
      setXmlNotification(null);
      // [XML / AJAX USAGE] Upload XML file to POST /api/complaints/import/xml
      const result = await importComplaintsXml(file);
      setXmlNotification({
        type: 'success',
        text: result.message || `Successfully imported complaints from ${file.name}.`,
      });
      await refetch();
      setTimeout(() => setXmlNotification(null), 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'XML import failed.';
      setXmlNotification({ type: 'error', text: msg });
    } finally {
      setXmlLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Admin Update Status
  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      setIsUpdatingStatus(true);
      setActionMessage(null);
      // [AJAX / JSON USAGE] PUT /api/complaints/:id/status
      const updated = await updateComplaintStatus(
        selectedComplaint.id,
        statusUpdateChoice,
        statusRemarks,
        token
      );
      setSelectedComplaint(updated);
      setStatusRemarks('');
      setActionMessage({ type: 'success', text: `Status updated to ${statusUpdateChoice}.` });
      await refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      setActionMessage({ type: 'error', text: msg });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Admin Add Comment
  const handleAddCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !commentInput.trim()) return;

    try {
      setIsAddingComment(true);
      setActionMessage(null);
      // [AJAX / JSON USAGE] POST /api/complaints/:id/comments
      const newComment = await addComplaintComment(selectedComplaint.id, commentInput.trim(), token);
      setSelectedComplaint((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          comments: [...prev.comments, newComment],
        };
      });
      setCommentInput('');
      setActionMessage({ type: 'success', text: 'Remark added successfully.' });
      await refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add comment';
      setActionMessage({ type: 'error', text: msg });
    } finally {
      setIsAddingComment(false);
    }
  };

  // Admin Delete Complaint
  const handleDeleteComplaint = async () => {
    if (!selectedComplaint) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete complaint ${selectedComplaint.trackingId}?`
    );
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      setActionMessage(null);
      // [AJAX USAGE] DELETE /api/complaints/:id
      await deleteComplaint(selectedComplaint.id, token);
      setIsDrawerOpen(false);
      setSelectedComplaint(null);
      await refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete complaint';
      setActionMessage({ type: 'error', text: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            All Complaints
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Filter, search, review details, or manage resolution workflows.
          </p>
        </div>

        {/* XML Export & Import Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Export as XML */}
          <button
            className="btn btn-secondary"
            onClick={handleExportXml}
            disabled={xmlLoading}
            title="Download all complaints in structured XML format"
          >
            <Download size={16} />
            Export as XML
          </button>

          {/* Import from XML */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportXmlFile}
            accept=".xml,text/xml,application/xml"
            style={{ display: 'none' }}
          />
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={xmlLoading}
            title="Upload and import complaints from an XML document"
          >
            <Upload size={16} />
            Import from XML
          </button>

          {/* Admin Login button if not signed in */}
          {!isAdmin && (
            <button className="btn btn-primary" onClick={onOpenAdminLogin}>
              <ShieldAlert size={16} />
              Admin Login
            </button>
          )}
        </div>
      </div>

      {/* XML Feedback Notification Toast */}
      {xmlNotification && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            fontSize: '0.9rem',
            backgroundColor:
              xmlNotification.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: xmlNotification.type === 'success' ? 'var(--success)' : 'var(--danger)',
            border: `1px solid ${
              xmlNotification.type === 'success'
                ? 'rgba(22, 163, 74, 0.2)'
                : 'rgba(220, 38, 38, 0.2)'
            }`,
          }}
        >
          {xmlNotification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{xmlNotification.text}</span>
        </div>
      )}

      {/* Filter and Live Search Bar */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Live Search Input (Debounced) */}
        <div style={{ position: 'relative', width: '100%' }}>
          <span
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              display: 'flex',
            }}
          >
            <Search size={18} />
          </span>
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.4rem' }}
            placeholder="Search by keyword, subject, tracking ID (CMP-...), name, email, or location..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Filter Dropdowns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
            alignItems: 'center',
          }}
        >
          {/* Status Filter */}
          <div>
            <label className="form-hint" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Filter size={12} /> Status
            </label>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as Status | 'All');
                setPage(1);
              }}
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st === 'All' ? 'All Statuses' : st}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="form-hint" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Filter size={12} /> Category
            </label>
            <select
              className="form-control"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value as Category | 'All');
                setPage(1);
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="form-hint" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Filter size={12} /> Priority
            </label>
            <select
              className="form-control"
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value as Priority | 'All');
                setPage(1);
              }}
            >
              {PRIORITIES.map((pri) => (
                <option key={pri} value={pri}>
                  {pri === 'All' ? 'All Priorities' : `${pri} Priority`}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Field */}
          <div>
            <label className="form-hint" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ArrowUpDown size={12} /> Sort By
            </label>
            <select
              className="form-control"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as ComplaintQueryParams['sortBy']);
                setPage(1);
              }}
            >
              <option value="createdAt">Date Filed</option>
              <option value="updatedAt">Last Updated</option>
              <option value="priority">Priority Level</option>
              <option value="status">Workflow Status</option>
              <option value="subject">Subject Title</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Complaints Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSortChange('subject')}>
                Tracking ID & Subject
              </th>
              <th>Category</th>
              <th className="sortable" onClick={() => handleSortChange('priority')}>
                Priority
              </th>
              <th className="sortable" onClick={() => handleSortChange('status')}>
                Status
              </th>
              <th className="sortable" onClick={() => handleSortChange('createdAt')}>
                Date Filed
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      border: '3px solid var(--border-color)',
                      borderTopColor: 'var(--primary)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 0.75rem',
                    }}
                  />
                  <span style={{ color: 'var(--text-muted)' }}>Loading complaints...</span>
                </td>
              </tr>
            ) : complaints.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <FileCode2 size={36} color="var(--text-subtle)" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    No matching complaints found
                  </p>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    Try adjusting your search criteria, clearing active filters, or filing a new complaint.
                  </p>
                </td>
              </tr>
            ) : (
              complaints.map((item) => (
                <tr key={item.id} onClick={() => handleRowClick(item)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                      <span className="tracking-badge">{item.trackingId}</span>
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.subject}</div>
                    <div
                      style={{
                        fontSize: '0.785rem',
                        color: 'var(--text-muted)',
                        maxWidth: '480px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.description}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem' }}>{item.category}</span>
                  </td>
                  <td>
                    <PriorityBadge priority={item.priority} />
                  </td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>
                    <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={limit}
        onPageChange={(newPage) => setPage(newPage)}
      />

      {/* Details Drawer / Slide-Over */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedComplaint ? selectedComplaint.trackingId : 'Complaint Details'}
        subtitle={selectedComplaint?.subject}
      >
        {selectedComplaint && (
          <div>
            {/* Action Feedback */}
            {actionMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  fontSize: '0.85rem',
                  backgroundColor:
                    actionMessage.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                  color: actionMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {actionMessage.type === 'success' ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                <span>{actionMessage.text}</span>
              </div>
            )}

            {/* Badges & Meta */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--border-color)',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <StatusBadge status={selectedComplaint.status} />
                <PriorityBadge priority={selectedComplaint.priority} />
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg-surface-alt)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {selectedComplaint.category}
                </span>
              </div>

              {/* Admin Indicator in Drawer */}
              {isAdmin && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    backgroundColor: 'var(--primary-light)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  Admin Mode Active
                </span>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                Description
              </h4>
              <p
                style={{
                  fontSize: '0.925rem',
                  lineHeight: '1.6',
                  color: 'var(--text-main)',
                  backgroundColor: 'var(--bg-surface-alt)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedComplaint.description}
              </p>
            </div>

            {/* Submitter Info Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                backgroundColor: 'var(--bg-surface-alt)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={15} color="var(--text-muted)" />
                <span>{selectedComplaint.fullName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={15} color="var(--text-muted)" />
                <span>{selectedComplaint.email}</span>
              </div>
              {selectedComplaint.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Phone size={15} color="var(--text-muted)" />
                  <span>{selectedComplaint.phone}</span>
                </div>
              )}
              {selectedComplaint.referenceOrLocation && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={15} color="var(--text-muted)" />
                  <span>{selectedComplaint.referenceOrLocation}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={15} color="var(--text-muted)" />
                <span>Filed: {new Date(selectedComplaint.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* ADMIN ACTIONS SECTION (when logged in as admin) */}
            {isAdmin ? (
              <div
                style={{
                  backgroundColor: 'var(--primary-light)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  marginBottom: '1.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <ShieldAlert size={18} color="var(--primary)" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
                    Admin Resolution Controls
                  </h3>
                </div>

                {/* Status Update Form */}
                <form onSubmit={handleUpdateStatusSubmit} style={{ marginBottom: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.825rem' }}>
                      Change Status Workflow:
                    </label>
                    <select
                      className="form-control"
                      value={statusUpdateChoice}
                      onChange={(e) => setStatusUpdateChoice(e.target.value as Status)}
                    >
                      {WORKFLOW_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.825rem' }}>
                      Workflow Remarks / Action Taken (Optional):
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Technician dispatched / Refund approved"
                      value={statusRemarks}
                      onChange={(e) => setStatusRemarks(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={isUpdatingStatus}
                    style={{ width: '100%' }}
                  >
                    {isUpdatingStatus ? 'Updating...' : 'Update Status & Append to Timeline'}
                  </button>
                </form>

                {/* Add Internal Remark */}
                <form onSubmit={handleAddCommentSubmit} style={{ marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.825rem' }}>
                      Add Admin Note / Remark:
                    </label>
                    <textarea
                      rows={2}
                      className="form-control"
                      placeholder="Enter internal comment or resolution note..."
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-secondary btn-sm"
                    disabled={isAddingComment}
                    style={{ width: '100%' }}
                  >
                    <MessageSquare size={14} />
                    {isAddingComment ? 'Posting...' : 'Post Admin Remark'}
                  </button>
                </form>

                {/* Delete Button */}
                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleDeleteComplaint}
                    disabled={isDeleting}
                    style={{ width: '100%' }}
                  >
                    <Trash2 size={14} />
                    {isDeleting ? 'Deleting...' : 'Delete Complaint Permanently'}
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: 'var(--bg-surface-alt)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.5rem',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600 }}>Administrator Actions</h4>
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    Log in as admin to update status, add resolution remarks, or delete complaints.
                  </p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={onOpenAdminLogin}>
                  Sign In
                </button>
              </div>
            )}

            {/* Status Timeline Section */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                Status Progression Timeline
              </h3>
              <Timeline events={selectedComplaint.timeline} />
            </div>

            {/* Comments / Admin Remarks Section */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                Administrative Remarks ({selectedComplaint.comments.length})
              </h3>
              {selectedComplaint.comments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No internal remarks have been logged yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedComplaint.comments.map((cm) => (
                    <div
                      key={cm.id}
                      style={{
                        backgroundColor: 'var(--bg-surface-alt)',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.35rem',
                        }}
                      >
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                          {cm.author}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(cm.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{cm.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
