export const SHIFTS = [
  { id: 'morning', label: 'Morning (6AM-2PM)', startTime: '06:00', endTime: '14:00', icon: '🌅' },
  { id: 'afternoon', label: 'Afternoon (2PM-10PM)', startTime: '14:00', endTime: '22:00', icon: '☀️' },
  { id: 'night', label: 'Night (10PM-6AM)', startTime: '22:00', endTime: '06:00', icon: '🌙' },
  { id: 'active-night', label: 'Active Night (10PM-6AM)', startTime: '22:00', endTime: '06:00', icon: '🌃' },
  { id: 'sleepover', label: 'Sleepover (10PM-6AM)', startTime: '22:00', endTime: '06:00', icon: '😴' }
];

export const EXTENDED_SHIFTS = [
  ...SHIFTS,
  { id: 'custom-am', label: 'Custom AM', startTime: '07:00', endTime: '15:00', icon: '⏰' },
  { id: 'custom-pm', label: 'Custom PM', startTime: '15:00', endTime: '23:00', icon: '⏰' }
];

export const TRIP_PURPOSES = [
  { id: 'medical', label: 'Medical', icon: '🏥' },
  { id: 'shopping', label: 'Shopping', icon: '🛒' },
  { id: 'community', label: 'Community Access', icon: '🏘️' },
  { id: 'therapy', label: 'Therapy', icon: '💆' },
  { id: 'social', label: 'Social', icon: '👥' },
  { id: 'other', label: 'Other', icon: '📋' }
];

export const TRIP_STATUSES = [
  { label: 'Pending', color: '#f59e0b' },
  { label: 'Approved', color: '#22c55e' },
  { label: 'Rejected', color: '#ef4444' }
];
