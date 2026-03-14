import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, X, Check, User, AlertCircle, Clock, Users } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getAssignmentDateStatus } from '../../utils/shiftStatus';
import api from '../../api/api';
import styles from './Incident.module.css';

const SEVERITY_LEVELS = [
  { id: 'low', label: 'Low', color: '#22c55e' },
  { id: 'medium', label: 'Medium', color: '#f59e0b' },
  { id: 'high', label: 'High', color: '#ef4444' },
  { id: 'critical', label: 'Critical', color: '#dc2626' }
];

export default function Incident() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [shiftStatus, setShiftStatus] = useState(null);
  const [assignment, setAssignment] = useState(null);

  const [incidentDate, setIncidentDate] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [severity, setSeverity] = useState('');
  const [description, setDescription] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');
  const [witnesses, setWitnesses] = useState('');

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
            setError(`Cannot report incident - shift ${status.badge}`);
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
    if (!incidentDate || !severity || !description.trim()) {
      setError('Please fill in the date, severity, and description');
      return;
    }

    setIsSaving(true);
    setError('');

    const severityLabel = SEVERITY_LEVELS.find(s => s.id === severity)?.label || severity;
    const content = [
      `[Incident Report]`,
      `Date: ${incidentDate}${incidentTime ? ' at ' + incidentTime : ''}`,
      `Severity: ${severityLabel}`,
      `Description: ${description.trim()}`,
      actionsTaken.trim() ? `Actions Taken: ${actionsTaken.trim()}` : null,
      witnesses.trim() ? `Witnesses: ${witnesses.trim()}` : null
    ].filter(Boolean).join('\n');

    try {
      await api.post(`/api/staff/clients/${clientId}/notes`, {
        content,
        noteType: 'text',
        category: 'Incident',
        status: 'Review'
      });

      navigate(`/staff/clients/${clientId}/notes`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save incident report');
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if ((incidentDate || description || actionsTaken) && !window.confirm('Discard this incident report? It will not be saved.')) {
      return;
    }
    navigate(`/staff/clients/${clientId}/notes`);
  };

  return (
    <DashboardLayout
      title="Report Incident"
      subtitle="Record an incident report for this client"
    >
      {shiftStatus && assignment && !canCreate && (
        <div className={styles.warningBanner}>
          <AlertCircle size={20} />
          <div>
            <strong>Incident Reporting Unavailable</strong>
            <p>Incidents can only be reported during your active shift ({assignment.shift}). {shiftStatus.badge}</p>
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
          Reporting incident for <strong>Client {clientId}</strong>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <AlertTriangle size={18} />
              Incident Date *
            </label>
            <input
              type="date"
              className={styles.input}
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
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
              value={incidentTime}
              onChange={(e) => setIncidentTime(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            <AlertTriangle size={18} />
            Severity *
          </label>
          <div className={styles.severityOptions}>
            {SEVERITY_LEVELS.map(level => (
              <button
                key={level.id}
                type="button"
                className={`${styles.severityBtn} ${severity === level.id ? styles.severityActive : ''}`}
                style={severity === level.id ? { background: level.color, color: 'white', borderColor: level.color } : {}}
                onClick={() => setSeverity(level.id)}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Description *
          </label>
          <textarea
            className={styles.textarea}
            placeholder="Describe what happened in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            Actions Taken
          </label>
          <textarea
            className={styles.textarea}
            placeholder="What actions were taken in response to the incident..."
            value={actionsTaken}
            onChange={(e) => setActionsTaken(e.target.value)}
            rows={3}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            <Users size={18} />
            Witnesses
          </label>
          <input
            type="text"
            className={styles.input}
            placeholder="Names of any witnesses (optional)"
            value={witnesses}
            onChange={(e) => setWitnesses(e.target.value)}
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
            disabled={!incidentDate || !severity || !description.trim() || isSaving || !canCreate}
            title={!canCreate ? 'Incidents can only be reported during active shifts' : ''}
            whileHover={incidentDate && severity && description.trim() && !isSaving && canCreate ? { scale: 1.02 } : {}}
            whileTap={incidentDate && severity && description.trim() && !isSaving && canCreate ? { scale: 0.98 } : {}}
          >
            <Check size={18} />
            {isSaving ? 'Saving...' : 'Submit Incident Report'}
          </motion.button>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
