import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v4 as uuidv4 } from 'uuid';
import type {
  Complaint,
  CreateComplaintInput,
  Status,
  Priority,
  Category,
  ComplaintComment,
  StatsSummary,
  ComplaintQueryParams,
  PaginatedComplaintsResponse,
} from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE_PATH = path.resolve(__dirname, '../../data/complaints.json');

/**
 * =========================================================================
 * JSON PERSISTENCE & IN-MEMORY COMPLAINT SERVICE
 * Technology Requirement: JSON data stored in memory & persisted to fs.
 * No relational or NoSQL database is used. All storage operations read/write
 * structured JSON data from/to data/complaints.json using Node.js fs module.
 * =========================================================================
 */
class ComplaintService {
  private complaints: Complaint[] = [];
  private isLoaded = false;

  constructor() {
    this.init();
  }

  /**
   * Initializes memory store by reading data/complaints.json (JSON parsing)
   */
  private async init(): Promise<void> {
    try {
      const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
      // [JSON USAGE] Deserializing JSON text from disk into in-memory typed Complaint objects
      this.complaints = JSON.parse(data) as Complaint[];
      this.isLoaded = true;
      console.log(`[ComplaintService] Loaded ${this.complaints.length} complaints from ${DATA_FILE_PATH}`);
    } catch (err: unknown) {
      console.warn(`[ComplaintService] Could not load ${DATA_FILE_PATH}, creating empty array. Error:`, err);
      this.complaints = [];
      await this.persist();
      this.isLoaded = true;
    }
  }

  private async ensureLoaded(): Promise<void> {
    if (!this.isLoaded) {
      await this.init();
    }
  }

  /**
   * [JSON USAGE] Serializes in-memory array of complaints into JSON format
   * and persists it to data/complaints.json.
   */
  private async persist(): Promise<void> {
    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
      const jsonContent = JSON.stringify(this.complaints, null, 2);
      await fs.writeFile(DATA_FILE_PATH, jsonContent, 'utf-8');
    } catch (error) {
      console.error('[ComplaintService] Error persisting complaints to JSON file:', error);
      throw new Error('Failed to persist complaint data to JSON file');
    }
  }

  /**
   * Generates a unique tracking ID, e.g., CMP-2026-0001
   */
  public generateTrackingId(): string {
    const year = new Date().getFullYear();
    // Count existing complaints for this year to make sequential IDs
    const regex = new RegExp(`^CMP-${year}-(\\d{4})$`);
    let maxSeq = 0;
    for (const c of this.complaints) {
      const match = c.trackingId.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) {
          maxSeq = num;
        }
      }
    }
    const nextSeq = maxSeq + 1;
    const padded = String(nextSeq).padStart(4, '0');
    return `CMP-${year}-${padded}`;
  }

  /**
   * Retrieve all complaints with search, filtering, sorting, and pagination
   */
  public async getAll(params: ComplaintQueryParams): Promise<PaginatedComplaintsResponse> {
    await this.ensureLoaded();

    let result = [...this.complaints];

    // Filter by search query (subject, description, trackingId, fullName, email, referenceOrLocation)
    if (params.search && params.search.trim().length > 0) {
      const query = params.search.trim().toLowerCase();
      result = result.filter((c) =>
        c.subject.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.trackingId.toLowerCase().includes(query) ||
        c.fullName.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        (c.referenceOrLocation && c.referenceOrLocation.toLowerCase().includes(query))
      );
    }

    // Filter by status
    if (params.status && params.status !== 'All') {
      result = result.filter((c) => c.status === params.status);
    }

    // Filter by category
    if (params.category && params.category !== 'All') {
      result = result.filter((c) => c.category === params.category);
    }

    // Filter by priority
    if (params.priority && params.priority !== 'All') {
      result = result.filter((c) => c.priority === params.priority);
    }

    // Sorting
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'priority') {
        const priorityRank: Record<Priority, number> = { High: 3, Medium: 2, Low: 1 };
        comparison = priorityRank[a.priority] - priorityRank[b.priority];
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (sortBy === 'subject') {
        comparison = a.subject.localeCompare(b.subject);
      } else if (sortBy === 'updatedAt') {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else {
        // Default createdAt
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    const total = result.length;
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 10));
    const totalPages = Math.ceil(total / limit) || 1;

    const startIndex = (page - 1) * limit;
    const paginatedData = result.slice(startIndex, startIndex + limit);

    return {
      data: paginatedData,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Retrieve all complaints raw (used for XML export)
   */
  public async getRawComplaints(): Promise<Complaint[]> {
    await this.ensureLoaded();
    return [...this.complaints];
  }

  /**
   * Find complaint by internal ID
   */
  public async getById(id: string): Promise<Complaint | undefined> {
    await this.ensureLoaded();
    return this.complaints.find((c) => c.id === id);
  }

  /**
   * Find complaint by tracking ID (case-insensitive)
   */
  public async getByTrackingId(trackingId: string): Promise<Complaint | undefined> {
    await this.ensureLoaded();
    const cleanId = trackingId.trim().toUpperCase();
    return this.complaints.find((c) => c.trackingId.toUpperCase() === cleanId);
  }

  /**
   * Create a new complaint and persist to JSON
   */
  public async create(input: CreateComplaintInput): Promise<Complaint> {
    await this.ensureLoaded();
    const now = new Date().toISOString();
    const trackingId = this.generateTrackingId();

    const newComplaint: Complaint = {
      id: uuidv4(),
      trackingId,
      subject: input.subject.trim(),
      description: input.description.trim(),
      category: input.category,
      priority: input.priority,
      fullName: input.fullName.trim(),
      email: input.email.trim(),
      phone: input.phone?.trim() || undefined,
      referenceOrLocation: input.referenceOrLocation?.trim() || undefined,
      status: 'Submitted',
      timeline: [
        {
          status: 'Submitted',
          timestamp: now,
          actor: input.fullName.trim(),
          remarks: 'Complaint filed successfully into the tracker.',
        },
      ],
      comments: [],
      createdAt: now,
      updatedAt: now,
    };

    this.complaints.unshift(newComplaint);
    await this.persist();
    return newComplaint;
  }

  /**
   * Update complaint status with timeline entry and persist to JSON
   */
  public async updateStatus(
    id: string,
    status: Status,
    remarks?: string,
    actor = 'Admin (admin)'
  ): Promise<Complaint | null> {
    await this.ensureLoaded();
    const index = this.complaints.findIndex((c) => c.id === id);
    if (index === -1) {
      return null;
    }

    const complaint = this.complaints[index];
    if (!complaint) return null;

    const now = new Date().toISOString();

    complaint.status = status;
    complaint.updatedAt = now;
    complaint.timeline.push({
      status,
      timestamp: now,
      actor,
      remarks: remarks?.trim() || `Status updated to ${status}.`,
    });

    this.complaints[index] = complaint;
    await this.persist();
    return complaint;
  }

  /**
   * Add a remark/comment to a complaint and persist to JSON
   */
  public async addComment(
    id: string,
    text: string,
    author = 'Admin (admin)'
  ): Promise<ComplaintComment | null> {
    await this.ensureLoaded();
    const index = this.complaints.findIndex((c) => c.id === id);
    if (index === -1) {
      return null;
    }

    const complaint = this.complaints[index];
    if (!complaint) return null;

    const now = new Date().toISOString();
    const newComment: ComplaintComment = {
      id: uuidv4(),
      author,
      text: text.trim(),
      createdAt: now,
    };

    complaint.comments.push(newComment);
    complaint.updatedAt = now;

    this.complaints[index] = complaint;
    await this.persist();
    return newComment;
  }

  /**
   * Delete a complaint and persist to JSON
   */
  public async delete(id: string): Promise<boolean> {
    await this.ensureLoaded();
    const initialLen = this.complaints.length;
    this.complaints = this.complaints.filter((c) => c.id !== id);

    if (this.complaints.length !== initialLen) {
      await this.persist();
      return true;
    }
    return false;
  }

  /**
   * Calculate aggregated statistics for Dashboard cards & category charts
   */
  public async getStats(): Promise<StatsSummary> {
    await this.ensureLoaded();

    const byStatus: Record<Status, number> = {
      Submitted: 0,
      'In Review': 0,
      'In Progress': 0,
      Resolved: 0,
      Rejected: 0,
    };

    const byPriority: Record<Priority, number> = {
      Low: 0,
      Medium: 0,
      High: 0,
    };

    const categoryMap = new Map<Category, number>();
    const allCategories: Category[] = [
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

    allCategories.forEach((cat) => categoryMap.set(cat, 0));

    for (const c of this.complaints) {
      if (byStatus[c.status] !== undefined) {
        byStatus[c.status]++;
      }
      if (byPriority[c.priority] !== undefined) {
        byPriority[c.priority]++;
      }
      const count = categoryMap.get(c.category) || 0;
      categoryMap.set(c.category, count + 1);
    }

    const byCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count,
    }));

    return {
      total: this.complaints.length,
      byStatus,
      byCategory,
      byPriority,
    };
  }

  /**
   * Bulk add complaints (used during XML import)
   */
  public async bulkAdd(incoming: Complaint[]): Promise<number> {
    await this.ensureLoaded();
    let addedCount = 0;

    for (const item of incoming) {
      // If trackingId already exists, generate a new one or keep unique
      const existing = this.complaints.find((c) => c.trackingId === item.trackingId || c.id === item.id);
      if (existing) {
        item.id = uuidv4();
        item.trackingId = this.generateTrackingId();
      }
      this.complaints.unshift(item);
      addedCount++;
    }

    if (addedCount > 0) {
      await this.persist();
    }
    return addedCount;
  }
}

export const complaintService = new ComplaintService();
