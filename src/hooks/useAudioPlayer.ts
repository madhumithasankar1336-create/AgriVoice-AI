import { useState, useRef, useCallback, useEffect } from 'react';
import { Language } from '../types';

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setActiveId(null);
  }, []);

  const playAudio = useCallback(
    async (
      id: string,
      audioBase64?: string,
      format: string = 'audio/wav',
      fallbackText?: string,
      language: Language = 'ta'
    ) => {
      stopAudio();
      setActiveId(id);

      // 1. If base64 audio is provided (from Gnani AI or Gemini 3.8 Flash Lite TTS)
      if (audioBase64) {
        try {
          const audio = new Audio(`data:${format};base64,${audioBase64}`);
          audio.playbackRate = playbackSpeed;
          audioRef.current = audio;

          audio.onended = () => {
            setIsPlaying(false);
            setActiveId(null);
          };
          audio.onerror = () => {
            console.warn('Audio element playback error, attempting speech synthesis fallback.');
            if (fallbackText) {
              playSpeechSynthesis(fallbackText, language);
            } else {
              setIsPlaying(false);
              setActiveId(null);
            }
          };

          setIsPlaying(true);
          await audio.play();
          return;
        } catch (err) {
          console.warn('Direct audio play failed:', err);
        }
      }

      // 2. Web Speech API synthesis fallback
      if (fallbackText && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        playSpeechSynthesis(fallbackText, language);
      } else {
        setIsPlaying(false);
        setActiveId(null);
      }
    },
    [playbackSpeed, stopAudio]
  );

  const playSpeechSynthesis = useCallback((text: string, language: Language = 'ta') => {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 500));
      utterance.lang = language === 'ta' ? 'ta-IN' : 'en-IN';
      utterance.rate = playbackSpeed;

      // Select natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const targetLang = language === 'ta' ? 'ta' : 'en';
      const matchedVoice = voices.find((v) => v.lang.startsWith(targetLang));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        setIsPlaying(true);
      };
      utterance.onend = () => {
        setIsPlaying(false);
        setActiveId(null);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        setActiveId(null);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Speech synthesis error:', e);
      setIsPlaying(false);
      setActiveId(null);
    }
  }, [playbackSpeed]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  return {
    isPlaying,
    activeId,
    playbackSpeed,
    setPlaybackSpeed,
    playAudio,
    stopAudio,
  };
}
