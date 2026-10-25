// ==========================================
// SHARED TYPESCRIPT DEFINITIONS (Strict Mode)
// Shared between Client and Server
// ==========================================

export type Status = 'Submitted' | 'In Review' | 'In Progress' | 'Resolved' | 'Rejected';

export type Priority = 'Low' | 'Medium' | 'High';

export type Category =
  | 'Product'
  | 'Service'
  | 'Billing/Payment'
  | 'Facilities'
  | 'Staff Behavior'
  | 'Delivery/Transport'
  | 'Safety'
  | 'Online/Technical'
  | 'Other';

export interface TimelineEvent {
  status: Status;
  timestamp: string; // ISO 8601 string
  actor: string;    // e.g. "User", "Admin (admin)", "System"
  remarks?: string;
}

export interface ComplaintComment {
  id: string;
  author: string;
  text: string;
  createdAt: string; // ISO 8601 string
}

export interface Complaint {
  id: string;
  trackingId: string;
  subject: string;
  description: string;
  category: Category;
  priority: Priority;
  fullName: string;
  email: string;
  phone?: string;
  referenceOrLocation?: string;
  status: Status;
  timeline: TimelineEvent[];
  comments: ComplaintComment[];
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
}

// Request payload when submitting a complaint
export interface CreateComplaintInput {
  subject: string;
  description: string;
  category: Category;
  priority: Priority;
  fullName: string;
  email: string;
  phone?: string;
  referenceOrLocation?: string;
}

// Request payload when admin updates status
export interface UpdateStatusInput {
  status: Status;
  remarks?: string;
}

// Request payload when admin adds a comment
export interface AddCommentInput {
  text: string;
}

// Stats response structure
export interface StatsSummary {
  total: number;
  byStatus: Record<Status, number>;
  byCategory: { category: Category; count: number }[];
  byPriority: Record<Priority, number>;
}

// Paginated query params
export interface ComplaintQueryParams {
  search?: string;
  status?: Status | 'All';
  category?: Category | 'All';
  priority?: Priority | 'All';
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'subject';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Paginated API response format
export interface PaginatedComplaintsResponse {
  data: Complaint[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Standard API Error
export interface ApiErrorResponse {
  error: string;
  details?: string[];
}

// Auth credentials & token response
export interface LoginResponse {
  token: string;
  user: {
    username: string;
    role: 'admin';
  };
}
