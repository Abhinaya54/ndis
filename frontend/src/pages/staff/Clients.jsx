import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Clock } from 'lucide-react';
import api from '../../api/api';
import { AuthContext } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import styles from './Clients.module.css';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [clientsRes, shiftsRes] = await Promise.all([
          api.get('/api/staff/clients'),
          api.get(`/api/staff/${user.id}/shifts/overview`)
        ]);
        const clientsData = clientsRes.data?.data || [];
        setClients(clientsData);

        // Build a map of clientId → assignment info
        const assignmentMap = {};
        const allAssignments = shiftsRes.data?.data?.assignments || [];
        allAssignments.forEach(a => {
          const cId = a.clientId?._id || a.clientId;
          if (cId) {
            // Keep the most relevant assignment (Current > Pending > Previous)
            const priority = { 'Current': 3, 'Pending': 2, 'Previous': 1 };
            const existing = assignmentMap[cId];
            const newPriority = priority[a.computedStatus] || 0;
            const existingPriority = existing ? (priority[existing.computedStatus] || 0) : -1;
            if (newPriority > existingPriority) {
              assignmentMap[cId] = a;
            }
          }
        });
        setAssignments(assignmentMap);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Error loading clients");
      }
      setLoading(false);
    };
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const getCareLevelClass = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return styles.high;
      case 'medium': return styles.medium;
      case 'low': return styles.low;
      default: return styles.low;
    }
  };

  const getShiftStatusClass = (status) => {
    switch (status) {
      case 'Current': return styles.shiftActive;
      case 'Pending': return styles.shiftUpcoming;
      case 'Previous': return styles.shiftCompleted;
      default: return styles.shiftNone;
    }
  };

  const getShiftStatusLabel = (status) => {
    switch (status) {
      case 'Current': return 'Active';
      case 'Pending': return 'Upcoming';
      case 'Previous': return 'Completed';
      default: return 'No Shift';
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

  return (
    <DashboardLayout
      title="My Clients"
      subtitle="Manage and care for your assigned clients"
      loading={loading}
      error={error}
    >
      {clients.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>👥</div>
          <h3 className={styles.emptyTitle}>No clients assigned yet</h3>
          <p className={styles.emptyDescription}>
            You don't have any clients assigned to you at the moment.
          </p>
        </div>
      ) : (
        <motion.div
          className={styles.clientsGrid}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {clients.map((client) => (
            <motion.div
              key={client._id}
              className={styles.clientCard}
              variants={itemVariants}
              whileHover={{ y: -4 }}
            >
              <div className={styles.clientHeader}>
                <div className={styles.clientInfo}>
                  <h3>{client.name}</h3>
                  <span className={styles.clientId}>
                    ID: {client.code || client._id?.slice(0, 8)}
                  </span>
                </div>
                <div className={styles.headerBadges}>
                  <span className={`${styles.shiftStatusBadge} ${getShiftStatusClass(assignments[client._id]?.computedStatus)}`}>
                    <Clock size={12} />
                    {getShiftStatusLabel(assignments[client._id]?.computedStatus)}
                  </span>
                  <span className={`${styles.careLevelBadge} ${getCareLevelClass(client.careLevel)}`}>
                    {client.careLevel || 'Low'} Care
                  </span>
                </div>
              </div>

              {/* Shift Info */}
              {assignments[client._id] && (
                <div className={styles.shiftInfo}>
                  <Clock size={14} />
                  <span>{assignments[client._id].shift}</span>
                  {assignments[client._id].statusBadge && (
                    <span className={styles.shiftBadgeText}>{assignments[client._id].statusBadge}</span>
                  )}
                </div>
              )}

              <div className={styles.clientDetails}>
                <h4 className={styles.detailsTitle}>
                  <FileText size={14} /> Details
                </h4>
                <div className={styles.detailsList}>
                  {client.room && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Room:</span>
                      <span className={styles.detailValue}>{client.room}</span>
                    </div>
                  )}
                  {client.careLevel && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Care Level:</span>
                      <span className={styles.detailValue}>{client.careLevel}</span>
                    </div>
                  )}
                  {client.ndisNumber && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>NDIS #:</span>
                      <span className={styles.detailValue}>{client.ndisNumber}</span>
                    </div>
                  )}
                  {client.dateOfBirth && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>DOB:</span>
                      <span className={styles.detailValue}>
                        {new Date(client.dateOfBirth).toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  {client.address && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Address:</span>
                      <span className={styles.detailValue}>{client.address}</span>
                    </div>
                  )}
                  {client.emergencyContact?.name && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Emergency:</span>
                      <span className={styles.detailValue}>{client.emergencyContact.name}</span>
                    </div>
                  )}
                  {client.emergencyContact?.phone && (
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Phone:</span>
                      <span className={styles.detailValue}>{client.emergencyContact.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.clientActions}>
                <motion.button
                  className={styles.viewNotesBtn}
                  onClick={() => navigate(`/staff/clients/${client._id}/notes`)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FileText size={18} />
                  View Notes
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </DashboardLayout>
  );
}
