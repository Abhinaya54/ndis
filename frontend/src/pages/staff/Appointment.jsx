import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarPlus, X, Check, User, AlertCircle, MapPin, Clock } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getAssignmentDateStatus } from '../../utils/shiftStatus';
import api from '../../api/api';
import styles from './Appointment.module.css';

const PURPOSES = [
  { id: 'doctor', label: 'Doctor Visit' },
  { id: 'therapy', label: 'Therapy' },
  { id: 'community', label: 'Community Access' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'personal', label: 'Personal Care' },
  { id: 'other', label: 'Other' }
];

export default function Appointment() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [shiftStatus, setShiftStatus] = useState(null);
  const [assignment, setAssignment] = useState(null);

  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const checkShiftStatus = async () => {
      try {
        const assignmentRes = await api.get(`/api/staff/clients/${clientId}/assignment`);
        const assignmentData = assignmentRes.data?.data || assignmentRes.data;
        setAssignment(assignmentData);

        if (assignmentData) {
          const status = getAssignmentDateStatus(assignmentData.startDate, assignmentData.shift);
          setShiftStatus(status);

          if (status.status !== 'Current') {
            setError(`Cannot create appointment - shift ${status.badge}`);
          }
        }
      } catch (err) {
        console.error('Error fetching assignment:', err);
        setError('Unable to verify shift status.');
      }
    };

    if (clientId) checkShiftStatus();
  }, [clientId]);

  const canCreate = shiftStatus?.status === 'Current';

  const handleSave = async () => {
    if (!appointmentDate || !purpose) {
      setError('Please fill in the date and purpose');
      return;
    }

    setIsSaving(true);
    setError('');

    const purposeLabel = PURPOSES.find(p => p.id === purpose)?.label || purpose;
    const content = [
      `[Appointment]`,
      `Date: ${appointmentDate}${appointmentTime ? ' at ' + appointmentTime : ''}`,
      `Purpose: ${purposeLabel}`,
      location ? `Location: ${location}` : null,
      notes ? `Notes: ${notes}` : null
    ].filter(Boolean).join('\n');

    try {
      await api.post(`/api/staff/clients/${clientId}/notes`, {
        content,
        noteType: 'text',
        category: 'appointment',
        status: 'Review'
      });

      navigate(`/staff/clients/${clientId}/notes`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save appointment');
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if ((appointmentDate || purpose || location || notes) && !window.confirm('Discard this appointment? It will not be saved.')) {
      return;
    }
    navigate(`/staff/clients/${clientId}/notes`);
  };

  return (
    <DashboardLayout
      title="Log Appointment"
      subtitle="Record an appointment for this client"
    >
      {shiftStatus && assignment && !canCreate && (
        <div className={styles.warningBanner}>
          <AlertCircle size={20} />
          <div>
            <strong>Appointment Logging Unavailable</strong>
            <p>Appointments can only be logged during your active shift ({assignment.shift}). {shiftStatus.badge}</p>
          </div>
        </div>
      )}

      <motion.div
        className={styles.formCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.clientInfo}>
          <User size={16} />
          Logging appointment for <strong>Client {clientId}</strong>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <CalendarPlus size={18} />
              Appointment Date *
            </label>
            <input
              type="date"
              className={styles.input}
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <Clock size={18} />
              Time
            </label>
            <input
              type="time"
              className={styles.input}
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            <CalendarPlus size={18} />
            Purpose *
          </label>
          <select
            className={styles.input}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          >
            <option value="">Select purpose...</option>
            {PURPOSES.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            <MapPin size={18} />
            Location
          </label>
          <input
            type="text"
            className={styles.input}
            placeholder="e.g. City Medical Centre, 123 Main St"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Additional Notes</label>
          <textarea
            className={styles.textarea}
            placeholder="Any additional details about the appointment..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <motion.div
            className={styles.error}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <X size={16} />
            {error}
          </motion.div>
        )}

        <div className={styles.actions}>
          <motion.button
            className={styles.cancelBtn}
            onClick={handleCancel}
            disabled={isSaving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <X size={18} />
            Cancel
          </motion.button>

          <motion.button
            className={styles.submitBtn}
            onClick={handleSave}
            disabled={!appointmentDate || !purpose || isSaving || !canCreate}
            title={!canCreate ? 'Appointments can only be logged during active shifts' : ''}
            whileHover={appointmentDate && purpose && !isSaving && canCreate ? { scale: 1.02 } : {}}
            whileTap={appointmentDate && purpose && !isSaving && canCreate ? { scale: 0.98 } : {}}
          >
            <Check size={18} />
            {isSaving ? 'Saving...' : 'Save Appointment'}
          </motion.button>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
