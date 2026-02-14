import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit3, User, Mic, FileText, Save, X, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import api from '../../api/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import styles from './EditNote.module.css';

export default function EditNote() {
  const { clientId, noteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [note, setNote] = useState(location.state?.note || null);
  const [editedContent, setEditedContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [loading, setLoading] = useState(!location.state?.note);

  useEffect(() => {
    if (note) {
      setEditedContent(note.content);
      setLoading(false);
    } else if (noteId) {
      const fetchNote = async () => {
        try {
          const res = await api.get(`/api/staff/clients/${clientId}/notes`);
          const notes = res.data?.data || res.data || [];
          const found = notes.find(n => n._id === noteId);
          if (found) {
            setNote(found);
            setEditedContent(found.content);
          }
        } catch (err) {
          setError('Failed to load note');
        }
        setLoading(false);
      };
      fetchNote();
    }
  }, [noteId, clientId, note]);

  const handleSaveAndSubmit = async () => {
    if (!editedContent.trim()) {
      setError('Note content cannot be empty');
      return;
    }

    if (!isConfirmed) {
      setError('Please confirm all details are correct');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/api/staff/clients/${clientId}/notes/${noteId}`, {
        content: editedContent,
        submitForReview: true
      });
      navigate(`/staff/clients/${clientId}/notes`);
    } catch (err) {
      setError('Failed to save note');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (editedContent.trim() !== note?.content && !window.confirm('Discard changes?')) {
      return;
    }
    navigate(`/staff/clients/${clientId}/notes`);
  };

  return (
    <DashboardLayout
      title="Edit Note"
      subtitle="Edit note and save back to Review"
      loading={loading}
    >
      {note && note.isLocked && (
        <motion.div
          className={styles.formCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.lockedMessage}>
            <Lock size={24} />
            <h3>This note is locked</h3>
            <p>This note has been submitted for review and cannot be edited. Contact your supervisor to unlock it.</p>
            <motion.button
              className={styles.cancelBtn}
              onClick={() => navigate(`/staff/clients/${clientId}/notes`)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Back to Notes
            </motion.button>
          </div>
        </motion.div>
      )}

      {note && !note.isLocked && (
        <motion.div
          className={styles.formCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Client Info */}
          <div className={styles.clientInfo}>
            <User size={16} />
            Editing note for <strong>Client {clientId}</strong>
          </div>

          {/* Note Info */}
          <div className={styles.noteInfo}>
            <div className={styles.infoItem}>
              {note.noteType === 'voice' ? <Mic size={16} /> : <FileText size={16} />}
              <strong>Type:</strong> {note.noteType === 'voice' ? 'Voice' : 'Text'}
            </div>
            <div className={styles.infoItem}>
              <strong>Status:</strong> {note.status}
            </div>
          </div>

          {/* Form Group */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <Edit3 size={18} />
              Note Content
            </label>
            <textarea
              className={styles.textarea}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder="Edit your note here..."
            />
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
              <CheckCircle size={18} color={isConfirmed ? 'var(--color-success)' : 'var(--color-text-muted)'} />
              I confirm all details are correct
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
            <motion.button
              className={styles.cancelBtn}
              onClick={handleCancel}
              disabled={saving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <X size={18} />
              Cancel
            </motion.button>
            <motion.button
              className={styles.submitBtn}
              onClick={handleSaveAndSubmit}
              disabled={!isConfirmed || saving}
              whileHover={isConfirmed && !saving ? { scale: 1.02 } : {}}
              whileTap={isConfirmed && !saving ? { scale: 0.98 } : {}}
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save & Return to Review'}
            </motion.button>
          </div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
