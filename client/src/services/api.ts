import type {
  Complaint,
  ComplaintQueryParams,
  CreateComplaintInput,
  PaginatedComplaintsResponse,
  StatsSummary,
  Status,
  ComplaintComment,
  LoginResponse,
} from '../types/index';

const API_BASE = '/api';

/**
 * Helper to handle fetch responses and parse standard error responses
 */
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
    try {
      // [JSON USAGE] Deserializing JSON error response payload: { "error": "message" }
      const data = await res.json();
      if (data && data.error) {
        errorMsg = data.error;
      }
    } catch {
      // Non-JSON response, keep default message
    }
    throw new Error(errorMsg);
  }
  // [JSON USAGE] Parsing JSON response payload
  return res.json() as Promise<T>;
}

/**
 * =========================================================================
 * TYPED API SERVICE LAYER (AJAX & JSON Client)
 * All client-server interactions use standard fetch with async/await (AJAX),
 * avoiding all full page reloads and providing seamless single-page UX.
 * =========================================================================
 */

/**
 * [AJAX USAGE] Fetch paginated and filtered list of complaints
 */
export async function fetchComplaints(
  params: ComplaintQueryParams = {}
): Promise<PaginatedComplaintsResponse> {
  const query = new URLSearchParams();

  if (params.search) query.set('search', params.search);
  if (params.status && params.status !== 'All') query.set('status', params.status);
  if (params.category && params.category !== 'All') query.set('category', params.category);
  if (params.priority && params.priority !== 'All') query.set('priority', params.priority);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const url = `${API_BASE}/complaints?${query.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  return handleResponse<PaginatedComplaintsResponse>(response);
}

/**
 * [AJAX USAGE] Track a single complaint by tracking ID (e.g. CMP-2026-0001)
 */
export async function trackComplaint(trackingId: string): Promise<Complaint> {
  const url = `${API_BASE}/complaints/track/${encodeURIComponent(trackingId.trim())}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  return handleResponse<Complaint>(response);
}

/**
 * [AJAX / JSON USAGE] Submit a new complaint
 */
export async function submitComplaint(data: CreateComplaintInput): Promise<Complaint> {
  const response = await fetch(`${API_BASE}/complaints`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    // [JSON USAGE] Serializing payload to JSON
    body: JSON.stringify(data),
  });

  return handleResponse<Complaint>(response);
}

/**
 * [AJAX / JSON USAGE] Update status of a complaint (Admin only)
 */
export async function updateComplaintStatus(
  id: string,
  status: Status,
  remarks?: string,
  token?: string | null
): Promise<Complaint> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status, remarks }),
  });

  return handleResponse<Complaint>(response);
}

/**
 * [AJAX / JSON USAGE] Add an admin remark/comment to a complaint (Admin only)
 */
export async function addComplaintComment(
  id: string,
  text: string,
  token?: string | null
): Promise<ComplaintComment> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}/comments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text }),
  });

  return handleResponse<ComplaintComment>(response);
}

/**
 * [AJAX USAGE] Delete a complaint (Admin only)
 */
export async function deleteComplaint(
  id: string,
  token?: string | null
): Promise<{ message: string }> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  });

  return handleResponse<{ message: string }>(response);
}

/**
 * [AJAX USAGE] Fetch summary stats for Dashboard cards and charts
 */
export async function fetchStats(): Promise<StatsSummary> {
  const response = await fetch(`${API_BASE}/stats`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  return handleResponse<StatsSummary>(response);
}

/**
 * [XML / AJAX USAGE] Download XML Export file directly via browser Blob or URL
 */
export async function downloadXmlExport(): Promise<void> {
  const response = await fetch(`${API_BASE}/complaints/export/xml`, {
    method: 'GET',
    headers: {
      Accept: 'application/xml, text/xml',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to export XML file from server');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `complaints-export-${new Date().toISOString().slice(0, 10)}.xml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

/**
 * [XML / AJAX USAGE] Upload and import complaints from an XML file
 */
export async function importComplaintsXml(file: File): Promise<{ message: string; count: number }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/complaints/import/xml`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse<{ message: string; count: number }>(response);
}

/**
 * [AJAX / JSON USAGE] Admin login request
 */
export async function loginAdmin(username: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  return handleResponse<LoginResponse>(response);
}
