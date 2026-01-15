'use client';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export default function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  // Auto-detect variant from status
  let finalVariant = variant;
  if (variant === 'default') {
    const upperStatus = status.toUpperCase();
    if (upperStatus.includes('ACTIVE') || upperStatus.includes('APPROVED')) {
      finalVariant = 'success';
    } else if (upperStatus.includes('PENDING')) {
      finalVariant = 'warning';
    } else if (upperStatus.includes('REJECTED') || upperStatus.includes('INACTIVE') || upperStatus === 'STOP') {
      finalVariant = 'danger';
    }
  }
  
  // Display INACTIVE instead of STOP for better UX
  const displayStatus = status.toUpperCase() === 'STOP' ? 'INACTIVE' : status;

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
        variantClasses[finalVariant]
      }`}
    >
      {displayStatus}
    </span>
  );
}
