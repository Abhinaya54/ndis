import { useEffect, useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock, Calendar, Users, MapPin,
  CheckCircle, AlertCircle, Filter
} from 'lucide-react';
import api from '../../api/api';
import { AuthContext } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { formatAssignmentDisplay, getAssignmentDateStatus } from '../../utils/shiftStatus';
import styles from './Shifts.module.css';

export default function Shifts() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [shiftsData, setShiftsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterTab, setFilterTab] = useState('all');

  const fetchShifts = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const res = await api.get(`/api/staff/${user?.id}/shifts/overview`);
      const data = res.data?.data || res.data;

      // Enrich assignments with computed status
      if (data?.assignments) {
        data.assignments = data.assignments.map(assignment => {
          // Use backend computedStatus if available, otherwise calculate
          const statusInfo = assignment.computedStatus
            ? {
                status: assignment.computedStatus,
                badge: assignment.statusBadge,
                color: assignment.statusColor
              }
            : getAssignmentDateStatus(assignment.startDate, assignment.shift);

          const displayInfo = formatAssignmentDisplay(assignment);

          return {
            ...assignment,
            computedStatus: statusInfo.status,
            statusBadge: statusInfo.badge,
            statusColor: statusInfo.color || displayInfo?.statusColor,
            dateDisplay: displayInfo?.date || 'Unknown',
            shortDate: displayInfo?.shortDate,
            fullDate: displayInfo?.fullDate
          };
        });
      }

      setShiftsData(data);
    } catch (err) {
      console.error('Error fetching shifts:', err);
      setError('Failed to load shifts data');
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  // Periodic refresh every 5 minutes and on window focus
  useEffect(() => {
    const interval = setInterval(() => {
      fetchShifts();
    }, 5 * 60 * 1000);

    const handleFocus = () => {
      fetchShifts();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchShifts]);

  const getFilteredAssignments = () => {
    if (!shiftsData?.assignments) return [];

    switch (filterTab) {
      case 'current':
        // Use computedStatus for filtering - Current and Pending are active/upcoming
        return shiftsData.assignments.filter(a =>
          a.computedStatus === 'Current' || a.computedStatus === 'Pending' ||
          a.status === 'Active' || a.status === 'Upcoming'
        );
      case 'completed':
        // Previous status means completed
        return shiftsData.assignments.filter(a =>
          a.computedStatus === 'Previous' || a.status === 'Completed'
        );
      default:
        return shiftsData.assignments;
    }
  };

  const getStatusClass = (computedStatus, status) => {
    const effectiveStatus = computedStatus || status;
    switch (effectiveStatus?.toLowerCase()) {
      case 'current':
      case 'active':
        return styles.active;
      case 'pending':
      case 'upcoming':
        return styles.upcoming;
      case 'previous':
      case 'completed':
        return styles.completed;
      default:
        return styles.pending;
    }
  };

  const getStatusDisplay = (assignment) => {
    if (assignment.statusBadge) {
      return assignment.statusBadge;
    }
    switch (assignment.computedStatus) {
      case 'Current': return '● IN PROGRESS';
      case 'Pending': return '⏳ UPCOMING';
      case 'Previous': return '✓ COMPLETED';
      default: return assignment.status || 'Active';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const filteredAssignments = getFilteredAssignments();

  return (
    <DashboardLayout
      title="My Shifts"
      subtitle="View and manage your work schedule"
      loading={loading}
      error={error}
    >
      {/* Stats Overview */}
      <motion.div
        className={styles.statsGrid}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className={styles.statCard} variants={itemVariants}>
          <div className={`${styles.statIcon} ${styles.total}`}>
            <Calendar size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{shiftsData?.totalAssignments || 0}</span>
            <span className={styles.statLabel}>Total Assignments</span>
          </div>
        </motion.div>

        <motion.div className={styles.statCard} variants={itemVariants}>
          <div className={`${styles.statIcon} ${styles.active}`}>
            <Clock size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{shiftsData?.upcomingCount || 0}</span>
            <span className={styles.statLabel}>Upcoming Shifts</span>
          </div>
        </motion.div>

        <motion.div className={styles.statCard} variants={itemVariants}>
          <div className={`${styles.statIcon} ${styles.clients}`}>
            <Users size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{shiftsData?.assignments?.length || 0}</span>
            <span className={styles.statLabel}>Active Clients</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Filter Tabs */}
      <div className={styles.filterSection}>
        <div className={styles.filterHeader}>
          <h3 className={styles.filterTitle}>
            <Filter size={18} />
            Shift History
          </h3>
        </div>
        <div className={styles.filterTabs}>
          <button
            className={`${styles.filterTab} ${filterTab === 'all' ? styles.active : ''}`}
            onClick={() => setFilterTab('all')}
          >
            All Shifts
          </button>
          <button
            className={`${styles.filterTab} ${filterTab === 'current' ? styles.active : ''}`}
            onClick={() => setFilterTab('current')}
          >
            Current & Upcoming
          </button>
          <button
            className={`${styles.filterTab} ${filterTab === 'completed' ? styles.active : ''}`}
            onClick={() => setFilterTab('completed')}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Shifts List */}
      <motion.div
        className={styles.shiftsContainer}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {filteredAssignments.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Calendar size={48} strokeWidth={1} />
            </div>
            <h3 className={styles.emptyTitle}>No shifts found</h3>
            <p className={styles.emptyDescription}>
              {filterTab === 'all'
                ? "You don't have any shift assignments yet."
                : filterTab === 'current'
                ? "No current or upcoming shifts."
                : "No completed shifts in your history."}
            </p>
          </div>
        ) : (
          <div className={styles.shiftsList}>
            {filteredAssignments.map((assignment, index) => (
              <motion.div
                key={assignment._id || index}
                className={styles.shiftCard}
                variants={itemVariants}
                whileHover={{ y: -4 }}
              >
                <div className={styles.shiftHeader}>
                  <div className={styles.shiftDateTime}>
                    <span className={styles.shiftDateBadge}>
                      <Calendar size={14} />
                      {assignment.dateDisplay || assignment.shortDate || 'Unknown'}
                    </span>
                    <span className={styles.shiftTimeBadge}>
                      <Clock size={14} />
                      {assignment.shift || 'Shift Time'}
                    </span>
                  </div>
                  <span
                    className={`${styles.statusBadge} ${getStatusClass(assignment.computedStatus, assignment.status)}`}
                    style={assignment.statusColor ? {
                      backgroundColor: assignment.statusColor.bg,
                      color: assignment.statusColor.text,
                      borderColor: assignment.statusColor.border
                    } : {}}
                  >
                    {assignment.computedStatus === 'Current' && <CheckCircle size={12} />}
                    {assignment.computedStatus === 'Pending' && <AlertCircle size={12} />}
                    {getStatusDisplay(assignment)}
                  </span>
                </div>

                <div className={styles.shiftBody}>
                  <div className={styles.clientInfo}>
                    <div className={styles.clientAvatar}>
                      {(assignment.clientId?.name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.clientDetails}>
                      <h4 className={styles.clientName}>
                        {assignment.clientId?.name || 'Unknown Client'}
                      </h4>
                      {assignment.clientId?.careLevel && (
                        <span className={`${styles.careLevelBadge} ${styles[assignment.clientId.careLevel?.toLowerCase()]}`}>
                          {assignment.clientId.careLevel} Care
                        </span>
                      )}
                    </div>
                  </div>

                  {assignment.clientId?.address && (
                    <div className={styles.shiftLocation}>
                      <MapPin size={14} />
                      <span>{assignment.clientId.address}</span>
                    </div>
                  )}
                </div>

                <div className={styles.shiftFooter}>
                  <motion.button
                    className={styles.viewClientBtn}
                    onClick={() => navigate(`/staff/clients/${assignment.clientId?._id}/notes`)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View Client Notes
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
