import { useState, useRef, useEffect, useCallback } from 'react';
import { Language } from '../types';

export function useVoiceRecorder(language: Language = 'ta') {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Stop recording cleanup
  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
    setAudioLevel(0);
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setLiveTranscript('');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Setup audio analyzer for volume visualization
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(1, avg / 128));
            animationFrameRef.current = requestAnimationFrame(updateLevel);
          }
        };
        updateLevel();
      } catch (e) {
        console.warn('AudioContext visualization setup failed:', e);
      }

      // Live Web Speech recognition preview if supported
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
          
          recognition.onresult = (event: any) => {
            let current = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              current += event.results[i][0].transcript;
            }
            if (current.trim()) {
              setLiveTranscript(current.trim());
            }
          };
          recognition.onerror = () => {};
          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn('SpeechRecognition not available:', e);
        }
      }

      // MediaRecorder initialization
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          mimeType = '';
        }
      }

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setError(
        language === 'ta'
          ? 'மைக்ரோஃபோன் அணுகல் மறுக்கப்பட்டது. தயவுசெய்து பிரவுசரில் அனுமதி வழங்கவும்.'
          : 'Microphone permission denied. Please allow microphone access in your browser.'
      );
      cleanup();
    }
  }, [language, cleanup]);

  const stopRecording = useCallback((): Promise<{ blob: Blob; liveText: string }> => {
    return new Promise((resolve, reject) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        cleanup();
        reject(new Error('No active recording session.'));
        return;
      }

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const text = liveTranscript;
        
        // Stop stream tracks
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
        cleanup();
        resolve({ blob: audioBlob, liveText: text });
      };

      try {
        mediaRecorder.stop();
      } catch (err) {
        cleanup();
        reject(err);
      }
    });
  }, [liveTranscript, cleanup]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current.stop();
      } catch {}
    }
    audioChunksRef.current = [];
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isRecording,
    recordingDuration,
    audioLevel,
    liveTranscript,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
