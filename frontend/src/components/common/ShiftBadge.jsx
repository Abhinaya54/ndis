import React from 'react';
import { SHIFTS, EXTENDED_SHIFTS, SHIFT_COLORS } from '../../constants/shifts';

const ShiftBadge = ({ shiftTime, size = 'medium' }) => {
  const allShifts = [...SHIFTS, ...EXTENDED_SHIFTS];
  const shift = allShifts.find((s) => s.time === shiftTime) || { icon: '⏰', label: shiftTime };

  const sizes = {
    small: { padding: '2px 8px', fontSize: '11px' },
    medium: { padding: '4px 12px', fontSize: '12px' },
    large: { padding: '6px 16px', fontSize: '14px' }
  };

  const getShiftColor = () => {
    if (shiftTime.includes('7:00 AM') || shiftTime.includes('6:00 AM')) return SHIFT_COLORS.morning;
    if (shiftTime.includes('3:00 PM') || shiftTime.includes('2:00 PM')) return SHIFT_COLORS.afternoon;
    if (shiftTime.includes('11:00 PM') || shiftTime.includes('10:00 PM')) return SHIFT_COLORS.night;
    if (shiftTime.includes('Sleepover')) return SHIFT_COLORS.sleepover;
    return SHIFT_COLORS.default;
  };

  const colors = getShiftColor();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: colors.bg,
        color: colors.text,
        borderRadius: '20px',
        fontWeight: '600',
        whiteSpace: 'nowrap',
        ...sizes[size]
      }}
    >
      {shift.icon} {shiftTime}
    </span>
  );
};

export default ShiftBadge;
