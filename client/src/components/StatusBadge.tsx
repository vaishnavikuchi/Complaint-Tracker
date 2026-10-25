import React from 'react';
import type { Status } from '../types/index';
import { Clock, Eye, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  status: Status;
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'Submitted':
        return { className: 'badge badge-submitted', icon: <Clock size={12} /> };
      case 'In Review':
        return { className: 'badge badge-in-review', icon: <Eye size={12} /> };
      case 'In Progress':
        return { className: 'badge badge-in-progress', icon: <AlertCircle size={12} /> };
      case 'Resolved':
        return { className: 'badge badge-resolved', icon: <CheckCircle2 size={12} /> };
      case 'Rejected':
        return { className: 'badge badge-rejected', icon: <XCircle size={12} /> };
      default:
        return { className: 'badge', icon: null };
    }
  };

  const { className, icon } = getStatusConfig();

  return (
    <span className={className}>
      {icon}
      {status}
    </span>
  );
};
