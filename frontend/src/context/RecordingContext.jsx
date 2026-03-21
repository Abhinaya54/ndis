import { createContext, useState, useRef, useCallback } from 'react';

export const RecordingContext = createContext(null);

export const RecordingProvider = ({ children }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = useCallback(async () => {
    try {
      setError('');
      setTranscription('');
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access.');
      console.error('Start recording error:', err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  }, []);

  const completeRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          resolve(audioBlob);
        };
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      } else {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        resolve(audioBlob);
      }
      setIsRecording(false);
      setIsPaused(false);
    });
  }, []);

  const resetRecording = useCallback(() => {
    stopRecording();
    setTranscription('');
    setError('');
    chunksRef.current = [];
  }, [stopRecording]);

  return (
    <RecordingContext.Provider
      value={{
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
        setTranscription
      }}
    >
      {children}
    </RecordingContext.Provider>
  );
};
