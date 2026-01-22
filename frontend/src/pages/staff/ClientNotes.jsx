import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../api/api";
import { getStaffAssignments } from "../../api/assignments";
import { connectSocket, joinStaffRoom, onAssignmentUpdate, onAssignmentStatus, disconnectSocket } from "../../api/socket";
import { AuthContext } from "../../context/AuthContext";


// Categories removed from this page — notes are uncategorized here

const ClientNotes = () => {
    const { id: clientId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext);
    const [showVoiceModal, setShowVoiceModal] = React.useState(false);
    const [showWriteModal, setShowWriteModal] = useState(false);
    const [recording, setRecording] = React.useState(false);
    const [transcript, setTranscript] = React.useState("");
    const [editText, setEditText] = React.useState("");
    const [error, setError] = React.useState("");
    const recognitionRef = React.useRef(null);
    const isSpeechRecognitionSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    // State for Daily Consolidation modal
    const [showConsolidateModal, setShowConsolidateModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState("");
    // categories removed — no local category state
    const [client, setClient] = useState(null);
      const [currentAssignment, setCurrentAssignment] = useState(null);

    useEffect(() => {
      const fetchClient = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/api/staff/clients/${clientId}`);
          setClient(res.data);
          setLoading(false);
        } catch (err) {
          setError("Failed to load client info");
          setLoading(false);
        }
      };
      const fetchNotes = async () => {
        try {
          const res = await api.get(`/api/staff/clients/${clientId}/notes`);
          setNotes(res.data);
        } catch (err) {
          setError("Failed to load notes");
        }
      };
      const fetchAssignment = async () => {
        try {
          if (!user?.id) return;
          const assignments = await getStaffAssignments(user.id, "current");
          if (assignments && assignments.length) {
            const forClient = assignments.find(a => String(a.clientId._id || a.clientId) === String(clientId));
            setCurrentAssignment(forClient || null);
          } else setCurrentAssignment(null);
        } catch (err) {
          // ignore silently
        }
      };
      fetchClient();
      fetchNotes();
      fetchAssignment();
    }, [clientId]);

  // Socket: join staff room and listen for assignment updates
  useEffect(() => {
    if (!user?.id) return;
    const socket = connectSocket();
    joinStaffRoom(user.id);

    const handleUpdate = (assignment) => {
      // if update is relevant to this client, refresh currentAssignment
      if (!assignment) return;
      const cid = assignment.clientId && (assignment.clientId._id || assignment.clientId);
      if (String(cid) === String(clientId)) {
        setCurrentAssignment(assignment);
      }
    };

    onAssignmentUpdate(handleUpdate);
    onAssignmentStatus(handleUpdate);

    return () => {
      disconnectSocket();
    };
  }, [user?.id, clientId]);

    const handleEdit = (note) => {
      setEditingId(note._id);
      setEditContent(note.content);
    };

    const handleEditSave = async () => {
      try {
        await api.put(`/api/staff/notes/${editingId}`, { content: editContent });
        setNotes(notes.map(n => n._id === editingId ? { ...n, content: editContent, draft: false } : n));
        setEditingId(null);
        setEditContent("");
      } catch (err) {
        setError("Failed to update note");
      }
    };

    const handleStartRecording = () => {
      if (!isSpeechRecognitionSupported) return;
      setTranscript("");
      setEditText("");
      setRecording(true);
      setError("");
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.onresult = (event) => {
        let interim = "";
        let final = "";
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setTranscript(final + interim);
        setEditText(final + interim);
      };
      recognition.onerror = (event) => {
        setError('Speech recognition error: ' + event.error);
        setRecording(false);
      };
      recognition.onend = () => {
        setRecording(false);
      };
      recognitionRef.current = recognition;
      recognition.start();
    };

    const handleStopRecording = () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setRecording(false);
      // Navigate to review page after stopping (no category passed)
      navigate(`/staff/clients/${clientId}/review-note`, {
        state: {
          transcript,
          client: location.state?.client,
          user,
          noteType: "voice",
          allowEdit: false
        }
      });
    };

    const handleSaveAndReview = () => {
      if (recording) handleStopRecording();
      navigate(`/staff/clients/${clientId}/review-note`, {
        state: {
          transcript: editText,
          client: location.state?.client,
          user,
          noteType: "voice",
          allowEdit: false
        }
      });
    };

    const generateDailyConsolidation = () => {
      const today = new Date();
      const todayStr = today.toDateString();
      const todayNotes = notes.filter(note => {
        const noteDate = new Date(note.createdAt);
        return noteDate.toDateString() === todayStr;
      });
      if (todayNotes.length === 0) return "No notes for today.";

      return todayNotes.map(note => note.content).join('\n\n');
    };

    if (loading) return <div style={styles.loading}>Loading...</div>;
    // Only show error if not a 403 supervisor error (which staff should not see)
    if (error && !error.includes('403')) return <div style={styles.error}>{error}</div>;
    if (!client) return <div style={styles.error}>No client found.</div>;


    return (
      <div style={styles.page}>
        {/* Header */}
        <div style={styles.headerRow}>
          <button onClick={() => navigate(-1)} style={styles.backBtn} aria-label="Back to Clients">
            <svg width="22" height="22" fill="none" stroke="#B8A6D9" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h1 style={styles.pageTitle}>Client Notes</h1>
        </div>
        {/* Client Info Card */}
        <div style={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginRight: 12, display: 'flex', alignItems: 'center' }} aria-label="Back">
              {/* Material Icon: arrow_back */}
              <svg width="28" height="28" fill="none" stroke="#805AD5" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F8F9ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="40" height="40" fill="none" stroke="#805AD5" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-2.5 3.5-4.5 8-4.5s8 2 8 4.5"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontWeight: 700, fontSize: 22, color: '#2F2F2F' }}>{client.name}</div>
              <div style={{ color: '#805AD5', fontSize: 14, marginTop: 2 }}>ID: {client.code || client._id}</div>
              <div style={{ color: '#805AD5', fontSize: 14, marginTop: 2 }}>Care Level: <span style={{ color: '#2F2F2F' }}>{client.careLevel || '—'}</span></div>
              <div style={{ color: '#805AD5', fontSize: 14, marginTop: 2 }}>Care Plan: <span style={{ color: '#2F2F2F' }}>{client.carePlan || '—'}</span></div>
              <div style={{ color: '#805AD5', fontSize: 14, marginTop: 2 }}>Medical Notes: <span style={{ color: '#2F2F2F' }}>{client.medicalNotes || '—'}</span></div>
              <div style={{ color: '#805AD5', fontSize: 14, marginTop: 2 }}>Priority: <span style={{ color: '#2F2F2F' }}>{client.priority || 'Normal'}</span></div>
            </div>
          </div>
        </div>
        {/* Categories removed from UI */}
        {/* Record Observation Card */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>Record Observation</div>
          <div style={styles.sectionDesc}>Choose how you want to add your note</div>
          <div style={styles.actionRow}>
            <button
              onClick={() => setShowVoiceModal(true)}
              style={styles.actionBtn}
            >
              <svg width="22" height="22" fill="none" stroke="#B8A6D9" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="9" y="2" width="6" height="14" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/><path d="M12 19v3"/></svg>
              <span>Voice Note</span>
            </button>
            <button
              onClick={() => setShowWriteModal(true)}
              style={{ ...styles.actionBtn, background: "#fff", color: "#2E2E2E", border: "1.5px solid #B8A6D9" }}
            >
              <svg width="22" height="22" fill="none" stroke="#B8A6D9" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8h8M8 12h8M8 16h4"/></svg>
              <span>Write Note</span>
            </button>
            <button
              onClick={() => setShowConsolidateModal(true)}
              style={{ ...styles.actionBtn, background: "#F8F9ED", color: "#805AD5", border: "1.5px solid #805AD5" }}
            >
              <svg width="22" height="22" fill="none" stroke="#805AD5" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>
              <span>Consolidate Daily</span>
            </button>
          </div>
          {/* Daily Consolidation Modal */}
          {/* Daily Consolidation Modal */}
          {showConsolidateModal && (
            <div style={styles.modalOverlay}>
              <div style={styles.modalContent}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={styles.sectionTitle}>Daily Notes Consolidation</div>
                  <button onClick={() => setShowConsolidateModal(false)} style={styles.closeModalBtn} aria-label="Close">
                    <svg width="22" height="22" fill="none" stroke="#805AD5" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: '#f8f9ed', padding: 16, borderRadius: 8, border: '1px solid #b8a6d9' }}>
                  {generateDailyConsolidation()}
                </div>
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <button onClick={() => setShowConsolidateModal(false)} style={styles.cancelBtn}>Close</button>
                </div>
              </div>
            </div>
          )}
          {/* Voice Note Modal (styled template matching staff dashboard) */}
          {showVoiceModal && (
            <div style={{ ...styles.modalOverlay, background: 'rgba(8,6,23,0.6)' }}>
              <div style={{
                maxWidth: 760,
                width: '95%',
                borderRadius: 16,
                padding: 20,
                boxShadow: '0 20px 60px rgba(8,6,23,0.45)',
                background: 'linear-gradient(180deg,#fff,#F8F9ED)',
                border: '1px solid rgba(128,90,213,0.12)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: '#805AD5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22 }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 1v10" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><rect x="9" y="4" width="6" height="8" rx="3" stroke="white" strokeWidth="1.2"/></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#2F2F2F' }}>Voice Note</div>
                    <div style={{ color: '#6B6B6B', marginTop: 2 }}>Record a quick voice observation — transcription will appear below.</div>
                  </div>
                  <button onClick={() => setShowVoiceModal(false)} style={{ ...styles.closeModalBtn, background: 'transparent', color: '#6B6B6B', border: 'none' }} aria-label="Close">✕</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18, alignItems: 'start' }}>
                  <div>
                    <div style={{ fontSize: 14, color: '#6B6B6B', marginBottom: 8 }}>Live Transcription</div>
                    <div style={{ minHeight: 160, borderRadius: 12, padding: 16, background: '#fff', border: '1px solid rgba(128,90,213,0.06)', boxShadow: 'inset 0 1px 6px rgba(11,7,36,0.03)', color: '#2E2E2E', fontSize: 15 }}>
                      {recording ? (transcript || 'Listening… speak now') : (transcript ? transcript : 'No transcript yet. Click Start to begin recording.')}
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 14 }}>
                      {!recording && (
                        <button onClick={handleStartRecording} style={{
                          width: 72, height: 72, borderRadius: 36, border: 'none', cursor: 'pointer',
                          background: 'linear-gradient(135deg,#805AD5,#B8A6D9)', color: '#fff', fontWeight: 700, fontSize: 16, boxShadow: '0 8px 20px rgba(128,90,213,0.2)'
                        }}>Start</button>
                      )}
                      {recording && (
                        <button onClick={handleStopRecording} style={{
                          width: 72, height: 72, borderRadius: 36, border: 'none', cursor: 'pointer',
                          background: 'linear-gradient(135deg,#D53F8C,#F973AA)', color: '#fff', fontWeight: 700, fontSize: 16, boxShadow: '0 8px 20px rgba(213,63,140,0.18)'
                        }}>Stop</button>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 13, color: '#6B6B6B' }}>Controls</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {!recording && transcript && (
                            <button onClick={handleStartRecording} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(128,90,213,0.12)', background: '#fff', cursor: 'pointer' }}>Resume</button>
                          )}
                          <button onClick={handleSaveAndReview} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#805AD5', color: '#fff', cursor: 'pointer' }}>Save & Review</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderRadius: 12, padding: 12, background: 'linear-gradient(180deg,#FBF8FF,#F8F9ED)', border: '1px solid rgba(128,90,213,0.06)' }}>
                    <div style={{ fontSize: 13, color: '#6B6B6B', marginBottom: 10 }}>Recording Status</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 6, background: recording ? '#EF4444' : '#94A3B8', boxShadow: recording ? '0 0 8px rgba(239,68,68,0.45)' : 'none' }} />
                      <div style={{ fontSize: 15, color: '#2E2E2E' }}>{recording ? 'Recording' : 'Idle'}</div>
                    </div>
                    <div style={{ height: 12, marginTop: 16, background: '#fff', borderRadius: 6, border: '1px solid rgba(11,7,36,0.04)' }}>
                      <div style={{ width: recording ? '60%' : '0%', height: '100%', background: 'linear-gradient(90deg,#805AD5,#B8A6D9)', borderRadius: 6, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize: 13, color: '#6B6B6B', marginTop: 12 }}>Tips</div>
                    <ul style={{ marginTop: 8, paddingLeft: 18, color: '#6B6B6B' }}>
                      <li>Speak clearly near your microphone.</li>
                      <li>Keep recordings under 5 minutes for best results.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Write Note Modal */}
          <WriteNoteModal
            open={showWriteModal}
            onClose={() => setShowWriteModal(false)}
            onSaved={() => {
              // Refresh notes after saving
              const fetchNotes = async () => {
                try {
                  const res = await api.get(`/api/staff/clients/${clientId}/notes`);
                  setNotes(res.data);
                } catch (err) {
                  setError("Failed to load notes");
                }
              };
              fetchNotes();
            }}
            clientId={clientId}
            api={api}
            styles={styles}
          />
        </div>
      </div>
    );
}

// --- Write Note Modal Component (top-level) ---
function WriteNoteModal({ open, onClose, onSaved, clientId, api, styles }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await api.post(`/api/staff/clients/${clientId}/notes`, {
        clientId,
        content: note,
        noteType: "text",
        status: "Pending"
      });
      setNote("");
      setSaving(false);
      onSaved && onSaved();
      onClose();
    } catch (err) {
      setError("Failed to save note");
      setSaving(false);
    }
  };
  if (!open) return null;
  return (
    <div style={{
      ...styles.modalOverlay,
      background: 'rgba(80, 60, 140, 0.13)',
      zIndex: 2000
    }}>
      <div style={{
        ...styles.modalContent,
        maxWidth: 520,
        minWidth: 340,
        borderRadius: 22,
        boxShadow: '0 8px 32px #B8A6D9',
        padding: 40,
        border: '1.5px solid #805AD5',
        background: 'linear-gradient(120deg, #fff 80%, #f8f9ed 100%)',
        position: 'relative',
        margin: 0
      }}>
        {/* Close (X) icon at top right */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 6,
            borderRadius: 8,
            color: '#805AD5',
            fontSize: 22,
            display: 'flex',
            alignItems: 'center',
            transition: 'background 0.15s',
          }}
        >
          <svg width="28" height="28" fill="none" stroke="#805AD5" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ marginBottom: 18, marginTop: 8 }}>
          <h2 style={{ fontWeight: 700, fontSize: 28, color: "#2E2E2E", margin: 0, letterSpacing: 0.2 }}>Write Note</h2>
        </div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={`Type your observation...`}
          style={{
            width: '100%',
            minHeight: 120,
            maxHeight: 220,
            borderRadius: 14,
            border: '1.5px solid #B8A6D9',
            padding: '16px 14px',
            fontSize: 17,
            background: '#F8F9ED',
            color: '#2E2E2E',
            marginBottom: 18,
            outline: 'none',
            resize: 'vertical',
            boxShadow: '0 1px 4px #E0E7EF',
            transition: 'border 0.2s, box-shadow 0.2s',
          }}
        />
        {error && <div style={{ color: '#C53030', textAlign: 'left', marginBottom: 12, fontSize: 16 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 18, marginTop: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: '#fff',
              color: '#805AD5',
              border: '1.5px solid #805AD5',
              borderRadius: 8,
              padding: '10px 28px',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 1px 4px #E0E7EF',
              transition: 'background 0.15s, color 0.15s, border 0.15s',
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = '#F8F9ED';
              e.currentTarget.style.color = '#6B6B6B';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.color = '#805AD5';
            }}
          >Cancel</button>
          <button
            onClick={handleSave}
            style={{
              background: saving || !note.trim() ? '#B8A6D9' : '#805AD5',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 32px',
              fontWeight: 700,
              fontSize: 17,
              cursor: saving || !note.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 8px #E0E7EF',
              opacity: saving || !note.trim() ? 0.7 : 1,
              transition: 'background 0.15s, opacity 0.15s',
            }}
            disabled={saving || !note.trim()}
          >
            <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Styles ---
const styles = {
    // ...existing styles...
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(128,90,213,0.10)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 4px 24px #B8A6D9',
      padding: 32,
      minWidth: 340,
      maxWidth: 540,
      width: '90vw',
      maxHeight: '80vh',
      overflowY: 'auto',
      position: 'relative'
    },
    closeModalBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 4,
      borderRadius: 8,
      color: '#805AD5',
      fontSize: 18,
      display: 'flex',
      alignItems: 'center',
      transition: 'background 0.15s',
    },
  page: {
    background: "#F8F9ED", // linen
    minHeight: "100vh",
    fontFamily: "Inter, system-ui, Arial, sans-serif"
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
    paddingTop: 18,
    paddingLeft: 8
  },
  backBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    marginRight: 4
  },
  pageTitle: {
    fontWeight: 500,
    fontSize: 24,
    color: "#2E2E2E",
    margin: 0
  },
  card: {
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 2px 8px #E0E7EF",
      padding: 24,
      marginBottom: 18,
      border: '1.5px solid #805AD5',
      width: '100%',
      maxWidth: 900,
      marginLeft: 'auto',
      marginRight: 'auto'
    },
  clientInfoRow: {
    display: "flex",
    alignItems: "center",
    gap: 18
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "#F8F9ED",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  clientName: {
        fontWeight: 700,
        fontSize: 28,
        color: "#805AD5",
        margin: 0
      },
  careLevel: {
    color: "#6B6B6B",
    fontSize: 14,
    marginTop: 4
  },
  carePlan: {
    color: "#6B6B6B",
    fontSize: 14,
    marginTop: 2
  },
  careLabel: {
    color: "#B8A6D9",
    fontWeight: 500,
    marginRight: 4
  },
  sectionTitle: {
      fontWeight: 600,
      color: "#805AD5",
      fontSize: 18,
      marginBottom: 6
    },
  sectionDesc: {
    color: "#6B6B6B",
    fontSize: 15,
    marginBottom: 16
  },
  categoryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 18
  },
  categoryCard: {
    borderRadius: 12,
    padding: 18,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    transition: "all 0.15s"
  },
  categoryIcon: {
    fontSize: 22,
    marginBottom: 8,
    color: "#B8A6D9"
  },
  categoryLabel: {
    fontWeight: 500,
    color: "#2E2E2E",
    fontSize: 16
  },
  categoryDesc: {
    color: "#6B6B6B",
    fontSize: 14,
    marginTop: 2
  },
  selectedMark: {
    marginTop: 10,
    color: "#B8A6D9",
    fontWeight: 500,
    fontSize: 14
  },
  actionRow: {
    display: "flex",
    gap: 18,
    marginTop: 10
  },
  actionBtn: {
    flex: 1,
    background: "#B8A6D9",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "18px 0",
    fontWeight: 500,
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: "0 2px 8px #E0E7EF"
  },
  saveBtn: {
      background: "#805AD5",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      padding: "6px 16px",
      fontWeight: 500,
      fontSize: 14,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 4
    },
  cancelBtn: {
      background: "#fff",
      color: "#805AD5",
      border: "1.5px solid #805AD5",
      borderRadius: 8,
      padding: "6px 16px",
      fontWeight: 500,
      fontSize: 14,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 4
    },
  loading: {
    color: "#B8A6D9",
    textAlign: "center",
    marginTop: 40,
    fontSize: 18
  },
  error: {
    color: "#C53030",
    textAlign: "center",
    marginTop: 40,
    fontSize: 18
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  },
  modalContent: {
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    maxWidth: 600,
    width: "90%",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
  },
  closeModalBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0
  }
};
export default ClientNotes;
