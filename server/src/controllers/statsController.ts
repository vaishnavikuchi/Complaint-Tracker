import type { Request, Response } from 'express';
import { complaintService } from '../services/complaintService.js';

/**
 * Controller for Complaint Statistics
 * Handles GET /api/stats
 */
export async function getStats(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await complaintService.getStats();
    res.status(200).json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve statistics';
    res.status(500).json({ error: message });
  }
}
