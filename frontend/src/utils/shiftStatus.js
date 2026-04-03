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

  // Find shift definition by label, or parse custom "H:MM AM - H:MM PM" format
  let shift = SHIFTS.find(s => s.label === shiftName) || null;

  if (!shift && shiftName) {
    const match = shiftName.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );
    if (match) {
      const to24 = (h, m, ampm) => {
        let hour = parseInt(h, 10);
        if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
        if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
        return `${String(hour).padStart(2, '0')}:${m}`;
      };
      shift = { startTime: to24(match[1], match[2], match[3]), endTime: to24(match[4], match[5], match[6]) };
    }
  }

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

  // For recurring assignments, always evaluate against today's shift window
  // Use todayStr (Sydney date) as the base date when assignment started in the past
  const shiftDateStr = assignmentDateStr <= todayStr ? todayStr : assignmentDateStr;

  // Get current time in Sydney timezone as minutes since midnight
  const nowSydney = new Date().toLocaleTimeString('en-AU', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false
  });
  const [nowH, nowM] = nowSydney.split(':').map(Number);
  const nowMinutes = nowH * 60 + nowM;
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const isOvernight = endMinutes < startMinutes;

  const isActive = isOvernight
    ? (nowMinutes >= startMinutes || nowMinutes < endMinutes)
    : (nowMinutes >= startMinutes && nowMinutes < endMinutes);

  const isPending = isOvernight
    ? (!isActive && nowMinutes < startMinutes)
    : (nowMinutes < startMinutes);

  if (shiftDateStr > todayStr) {
    const days = Math.ceil((new Date(shiftDateStr) - new Date(todayStr)) / 86400000);
    const badge = days === 1 ? 'Tomorrow' : `Starts in ${days} days`;
    return { status: 'Pending', badge, shiftPhase: 'before', color: STATUS_COLORS.Pending };
  }

  if (isPending) {
    const diffMins = startMinutes - nowMinutes;
    const diffHours = Math.floor(diffMins / 60);
    const remMins = diffMins % 60;
    const badge = diffHours > 0 ? `Starts in ${diffHours}h ${remMins}m` : `Starts in ${diffMins}m`;
    return { status: 'Pending', badge, shiftPhase: 'before', color: STATUS_COLORS.Pending };
  }

  if (isActive) {
    const remaining = isOvernight && nowMinutes >= startMinutes
      ? (1440 - nowMinutes + endMinutes)
      : (endMinutes - nowMinutes);
    const remHours = Math.floor(remaining / 60);
    const remMins = remaining % 60;
    const badge = remHours > 0 ? `${remHours}h ${remMins}m remaining` : `${remMins}m remaining`;
    return { status: 'Current', badge, shiftPhase: 'during', color: STATUS_COLORS.Current };
  }

  // Shift ended today
  const diffMins = nowMinutes - (isOvernight && nowMinutes < endMinutes ? endMinutes + 1440 : endMinutes);
  const diffHoursFinal = Math.floor(Math.abs(diffMins) / 60);
  const remMinsFinal = Math.abs(diffMins) % 60;
  const badge = diffHoursFinal > 0 ? `Ended ${diffHoursFinal}h ${remMinsFinal}m ago` : `Ended ${Math.abs(diffMins)}m ago`;
  return { status: 'Previous', badge, shiftPhase: 'after', color: STATUS_COLORS.Previous };
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
