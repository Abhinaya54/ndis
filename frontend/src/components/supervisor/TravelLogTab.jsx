import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/api';
import { currentMonthAU } from '../../utils/dateUtils';

const TravelLogTab = () => {
  const [trips, setTrips] = useState([]);
  const [filters, setFilters] = useState({
    status: 'pending',
    month: currentMonthAU()
  });

  const fetchTrips = useCallback(async () => {
    try {
      const response = await api.get('/api/supervisor/trips', { params: filters });
      setTrips(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch trips:', error);
    }
  }, [filters]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleVerifyTrip = async (tripId) => {
    try {
      await api.put(`/api/supervisor/trips/${tripId}/verify`);
      fetchTrips();
    } catch (error) {
      console.error('Failed to verify trip:', error);
    }
  };

  const handleRejectTrip = async (tripId) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      try {
        await api.put(`/api/supervisor/trips/${tripId}/reject`, { rejectionReason: reason });
        fetchTrips();
      } catch (error) {
        console.error('Failed to reject trip:', error);
      }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Travel Log Verification</h2>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>

        <input
          type="month"
          value={filters.month}
          onChange={(e) => setFilters({...filters, month: e.target.value})}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
        />
      </div>

      {trips.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#999', paddingTop: '40px' }}>
          No trips found
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {trips.map(trip => (
            <div key={trip._id} style={{
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#fafafa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px 0', fontWeight: '600' }}>
                    {trip.clientName || 'Unknown Client'} • {trip.staffName || 'Unknown Staff'}
                  </p>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>
                    {new Date(trip.tripDate).toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' })} • {trip.startTime} - {trip.endTime}
                  </p>
                </div>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: trip.status === 'approved' ? '#dcfce7' : 
                                   trip.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                  color: trip.status === 'approved' ? '#15803d' : 
                         trip.status === 'rejected' ? '#991b1b' : '#92400e'
                }}>
                  {trip.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px', fontSize: '14px' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '12px' }}>Purpose</p>
                  <p style={{ margin: '0', fontWeight: '600' }}>{trip.purpose}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '12px' }}>Distance</p>
                  <p style={{ margin: '0', fontWeight: '600' }}>{trip.totalDistance}km</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '12px' }}>Odometer</p>
                  <p style={{ margin: '0', fontWeight: '600', fontSize: '12px' }}>{trip.startOdometer} → {trip.endOdometer}</p>
                </div>
              </div>

              {trip.staffNotes && (
                <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#333', padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
                  {trip.staffNotes}
                </p>
              )}

              {trip.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleVerifyTrip(trip._id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '12px'
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleRejectTrip(trip._id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '12px'
                    }}
                  >
                    ✗ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TravelLogTab;
