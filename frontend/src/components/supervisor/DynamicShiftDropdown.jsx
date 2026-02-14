import React, { useState, useEffect } from 'react';
import api from '../../api/api';

/**
 * DynamicShiftDropdown Component
 * 
 * Displays only shift timings that have at least one client assigned across all staff.
 * Updates automatically when assignments change.
 * 
 * Props:
 *  - value: Current selected shift value
 *  - onChange: Callback when shift selection changes
 *  - style: Optional custom styles
 */
const DynamicShiftDropdown = ({ value = 'all', onChange, style = {} }) => {
  const [assignedShifts, setAssignedShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all assignments and extract unique shift timings
  useEffect(() => {
    const fetchAssignedShifts = async () => {
      try {
        setLoading(true);
        console.log('📥 Fetching assignments to get shift timings...');
        
        // Fetch all assignments (active ones)
        const response = await api.get('/api/supervisor/assignments', {
          params: { active: true }
        });
        
        console.log('✅ Assignments response:', response.data);
        
        const assignments = response.data.data || [];
        
        // Extract unique shift timings from assignments
        const shiftsSet = new Set();
        assignments.forEach(assignment => {
          if (assignment.shift) {
            shiftsSet.add(assignment.shift);
          }
        });
        
        // Convert set to sorted array
        const uniqueShifts = Array.from(shiftsSet).sort();
        
        console.log('📊 Unique assigned shifts:', uniqueShifts);
        setAssignedShifts(uniqueShifts);
      } catch (error) {
        console.error('❌ Failed to fetch assigned shifts:', error);
        setAssignedShifts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssignedShifts();
  }, []);

  const defaultSelectStyle = {
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontFamily: 'inherit',
    fontSize: '14px',
    cursor: 'pointer',
    ...style
  };

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={defaultSelectStyle}
      disabled={loading}
    >
      <option value="all">All Shifts</option>
      
      {loading ? (
        <option disabled>Loading shifts...</option>
      ) : assignedShifts.length === 0 ? (
        <option disabled>No shifts assigned</option>
      ) : (
        assignedShifts.map((shift) => (
          <option key={shift} value={shift}>
            {shift}
          </option>
        ))
      )}
    </select>
  );
};

export default DynamicShiftDropdown;
