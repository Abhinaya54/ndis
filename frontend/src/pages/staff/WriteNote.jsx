import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PenLine, X, Check, Lightbulb, User, Type, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getAssignmentDateStatus } from '../../utils/shiftStatus';
import api from '../../api/api';
import styles from './WriteNote.module.css';

export default function WriteNote() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [shiftStatus, setShiftStatus] = useState(null);
  const [assignment, setAssignment] = useState(null);

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
            setError(`Cannot write notes - shift ${status.badge}`);
          }
        }
      } catch (err) {
        console.error('Error fetching assignment:', err);
        setError('Unable to verify shift status. Please check your assignment.');
      }
    };

    if (clientId) {
      checkShiftStatus();
    }
  }, [clientId]);

  const canWrite = shiftStatus?.status === 'Current';

  const saveForReview = async () => {
    if (!noteContent.trim()) {
      setError('Note cannot be empty');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await api.post(`/api/staff/clients/${clientId}/notes`, {
        content: noteContent.trim(),
        noteType: 'text',
        status: 'Review'
      });

      navigate(`/staff/clients/${clientId}/notes`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save note. Please try again.');
      setIsSaving(false);
    }
  };

  const discardNote = () => {
    if (noteContent.trim() && !window.confirm('Discard this note? It will not be saved.')) {
      return;
    }
    setNoteContent('');
    setError('');
    navigate(`/staff/clients/${clientId}/notes`);
  };

  return (
    <DashboardLayout
      title="Write a New Note"
      subtitle="Write and save a text note for this client"
    >
      {/* Shift Status Warning */}
      {shiftStatus && assignment && !canWrite && (
        <div className={styles.warningBanner}>
          <AlertCircle size={20} />
          <div>
            <strong>Writing Unavailable</strong>
            <p>Text notes can only be written during your active shift ({assignment.shift}). {shiftStatus.badge}</p>
          </div>
        </div>
      )}

      <motion.div
        className={styles.formCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Client Info */}
        <div className={styles.clientInfo}>
          <User size={16} />
          Writing note for <strong>Client {clientId}</strong>
        </div>

        {/* Note Content Textarea */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <PenLine size={18} />
            Note Content
          </label>
          <textarea
            className={styles.textarea}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Write your note here... You can review and edit before confirming."
          />
          <div className={styles.charCount}>
            <Type size={12} />
            {noteContent.length} characters
          </div>
        </div>

        {/* Error Message */}
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

        {/* Action Buttons */}
        <div className={styles.actions}>
          <motion.button
            className={styles.cancelBtn}
            onClick={discardNote}
            disabled={isSaving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <X size={18} />
            Cancel
          </motion.button>

          <motion.button
            className={styles.submitBtn}
            onClick={saveForReview}
            disabled={!noteContent.trim() || isSaving || !canWrite}
            title={!canWrite ? 'Notes can only be written during active shifts' : ''}
            whileHover={noteContent.trim() && !isSaving && canWrite ? { scale: 1.02 } : {}}
            whileTap={noteContent.trim() && !isSaving && canWrite ? { scale: 0.98 } : {}}
          >
            <Check size={18} />
            {isSaving ? 'Saving...' : 'Save as Review Note'}
          </motion.button>
        </div>

        {/* Tips */}
        <div className={styles.tipsCard}>
          <h4 className={styles.tipsTitle}>
            <Lightbulb size={16} />
            Writing Tips
          </h4>
          <ul className={styles.tipsList}>
            <li className={styles.tipItem}>
              <span className={styles.tipBullet}></span>
              <span>Be specific about observations and actions taken</span>
            </li>
            <li className={styles.tipItem}>
              <span className={styles.tipBullet}></span>
              <span>Include relevant times, dates, and participant names</span>
            </li>
            <li className={styles.tipItem}>
              <span className={styles.tipBullet}></span>
              <span>Document any concerns or follow-up actions needed</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
