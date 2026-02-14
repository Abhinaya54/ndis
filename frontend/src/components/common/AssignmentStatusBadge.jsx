import React from 'react';
import { Calendar, Clock, Activity } from 'lucide-react';
import { formatAssignmentDisplay } from '../../utils/shiftStatus';

/**
 * AssignmentStatusBadge - Displays date, time, and status for an assignment
 *
 * Props:
 * - assignment: Assignment object with startDate, shift, computedStatus
 * - showDate: boolean (default true) - show date badge
 * - showTime: boolean (default true) - show time badge
 * - showStatus: boolean (default true) - show status badge
 * - size: 'small' | 'medium' | 'large' (default 'medium')
 * - layout: 'inline' | 'stacked' (default 'inline')
 */
const AssignmentStatusBadge = ({
  assignment,
  showDate = true,
  showTime = true,
  showStatus = true,
  size = 'medium',
  layout = 'inline'
}) => {
  if (!assignment) return null;

  const display = formatAssignmentDisplay(assignment);
  if (!display) return null;

  const sizes = {
    small: { padding: '2px 8px', fontSize: '11px', iconSize: 12, gap: '3px' },
    medium: { padding: '4px 12px', fontSize: '12px', iconSize: 14, gap: '4px' },
    large: { padding: '6px 16px', fontSize: '14px', iconSize: 16, gap: '6px' }
  };

  const sizeConfig = sizes[size] || sizes.medium;

  const containerStyle = {
    display: 'flex',
    flexDirection: layout === 'stacked' ? 'column' : 'row',
    alignItems: layout === 'stacked' ? 'flex-start' : 'center',
    gap: layout === 'stacked' ? '6px' : '8px',
    flexWrap: 'wrap'
  };

  const badgeBaseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: sizeConfig.gap,
    padding: sizeConfig.padding,
    borderRadius: '20px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    fontSize: sizeConfig.fontSize
  };

  // Date badge style - neutral gray
  const dateBadgeStyle = {
    ...badgeBaseStyle,
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #e5e7eb'
  };

  // Time badge style - blue tint
  const timeBadgeStyle = {
    ...badgeBaseStyle,
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    border: '1px solid #bfdbfe'
  };

  // Status badge style - dynamic based on status
  const getStatusBadgeStyle = () => {
    const colors = display.statusColor || { bg: '#f3f4f6', text: '#6b7280', border: '#9ca3af' };
    return {
      ...badgeBaseStyle,
      backgroundColor: colors.bg,
      color: colors.text,
      border: `1px solid ${colors.border}`
    };
  };

  return (
    <div style={containerStyle}>
      {/* Date Badge */}
      {showDate && display.date && (
        <span style={dateBadgeStyle}>
          <Calendar size={sizeConfig.iconSize} />
          {display.date}
        </span>
      )}

      {/* Time Badge */}
      {showTime && display.time && (
        <span style={timeBadgeStyle}>
          <Clock size={sizeConfig.iconSize} />
          {display.time}
        </span>
      )}

      {/* Status Badge */}
      {showStatus && display.statusBadge && (
        <span style={getStatusBadgeStyle()}>
          <Activity size={sizeConfig.iconSize} />
          {display.statusBadge}
        </span>
      )}
    </div>
  );
};

/**
 * Compact version for list items - shows just status with icon
 */
export const StatusBadge = ({ status, badge, color, size = 'small' }) => {
  const sizes = {
    small: { padding: '2px 8px', fontSize: '11px' },
    medium: { padding: '4px 12px', fontSize: '12px' },
    large: { padding: '6px 16px', fontSize: '14px' }
  };

  const sizeConfig = sizes[size] || sizes.small;
  const colors = color || { bg: '#f3f4f6', text: '#6b7280', border: '#9ca3af' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: sizeConfig.padding,
        borderRadius: '20px',
        fontWeight: '600',
        whiteSpace: 'nowrap',
        fontSize: sizeConfig.fontSize,
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`
      }}
    >
      {badge || status}
    </span>
  );
};

/**
 * Date display component for shift cards
 */
export const DateBadge = ({ date, relative, size = 'small' }) => {
  const sizes = {
    small: { padding: '2px 8px', fontSize: '11px', iconSize: 12 },
    medium: { padding: '4px 12px', fontSize: '12px', iconSize: 14 },
    large: { padding: '6px 16px', fontSize: '14px', iconSize: 16 }
  };

  const sizeConfig = sizes[size] || sizes.small;

  // Different colors based on relative date
  let bgColor = '#f3f4f6';
  let textColor = '#374151';
  let borderColor = '#e5e7eb';

  if (relative === 'Today') {
    bgColor = '#ecfdf5';
    textColor = '#047857';
    borderColor = '#10b981';
  } else if (relative === 'Tomorrow') {
    bgColor = '#eff6ff';
    textColor = '#1e40af';
    borderColor = '#3b82f6';
  } else if (relative === 'Yesterday') {
    bgColor = '#fef3c7';
    textColor = '#92400e';
    borderColor = '#f59e0b';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: sizeConfig.padding,
        borderRadius: '20px',
        fontWeight: '600',
        whiteSpace: 'nowrap',
        fontSize: sizeConfig.fontSize,
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${borderColor}`
      }}
    >
      <Calendar size={sizeConfig.iconSize} />
      {relative || date}
    </span>
  );
};

export default AssignmentStatusBadge;
