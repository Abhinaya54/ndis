import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Calendar, Lock, Unlock, Edit3, Save, X,
  User, MapPin, CheckCircle, AlertCircle, FileText
} from 'lucide-react';
import api from '../../api/api';
import styles from './ShiftHistoryTab.module.css';

const ShiftHistoryTab = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState('month');
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [unlockModal, setUnlockModal] = useState(null);
  const [unlockReason, setUnlockReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchShiftHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/shift-history', {
        params: { dateRange: dateFilter }
      });
      setShifts(res.data.data || []);
    } catch (err) {
      setError('Failed to load shift history');
      console.error('Shift history fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchShiftHistory();
  }, [fetchShiftHistory]);

  const handleUnlock = async () => {
    if (!unlockModal || !unlockReason.trim()) return;
    setActionLoading(unlockModal);
    try {
      const res = await api.put(`/api/shift-history/${unlockModal}/unlock`, {
        reason: unlockReason.trim()
      });
      setShifts(prev => prev.map(s => s._id === unlockModal ? { ...s, ...res.data.data, isLocked: false } : s));
      setUnlockModal(null);
      setUnlockReason('');
    } catch (err) {
      console.error('Unlock error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLock = async (shiftId) => {
    setActionLoading(shiftId);
    try {
      const res = await api.put(`/api/shift-history/${shiftId}/lock`);
      setShifts(prev => prev.map(s => s._id === shiftId ? { ...s, ...res.data.data, isLocked: true } : s));
      setEditingId(null);
    } catch (err) {
      console.error('Lock error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveNotes = async (shiftId) => {
    setActionLoading(shiftId);
    try {
      const res = await api.put(`/api/shift-history/${shiftId}/notes`, {
        shiftNotes: editNotes
      });
      setShifts(prev => prev.map(s => s._id === shiftId ? { ...s, ...res.data.data } : s));
      setEditingId(null);
    } catch (err) {
      console.error('Save notes error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const startEditing = (shift) => {
    setEditingId(shift._id);
    setEditNotes(shift.shiftNotes || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditNotes('');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const filterTabs = [
    { key: 'week', label: 'Last Week' },
    { key: 'month', label: 'Last Month' },
    { key: '3months', label: 'Last 3 Months' },
    { key: 'all', label: 'All Time' }
  ];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p>Loading shift history...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.errorBanner}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className={styles.filterSection}>
        <div className={styles.filterTabs}>
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              className={`${styles.filterTab} ${dateFilter === tab.key ? styles.active : ''}`}
              onClick={() => setDateFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={styles.resultCount}>
          {shifts.length} completed shift{shifts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Shifts Grid */}
      {shifts.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Clock size={40} />
          </div>
          <h3 className={styles.emptyTitle}>No completed shifts found</h3>
          <p className={styles.emptyDescription}>
            Completed shift records will appear here.
          </p>
        </div>
      ) : (
        <div className={styles.shiftsGrid}>
          {shifts.map((shift, index) => (
            <motion.div
              key={shift._id}
              className={styles.shiftCard}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              {/* Card Header */}
              <div className={styles.shiftHeader}>
                <div className={styles.shiftDateTime}>
                  <span className={styles.shiftDateBadge}>
                    <Calendar size={12} />
                    {formatDate(shift.startDate)}
                  </span>
                  <span className={styles.shiftTimeBadge}>
                    <Clock size={12} />
                    {shift.shift}
                  </span>
                </div>
                <div className={`${styles.lockBadge} ${shift.isLocked ? styles.locked : styles.unlocked}`}>
                  {shift.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                  {shift.isLocked ? 'Locked' : 'Unlocked'}
                </div>
              </div>

              {/* Card Body */}
              <div className={styles.shiftBody}>
                {/* Client Info */}
                <div className={styles.clientInfo}>
                  <div className={styles.clientAvatar}>
                    {(shift.clientId?.name || 'C')[0].toUpperCase()}
                  </div>
                  <div className={styles.clientDetails}>
                    <h4 className={styles.clientName}>{shift.clientId?.name || 'Unknown Client'}</h4>
                    {shift.clientId?.careLevel && (
                      <span className={`${styles.careLevelBadge} ${styles[shift.clientId.careLevel.toLowerCase()]}`}>
                        {shift.clientId.careLevel} Care
                      </span>
                    )}
                  </div>
                </div>

                {/* Staff Info */}
                <div className={styles.staffInfo}>
                  <User size={14} />
                  <span>Staff: <strong>{shift.staffId?.name || 'Unknown Staff'}</strong></span>
                </div>

                {/* Location */}
                {shift.clientId?.address && (
                  <div className={styles.locationInfo}>
                    <MapPin size={14} />
                    <span>{shift.clientId.address}</span>
                  </div>
                )}

                {/* Completion Info */}
                {shift.completedAt && (
                  <div className={styles.completedInfo}>
                    <CheckCircle size={14} />
                    <span>Completed: {formatTimestamp(shift.completedAt)}</span>
                  </div>
                )}

                {/* Shift Notes */}
                <div className={styles.notesSection}>
                  <div className={styles.notesHeader}>
                    <FileText size={14} />
                    <span>Shift Notes</span>
                  </div>
                  {editingId === shift._id ? (
                    <div className={styles.editSection}>
                      <textarea
                        className={styles.notesTextarea}
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Enter shift notes..."
                        rows={4}
                      />
                      <div className={styles.editActions}>
                        <button
                          className={styles.saveBtn}
                          onClick={() => handleSaveNotes(shift._id)}
                          disabled={actionLoading === shift._id}
                        >
                          <Save size={14} />
                          Save
                        </button>
                        <button
                          className={styles.cancelEditBtn}
                          onClick={cancelEditing}
                        >
                          <X size={14} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className={styles.notesContent}>
                      {shift.shiftNotes || 'No notes recorded.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className={styles.shiftFooter}>
                {shift.isLocked ? (
                  <button
                    className={styles.unlockBtn}
                    onClick={() => { setUnlockModal(shift._id); setUnlockReason(''); }}
                    disabled={actionLoading === shift._id}
                  >
                    <Unlock size={14} />
                    Unlock Record
                  </button>
                ) : (
                  <div className={styles.footerActions}>
                    {editingId !== shift._id && (
                      <button
                        className={styles.editBtn}
                        onClick={() => startEditing(shift)}
                      >
                        <Edit3 size={14} />
                        Edit Notes
                      </button>
                    )}
                    <button
                      className={styles.lockBtn}
                      onClick={() => handleLock(shift._id)}
                      disabled={actionLoading === shift._id}
                    >
                      <Lock size={14} />
                      Re-Lock
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Unlock Modal */}
      <AnimatePresence>
        {unlockModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setUnlockModal(null)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={styles.modalTitle}>
                <Unlock size={20} />
                Unlock Shift Record
              </h3>
              <p className={styles.modalDescription}>
                Please provide a reason for unlocking this shift record. This will be logged for audit purposes.
              </p>
              <textarea
                className={styles.modalTextarea}
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="Enter reason for unlocking..."
                rows={3}
              />
              <div className={styles.modalActions}>
                <button
                  className={styles.modalCancelBtn}
                  onClick={() => setUnlockModal(null)}
                >
                  Cancel
                </button>
                <button
                  className={styles.modalConfirmBtn}
                  onClick={handleUnlock}
                  disabled={!unlockReason.trim() || actionLoading === unlockModal}
                >
                  <Unlock size={14} />
                  Confirm Unlock
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShiftHistoryTab;
