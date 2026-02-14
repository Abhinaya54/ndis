import React from 'react';
import { SHIFTS, EXTENDED_SHIFTS } from '../../constants/shifts';

const ShiftSelector = ({
  value,
  onChange,
  extended = false,
  showIcons = true,
  includeAll = false,
  required = false,
  name = 'shift',
  className = ''
}) => {
  const shifts = extended ? EXTENDED_SHIFTS : SHIFTS;

  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className={`shift-selector ${className}`}
      style={{
        padding: '10px 15px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#374151',
        background: 'white',
        minWidth: '200px',
        cursor: 'pointer',
        fontWeight: '500'
      }}
    >
      {includeAll ? (
        <option value="">All Shifts</option>
      ) : (
        <option value="">Select Shift</option>
      )}
      {shifts.map((shift) => (
        <option key={shift.id} value={shift.time}>
          {shift.time}
        </option>
      ))}
    </select>
  );
};

export default ShiftSelector;
