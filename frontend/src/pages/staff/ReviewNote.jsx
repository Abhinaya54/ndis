import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Mic, Edit3, Check, Trash2, X, AlertCircle } from 'lucide-react';
import api from '../../api/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import styles from './ReviewNote.module.css';

export default function ReviewNote() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [reviewingNote, setReviewingNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    // First check if data was passed via React Router state
    if (location.state?.transcript && location.state?.noteType === 'voice') {
      setReviewingNote({
        transcript: location.state.transcript,
        client: location.state.client,
        user: location.state.user,
        type: 'voice',
        timestamp: new Date().toISOString(),
      });
      setEditContent(location.state.transcript);
      setLoading(false);
      return;
    }

    // Check for voice note data in localStorage
    const voiceTemp = localStorage.getItem('voiceNoteTemp');
    if (voiceTemp) {
      try {
        const data = JSON.parse(voiceTemp);
        if (data.audioBlob) {
          setReviewingNote(data);
          setEditContent(data.transcription);
          setLoading(false);
          return;
        }
      } catch (err) {
        localStorage.removeItem('voiceNoteTemp');
      }
    }

    // Check for text note data in localStorage
    const textTemp = localStorage.getItem('textNoteTemp');
    if (textTemp) {
      try {
        const data = JSON.parse(textTemp);
        setReviewingNote(data);
        setEditContent(data.content);
        setLoading(false);
        return;
      } catch (err) {
        localStorage.removeItem('textNoteTemp');
      }
    }

    setLoading(false);
  }, [location]);

  const handleConfirmAndSave = async () => {
    if (!reviewingNote || !isConfirmed) return;

    setLoading(true);
    try {
      const noteType = reviewingNote.type === 'voice' ? 'voice' : 'text';

      await api.post(`/api/staff/clients/${clientId}/notes`, {
        content: editContent,
        noteType: noteType,
        locked: true,
        status: 'Consolidated'
      });

      // Clear localStorage after saving
      if (reviewingNote.type === 'voice') {
        localStorage.removeItem('voiceNoteTemp');
      } else {
        localStorage.removeItem('textNoteTemp');
      }

      navigate(`/staff/clients/${clientId}/notes`);
    } catch (err) {
      setError('Failed to save note. Please try again.');
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard this note?')) {
      if (reviewingNote?.type === 'voice') {
        localStorage.removeItem('voiceNoteTemp');
      } else {
        localStorage.removeItem('textNoteTemp');
      }
      setReviewingNote(null);
      setEditContent('');
      setIsConfirmed(false);
      setIsEditing(false);
      setError('');
      navigate(`/staff/clients/${clientId}/notes`);
    }
  };

  const handleCancelEdit = () => {
    if (reviewingNote?.type === 'voice') {
      setEditContent(reviewingNote?.transcription || '');
    } else {
      setEditContent(reviewingNote?.content || '');
    }
    setIsEditing(false);
  };

  if (!reviewingNote && !loading) {
    return (
      <DashboardLayout
        title="No Note to Review"
        subtitle="Record or write a note first"
      >
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <FileText size={64} strokeWidth={1} />
          </div>
          <h3 className={styles.emptyTitle}>Nothing to review right now</h3>
          <p className={styles.emptyDescription}>
            Record a voice note or write text to get started.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={reviewingNote?.type === 'voice' ? 'Review Voice Note' : 'Review Text Note'}
      subtitle="Review and confirm your note details before saving"
      loading={loading}
    >
      {reviewingNote && (
        <motion.div
          className={styles.formCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Note Content */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              {reviewingNote.type === 'voice' ? <Mic size={18} /> : <FileText size={18} />}
              Note Content
            </label>
            <textarea
              className={`${styles.textarea} ${isEditing ? styles.editing : ''}`}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={!isEditing}
              placeholder="Note content..."
            />
            {isEditing && (
              <div className={styles.editActions}>
                <motion.button
                  className={styles.doneEditBtn}
                  onClick={() => setIsEditing(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Check size={16} />
                  Done Editing
                </motion.button>
                <motion.button
                  className={styles.cancelEditBtn}
                  onClick={handleCancelEdit}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <X size={16} />
                  Cancel
                </motion.button>
              </div>
            )}
          </div>

          {/* Confirmation Checkbox */}
          <div className={styles.confirmationBox}>
            <label className={styles.confirmationLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
              />
              <div className={styles.confirmationText}>
                <div className={styles.confirmationTitle}>
                  I confirm all details are correct
                </div>
                <div className={styles.confirmationDesc}>
                  This note will be locked and cannot be edited once confirmed
                </div>
              </div>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              className={styles.error}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <div className={styles.leftActions}>
              {!isEditing && (
                <motion.button
                  className={styles.editBtn}
                  onClick={() => setIsEditing(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Edit3 size={18} />
                  Edit
                </motion.button>
              )}
              <motion.button
                className={styles.confirmBtn}
                onClick={handleConfirmAndSave}
                disabled={!isConfirmed}
                whileHover={isConfirmed ? { scale: 1.02 } : {}}
                whileTap={isConfirmed ? { scale: 0.98 } : {}}
              >
                <Check size={18} />
                Save & Submit for Review
              </motion.button>
            </div>
            <motion.button
              className={styles.discardBtn}
              onClick={handleDiscard}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Trash2 size={18} />
              Discard
            </motion.button>
          </div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
