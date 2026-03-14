import { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, MicOff, Pause, Play, Trash2, Save, Clock, AlertCircle, Lightbulb, FileText } from 'lucide-react';
import { RecordingContext } from '../../context/RecordingContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getAssignmentDateStatus } from '../../utils/shiftStatus';
import api from '../../api/api';
import styles from './VoiceNote.module.css';

export default function VoiceNote() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const {
    isRecording,
    isPaused,
    transcription,
    error,
    startRecording,
    stopRecording,
    resumeRecording,
    completeRecording,
    resetRecording,
    setError,
  } = useContext(RecordingContext);

  const [isSaving, setIsSaving] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [shiftStatus, setShiftStatus] = useState(null);
  const [assignment, setAssignment] = useState(null);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    return () => {
      resetRecording();
    };
  }, [resetRecording]);

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
            setError(`Cannot record notes - shift ${status.badge}`);
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
  }, [clientId, setError]);

  const handleStartRecording = async () => {
    await startRecording(clientId);
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleResumeRecording = () => {
    resumeRecording();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveAndReview = async () => {
    if (!transcription.trim()) {
      setError('Please record some audio first. Speak clearly near your microphone.');
      return;
    }

    setIsSaving(true);
    try {
      await completeRecording();

      await api.post(`/api/staff/clients/${clientId}/notes`, {
        content: transcription.trim(),
        noteType: 'voice',
        status: 'Draft'
      });

      navigate(`/staff/clients/${clientId}/notes`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save voice note. Please try again.');
      setIsSaving(false);
    }
  };

  const handleDiscardRecording = () => {
    resetRecording();
    setRecordingTime(0);
  };

  const canRecord = shiftStatus?.status === 'Current';

  return (
    <DashboardLayout
      title="Voice Note"
      subtitle="Record a voice note with live transcription"
    >
      {/* Shift Status Warning */}
      {shiftStatus && assignment && !canRecord && (
        <div className={styles.warningBanner}>
          <AlertCircle size={20} />
          <div>
            <strong>Recording Unavailable</strong>
            <p>Voice notes can only be recorded during your active shift ({assignment.shift}). {shiftStatus.badge}</p>
          </div>
        </div>
      )}

      <motion.div
        className={styles.recordingCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Recording Controls Section */}
        <div className={styles.controlsSection}>
          <motion.div
            className={styles.recordingIcon}
            animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            {isRecording ? <Mic size={72} color="var(--color-error)" /> :
             isPaused ? <MicOff size={72} color="var(--color-warning)" /> :
             <Mic size={72} color="var(--color-primary)" />}
          </motion.div>

          <h2 className={styles.statusTitle}>
            {isRecording ? 'Recording in Progress...' : isPaused ? 'Recording Paused' : 'Ready to Record'}
          </h2>

          {(isRecording || isPaused) && (
            <div className={styles.recordingTimer}>
              <Clock size={20} />
              {formatTime(recordingTime)}
            </div>
          )}

          <p className={styles.statusDescription}>
            {isRecording
              ? 'Click pause to stop recording, or continue speaking to add more content.'
              : isPaused
              ? 'Click resume to continue recording or save to review your note.'
              : 'Click the record button to start capturing your voice note.'}
          </p>

          {/* Recording Buttons */}
          <div className={styles.recordingButtons}>
            {!isRecording && !isPaused ? (
              <motion.button
                className={`${styles.recordBtn} ${styles.start}`}
                onClick={handleStartRecording}
                disabled={!canRecord}
                title={!canRecord ? 'Recording is only available during active shifts' : 'Start recording'}
                whileHover={canRecord ? { scale: 1.05 } : {}}
                whileTap={canRecord ? { scale: 0.95 } : {}}
              >
                <Mic size={32} />
              </motion.button>
            ) : isRecording ? (
              <motion.button
                className={`${styles.recordBtn} ${styles.pause}`}
                onClick={handleStopRecording}
                whileTap={{ scale: 0.95 }}
              >
                <Pause size={32} />
              </motion.button>
            ) : (
              <motion.button
                className={`${styles.recordBtn} ${styles.resume}`}
                onClick={handleResumeRecording}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play size={32} />
              </motion.button>
            )}

            {(isRecording || isPaused) && (
              <motion.button
                className={`${styles.recordBtn} ${styles.discard}`}
                onClick={handleDiscardRecording}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Trash2 size={28} />
              </motion.button>
            )}
          </div>
        </div>

        {/* Live Transcription Section */}
        {(isRecording || isPaused || transcription) && (
          <motion.div
            className={styles.transcriptionSection}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <h3 className={styles.transcriptionHeader}>
              <FileText size={18} />
              Live Transcription
            </h3>
            <div className={`${styles.transcriptionContent} ${!transcription ? styles.empty : ''}`}>
              {transcription || 'Your transcription will appear here...'}
            </div>
            {!transcription && (isRecording || isPaused) && (
              <div className={styles.transcriptionWarning}>
                <AlertCircle size={14} />
                No transcription yet. Try speaking clearly near your microphone.
              </div>
            )}
          </motion.div>
        )}

        {/* Save & Review Button */}
        {(isPaused || transcription) && (
          <div className={styles.saveSection}>
            <motion.button
              className={styles.saveBtn}
              onClick={handleSaveAndReview}
              disabled={isSaving || !transcription.trim()}
              whileHover={transcription.trim() && !isSaving ? { scale: 1.02 } : {}}
              whileTap={transcription.trim() && !isSaving ? { scale: 0.98 } : {}}
            >
              <Save size={20} />
              {isSaving ? 'Saving...' : 'Save as Review Note'}
            </motion.button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            className={styles.error}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <AlertCircle size={18} />
            {error}
          </motion.div>
        )}

        {/* Tips */}
        <div className={styles.tipsSection}>
          <h4 className={styles.tipsTitle}>
            <Lightbulb size={16} />
            Recording Tips
          </h4>
          <ul className={styles.tipsList}>
            <li className={styles.tipItem}>
              <span className={styles.tipBullet}></span>
              <span>Speak clearly and at a moderate pace for best transcription</span>
            </li>
            <li className={styles.tipItem}>
              <span className={styles.tipBullet}></span>
              <span>Minimize background noise for accurate results</span>
            </li>
            <li className={styles.tipItem}>
              <span className={styles.tipBullet}></span>
              <span>You can pause and resume recording as needed</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
