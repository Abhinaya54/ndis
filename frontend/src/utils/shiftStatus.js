import { SHIFTS } from '../constants/shifts';
import { todayAU } from './dateUtils';

const TZ = 'Australia/Sydney';

/**
 * Determines if a shift is Current, Pending, or Previous
 * based on the assignment's startDate and the shift time range.
 */
const STATUS_COLORS = {
  Current:  { border: '#16a34a', bg: '#f0fdf4', text: '#15803d' },
  Pending:  { border: '#2563eb', bg: '#eff6ff', text: '#1d4ed8' },
  Previous: { border: '#9ca3af', bg: '#f9fafb', text: '#6b7280' },
  Unknown:  { border: '#9ca3af', bg: '#f9fafb', text: '#6b7280' },
};

export function getAssignmentDateStatus(startDate, shiftName) {
  if (!startDate || !shiftName) {
    return { status: 'Unknown', badge: 'Unknown', shiftPhase: null, color: STATUS_COLORS.Unknown };
  }

  const now = new Date();
  // Use AU date string (YYYY-MM-DD) for date-only comparisons
  const todayStr = todayAU();
  const today = new Date(todayStr + 'T00:00:00');

  const assignmentDateStr = new Date(startDate).toLocaleDateString('en-CA', { timeZone: TZ });
  const assignmentDate = new Date(assignmentDateStr + 'T00:00:00');

  // Find shift definition
  const shift = SHIFTS.find(s => s.label === shiftName) || null;

  if (!shift) {
    // Fallback: just compare dates
    if (assignmentDate > today) {
      return { status: 'Pending', badge: 'Upcoming', shiftPhase: 'before', color: STATUS_COLORS.Pending };
    }
    if (assignmentDate < today) {
      return { status: 'Previous', badge: 'Completed', shiftPhase: 'after', color: STATUS_COLORS.Previous };
    }
    return { status: 'Current', badge: 'Active Now', shiftPhase: 'during', color: STATUS_COLORS.Current };
  }

  // Parse shift start and end times
  const [startHour, startMin] = shift.startTime.split(':').map(Number);
  const [endHour, endMin] = shift.endTime.split(':').map(Number);

  const shiftStart = new Date(assignmentDate);
  shiftStart.setHours(startHour, startMin, 0, 0);

  const shiftEnd = new Date(assignmentDate);
  shiftEnd.setHours(endHour, endMin, 0, 0);

  // Handle overnight shifts
  if (endHour < startHour) {
    shiftEnd.setDate(shiftEnd.getDate() + 1);
  }

  if (now < shiftStart) {
    const diffMs = shiftStart - now;
    const diffHours = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);

    let badge;
    if (diffHours > 24) {
      const days = Math.ceil(diffHours / 24);
      badge = `Starts in ${days} day${days > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      badge = `Starts in ${diffHours}h ${diffMins}m`;
    } else {
      badge = `Starts in ${diffMins}m`;
    }

    return { status: 'Pending', badge, shiftPhase: 'before', color: STATUS_COLORS.Pending };
  }

  if (now > shiftEnd) {
    const diffMs = now - shiftEnd;
    const diffHours = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);

    let badge;
    if (diffHours > 24) {
      const days = Math.floor(diffHours / 24);
      badge = `Ended ${days} day${days > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      badge = `Ended ${diffHours}h ${diffMins}m ago`;
    } else {
      badge = `Ended ${diffMins}m ago`;
    }

    return { status: 'Previous', badge, shiftPhase: 'after', color: STATUS_COLORS.Previous };
  }

  // During shift
  const remaining = shiftEnd - now;
  const remHours = Math.floor(remaining / 3600000);
  const remMins = Math.floor((remaining % 3600000) / 60000);
  const badge = remHours > 0 ? `${remHours}h ${remMins}m remaining` : `${remMins}m remaining`;

  return { status: 'Current', badge, shiftPhase: 'during', color: STATUS_COLORS.Current };
}

/**
 * Formats an assignment for display purposes.
 */
export function formatAssignmentDisplay(assignment) {
  if (!assignment) return null;

  const dateInfo = formatDateForDisplay(assignment.startDate);
  const statusInfo = assignment.computedStatus
    ? { status: assignment.computedStatus, badge: assignment.statusBadge }
    : getAssignmentDateStatus(assignment.startDate, assignment.shift);

  let statusColor;
  switch (statusInfo.status) {
    case 'Current':
      statusColor = { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' };
      break;
    case 'Pending':
      statusColor = { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
      break;
    case 'Previous':
      statusColor = { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' };
      break;
    default:
      statusColor = { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' };
  }

  return {
    date: dateInfo.relative,
    fullDate: dateInfo.full,
    shortDate: dateInfo.short,
    status: statusInfo.status,
    badge: statusInfo.badge,
    statusColor
  };
}

/**
 * Formats a date string for display.
 */
export function formatDateForDisplay(dateStr) {
  if (!dateStr) return { relative: 'Unknown', full: 'Unknown', short: 'Unknown' };

  const date = new Date(dateStr);
  const todayStr = todayAU(); // YYYY-MM-DD in AU timezone
  const today = new Date(todayStr + 'T00:00:00');

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnlyStr = date.toLocaleDateString('en-CA', { timeZone: TZ });
  const dateOnly = new Date(dateOnlyStr + 'T00:00:00');

  let relative;
  if (dateOnly.getTime() === today.getTime()) {
    relative = 'Today';
  } else if (dateOnly.getTime() === tomorrow.getTime()) {
    relative = 'Tomorrow';
  } else if (dateOnly.getTime() === yesterday.getTime()) {
    relative = 'Yesterday';
  } else {
    relative = date.toLocaleDateString('en-AU', { timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric' });
  }

  return {
    relative,
    full: date.toLocaleDateString('en-AU', { timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    short: date.toLocaleDateString('en-AU', { timeZone: TZ, month: 'short', day: 'numeric' })
  };
}

/**
 * Sorts assignments by date status (Current first, then Pending, then Previous).
 */
export function sortAssignmentsByDateStatus(assignments) {
  const statusOrder = { Current: 0, Pending: 1, Previous: 2 };

  return [...assignments].sort((a, b) => {
    const statusA = a.computedStatus || getAssignmentDateStatus(a.startDate, a.shift).status;
    const statusB = b.computedStatus || getAssignmentDateStatus(b.startDate, b.shift).status;
    return (statusOrder[statusA] ?? 3) - (statusOrder[statusB] ?? 3);
  });
}
