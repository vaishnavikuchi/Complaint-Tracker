import React from 'react';
import type { Priority } from '../types/index';

interface Props {
  priority: Priority;
}

export const PriorityBadge: React.FC<Props> = ({ priority }) => {
  const getClassName = () => {
    switch (priority) {
      case 'High':
        return 'badge badge-priority-high';
      case 'Medium':
        return 'badge badge-priority-medium';
      case 'Low':
      default:
        return 'badge badge-priority-low';
    }
  };

  return <span className={getClassName()}>{priority}</span>;
};
