import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Square, 
  Sparkles, 
  Radio, 
  MessageSquare,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { Language, ChatMessage } from '../types';
import { translations, sampleQuestions } from '../i18n/translations';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { askChat, sendSpeechToText, getTextToSpeech } from '../services/api';

interface VoiceAssistantProps {
  language: Language;
  onNewHistoryItem?: () => void;
  initialQuery?: string;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  language,
  onNewHistoryItem,
  initialQuery,
}) => {
  const t = translations[language];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<'stt' | 'gemini' | 'tts' | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const {
    isRecording,
    recordingDuration,
    audioLevel,
    liveTranscript,
    error: recordError,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder(language);

  const {
    isPlaying,
    activeId,
    playbackSpeed,
    setPlaybackSpeed,
    playAudio,
    stopAudio,
  } = useAudioPlayer();

  // Initial welcome message
  useEffect(() => {
    const isTamil = language === 'ta';
    const welcomeMsg: ChatMessage = {
      id: 'welcome-intro',
      role: 'assistant',
      language,
      query: isTamil ? 'வணக்கம்!' : 'Hello!',
      response: isTamil
        ? 'வணக்கம் விவசாய நண்பரே! நான் உங்கள் அக்ரிவாய்ஸ் ஏஐ (AgriVoice AI) விவசாய உதவியாளர். நெல், பருத்தி, கரும்பு, காய்கறிகள், உர மேலாண்மை, பூச்சி மருந்து அல்லது அரசு திட்டங்கள் குறித்து உங்கள் கேள்விகளை கீழே உள்ள பெரிய மைக் பொத்தானை அழுத்தி தமிழில் கேட்கலாம்.'
        : 'Welcome farmer friend! I am your AgriVoice AI smart farming assistant. You can ask any question about crop cultivation, fertilizers, pest remedies, irrigation, or subsidies by tapping the microphone below in Tamil or English.',
      keyPoints: isTamil
        ? [
            'மைக் பொத்தானை அழுத்தி கேள்விகளை குரல் மூலம் கேட்கலாம்',
            'பதில் தமிழ் மற்றும் ஆங்கிலத்தில் பேசி வாசிக்கப்படும்',
            'விதைப்பு, உரம், பூச்சி தாக்குதல் மற்றும் மானிய விவரங்கள் பெறலாம்',
          ]
        : [
            'Press the microphone to ask farming questions via voice',
            'Responses will be read aloud in Tamil or English',
            'Get actionable guidance on seeds, fertilizers, and pest control',
          ],
      suggestedQuestions: sampleQuestions[language].slice(0, 3),
      category: 'voice_assistant',
      createdAt: new Date().toISOString(),
    };

    setMessages([welcomeMsg]);
  }, [language]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Auto-send initial query from Dashboard if provided
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSendText(initialQuery.trim());
    }
  }, [initialQuery]);

  // Submit text query
  const handleSendText = async (textToSend: string) => {
    const query = textToSend.trim();
    if (!query || isProcessing) return;

    setInputText('');
    setIsProcessing(true);
    setProcessingStage('gemini');

    // Add user message optimistic
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      language,
      query,
      response: '',
      category: 'voice_assistant',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const responseData = await askChat(query, language, 'voice_assistant');
      setMessages((prev) => [...prev, responseData]);
      onNewHistoryItem?.();

      // Automatically speak the response
      if (responseData.response) {
        setProcessingStage('tts');
        await playAudio(
          responseData.id,
          responseData.audioBase64,
          responseData.audioFormat || 'audio/wav',
          responseData.response,
          language
        );
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        language,
        query,
        response:
          language === 'ta'
            ? `மன்னிக்கவும்! பதிலைப் பெறுவதில் சிக்கல் ஏற்பட்டது: ${err.message || 'மீண்டும் முயற்சிக்கவும்.'}`
            : `Sorry! Could not process agricultural query: ${err.message || 'Please try again.'}`,
        category: 'voice_assistant',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
      setProcessingStage(null);
    }
  };

  // Handle voice recording submission
  const handleStopRecording = async () => {
    try {
      setIsProcessing(true);
      setProcessingStage('stt');

      const { blob, liveText } = await stopRecording();

      let transcribedText = liveText;

      // Call backend STT (Gnani AI with Gemini fallback)
      try {
        const sttResult = await sendSpeechToText(blob, language);
        if (sttResult.text && sttResult.text.trim()) {
          transcribedText = sttResult.text.trim();
        }
      } catch (sttErr) {
        console.warn('Backend STT failed, using live recognition text:', sttErr);
      }

      if (!transcribedText || !transcribedText.trim()) {
        transcribedText = language === 'ta' ? 'விவசாய ஆலோசனை' : 'Agricultural advice';
      }

      // Add user message
      const userMsg: ChatMessage = {
        id: `user-voice-${Date.now()}`,
        role: 'user',
        language,
        query: transcribedText,
        response: '',
        category: 'voice_assistant',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Call Gemini AI
      setProcessingStage('gemini');
      const responseData = await askChat(transcribedText, language, 'voice_assistant');
      setMessages((prev) => [...prev, responseData]);
      onNewHistoryItem?.();

      // Automatically play the answer
      if (responseData.response) {
        setProcessingStage('tts');
        await playAudio(
          responseData.id,
          responseData.audioBase64,
          responseData.audioFormat || 'audio/wav',
          responseData.response,
          language
        );
      }
    } catch (err: any) {
      console.error('Voice processing pipeline error:', err);
    } finally {
      setIsProcessing(false);
      setProcessingStage(null);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[580px] max-w-5xl mx-auto px-2 sm:px-4 py-3">
      
      {/* Top Banner with Quick Sample Chips */}
      <div className="mb-3 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-900 tracking-wide uppercase">
            {t.voice.suggestedHeading}
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {sampleQuestions[language].map((question, idx) => (
            <button
              key={idx}
              onClick={() => handleSendText(question)}
              disabled={isProcessing || isRecording}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200/80 shadow-xs hover:border-emerald-400 whitespace-nowrap transition-all disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 rounded-2xl bg-white/70 backdrop-blur-xs border border-emerald-100/80 shadow-sm space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isMsgPlaying = isPlaying && activeId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 shadow-xs ${
                  isUser
                    ? 'bg-gradient-to-r from-emerald-700 to-emerald-800 text-white rounded-br-xs'
                    : 'bg-white border border-stone-200/90 text-stone-800 rounded-bl-xs'
                }`}
              >
                {/* Header tag */}
                <div className="flex items-center justify-between gap-3 mb-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold">
                    {isUser ? (
                      <>
                        <Mic className="w-3.5 h-3.5 text-lime-300" />
                        <span>{language === 'ta' ? 'விவசாயி கேள்வி' : 'Farmer Query'}</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-emerald-950 font-extrabold">{t.appTitle}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                          {msg.provider === 'gnani' ? t.voice.aiProviderGnani : t.voice.aiProviderGemini}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Question or Response text */}
                <p className={`text-sm sm:text-base leading-relaxed whitespace-pre-line font-medium ${isUser ? 'text-emerald-50' : 'text-stone-800'}`}>
                  {isUser ? msg.query : msg.response}
                </p>

                {/* Key Takeaways Cards */}
                {!isUser && msg.keyPoints && msg.keyPoints.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-stone-100">
                    <div className="text-xs font-bold text-emerald-900 mb-1.5 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      {t.voice.keyTakeaways}
                    </div>
                    <ul className="space-y-1">
                      {msg.keyPoints.map((point, pIdx) => (
                        <li key={pIdx} className="text-xs text-stone-700 flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Audio Read-Aloud Controls for AI Response */}
                {!isUser && msg.response && (
                  <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (isMsgPlaying) {
                            stopAudio();
                          } else {
                            playAudio(
                              msg.id,
                              msg.audioBase64,
                              msg.audioFormat || 'audio/wav',
                              msg.response,
                              language
                            );
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                          isMsgPlaying
                            ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isMsgPlaying ? (
                          <>
                            <Square className="w-3.5 h-3.5 fill-current" />
                            <span>{t.voice.stopPlaying}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>{t.voice.listenAgain}</span>
                          </>
                        )}
                      </button>

                      {/* Playback speed selector */}
                      <button
                        onClick={() => {
                          const speeds = [0.8, 1.0, 1.2];
                          const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
                          setPlaybackSpeed(speeds[nextIdx]);
                        }}
                        className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold"
                        title="Voice playback speed"
                      >
                        {playbackSpeed}x
                      </button>
                    </div>

                    <div className="text-[10px] text-stone-500 flex items-center gap-1">
                      <Radio className="w-3 h-3 text-emerald-500" />
                      <span>{language === 'ta' ? 'குரல் வெளியீடு' : 'Audio Output'}</span>
                    </div>
                  </div>
                )}

                {/* Follow-up Suggested Question Pills */}
                {!isUser && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-stone-100 flex flex-wrap gap-1.5">
                    {msg.suggestedQuestions.map((sq, sqIdx) => (
                      <button
                        key={sqIdx}
                        onClick={() => handleSendText(sq)}
                        disabled={isProcessing || isRecording}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors flex items-center gap-1"
                      >
                        <span>{sq}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-emerald-700" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-emerald-200 shadow-xs max-w-md">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center animate-spin">
              <Sparkles className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="text-sm font-bold text-emerald-950">
                {processingStage === 'stt'
                  ? t.voice.processing
                  : processingStage === 'gemini'
                  ? t.voice.analyzing
                  : t.voice.speaking}
              </div>
              <p className="text-xs text-stone-500">
                {language === 'ta'
                  ? 'ஞானி ஏஐ மற்றும் கூகுள் ஜெமினி வேளாண் அறிவு என்ஜின் இணைந்து செயல்படுகிறது...'
                  : 'Gnani AI speech & Gemini agricultural brain are collaborating...'}
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Recording Microphone & Text Input Control Bar */}
      <div className="mt-3 shrink-0">
        
        {/* Error notification */}
        {recordError && (
          <div className="mb-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
            <span>{recordError}</span>
            <button onClick={() => setInputText('')} className="font-bold underline ml-2">OK</button>
          </div>
        )}

        {/* Active Recording State UI */}
        {isRecording ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative">
                <span className="w-12 h-12 rounded-full bg-white text-red-600 flex items-center justify-center font-bold shadow-md animate-pulse">
                  <Mic className="w-6 h-6" />
                </span>
                <span
                  className="absolute inset-0 rounded-full bg-white/40 -z-10 animate-ping"
                  style={{ animationDuration: '1.2s' }}
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  <span className="font-extrabold text-base tracking-wide">
                    {t.voice.listening}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/20 text-xs font-mono font-bold">
                    {formatTimer(recordingDuration)}
                  </span>
                </div>
                
                {/* Live speech preview if available */}
                <p className="text-xs text-red-100 font-medium truncate max-w-xs sm:max-w-md mt-0.5">
                  {liveTranscript ? `"${liveTranscript}"` : t.voice.tapToSpeak}
                </p>
              </div>
            </div>

            {/* Volume audio level bar */}
            <div className="w-full sm:w-40 h-2 bg-white/25 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-75 rounded-full"
                style={{ width: `${Math.max(10, Math.min(100, audioLevel * 100))}%` }}
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={cancelRecording}
                className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors"
              >
                {t.voice.cancel}
              </button>
              <button
                type="button"
                onClick={handleStopRecording}
                className="px-5 py-2 rounded-xl bg-white hover:bg-stone-100 text-red-700 text-xs font-black shadow-md flex items-center gap-1.5 transition-all"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>{t.voice.stopRecording}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Normal Input State: Big Mic Button + Text Input Field */
          <div className="flex items-center gap-2 sm:gap-3 bg-white p-2 rounded-2xl border-2 border-emerald-300/80 shadow-md">
            
            {/* Big Prominent Voice Microphone Button */}
            <button
              type="button"
              onClick={startRecording}
              disabled={isProcessing}
              className="relative group shrink-0 px-4 py-3 sm:px-6 sm:py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-md hover:shadow-lg font-bold flex items-center gap-2.5 transition-all active:scale-95 disabled:opacity-50"
              title="Click to speak your farming question"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mic className="w-4 h-4 text-lime-300" />
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-black tracking-wide leading-tight">
                  {t.voice.speakNow}
                </div>
                <div className="text-[10px] text-emerald-200 font-medium">
                  {language === 'ta' ? 'குரல் வழி கேள்வி' : 'Tamil / English Voice'}
                </div>
              </div>
            </button>

            {/* Text Input Box */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendText(inputText);
                  }
                }}
                disabled={isProcessing}
                placeholder={t.voice.placeholder}
                className="w-full pl-3 pr-10 py-3 text-sm text-stone-900 bg-stone-50/80 hover:bg-stone-50 focus:bg-white rounded-xl border border-stone-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all placeholder:text-stone-400 font-medium"
              />
              {inputText.trim() && (
                <button
                  type="button"
                  onClick={() => handleSendText(inputText)}
                  disabled={isProcessing}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
