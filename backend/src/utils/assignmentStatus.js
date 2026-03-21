/**
 * Shared utility for calculating assignment status dynamically
 * Uses Australia Eastern Standard Time (AEST, Australia/Sydney, UTC+10)
 */

/**
 * Get current time in AEST
 */
const getConfiguredTime = () => {
  const timezone = process.env.TIMEZONE || 'Australia/Sydney';

  try {
    const utcDate = new Date();
    const timeString = utcDate.toLocaleString('en-US', {
      timeZone: timezone
    });
    const configDate = new Date(timeString);
    return configDate;
  } catch (e) {
    console.warn(`Invalid timezone: ${timezone}, falling back to local time`, e);
    return new Date();
  }
};

/**
 * Get timezone offset in milliseconds (AEST = UTC+10)
 * KEPT FOR LEGACY - Use getConfiguredTime() instead
 */
const getTZOffset = () => {
  return 10 * 60 * 60 * 1000; // AEST = UTC+10
};

/**
 * Get a "fake-UTC" Date representing the current moment in IST.
 */
const nowInBusinessTZ = () => new Date(Date.now() + getTZOffset());

/**
 * Normalise a stored date to IST midnight, returned as a comparable timestamp.
 */
const toBusinessTZMidnight = (date) => {
  const shifted = new Date(new Date(date).getTime() + getTZOffset());
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
};

/**
 * Parse time string in format "7:00 AM" or "11:00 PM" to hours/minutes
 */
const parseTimeString = (timeStr) => {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return { hours: 0, minutes: 0 };

  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return { hours, minutes };
};

/**
 * Calculate assignment status dynamically based on date and shift time
 * Uses configured timezone for all date comparisons to avoid mismatches
 */
// eslint-disable-next-line no-unused-vars
const calculateDynamicStatus = (startDate, _endDate, shift) => {
  try {
    if (!shift || !shift.includes(' - ')) {
      return {
        status: 'Unknown',
        badge: 'INVALID',
        shiftPhase: 'unknown',
        isActive: false
      };
    }

    const now = getConfiguredTime();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth();
    const nowDate = now.getDate();

    // Normalize assignment date to the configured timezone
    const rawAssignDate = new Date(startDate);
    const timezone = process.env.TIMEZONE || 'Australia/Sydney';
    let assignYear, assignMonth, assignDate;
    try {
      // Extract year/month/day in the configured timezone
      const parts = rawAssignDate.toLocaleDateString('en-CA', { timeZone: timezone }).split('-');
      assignYear = parseInt(parts[0]);
      assignMonth = parseInt(parts[1]) - 1;
      assignDate = parseInt(parts[2]);
    } catch (e) {
      // Fallback: use local date fields
      assignYear = rawAssignDate.getFullYear();
      assignMonth = rawAssignDate.getMonth();
      assignDate = rawAssignDate.getDate();
    }

    // Compare dates using year/month/day numbers (no timezone ambiguity)
    const isToday = assignYear === nowYear && assignMonth === nowMonth && assignDate === nowDate;
    const assignDayValue = assignYear * 10000 + assignMonth * 100 + assignDate;
    const todayValue = nowYear * 10000 + nowMonth * 100 + nowDate;
    const isFuture = assignDayValue > todayValue;
    const isPast = assignDayValue < todayValue;

    const [startStr, endStr] = shift.split(' - ');
    const startTime = parseTimeString(startStr);
    const endTime = parseTimeString(endStr);

    // Calculate shift start/end as minutes since midnight for comparison
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const shiftStartMinutes = startTime.hours * 60 + startTime.minutes;
    let shiftEndMinutes = endTime.hours * 60 + endTime.minutes;

    // Handle overnight shifts (e.g., 10:00 PM - 6:00 AM)
    const isOvernight = shiftEndMinutes <= shiftStartMinutes;

    // Current: Today AND within shift times
    let isCurrent = false;
    if (isToday) {
      if (isOvernight) {
        // Overnight shift: current if after start OR before end
        isCurrent = nowMinutes >= shiftStartMinutes || nowMinutes < shiftEndMinutes;
      } else {
        isCurrent = nowMinutes >= shiftStartMinutes && nowMinutes < shiftEndMinutes;
      }
    }

    if (isCurrent) {
      const remainMinutes = isOvernight
        ? (nowMinutes >= shiftStartMinutes ? (1440 - nowMinutes + shiftEndMinutes) : (shiftEndMinutes - nowMinutes))
        : (shiftEndMinutes - nowMinutes);
      const hoursRemaining = Math.ceil(remainMinutes / 60);
      return {
        status: 'Current',
        badge: 'IN PROGRESS',
        shiftPhase: 'active',
        isActive: true,
        hoursRemaining
      };
    }

    // Upcoming: Future date OR today before shift starts
    const isBeforeShift = isToday && nowMinutes < shiftStartMinutes;
    if (isFuture || isBeforeShift) {
      const daysUntil = isFuture
        ? Math.round((new Date(assignYear, assignMonth, assignDate) - new Date(nowYear, nowMonth, nowDate)) / (1000 * 60 * 60 * 24))
        : 0;
      const hoursUntil = isBeforeShift ? Math.ceil((shiftStartMinutes - nowMinutes) / 60) : daysUntil * 24;

      let badge;
      if (daysUntil === 0) {
        badge = hoursUntil <= 12 ? `IN ${hoursUntil}H` : 'TODAY';
      } else if (daysUntil === 1) {
        badge = 'TOMORROW';
      } else {
        badge = `IN ${daysUntil}D`;
      }

      return {
        status: 'Pending',
        badge,
        shiftPhase: 'upcoming',
        isActive: true,
        daysUntil
      };
    }

    // Previous: Past date OR today after shift ended
    const daysSince = isPast
      ? Math.round((new Date(nowYear, nowMonth, nowDate) - new Date(assignYear, assignMonth, assignDate)) / (1000 * 60 * 60 * 24))
      : 0;
    let badge;

    if (daysSince === 0) {
      badge = 'COMPLETED';
    } else if (daysSince === 1) {
      badge = 'YESTERDAY';
    } else {
      badge = `${daysSince}D AGO`;
    }

    return {
      status: 'Previous',
      badge,
      shiftPhase: 'completed',
      isActive: false,
      daysSince
    };
  } catch (error) {
    console.error('Error calculating assignment status:', error);
    return {
      status: 'Unknown',
      badge: 'ERROR',
      shiftPhase: 'unknown',
      isActive: false
    };
  }
};

/**
 * Simple status calculation (returns string only)
 */
const calculateSimpleStatus = (startDate, shift) => {
  const result = calculateDynamicStatus(startDate, null, shift);
  return result.status;
};

/**
 * Format date for display
 */
const formatDateDisplay = (date) => {
  const d = new Date(date);
  const nowAET = nowInBusinessTZ();
  const today = new Date(Date.UTC(nowAET.getUTCFullYear(), nowAET.getUTCMonth(), nowAET.getUTCDate()));
  const dateDay = toBusinessTZMidnight(d);

  const diffDays = Math.floor((dateDay - today) / (1000 * 60 * 60 * 24));

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
    short: d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }),
    full: d.toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    relative,
    iso: d.toISOString().split('T')[0]
  };
};

module.exports = {
  calculateDynamicStatus,
  calculateSimpleStatus,
  formatDateDisplay,
  parseTimeString
};
