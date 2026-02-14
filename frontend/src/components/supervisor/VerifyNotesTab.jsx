import React, { useState, useEffect } from 'react';
import api from '../../api/api';

const VerifyNotesTab = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingNotes();
  }, []);

  const fetchPendingNotes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/supervisor/notes?status=submitted');
      setNotes(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch pending notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (noteId) => {
    try {
      await api.put(`/api/supervisor/notes/${noteId}/verify`, { status: 'Approved', odometerStatus: 'approved' });
      fetchPendingNotes();
    } catch (error) {
      console.error('Failed to approve note:', error);
    }
  };

  const handleFlagOdometer = async (noteId) => {
    try {
      await api.put(`/api/supervisor/notes/${noteId}/verify`, {
        status: 'Approved',
        odometerStatus: 'flagged'
      });
      fetchPendingNotes();
    } catch (error) {
      console.error('Failed to flag odometer:', error);
    }
  };

  const handleReject = async (noteId) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      try {
        await api.put(`/api/supervisor/notes/${noteId}/verify`, { 
          status: 'Rejected', 
          rejectionReason: reason 
        });
        fetchPendingNotes();
      } catch (error) {
        console.error('Failed to reject note:', error);
      }
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading pending notes...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Verify Notes</h2>
      
      {notes.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#999', paddingTop: '40px' }}>
          No pending notes to verify
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {notes.map(note => (
            <div key={note._id} style={{
              padding: '16px',
              border: '2px solid #fbbf24',
              borderRadius: '8px',
              backgroundColor: '#fffbeb'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ margin: '0 0 4px 0', fontWeight: '600', fontSize: '16px' }}>
                  {note.clientId?.name || note.clientName || 'Unknown Client'}
                </p>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>
                  {note.category || 'General'} • {note.shift || 'Unknown Shift'} • {new Date(note.shiftDate).toLocaleDateString()}
                  {note.entries && note.entries.length > 0 && (
                    <span style={{ marginLeft: '8px', padding: '1px 8px', background: '#e0e7ff', color: '#4338ca', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>
                      {note.entries.length} {note.entries.length === 1 ? 'entry' : 'entries'}
                    </span>
                  )}
                </p>
                <p style={{ margin: '0 0 12px 0', fontSize: '14px', lineHeight: '1.6', color: '#333' }}>
                  {note.entries && note.entries.length > 0
                    ? note.entries[0].content.substring(0, 200) + (note.entries[0].content.length > 200 ? '...' : '')
                    : note.content}
                </p>
              </div>

              {/* Odometer / Travel Data */}
              {note.startOdometer !== null && note.startOdometer !== undefined && (
                <div style={{
                  padding: '12px',
                  background: 'linear-gradient(135deg, #ecfeff, #cffafe)',
                  border: '1px solid #06b6d4',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#0e7490' }}>
                    🚗 Travel Data
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#0e7490', fontWeight: '600' }}>Start KM</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#0891b2' }}>{note.startOdometer}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#0e7490', fontWeight: '600' }}>End KM</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#0891b2' }}>{note.endOdometer || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#0e7490', fontWeight: '600' }}>Distance</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#0891b2' }}>
                        {note.totalDistance ? `${note.totalDistance} km` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleApprove(note._id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleReject(note._id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  ✗ Reject
                </button>
                {note.startOdometer !== null && note.startOdometer !== undefined && (
                  <button
                    onClick={() => handleFlagOdometer(note._id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}
                  >
                    ⚠ Flag Travel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VerifyNotesTab;
