import React from 'react';
import type { TimelineEvent } from '../types/index';
import { StatusBadge } from './StatusBadge';

interface Props {
  events: TimelineEvent[];
}

export const Timeline: React.FC<Props> = ({ events }) => {
  if (!events || events.length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No timeline events recorded.</p>;
  }

  // Format date readable
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="timeline">
      {events.map((event, index) => (
        <div key={index} className="timeline-item">
          <div className="timeline-dot" />
          <div className="timeline-content">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <StatusBadge status={event.status} />
                <span className="timeline-actor">{event.actor}</span>
              </div>
              <span className="timeline-time">{formatDate(event.timestamp)}</span>
            </div>
            {event.remarks && <p className="timeline-remarks">{event.remarks}</p>}
          </div>
        </div>
      ))}
    </div>
  );
};
