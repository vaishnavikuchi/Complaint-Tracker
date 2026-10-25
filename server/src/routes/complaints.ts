import { Router } from 'express';
import multer from 'multer';
import {
  getComplaints,
  getComplaintByTrackingId,
  createComplaint,
  updateComplaintStatus,
  addComplaintComment,
  deleteComplaint,
  exportXml,
  importXml,
} from '../controllers/complaintsController.js';
import { requireAdmin } from '../middleware/auth.js';
import {
  validateCreateComplaint,
  validateUpdateStatus,
  validateAddComment,
} from '../middleware/validation.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// XML Export and Import routes (placed ahead of parameter routes)
router.get('/export/xml', exportXml);
router.post('/import/xml', upload.single('file'), importXml);

// Tracking route
router.get('/track/:trackingId', getComplaintByTrackingId);

// Collection routes
router.get('/', getComplaints);
router.post('/', validateCreateComplaint, createComplaint);

// Item routes (Admin protected)
router.put('/:id/status', requireAdmin, validateUpdateStatus, updateComplaintStatus);
router.post('/:id/comments', requireAdmin, validateAddComment, addComplaintComment);
router.delete('/:id', requireAdmin, deleteComplaint);

export default router;
