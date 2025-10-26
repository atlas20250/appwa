import React from 'react';
import { BillStatus } from '../types';

interface BillStatusBadgeProps {
  status: BillStatus;
}

const BillStatusBadge: React.FC<BillStatusBadgeProps> = ({ status }) => {
  const statusStyles: Record<BillStatus, string> = {
    [BillStatus.PAID]: 'bg-green-100 text-green-800',
    [BillStatus.UNPAID]: 'bg-yellow-100 text-yellow-800',
    [BillStatus.OVERDUE]: 'bg-red-100 text-red-800',
    [BillStatus.PENDING_APPROVAL]: 'bg-blue-100 text-blue-800',
  };
  const translations: Record<BillStatus, string> = {
    [BillStatus.PAID]: 'مدفوعة',
    [BillStatus.UNPAID]: 'غير مدفوعة',
    [BillStatus.OVERDUE]: 'متأخرة',
    [BillStatus.PENDING_APPROVAL]: 'قيد المراجعة',
  };
  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status]}`}>
      {translations[status] || status.toUpperCase()}
    </span>
  );
};

export default BillStatusBadge;