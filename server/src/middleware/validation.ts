import type { Request, Response, NextFunction } from 'express';
import type { Category, Priority, Status } from '../types/index.js';

const VALID_CATEGORIES: Category[] = [
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

const VALID_PRIORITIES: Priority[] = ['Low', 'Medium', 'High'];

const VALID_STATUSES: Status[] = ['Submitted', 'In Review', 'In Progress', 'Resolved', 'Rejected'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validation middleware for creating a complaint
 */
export function validateCreateComplaint(req: Request, res: Response, next: NextFunction): void {
  const { subject, description, category, priority, fullName, email } = req.body;
  const errors: string[] = [];

  if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
    errors.push('Subject is required and must be at least 3 characters.');
  }

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    errors.push('Description is required and must be at least 10 characters.');
  }

  if (!category || !VALID_CATEGORIES.includes(category as Category)) {
    errors.push(`Category must be one of: ${VALID_CATEGORIES.join(', ')}.`);
  }

  if (!priority || !VALID_PRIORITIES.includes(priority as Priority)) {
    errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}.`);
  }

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    errors.push('Full name is required and must be at least 2 characters.');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (errors.length > 0) {
    res.status(400).json({ error: errors.join(' ') });
    return;
  }

  next();
}

/**
 * Validation middleware for updating complaint status
 */
export function validateUpdateStatus(req: Request, res: Response, next: NextFunction): void {
  const { status } = req.body;

  if (!status || !VALID_STATUSES.includes(status as Status)) {
    res.status(400).json({
      error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.`,
    });
    return;
  }

  next();
}

/**
 * Validation middleware for adding admin remarks/comments
 */
export function validateAddComment(req: Request, res: Response, next: NextFunction): void {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({ error: 'Comment text cannot be empty.' });
    return;
  }

  next();
}
