import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  TIME_UPDATE_REQUESTED: 'bg-orange-100 text-orange-800',
  CUSTOMER_TIME_REQUESTED: 'bg-orange-100 text-orange-800',
  DELAYED: 'bg-amber-100 text-amber-800',
  RESCHEDULE_REQUESTED: 'bg-blue-100 text-blue-800',
  RESCHEDULED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-600',
  REJECTED: 'bg-red-100 text-red-600',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  TIME_UPDATE_REQUESTED: 'Time Update',
  CUSTOMER_TIME_REQUESTED: 'Customer Late',
  DELAYED: 'Delayed',
  RESCHEDULE_REQUESTED: 'Reschedule',
  RESCHEDULED: 'Rescheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REJECTED: 'Rejected',
};

export function StatusChip({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusStyles[status] || 'bg-gray-100 text-gray-600')}>
      {statusLabels[status] || status}
    </span>
  );
}
