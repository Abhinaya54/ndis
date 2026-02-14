// Standard 3-shift model (24/7 care)
export const SHIFTS = [
  { id: 'morning', label: 'Morning Shift', time: '7:00 AM - 3:00 PM', icon: '🌅', code: 'AM' },
  { id: 'afternoon', label: 'Afternoon Shift', time: '3:00 PM - 11:00 PM', icon: '🌆', code: 'PM' },
  { id: 'night', label: 'Night Shift', time: '11:00 PM - 7:00 AM', icon: '🌙', code: 'NIGHT' },
  { id: 'morning_alt', label: 'Morning (Alt)', time: '6:00 AM - 2:00 PM', icon: '🌅', code: 'AM-ALT' },
  { id: 'afternoon_alt', label: 'Afternoon (Alt)', time: '2:00 PM - 10:00 PM', icon: '🌆', code: 'PM-ALT' },
  { id: 'night_alt', label: 'Night (Alt)', time: '10:00 PM - 6:00 AM', icon: '🌙', code: 'NIGHT-ALT' },
  { id: 'sleepover', label: 'Sleepover', time: '10:00 PM - 6:00 AM', icon: '😴', code: 'SLEEP' }
];

export const NOTE_CATEGORIES = [
  { id: 'vital_signs', label: 'Vital Signs', icon: '❤️', color: '#ef4444' },
  { id: 'medication', label: 'Medication', icon: '💊', color: '#3b82f6' },
  { id: 'behaviour', label: 'Behaviour', icon: '🧠', color: '#f97316' },
  { id: 'daily_activity', label: 'Daily Activity', icon: '🏃', color: '#22c55e' },
  { id: 'incident', label: 'Incident', icon: '⚠️', color: '#dc2626' },
  { id: 'general', label: 'General', icon: '📝', color: '#6b7280' }
];

export const TRIP_PURPOSES = [
  { id: 'doctor', label: 'Doctor Visit', icon: '🏥' },
  { id: 'therapy', label: 'Therapy', icon: '🧘' },
  { id: 'community', label: 'Community Access', icon: '🏘️' },
  { id: 'shopping', label: 'Shopping', icon: '🛒' },
  { id: 'other', label: 'Other', icon: '📍' }
];

export const CARE_LEVELS = ['High', 'Medium', 'Low'];

export const NOTE_STATUSES = [
  { id: 'draft', label: 'Draft', icon: '📝', color: '#6b7280' },
  { id: 'pending', label: 'Pending Review', icon: '⏳', color: '#f97316' },
  { id: 'approved', label: 'Approved', icon: '✅', color: '#22c55e' },
  { id: 'rejected', label: 'Rejected', icon: '❌', color: '#ef4444' },
  { id: 'locked', label: 'Locked', icon: '🔒', color: '#7c3aed' }
];

export const TRIP_STATUSES = [
  { id: 'pending', label: 'Pending', icon: '⏳', color: '#f97316' },
  { id: 'approved', label: 'Approved', icon: '✅', color: '#22c55e' },
  { id: 'rejected', label: 'Rejected', icon: '❌', color: '#ef4444' }
];

// Shift rate types
export const SHIFT_RATE_TYPES = [
  { type: 'standard', label: 'Standard', description: 'Weekday 6AM - 8PM', rateMultiplier: 1.0 },
  { type: 'evening', label: 'Evening', description: 'Weekday 8PM - 12AM', rateMultiplier: 1.15 },
  { type: 'night', label: 'Night', description: '12AM - 6AM', rateMultiplier: 1.25 },
  { type: 'saturday', label: 'Saturday', description: 'All day Saturday', rateMultiplier: 1.5 },
  { type: 'sunday', label: 'Sunday', description: 'All day Sunday', rateMultiplier: 2.0 },
  { type: 'public_holiday', label: 'Public Holiday', description: 'All day', rateMultiplier: 2.5 }
];

// Color mapping for shifts
export const SHIFT_COLORS = {
  'morning': { bg: '#fef3c7', text: '#d97706' },
  'afternoon': { bg: '#fed7aa', text: '#ea580c' },
  'night': { bg: '#e0e7ff', text: '#4f46e5' },
  'sleepover': { bg: '#f3e8ff', text: '#9333ea' },
  'morning_alt': { bg: '#fef3c7', text: '#d97706' },
  'afternoon_alt': { bg: '#fed7aa', text: '#ea580c' },
  'night_alt': { bg: '#e0e7ff', text: '#4f46e5' },
  'default': { bg: '#f3f4f6', text: '#6b7280' }
};

// Care level colors
export const CARE_LEVEL_COLORS = {
  'High': { bg: '#fef2f2', text: '#dc2626' },
  'Medium': { bg: '#fff7ed', text: '#ea580c' },
  'Low': { bg: '#f0fdf4', text: '#16a34a' }
};

// Helper functions
export const getShiftByTime = (time) => SHIFTS.find(s => s.time === time);
export const getShiftById = (id) => SHIFTS.find(s => s.id === id);
export const getCategoryById = (id) => NOTE_CATEGORIES.find(c => c.id === id);
export const getCategoryByLabel = (label) => NOTE_CATEGORIES.find(c => c.label === label);
export const getTripPurposeById = (id) => TRIP_PURPOSES.find(p => p.id === id);
export const getStatusById = (id) => NOTE_STATUSES.find(s => s.id === id);

