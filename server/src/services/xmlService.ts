import { XMLParser } from 'fast-xml-parser';
import { v4 as uuidv4 } from 'uuid';
import type {
  Complaint,
  Category,
  Priority,
  Status,
  TimelineEvent,
  ComplaintComment,
} from '../types/index.js';

/**
 * =========================================================================
 * XML PARSING & GENERATION SERVICE
 * Technology Requirement: XML export and import capabilities.
 * - Well-formed XML generation for complaint export.
 * - Server-side XML parsing for importing complaints into the system.
 * =========================================================================
 */

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

/**
 * [XML USAGE] Generates a well-formed XML string representing complaints
 */
export function exportComplaintsToXml(complaints: Complaint[]): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<!-- Complaint Tracker System Export -->');
  lines.push('<complaints>');

  for (const c of complaints) {
    lines.push('  <complaint>');
    lines.push(`    <id>${escapeXml(c.id)}</id>`);
    lines.push(`    <trackingId>${escapeXml(c.trackingId)}</trackingId>`);
    lines.push(`    <subject>${escapeXml(c.subject)}</subject>`);
    lines.push(`    <description>${escapeXml(c.description)}</description>`);
    lines.push(`    <category>${escapeXml(c.category)}</category>`);
    lines.push(`    <priority>${escapeXml(c.priority)}</priority>`);
    lines.push(`    <fullName>${escapeXml(c.fullName)}</fullName>`);
    lines.push(`    <email>${escapeXml(c.email)}</email>`);
    if (c.phone) {
      lines.push(`    <phone>${escapeXml(c.phone)}</phone>`);
    }
    if (c.referenceOrLocation) {
      lines.push(`    <referenceOrLocation>${escapeXml(c.referenceOrLocation)}</referenceOrLocation>`);
    }
    lines.push(`    <status>${escapeXml(c.status)}</status>`);
    lines.push(`    <createdAt>${escapeXml(c.createdAt)}</createdAt>`);
    lines.push(`    <updatedAt>${escapeXml(c.updatedAt)}</updatedAt>`);

    // Timeline nodes
    if (c.timeline && c.timeline.length > 0) {
      lines.push('    <timeline>');
      for (const t of c.timeline) {
        lines.push('      <event>');
        lines.push(`        <status>${escapeXml(t.status)}</status>`);
        lines.push(`        <timestamp>${escapeXml(t.timestamp)}</timestamp>`);
        lines.push(`        <actor>${escapeXml(t.actor)}</actor>`);
        if (t.remarks) {
          lines.push(`        <remarks>${escapeXml(t.remarks)}</remarks>`);
        }
        lines.push('      </event>');
      }
      lines.push('    </timeline>');
    } else {
      lines.push('    <timeline />');
    }

    // Comments nodes
    if (c.comments && c.comments.length > 0) {
      lines.push('    <comments>');
      for (const comm of c.comments) {
        lines.push('      <comment>');
        lines.push(`        <id>${escapeXml(comm.id)}</id>`);
        lines.push(`        <author>${escapeXml(comm.author)}</author>`);
        lines.push(`        <text>${escapeXml(comm.text)}</text>`);
        lines.push(`        <createdAt>${escapeXml(comm.createdAt)}</createdAt>`);
        lines.push('      </comment>');
      }
      lines.push('    </comments>');
    } else {
      lines.push('    <comments />');
    }

    lines.push('  </complaint>');
  }

  lines.push('</complaints>');
  return lines.join('\n');
}

/**
 * [XML USAGE] Parses uploaded XML string into an array of typed Complaint objects
 */
export function parseComplaintsFromXml(xmlContent: string): Complaint[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    trimValues: true,
    parseTagValue: false, // Keep as strings
  });

  const parsed = parser.parse(xmlContent);

  if (!parsed || !parsed.complaints) {
    throw new Error('Invalid XML document: missing <complaints> root element');
  }

  const rawComplaints = parsed.complaints.complaint;
  if (!rawComplaints) {
    return []; // Valid but empty
  }

  // fast-xml-parser returns single object if 1 child, array if multiple
  const items = Array.isArray(rawComplaints) ? rawComplaints : [rawComplaints];
  const validCategories: Category[] = [
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

  const validStatuses: Status[] = ['Submitted', 'In Review', 'In Progress', 'Resolved', 'Rejected'];
  const validPriorities: Priority[] = ['Low', 'Medium', 'High'];

  const results: Complaint[] = [];

  for (const item of items) {
    if (!item.subject || !item.description || !item.fullName || !item.email) {
      throw new Error('XML parsing failed: Complaint missing required fields (subject, description, fullName, email)');
    }

    const category: Category = validCategories.includes(item.category) ? item.category : 'Other';
    const status: Status = validStatuses.includes(item.status) ? item.status : 'Submitted';
    const priority: Priority = validPriorities.includes(item.priority) ? item.priority : 'Medium';

    const now = new Date().toISOString();
    const createdAt = item.createdAt || now;
    const updatedAt = item.updatedAt || now;

    // Parse timeline
    const timeline: TimelineEvent[] = [];
    if (item.timeline && item.timeline.event) {
      const events = Array.isArray(item.timeline.event) ? item.timeline.event : [item.timeline.event];
      for (const ev of events) {
        timeline.push({
          status: validStatuses.includes(ev.status) ? ev.status : status,
          timestamp: ev.timestamp || createdAt,
          actor: ev.actor || 'System',
          remarks: ev.remarks || undefined,
        });
      }
    }

    // Default timeline if empty
    if (timeline.length === 0) {
      timeline.push({
        status,
        timestamp: createdAt,
        actor: 'XML Import',
        remarks: 'Imported from XML file.',
      });
    }

    // Parse comments
    const comments: ComplaintComment[] = [];
    if (item.comments && item.comments.comment) {
      const comms = Array.isArray(item.comments.comment) ? item.comments.comment : [item.comments.comment];
      for (const cm of comms) {
        comments.push({
          id: cm.id || uuidv4(),
          author: cm.author || 'Admin (admin)',
          text: cm.text || '',
          createdAt: cm.createdAt || createdAt,
        });
      }
    }

    const complaint: Complaint = {
      id: item.id || uuidv4(),
      trackingId: item.trackingId || `CMP-2026-IMP${Math.floor(1000 + Math.random() * 9000)}`,
      subject: String(item.subject),
      description: String(item.description),
      category,
      priority,
      fullName: String(item.fullName),
      email: String(item.email),
      phone: item.phone ? String(item.phone) : undefined,
      referenceOrLocation: item.referenceOrLocation ? String(item.referenceOrLocation) : undefined,
      status,
      timeline,
      comments,
      createdAt,
      updatedAt,
    };

    results.push(complaint);
  }

  return results;
}
