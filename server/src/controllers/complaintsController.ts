import type { Request, Response } from 'express';
import { complaintService } from '../services/complaintService.js';
import { exportComplaintsToXml, parseComplaintsFromXml } from '../services/xmlService.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type { ComplaintQueryParams, Status, Category, Priority } from '../types/index.js';

/**
 * =========================================================================
 * COMPLAINTS CONTROLLER
 * REST API Endpoints handling JSON, XML, and AJAX operations.
 * =========================================================================
 */

function getParamString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) {
    return param[0] || '';
  }
  return typeof param === 'string' ? param : '';
}

/**
 * GET /api/complaints
 * [AJAX / JSON USAGE] Returns filtered, paginated JSON list of complaints
 */
export async function getComplaints(req: Request, res: Response): Promise<void> {
  try {
    const query: ComplaintQueryParams = {
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      status: typeof req.query.status === 'string' ? (req.query.status as Status | 'All') : undefined,
      category: typeof req.query.category === 'string' ? (req.query.category as Category | 'All') : undefined,
      priority: typeof req.query.priority === 'string' ? (req.query.priority as Priority | 'All') : undefined,
      sortBy: typeof req.query.sortBy === 'string' ? (req.query.sortBy as ComplaintQueryParams['sortBy']) : undefined,
      sortOrder: req.query.sortOrder === 'asc' ? 'asc' : 'desc',
      page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
      limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 10,
    };

    const response = await complaintService.getAll(query);
    res.status(200).json(response);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to retrieve complaints';
    res.status(500).json({ error: msg });
  }
}

/**
 * GET /api/complaints/track/:trackingId
 * [AJAX / JSON USAGE] Looks up a single complaint by tracking ID (e.g. CMP-2026-0001)
 */
export async function getComplaintByTrackingId(req: Request, res: Response): Promise<void> {
  try {
    const trackingId = getParamString(req.params.trackingId);
    if (!trackingId) {
      res.status(400).json({ error: 'Tracking ID is required.' });
      return;
    }

    const complaint = await complaintService.getByTrackingId(trackingId);
    if (!complaint) {
      res.status(404).json({ error: `Complaint with tracking ID '${trackingId}' was not found.` });
      return;
    }

    res.status(200).json(complaint);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error tracking complaint';
    res.status(500).json({ error: msg });
  }
}

/**
 * POST /api/complaints
 * [AJAX / JSON USAGE] Creates a new complaint, generates tracking ID, returns 201 Created
 */
export async function createComplaint(req: Request, res: Response): Promise<void> {
  try {
    const created = await complaintService.create(req.body);
    res.status(201).json(created);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to file complaint';
    res.status(500).json({ error: msg });
  }
}

/**
 * PUT /api/complaints/:id/status
 * [ADMIN] Updates status and appends timeline event
 */
export async function updateComplaintStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = getParamString(req.params.id);
    const { status, remarks } = req.body;
    const actor = req.user ? `Admin (${req.user.username})` : 'Admin (admin)';

    if (!id) {
      res.status(400).json({ error: 'Complaint ID is required.' });
      return;
    }

    const updated = await complaintService.updateStatus(id, status, remarks, actor);
    if (!updated) {
      res.status(404).json({ error: 'Complaint not found.' });
      return;
    }

    res.status(200).json(updated);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to update complaint status';
    res.status(500).json({ error: msg });
  }
}

/**
 * POST /api/complaints/:id/comments
 * [ADMIN] Adds an internal administrative remark / comment
 */
export async function addComplaintComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = getParamString(req.params.id);
    const { text } = req.body;
    const author = req.user ? `Admin (${req.user.username})` : 'Admin (admin)';

    if (!id) {
      res.status(400).json({ error: 'Complaint ID is required.' });
      return;
    }

    const comment = await complaintService.addComment(id, text, author);
    if (!comment) {
      res.status(404).json({ error: 'Complaint not found.' });
      return;
    }

    res.status(201).json(comment);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to add comment';
    res.status(500).json({ error: msg });
  }
}

/**
 * DELETE /api/complaints/:id
 * [ADMIN] Deletes a complaint from the database
 */
export async function deleteComplaint(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = getParamString(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Complaint ID is required.' });
      return;
    }

    const deleted = await complaintService.delete(id);
    if (!deleted) {
      res.status(404).json({ error: 'Complaint not found.' });
      return;
    }

    res.status(200).json({ message: 'Complaint deleted successfully.' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to delete complaint';
    res.status(500).json({ error: msg });
  }
}

/**
 * GET /api/complaints/export/xml
 * [XML USAGE] Exports all complaints as an XML file download
 */
export async function exportXml(_req: Request, res: Response): Promise<void> {
  try {
    const complaints = await complaintService.getRawComplaints();
    const xmlData = exportComplaintsToXml(complaints);

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="complaints-export.xml"');
    res.status(200).send(xmlData);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to export XML';
    res.status(500).json({ error: msg });
  }
}

/**
 * POST /api/complaints/import/xml
 * [XML USAGE] Accepts uploaded XML file (via multer or text/xml payload) and parses it
 */
export async function importXml(req: Request, res: Response): Promise<void> {
  try {
    let xmlContent = '';

    // Check if multipart file upload was provided
    if (req.file && req.file.buffer) {
      xmlContent = req.file.buffer.toString('utf-8');
    } else if (typeof req.body === 'string' && req.body.trim().startsWith('<')) {
      xmlContent = req.body;
    } else if (req.body && typeof req.body.xml === 'string') {
      xmlContent = req.body.xml;
    }

    if (!xmlContent || xmlContent.trim().length === 0) {
      res.status(400).json({ error: 'No XML content or file provided for import.' });
      return;
    }

    const parsedComplaints = parseComplaintsFromXml(xmlContent);
    const count = await complaintService.bulkAdd(parsedComplaints);

    res.status(200).json({
      message: `Successfully imported ${count} complaints from XML.`,
      count,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to parse and import XML document';
    res.status(400).json({ error: msg });
  }
}
