const TZ = 'Australia/Sydney';
const LOCALE = 'en-AU';

/** Returns today's date string YYYY-MM-DD in Australian time */
export function todayAU() {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ }); // en-CA gives YYYY-MM-DD
}

/** Returns current month string YYYY-MM in Australian time */
export function currentMonthAU() {
  return todayAU().slice(0, 7);
}

/** Formats a date value as a short date: e.g. "25 Mar 2025" */
export function formatDateAU(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString(LOCALE, {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Formats a date with weekday: e.g. "Tue, 25 Mar 2025" */
export function formatDateWithDayAU(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString(LOCALE, {
    timeZone: TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Formats a date with full weekday: e.g. "Tuesday, 25 March 2025" */
export function formatDateFullAU(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString(LOCALE, {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Formats a date as short month+day: e.g. "25 Mar" */
export function formatDateShortAU(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString(LOCALE, {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
  });
}

/** Formats time only: e.g. "02:30 pm" */
export function formatTimeAU(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString(LOCALE, {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Formats date + time: e.g. "25 Mar, 02:30 pm" */
export function formatDateTimeAU(date) {
  if (!date) return '';
  return new Date(date).toLocaleString(LOCALE, {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Formats weekday short: e.g. "Tue" */
export function formatWeekdayAU(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString(LOCALE, {
    timeZone: TZ,
    weekday: 'short',
  });
}

/** Full toLocaleString with no options (general purpose) */
export function toLocaleStringAU(date) {
  if (!date) return '';
  return new Date(date).toLocaleString(LOCALE, { timeZone: TZ });
}

/** Returns a new Date representing "now" but with hours/mins set to
 *  midnight in AU timezone — useful for date-only comparisons */
export function todayMidnightAU() {
  const todayStr = todayAU(); // YYYY-MM-DD in AU
  return new Date(todayStr + 'T00:00:00');
}

/** Formats date as "Mon, 25 Mar" (weekday + short date, no year) */
export function formatDateWeekdayShortAU(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString(LOCALE, {
    timeZone: TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
