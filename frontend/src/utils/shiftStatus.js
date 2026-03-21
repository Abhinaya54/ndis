/**
 * Get current time in configured timezone (Australia Eastern Standard Time)
 */
const TIMEZONE = process.env.REACT_APP_TIMEZONE || 'Australia/Sydney';

const getConfiguredTime = () => {
  try {
    const utcDate = new Date();
    const timeString = utcDate.toLocaleString('en-US', { timeZone: TIMEZONE });
    const configDate = new Date(timeString);
    return configDate;
  } catch (e) {
    console.warn(`Invalid timezone: ${TIMEZONE}, falling back to local time`);
    return new Date();
  }
};

/**
 * Extract year/month/day from a date in the configured timezone
 * Avoids setHours(0,0,0,0) which can mismatch across timezones
 */
const getDateParts = (date) => {
  try {
    const parts = new Date(date).toLocaleDateString('en-CA', { timeZone: TIMEZONE }).split('-');
    return { year: parseInt(parts[0]), month: parseInt(parts[1]) - 1, day: parseInt(parts[2]) };
  } catch (e) {
    const d = new Date(date);
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }
};

/**
 * Get assignment status based on DATE + SHIFT TIME
 * Uses IST (Asia/Kolkata) for all comparisons
 */
export const getAssignmentDateStatus = (assignmentDate, shiftTime) => {
  if (!assignmentDate || !shiftTime) {
    return { status: 'Unknown', badge: '❓ UNKNOWN', color: { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' } };
  }

  const now = getConfiguredTime();
  const nowParts = { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  const assignParts = getDateParts(assignmentDate);

  // Compare dates using numeric values (timezone-safe)
  const todayVal = nowParts.year * 10000 + nowParts.month * 100 + nowParts.day;
  const assignVal = assignParts.year * 10000 + assignParts.month * 100 + assignParts.day;
  const isToday = assignVal === todayVal;
  const isFuture = assignVal > todayVal;
  const isPast = assignVal < todayVal;

  // Parse shift time (e.g., "6:00 AM - 2:00 PM")
  const [startStr, endStr] = shiftTime.split(' - ');
  const startTime = parseTimeString(startStr);
  const endTime = parseTimeString(endStr);

  // Compare using minutes since midnight
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const shiftStartMinutes = startTime.hours * 60 + startTime.minutes;
  const shiftEndMinutes = endTime.hours * 60 + endTime.minutes;
  const isOvernight = shiftEndMinutes <= shiftStartMinutes;

  // 1. CHECK IF CURRENT (today AND within shift time)
  let isCurrent = false;
  if (isToday) {
    if (isOvernight) {
      isCurrent = nowMinutes >= shiftStartMinutes || nowMinutes < shiftEndMinutes;
    } else {
      isCurrent = nowMinutes >= shiftStartMinutes && nowMinutes < shiftEndMinutes;
    }
  }

  if (isCurrent) {
    return {
      status: 'Current',
      badge: '✅ CURRENT',
      color: { bg: '#ecfdf5', border: '#10b981', text: '#047857' }
    };
  }

  // 2. CHECK IF PENDING (future OR today before shift starts)
  const isBeforeShift = isToday && nowMinutes < shiftStartMinutes;
  if (isFuture || isBeforeShift) {
    const daysUntil = isFuture
      ? Math.round((new Date(assignParts.year, assignParts.month, assignParts.day) - new Date(nowParts.year, nowParts.month, nowParts.day)) / (1000 * 60 * 60 * 24))
      : 0;
    if (daysUntil === 0) {
      const minutesUntil = shiftStartMinutes - nowMinutes;
      const hoursStr = Math.round((minutesUntil / 60) * 10) / 10;
      return {
        status: 'Pending',
        badge: `⏳ IN ${hoursStr}H`,
        color: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' }
      };
    } else {
      return {
        status: 'Pending',
        badge: `⏳ IN ${daysUntil}D`,
        color: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' }
      };
    }
  }

  // 3. DEFAULT TO PREVIOUS (past date OR shift ended)
  const daysSince = isPast
    ? Math.round((new Date(nowParts.year, nowParts.month, nowParts.day) - new Date(assignParts.year, assignParts.month, assignParts.day)) / (1000 * 60 * 60 * 24))
    : 0;
  return {
    status: 'Previous',
    badge: `🕒 ${daysSince === 0 ? 'ENDED' : daysSince + 'D AGO'}`,
    color: { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' }
  };
};

/**
 * Sort assignments by status priority
 * Order: Current → Pending → Previous
 */
export const sortAssignmentsByDateStatus = (assignments) => {
  const statusPriority = {
    'Current': 0,
    'Pending': 1,
    'Previous': 2
  };

  return [...assignments].sort((a, b) => {
    const aStatus = getAssignmentDateStatus(a.startDate, a.shift).status;
    const bStatus = getAssignmentDateStatus(b.startDate, b.shift).status;
    return (statusPriority[aStatus] || 99) - (statusPriority[bStatus] || 99);
  });
};

/**
 * Get shift status based on current time and shift timing
 * FOR SCHEDULING/SHIFT VIEW - not for assignment date status
 * Returns: { status: 'Active' | 'Completed' | 'Upcoming', color: string, icon: string }
 */
export const getShiftStatus = (shiftTime, shiftDate) => {
  if (!shiftTime || !shiftDate) {
    return { status: 'Unknown', color: '#999', icon: '❓' };
  }

  const now = getConfiguredTime();
  const nowParts = { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  const shiftParts = getDateParts(shiftDate);

  const todayVal = nowParts.year * 10000 + nowParts.month * 100 + nowParts.day;
  const shiftVal = shiftParts.year * 10000 + shiftParts.month * 100 + shiftParts.day;
  const isToday = shiftVal === todayVal;
  const isPast = shiftVal < todayVal;

  const [startStr, endStr] = shiftTime.split(' - ');
  const startTime = parseTimeString(startStr);
  const endTime = parseTimeString(endStr);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const shiftStartMinutes = startTime.hours * 60 + startTime.minutes;
  const shiftEndMinutes = endTime.hours * 60 + endTime.minutes;
  const isOvernight = shiftEndMinutes <= shiftStartMinutes;

  // Check if shift is happening now
  if (isToday) {
    let isActive = false;
    if (isOvernight) {
      isActive = nowMinutes >= shiftStartMinutes || nowMinutes < shiftEndMinutes;
    } else {
      isActive = nowMinutes >= shiftStartMinutes && nowMinutes < shiftEndMinutes;
    }
    if (isActive) {
      return { status: 'Active', color: '#10b981', icon: '🟢', badge: '● ACTIVE' };
    }
    // Today but shift ended
    if (nowMinutes >= shiftEndMinutes && !isOvernight) {
      return { status: 'Completed', color: '#6b7280', icon: '✓', badge: '✓ COMPLETED' };
    }
  }

  // Past date
  if (isPast) {
    return { status: 'Completed', color: '#6b7280', icon: '✓', badge: '✓ COMPLETED' };
  }

  // Upcoming
  const minutesUntil = isToday ? (shiftStartMinutes - nowMinutes) : null;
  const hoursUntilShift = minutesUntil ? minutesUntil / 60 : 24;
  if (hoursUntilShift <= 24) {
    const hoursStr = Math.round(hoursUntilShift * 10) / 10;
    return {
      status: 'Upcoming',
      color: '#f59e0b',
      icon: '⏱️',
      badge: `↑ IN ${hoursStr}H`,
      hours: hoursStr
    };
  }

  // Shift is later (upcoming)
  return { status: 'Future', color: '#9ca3af', icon: '⬆️', badge: '⬆ UPCOMING' };
};

/**
 * Parse time string like "6:00 AM" or "2:00 PM"
 */
const parseTimeString = (timeStr) => {
  const trimmed = timeStr.trim();
  const [time, period] = trimmed.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (period.toUpperCase() === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
};

/**
 * Get status color styling based on status
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'Current':
      return { bg: '#ecfdf5', border: '#10b981', text: '#047857' };
    case 'Pending':
      return { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' };
    case 'Previous':
      return { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' };
    default:
      return { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' };
  }
};

/**
 * Format date for display with relative and absolute formats
 */
export const formatDateForDisplay = (date) => {
  if (!date) return { relative: 'Unknown', short: '', full: '' };

  const d = new Date(date);
  const now = getConfiguredTime();
  const nowParts = { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  const dateParts = getDateParts(date);

  const diffDays = Math.round(
    (new Date(dateParts.year, dateParts.month, dateParts.day) - new Date(nowParts.year, nowParts.month, nowParts.day)) / (1000 * 60 * 60 * 24)
  );

  let relative;
  if (diffDays === 0) {
    relative = 'Today';
  } else if (diffDays === 1) {
    relative = 'Tomorrow';
  } else if (diffDays === -1) {
    relative = 'Yesterday';
  } else if (diffDays < -1) {
    relative = `${Math.abs(diffDays)} days ago`;
  } else {
    relative = `In ${diffDays} days`;
  }

  return {
    relative,
    short: d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }),
    full: d.toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    weekday: d.toLocaleDateString('en-AU', { weekday: 'short' }),
    iso: d.toISOString().split('T')[0]
  };
};

/**
 * Format assignment for display with date, time, and status
 * Combines backend computedStatus (if available) with frontend calculation
 *
 * @param {object} assignment - Assignment object with startDate, shift, and optionally computedStatus
 * @returns {object} Formatted display data { date, fullDate, time, status, statusBadge, statusColor, isActive }
 */
export const formatAssignmentDisplay = (assignment) => {
  if (!assignment) return null;

  // Get date display
  const dateDisplay = formatDateForDisplay(assignment.startDate || assignment.date);

  // Get status - prefer backend computedStatus, fallback to frontend calculation
  let status, statusBadge, statusColor;

  if (assignment.computedStatus) {
    // Use backend-provided status
    status = assignment.computedStatus;
    statusBadge = assignment.statusBadge || status.toUpperCase();
    statusColor = getStatusColor(status);
  } else if (assignment.startDate && assignment.shift) {
    // Calculate on frontend
    const calculated = getAssignmentDateStatus(assignment.startDate, assignment.shift);
    status = calculated.status;
    statusBadge = calculated.badge;
    statusColor = calculated.color;
  } else {
    // Unknown status
    status = 'Unknown';
    statusBadge = 'UNKNOWN';
    statusColor = { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' };
  }

  return {
    date: dateDisplay.relative,
    shortDate: dateDisplay.short,
    fullDate: dateDisplay.full,
    weekday: dateDisplay.weekday,
    time: assignment.shift || assignment.fullShift || `${assignment.startTime} - ${assignment.endTime}`,
    status,
    statusBadge,
    statusColor,
    isActive: status === 'Current',
    shiftPhase: assignment.shiftPhase || (status === 'Current' ? 'active' : status === 'Pending' ? 'upcoming' : 'completed')
  };
};
